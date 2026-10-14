const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
require('../tools/build-extension.js');
const core = fs.readFileSync(path.join(root, 'vaft/vaft.user.js'));

for (const browser of ['chromium', 'firefox']) {
    test(`${browser}: packaged core is byte-for-byte stable and injection is scoped to Twitch`, () => {
        const directory = path.join(root, 'dist', browser);
        assert.deepEqual(fs.readFileSync(path.join(directory, 'blocker.js')), core);
        const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json')));
        assert.equal(manifest.version, require('../package.json').version);
        assert.equal(manifest.version, core.toString().match(/^\/\/ @version\s+(\S+)/m)[1]);
        const info = JSON.parse(fs.readFileSync(path.join(directory, 'build-info.json')));
        assert.equal(info.version, manifest.version);
        assert.equal(info.userscriptVersion, manifest.version);
        assert.deepEqual(manifest.host_permissions, ['*://*.twitch.tv/*']);
        assert.equal(manifest.permissions, undefined);
        assert.equal(manifest.background, undefined);
        assert.equal(manifest.content_scripts[0].world, 'MAIN');
        assert.equal(manifest.content_scripts[0].run_at, 'document_start');
        assert.deepEqual(manifest.content_scripts[0].js, ['startup.js', 'blocker.js', 'status.js']);
        assert.equal(manifest.content_scripts[1].world, 'ISOLATED');
        for (const content of manifest.content_scripts) {
            assert.deepEqual(content.matches, manifest.host_permissions);
            content.js.forEach(file => assert.ok(fs.existsSync(path.join(directory, file))));
        }
        if (browser === 'firefox') assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required, ['none']);
    });
    test(`${browser}: ZIP contains the complete extension with unchanged core`, () => {
        const bytes = fs.readFileSync(path.join(root, 'dist', `adbonk-${browser}-${require('../package.json').version}.zip`));
        const entries = new Map();
        let offset = 0;
        while (bytes.readUInt32LE(offset) === 0x04034b50) {
            assert.equal(bytes.readUInt16LE(offset + 8), 0);
            const size = bytes.readUInt32LE(offset + 18);
            const nameLength = bytes.readUInt16LE(offset + 26);
            const extraLength = bytes.readUInt16LE(offset + 28);
            const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString();
            const start = offset + 30 + nameLength + extraLength;
            assert.ok(!name.startsWith('/') && !name.split('/').includes('..'));
            entries.set(name, bytes.subarray(start, start + size));
            offset = start + size;
        }
        assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
        assert.deepEqual(entries.get('blocker.js'), core);
        for (const file of ['manifest.json', 'LICENSE', 'bridge.js', 'status.js', 'startup.js', 'popup/popup.html', 'popup/popup.js', 'popup/popup.css', 'icons/128.png']) assert.ok(entries.has(file), file);
    });
}

function pageHarness(previousVersion, currentVersion = 95) {
    const posted = [];
    const window = {
        __adbonkExtensionStartup: { previousVersion, expectedVersion: 95, version: '1.0.0' },
        twitchAdSolutionsVersion: currentVersion,
        realFetch() {}, location: { origin: 'https://www.twitch.tv' },
        addEventListener(_, fn) { this.receive = fn; },
        postMessage(message, origin) { posted.push({ message, origin }); }
    };
    Object.defineProperty(window, 'Worker', { get: () => function Worker() {} });
    vm.runInNewContext(fs.readFileSync(path.join(root, 'extension/status.js'), 'utf8'), { window });
    const request = { source: 'adbonk-extension', type: 'status-request', id: 'request' };
    return { window, posted, request, receive: data => window.receive({ source: window, data }) };
}

test('page status reports initialized hooks without exposing page credentials', () => {
    const h = pageHarness(undefined);
    h.window.AuthorizationHeader = 'private';
    h.receive(h.request);
    const result = h.posted[0].message.status;
    assert.equal(result.initialized, true);
    assert.equal(result.conflict, false);
    assert.deepEqual(Object.keys(result).sort(), ['conflict', 'initialized', 'version']);
    assert.equal(h.posted[0].origin, 'https://www.twitch.tv');
});

