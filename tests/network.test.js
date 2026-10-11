// Exercise the shipped stable functions in isolated window/worker contexts.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'vaft/vaft.user.js'), 'utf8');
function loadFunction(name, globals) {
    const start = source.search(new RegExp(`    (?:async )?function ${name}\\(`));
    assert.ok(start >= 0, `Missing ${name}`);
    const end = source.indexOf('\n    }', start);
    assert.ok(end >= start, `Missing end of ${name}`);
    const context = vm.createContext(globals);
    new vm.Script(source.slice(start, end + 6)).runInContext(context);
    return context;
}

async function settles(promise) {
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error('Request did not settle')), 100);
            })
        ]);
    } finally {
        clearTimeout(timer);
    }
}

function workerHarness(realFetch, overrides = {}) {
    const context = loadFunction('hookWorkerFetch', {
        Blob, Uint8Array, atob, Response, URL,
        console: { log() {} },
        AdSegmentCache: new Map(),
        ForceAccessTokenPlayerType: null,
        fetch: realFetch,
        processM3U8: async (_, text) => `${text}\n#processed`,
        getServerTimeFromM3u8: () => { throw new Error('Invalid master playlist'); },
        ...overrides
    });
    context.hookWorkerFetch();
    return context;
}

const mediaUrl = 'https://example.test/live.m3u8';
const masterUrl = 'https://usher.example.test/api/channel/hls/channel.m3u8?token=test';

test('stable worker fetch returns a processed media playlist and forwards options', async () => {
    const options = { signal: new AbortController().signal };
    const context = workerHarness(async (url, init) => {
        assert.equal(url, mediaUrl);
        assert.equal(init, options);
        return new Response('#EXTM3U');
    });
    const response = await settles(context.fetch(mediaUrl, options));
    assert.equal(await response.text(), '#EXTM3U\n#processed');
});

for (const url of [mediaUrl, masterUrl]) {
    test(`stable worker fetch preserves non-200 response: ${url}`, async () => {
        const response = new Response('Unavailable', { status: 503 });
        const context = workerHarness(async () => response);
        assert.equal(await settles(context.fetch(url)), response);
    });
    test(`stable worker fetch propagates body read failure: ${url}`, async () => {
        const failure = new Error('Body read failed');
        const context = workerHarness(async () => ({ status: 200, text: async () => { throw failure; } }));
        await assert.rejects(settles(context.fetch(url)), error => error === failure);
    });
}

test('stable worker fetch propagates network failure', async () => {
    const failure = new TypeError('Network failed');
    const context = workerHarness(async () => { throw failure; });
    await assert.rejects(settles(context.fetch(mediaUrl)), error => error === failure);
});

test('stable worker fetch propagates media processing failure', async () => {
    const failure = new Error('Playlist processing failed');
    const context = workerHarness(async () => new Response('#EXTM3U'), {
        processM3U8: async () => { throw failure; }
    });
    await assert.rejects(settles(context.fetch(mediaUrl)), error => error === failure);
});

test('stable worker fetch propagates master processing failure', async () => {
    const context = workerHarness(async () => new Response('#EXTM3U'));
    await assert.rejects(settles(context.fetch(masterUrl)), /Invalid master playlist/);
});

test('stable worker fetch passes unrelated requests through', async () => {
    const response = new Response('Content');
    const context = workerHarness(async () => response);
    assert.equal(await settles(context.fetch('https://example.test/content')), response);
});

test('stable worker fetch still substitutes cached ad segments without a network call', async () => {
    const adUrl = 'https://example.test/ad.mp4';
    const context = workerHarness(() => { throw new Error('Unexpected network request'); }, {
        AdSegmentCache: new Map([[adUrl, Date.now()]])
    });
    const response = await settles(context.fetch(adUrl));
    assert.equal(response.headers.get('content-type'), 'video/mp4');
    assert.ok((await response.arrayBuffer()).byteLength > 0);
});

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function windowHarness(realFetch) {
    const timers = new Map();
    let nextId = 0;
    const context = loadFunction('handleWorkerFetchRequest', {
        AbortController,
        window: { realFetch },
        setTimeout(fn, delay) {
            assert.equal(delay, 5000);
            const id = ++nextId;
            timers.set(id, fn);
            return id;
        },
        clearTimeout: id => timers.delete(id)
    });
    return { timers, request: () => context.handleWorkerFetchRequest({ id: 'request', url: 'https://example.test/gql', options: {} }) };
}

function abortablePendingBody(signal) {
    return new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
}

test('stable GQL fetch serializes response and clears timer after body completion', async () => {
    const started = deferred();
    const body = deferred();
    const harness = windowHarness(async () => ({
        status: 200, statusText: 'OK', ok: true, redirected: false, type: 'basic',
        url: 'https://example.test/gql', headers: new Headers({ 'content-type': 'application/json' }),
        text() { started.resolve(); return body.promise; }
    }));
    const pending = harness.request();
    await started.promise;
    assert.equal(harness.timers.size, 1, 'Body read must retain its timeout');
    body.resolve('{"data":{}}');
    const result = await settles(pending);
    assert.equal(result.id, 'request');
    assert.equal(result.status, 200);
    assert.equal(result.body, '{"data":{}}');
    assert.equal(result.headers['content-type'], 'application/json');
    assert.equal(harness.timers.size, 0);
});

for (const stage of ['network', 'body']) {
    test(`stable GQL fetch reports ${stage} failure and clears timer`, async () => {
        const failure = new Error(`${stage} failed`);
        const harness = windowHarness(async () => {
            if (stage === 'network') throw failure;
            return { text: async () => { throw failure; } };
        });
        const result = await settles(harness.request());
        assert.equal(result.id, 'request');
        assert.equal(result.error, failure.message);
        assert.equal(harness.timers.size, 0);
    });
}

for (const stage of ['headers', 'body']) {
    test(`stable GQL fetch aborts while waiting for ${stage} and clears timer`, async () => {
        const started = deferred();
        const harness = windowHarness(async (_, { signal }) => {
            if (stage === 'headers') {
                started.resolve();
                return abortablePendingBody(signal);
            }
            return { text() { started.resolve(); return abortablePendingBody(signal); } };
        });
        const pending = harness.request();
        await started.promise;
        assert.equal(harness.timers.size, 1, 'Timeout must cover the entire response');
        harness.timers.values().next().value();
        const result = await settles(pending);
        assert.equal(result.id, 'request');
        assert.equal(result.error, 'GQL fetch timeout (5s)');
        assert.equal(harness.timers.size, 0);
    });
}
