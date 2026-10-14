// Optional real-browser integration checks. Uses temporary profiles and loopback fixtures.
// Only the fixture copy of the manifest gains loopback access; shipped permissions stay Twitch-only.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'adbonk-extension-smoke-'));
const counter = Number(fs.readFileSync(path.join(root, 'vaft/vaft.user.js'), 'utf8').match(/const ourTwitchAdSolutionsVersion = (\d+)/)[1]);
const snapshot = `({version:window.twitchAdSolutionsVersion,fetchHook:typeof window.realFetch==='function',workerHook:typeof Object.getOwnPropertyDescriptor(window,'Worker')?.get==='function'})`;
const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(`<!doctype html><meta charset="utf-8"><script>window.atFirstPageScript=${snapshot};</script><div id="root"></div><div class="video-player"></div>`);
});
const children = new Set();
const sockets = new Set();
function start(binary, args) {
    const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
    children.add(child);
    child.on('error', error => console.error(`${binary}: ${error.message}`));
    return child;
}
function transport(send) {
    let nextId = 0;
    const pending = new Map();
    return {
        receive(message) {
            const entry = pending.get(message.id);
            if (!entry) return;
            clearTimeout(entry.timer); pending.delete(message.id);
            if (message.error) entry.reject(new Error(JSON.stringify(message)));
            else entry.resolve(message.result);
        },
        command(method, params = {}, sessionId) {
            return new Promise((resolve, reject) => {
                const id = ++nextId;
                const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
                pending.set(id, { resolve, reject, timer });
                send({ id, method, params, ...(sessionId ? { sessionId } : {}) });
            });
        }
    };
}
function fixturePackage(browser) {
    const directory = path.join(work, browser);
    fs.cpSync(path.join(root, 'dist', browser), directory, { recursive: true });
    const file = path.join(directory, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(file));
    manifest.host_permissions.push('http://127.0.0.1/*');
    manifest.content_scripts.forEach(content => content.matches.push('http://127.0.0.1/*'));
    if (browser === 'firefox') {
        // BiDi cannot navigate directly to extension URLs. Open a test popup from
        // an extension-owned background script in the fixture package only.
        manifest.background = { scripts: ['smoke-open-popup.js'] };
        fs.writeFileSync(path.join(directory, 'smoke-open-popup.js'), `browser.tabs.create({url:browser.runtime.getURL('popup/popup.html'),active:false});`);
    }
    fs.writeFileSync(file, JSON.stringify(manifest));
    return directory;
}
function values(remote) {
    if (!remote || remote.type === 'undefined') return undefined;
    if (remote.type === 'object') return Object.fromEntries(remote.value.map(([key, value]) => [key, values(value)]));
    if (remote.type === 'array') return remote.value.map(values);
    return remote.value;
}
async function runChecks(browser, navigate, evaluate, extensionUrl) {
    const base = `http://127.0.0.1:${server.address().port}`;
    await navigate(base + '/channel');
    const loaded = await evaluate('window.atFirstPageScript');
    assert.equal(loaded.version, counter);
    assert.equal(loaded.fetchHook, true);
    assert.equal(loaded.workerHook, true);
    const statusExpression = `new Promise(resolve=>{const id='smoke';const timer=setTimeout(()=>resolve({timeout:true}),2000);window.addEventListener('message',function receive(event){if(event.source===window&&event.data?.type==='status-response'&&event.data.id===id){clearTimeout(timer);window.removeEventListener('message',receive);resolve(event.data.status);}});window.postMessage({source:'adbonk-extension',type:'status-request',id},location.origin);})`;
    const status = await evaluate(statusExpression);
    assert.equal(status.initialized, true);
    assert.equal(status.conflict, false);
    await navigate(base + '/channel/clip/example');
    assert.equal((await evaluate('window.atFirstPageScript')).fetchHook, false);
    await navigate(base + '/channel');
    const frames = await evaluate(`(async()=>{const results=[];for(const pathname of ['/auxiliary','/embed/channel']){const frame=document.createElement('iframe');const loaded=new Promise(resolve=>frame.onload=resolve);frame.src=${JSON.stringify(base)}+pathname;document.body.appendChild(frame);await loaded;results.push({path:pathname,...frame.contentWindow.atFirstPageScript});frame.remove();}return results;})()`);
    assert.equal(frames[0].fetchHook, false);
    assert.equal(frames[1].fetchHook, true);
    // Simulate a previously loaded userscript, then reload the extension's adapters only.
    const startup = fs.readFileSync(path.join(work, browser, 'startup.js'), 'utf8');
    const statusSource = fs.readFileSync(path.join(work, browser, 'status.js'), 'utf8');
    await evaluate(`(()=>{${startup}\n${statusSource}\n})()`);
    // The initial adapter still responds first, so verify the duplicate adapter's response explicitly.
    const duplicate = await evaluate(`new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),2000);window.addEventListener('message',function receive(event){if(event.source===window&&event.data?.type==='status-response'&&event.data.id==='duplicate'&&event.data.status.conflict){clearTimeout(timer);window.removeEventListener('message',receive);resolve(true);}});window.postMessage({source:'adbonk-extension',type:'status-request',id:'duplicate'},location.origin);})`);
    assert.equal(duplicate, true);
    await navigate(extensionUrl);
    const bridge = await evaluate(`(async()=>{const api=globalThis.browser||globalThis.chrome;const tabs=await api.tabs.query({});const tab=tabs.find(tab=>tab.url===${JSON.stringify(base + '/channel')});return await api.tabs.sendMessage(tab.id,{type:'adbonk-status'},{frameId:0});})()`);
    assert.equal(bridge.initialized, true);
    assert.equal(bridge.conflict, false);
    assert.equal(await evaluate("document.getElementById('version').textContent"), require('../package.json').version);
    console.log(`${browser}: PASS — early MAIN-world hooks, page status, clip skip, auxiliary-frame skip, embed-frame injection, duplicate detection, isolated bridge, popup version`);
}
async function chromium() {
    const browser = start(process.env.ADBONK_CHROME || 'google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--enable-unsafe-extension-debugging', '--remote-debugging-pipe', `--user-data-dir=${path.join(work, 'chrome-profile')}`]);
    browser.stderr.on('data', () => {});
    const rpc = transport(message => browser.stdio[3].write(JSON.stringify(message) + '\0'));
    let buffer = '';
    browser.stdio[4].on('data', chunk => {
        buffer += chunk.toString(); let index;
        while ((index = buffer.indexOf('\0')) !== -1) {
            const message = JSON.parse(buffer.slice(0, index)); buffer = buffer.slice(index + 1); rpc.receive(message);
        }
    });
    const { id } = await rpc.command('Extensions.loadUnpacked', { path: fixturePackage('chromium') });
    const { targetId } = await rpc.command('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await rpc.command('Target.attachToTarget', { targetId, flatten: true });
    await rpc.command('Page.enable', {}, sessionId);
    let popupSession;
    const navigate = async url => {
        await rpc.command('Page.navigate', { url }, sessionId);
        // Wait for the new document's fixture or popup, rather than a previous readyState.
        for (let attempt = 0; attempt < 100; attempt++) {
            const result = await rpc.command('Runtime.evaluate', { expression: `location.href===${JSON.stringify(url)} && document.readyState==='complete'`, returnByValue: true }, sessionId);
            if (result.result.value) return;
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        throw new Error('Navigation did not complete');
    };
    const evaluate = async expression => {
        const result = await rpc.command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
        assert.ok(!result.exceptionDetails, JSON.stringify(result)); return result.result.value;
    };
    // Preserve the fixture tab when opening the extension popup as another tab.
    const navigation = async url => {
        if (url.startsWith('chrome-extension:')) {
            const created = await rpc.command('Target.createTarget', { url });
            const attached = await rpc.command('Target.attachToTarget', { targetId: created.targetId, flatten: true });
            popupSession = attached.sessionId;
            await new Promise(resolve => setTimeout(resolve, 100));
        } else await navigate(url);
    };
    await runChecks('chromium', navigation, async expression => {
        if (!popupSession) return evaluate(expression);
        const result = await rpc.command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, popupSession);
        assert.ok(!result.exceptionDetails, JSON.stringify(result)); return result.result.value;
    }, `chrome-extension://${id}/popup/popup.html`);
    const dimensions = await rpc.command('Runtime.evaluate', { expression: 'Math.ceil(document.body.getBoundingClientRect().height)', returnByValue: true }, popupSession);
    const screenshot = await rpc.command('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 354, height: dimensions.result.value, scale: 1 } }, popupSession);
    fs.writeFileSync(path.join(work, 'popup.png'), Buffer.from(screenshot.data, 'base64'));
    browser.kill();
}
async function firefox() {
    const profile = path.join(work, 'firefox-profile'); fs.mkdirSync(profile);
    const extensionUuid = randomUUID();
    const uuidMapping = JSON.stringify({ "adbonk@rafelolv.github.io": extensionUuid });
    fs.writeFileSync(path.join(profile, 'user.js'), 'user_pref("browser.shell.checkDefaultBrowser", false);\nuser_pref("remote.active-protocols", 1);\n' + `user_pref("extensions.webextensions.uuids", ${JSON.stringify(uuidMapping)});\n`);
    const browser = start(process.env.ADBONK_FIREFOX || 'firefox', ['--headless', '--no-remote', '--remote-allow-system-access', '--profile', profile, '--remote-debugging-port', '0', 'about:blank']);
    const endpoint = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Firefox BiDi endpoint missing')), 10000);
        browser.stderr.on('data', chunk => { const match = chunk.toString().match(/WebDriver BiDi listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
    });
    const socket = new WebSocket(endpoint + '/session'); sockets.add(socket);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    const rpc = transport(message => socket.send(JSON.stringify(message)));
    socket.onmessage = event => rpc.receive(JSON.parse(event.data));
    await rpc.command('session.new', { capabilities: { alwaysMatch: {} } });
    const { extension } = await rpc.command('webExtension.install', { extensionData: { type: 'path', path: fixturePackage('firefox') } });
    const { context } = await rpc.command('browsingContext.create', { type: 'tab' });
    let current = context;
    const evaluate = async expression => {
        const result = await rpc.command('script.evaluate', { expression, target: { context: current }, awaitPromise: true, resultOwnership: 'none' });
        assert.equal(result.type, 'success', JSON.stringify(result)); return values(result.result);
    };
    const extensionUrl = `moz-extension://${extensionUuid}/popup/popup.html`;
    const navigate = async url => {
        if (url.startsWith('moz-extension:')) {
            for (let attempt = 0; attempt < 100; attempt++) {
                const tree = await rpc.command('browsingContext.getTree', {});
                const popup = tree.contexts.find(tab => tab.url === url);
                if (popup) {
                    current = popup.context;
                    const ready = await evaluate(`document.readyState === 'complete' && typeof globalThis.browser === 'object' && document.getElementById('version')?.textContent === ${JSON.stringify(require('../package.json').version)}`);
                    if (ready) return;
                }
                await new Promise(resolve => setTimeout(resolve, 25));
            }
            throw new Error('Firefox test popup did not open');
        }
        await rpc.command('browsingContext.navigate', { context: current, url, wait: 'complete' });
    };
    await runChecks('firefox', navigate, evaluate, extensionUrl);
    await rpc.command('webExtension.uninstall', { extension });
    socket.close(); browser.kill();
}
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        const requested = process.argv[2] || 'both';
        if (requested === 'both' || requested === 'chromium') await chromium();
        if (requested === 'both' || requested === 'firefox') await firefox();
    } finally {
        sockets.forEach(socket => socket.close()); children.forEach(child => child.kill());
        server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
        // Browser profiles may still be shutting down; they are disposable and outside the repository.
        console.log(`Temporary profiles: ${work}`);
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