test('page status reports duplicate-script conflict and skipped initialization', () => {
    const conflict = pageHarness(95);
    conflict.receive(conflict.request);
    assert.equal(conflict.posted[0].message.status.conflict, true);
    assert.equal(conflict.posted[0].message.status.initialized, false);
    const fresh = pageHarness(undefined, 0);
    fresh.receive(fresh.request);
    assert.equal(fresh.posted[0].message.status.initialized, false);
});

test('page status ignores other frames and malformed requests', () => {
    const h = pageHarness(undefined);
    h.window.receive({ source: {}, data: h.request });
    h.receive({ ...h.request, type: 'change-settings' });
    h.receive({ ...h.request, id: 'x'.repeat(101) });
    assert.equal(h.posted.length, 0);
});

function bridgeHarness() {
    const listeners = new Set(), timers = new Map(), posted = [], responses = [];
    let onMessage;
    const window = {
        location: { origin: 'https://www.twitch.tv' },
        addEventListener(_, fn) { listeners.add(fn); },
        removeEventListener(_, fn) { listeners.delete(fn); },
        postMessage(message) { posted.push(message); }
    };
    const globals = { window, browser: { runtime: { id: 'extension', onMessage: { addListener(fn) { onMessage = fn; } } } }, crypto: { randomUUID: () => 'nonce' }, setTimeout(fn) { timers.set(1, fn); return 1; }, clearTimeout(id) { timers.delete(id); } };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'extension/bridge.js'), 'utf8'), globals);
    return { window, listeners, timers, posted, responses, request: (sender = 'extension') => onMessage({ type: 'adbonk-status' }, { id: sender }, result => responses.push(result)) };
}

test('isolated bridge validates response and cleans up after successful status', () => {
    const h = bridgeHarness();
    assert.equal(h.request(), true);
    const receive = h.listeners.values().next().value;
    const data = { source: 'adbonk-extension', type: 'status-response', id: 'wrong', status: { initialized: true, conflict: false, version: '1.0.0', token: 'private' } };
    receive({ source: h.window, data });
    assert.equal(h.responses.length, 0);
    receive({ source: h.window, data: { ...data, id: 'nonce' } });
    assert.deepEqual(Object.keys(h.responses[0]).sort(), ['conflict', 'initialized', 'version']);
    assert.equal(h.listeners.size, 0);
    assert.equal(h.timers.size, 0);
});

test('isolated bridge times out once and refuses messages from other extensions', () => {
    const h = bridgeHarness();
    assert.equal(h.request('other'), false);
    assert.equal(h.posted.length, 0);
    h.request();
    const expire = h.timers.values().next().value;
    expire(); expire();
    assert.equal(h.responses.length, 1);
    assert.equal(h.responses[0].unavailable, true);
    assert.equal(h.listeners.size, 0);
    assert.equal(h.timers.size, 0);
});

for (const [name, response, title] of [
    ['loaded', { initialized: true }, 'Ready on this page'],
    ['conflict', { conflict: true }, 'Another script is running'],
    ['uninitialized', { initialized: false }, 'Not loaded on this page'],
    ['outside Twitch', null, 'Open a Twitch live stream']
]) {
    test(`popup: ${name}`, async () => {
        const nodes = new Map(['status', 'detail', 'version'].map(id => [id, {}]));
        const api = { runtime: { getManifest: () => ({ version: '1.0.0' }) }, tabs: {
            query: async () => [{ id: 1 }],
            sendMessage: async (id, request, options) => {
                assert.equal(id, 1); assert.equal(options.frameId, 0);
                assert.equal(request.type, 'adbonk-status');
                if (!response) throw new Error('No receiver');
                return response;
            }
        } };
        await vm.runInNewContext(fs.readFileSync(path.join(root, 'extension/popup/popup.js'), 'utf8'), { browser: api, document: { getElementById: id => nodes.get(id) } });
        assert.equal(nodes.get('status').textContent, title);
        assert.equal(nodes.get('version').textContent, '1.0.0');
    });
}
