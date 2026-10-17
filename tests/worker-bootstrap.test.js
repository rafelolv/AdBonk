// Evaluate the actual generated worker script in isolation, including its serialized dependencies.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../vaft/vaft.user.js'), 'utf8');
function extract(name) {
    const start = source.search(new RegExp(`    (?:async )?function ${name}\\(`));
    assert.ok(start >= 0, name);
    return source.slice(start, source.indexOf('\n    }', start) + 6);
}
test('the generated worker boots with every serialized dependency and processes a real playlist request', async () => {
    let injected;
    const messages = [];
    const nativeScript = 'self.nativePlayerWorkerLoaded = true;';
    class XHR {
        open() {} overrideMimeType() {} send() { this.responseText = nativeScript; }
    }
    class NativeWorker { addEventListener() {} }
    const window = { Worker: NativeWorker };
    class TestURL extends URL { static createObjectURL(blob) { injected = blob; return 'blob:test'; } }
    const names = [...new Set([...source.matchAll(/\$\{(\w+)\.toString\(\)\}/g)].map(m => m[1]))];
    const page = vm.createContext({ window, URL: TestURL, Blob, XMLHttpRequest: XHR,
        twitchWorkers: [], console: { log() {} }, getWorkersForReinsert: () => [],
        getCleanWorker: () => NativeWorker, reinsertWorkers: value => value });
    vm.runInContext([...names, 'hookWindowWorker'].map(extract).join('\n'), page);
    page.declareOptions(page); page.hookWindowWorker();
    new window.Worker('https://www.twitch.tv/player-worker.js');
    assert.ok(injected instanceof Blob);
    const clean = '#EXTM3U\n#EXTINF:2,live\nhttps://video.example/live.ts';
    const worker = vm.createContext({ URL, Response, XMLHttpRequest: XHR,
        fetch: async () => new Response(clean), console: { log() {} },
        postMessage: value => messages.push(value), addEventListener() {},
        setTimeout, clearTimeout });
    worker.self = worker;
    new vm.Script(await injected.text()).runInContext(worker);
    assert.equal(worker.nativePlayerWorkerLoaded, true);
    const url = 'https://video.example/live.m3u8';
    worker.StreamInfosByUrl[url] = { IsShowingAd: false };
    assert.equal(await (await worker.fetch(url)).text(), clean);
    assert.ok(messages.some(m => m.key === 'UpdateAdBlockBanner'));
    assert.deepEqual(Array.from(worker.BackupPlayerTypes), ['embed', 'popout', 'autoplay']);
});
