// Exercise the restored blocking strategy using the shipped functions and deterministic responses.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../vaft/vaft.user.js'), 'utf8');
const baseline = require('./blocking-baseline.json');
function extract(name) {
    const start = source.search(new RegExp(`    (?:async )?function ${name}\\(`));
    assert.ok(start >= 0, `Missing ${name}`);
    return source.slice(start, source.indexOf('\n    }', start) + 6);
}
for (const [name, hash] of Object.entries(baseline.functions)) {
    test(`stable blocking baseline: ${name} matches the pinned implementation`, () => {
        assert.equal(createHash('sha256').update(extract(name)).digest('hex'), hash);
    });
}
test('worker interception matches the original except diagnostic text and async rejection propagation', () => {
    const canonical = extract('hookWorkerFetch')
        .replace("console.log('[AD DEBUG] hookWorkerFetch (AdBonk)');", "console.log('hookWorkerFetch (vaft)');")
        .replaceAll('return processAfter(response);', 'processAfter(response);');
    assert.equal(createHash('sha256').update(canonical).digest('hex'), baseline.workerFetchHash);
});
const media = 'https://native.example/live.m3u8';
const clean = '#EXTM3U\n#EXTINF:2,live\nhttps://native.example/live.ts';
const ad = '#EXTM3U\n#EXT-X-DATERANGE:CLASS="twitch-stitched-ad",X-TV-TWITCH-AD-ROLL-TYPE="MIDROLL"\n#EXTINF:2,ad\nhttps://native.example/ad.ts';
function harness(cleanTypes = new Set()) {
    const requests = [], messages = [];
    const ctx = vm.createContext({ URL, console: { log() {} }, postMessage: m => messages.push(m),
        fetch: async () => ({ blob: async () => new Blob([]) }) });
    vm.runInContext(['declareOptions', 'parseAttributes', 'getStreamUrlForResolution', 'stripAdSegments', 'processM3U8']
        .map(extract).join('\n'), ctx);
    ctx.declareOptions(ctx);
    const stream = { ChannelName: 'example', IsShowingAd: false, LastPlayerReload: 0,
        EncodingsM3U8: '', ModifiedM3U8: null, IsUsingModifiedM3U8: false, UsherParams: '',
        RequestedAds: new Set(), Urls: {}, ResolutionList: [], BackupEncodingsM3U8Cache: {},
        ActiveBackupPlayerType: null, NumStrippedAdSegments: 0 };
    stream.Urls[media] = { Resolution: '1920x1080', FrameRate: 60, Codecs: 'avc1' };
    ctx.StreamInfosByUrl[media] = stream;
    ctx.getAccessToken = async (_, type) => {
        requests.push(type);
        return { status: 200, json: async () => ({ data: { streamPlaybackAccessToken: { signature: type, value: type } } }) };
    };
    const realFetch = async address => {
        const url = new URL(address);
        if (url.hostname === 'usher.ttvnw.net') {
            const type = url.searchParams.get('token');
            return { status: 200, text: async () => `#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=${type === 'autoplay' ? '640x360' : '1920x1080'},FRAME-RATE=60\nhttps://backup.example/${type}.m3u8` };
        }
        const type = url.pathname.slice(1, -5);
        return { status: 200, text: async () => `${cleanTypes.has(type) ? clean : ad}\n#backup-${type}` };
    };
    return { ctx, stream, requests, messages, process: text => ctx.processM3U8(media, text, realFetch) };
}
test('clean native playlists pass through without backup requests', async () => {
    const h = harness(); assert.equal(await h.process(clean), clean); assert.equal(h.requests.length, 0);
});
test('clean embed wins before popout and autoplay', async () => {
    const h = harness(new Set(['embed', 'popout', 'autoplay']));
    assert.ok((await h.process(ad)).includes('#backup-embed')); assert.deepEqual(h.requests, ['embed']);
});
test('popout is tried before the 360p autoplay fallback', async () => {
    const h = harness(new Set(['popout', 'autoplay']));
    assert.ok((await h.process(ad)).includes('#backup-popout')); assert.deepEqual(h.requests, ['embed', 'popout']);
});
test('autoplay is the third alternative when both source alternatives contain ads', async () => {
    const h = harness(new Set(['autoplay']));
    assert.ok((await h.process(ad)).includes('#backup-autoplay')); assert.deepEqual(h.requests, ['embed', 'popout', 'autoplay']);
});
test('all contaminated alternatives use the embed fallback and cache ad segments for substitution', async () => {
    const h = harness(); const result = await h.process(ad);
    assert.ok(result.includes('#backup-embed')); assert.equal(h.stream.IsStrippingAdSegments, true);
    assert.ok(h.ctx.AdSegmentCache.has('https://native.example/ad.ts'));
    assert.deepEqual(h.requests, ['embed', 'popout', 'autoplay']);
});
test('ad completion requests the original reload and releases the backup', async () => {
    const h = harness(new Set(['embed'])); await h.process(ad); h.messages.length = 0;
    assert.equal(await h.process(clean), clean); assert.equal(h.stream.IsShowingAd, false);
    assert.equal(h.stream.ActiveBackupPlayerType, null);
    assert.ok(h.messages.some(m => m.key === 'ReloadPlayer'));
});
test('a later break retries embed after the original post-reload request window', async () => {
    const types = new Set(['autoplay']); const h = harness(types);
    await h.process(ad); await h.process(clean); types.add('embed');
    h.stream.LastPlayerReload = Date.now() - 2000;
    const previous = h.requests.length;
    assert.ok((await h.process(ad)).includes('#backup-embed'));
    assert.deepEqual(h.requests.slice(previous), ['embed']);
});
test('the original short post-reload request window starts at autoplay', async () => {
    const h = harness(new Set(['embed', 'popout', 'autoplay']));
    h.ctx.HasTriggeredPlayerReload = true;
    assert.ok((await h.process(ad)).includes('#backup-autoplay'));
    assert.deepEqual(h.requests, ['autoplay']);
});
test('the restored stable engine does not contain fork-only selection or acceleration layers', () => {
    const options = extract('declareOptions');
    for (const name of ['FastAutoplayFirstTry', 'PreferLowQualityBackup', 'BackupSwapFirst', 'PinBackupPlayerType', 'DriftCorrectionRate']) {
        assert.ok(!options.includes(name), name);
    }
    assert.ok(!source.includes('function startDriftCorrection('));
    assert.ok(!source.includes('.playbackRate ='));
});
