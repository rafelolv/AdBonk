// Run the shipped playlist processor with deterministic Twitch responses.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'vaft/vaft.user.js'), 'utf8');

function extract(name) {
    const start = source.search(new RegExp(`    (?:async )?function ${name}\\(`));
    assert.ok(start >= 0, `Missing ${name}`);
    const end = source.indexOf('\n    }', start);
    assert.ok(end > start, `Missing end of ${name}`);
    return source.slice(start, end + 6);
}

const mediaUrl = 'https://native.example/live.m3u8';
const clean = '#EXTM3U\n#EXTINF:2,live\nhttps://native.example/segment.ts';
const ad = '#EXTM3U\n#EXT-X-DATERANGE:CLASS="twitch-stitched-ad",X-TV-TWITCH-AD-ROLL-TYPE="MIDROLL"\n#EXTINF:2,live\nhttps://native.example/segment.ts';

function harness(cleanTypes, options = {}) {
    const tokenRequests = [];
    const messages = [];
    const context = vm.createContext({
        URL, console: { log() {} },
        HasTriggeredPlayerReload: false,
        StreamInfosByUrl: {},
        videoCodecFamily: () => 'avc',
        stripAdSegments: text => text,
        postMessage: message => messages.push(message),
        getAccessToken: async (_, type) => {
            tokenRequests.push(type);
            return { status: 200, json: async () => ({ data: { streamPlaybackAccessToken: { signature: type, value: type } } }) };
        }
    });
    vm.runInContext(['declareOptions', 'createStreamInfo', 'hasAdTags', 'getMatchedAdSignifiers', 'parseAttributes', 'getStreamUrlForResolution', 'processM3U8'].map(extract).join('\n'), context);
    context.declareOptions(context);
    Object.assign(context, options);
    const stream = context.createStreamInfo('example', '', '');
    stream.Urls[mediaUrl] = { Resolution: '1920x1080', FrameRate: '60', Codecs: 'avc1' };
    stream.LastBreakUsedEscapeHatch = true;
    context.StreamInfosByUrl[mediaUrl] = stream;
    const realFetch = async address => {
        const url = new URL(address);
        if (url.hostname === 'usher.ttvnw.net') {
            const type = url.searchParams.get('token');
            const resolution = type === 'autoplay' ? '640x360' : '1920x1080';
            return { status: 200, text: async () => `#EXTM3U\n#EXT-X-STREAM-INF:RESOLUTION=${resolution},FRAME-RATE=60\nhttps://backup.example/${type}.m3u8` };
        }
        const type = url.pathname.slice(1, -5);
        return { status: 200, text: async () => `${cleanTypes.has(type) ? clean : ad}\n#backup-${type}` };
    };
    return { context, stream, tokenRequests, messages, process: text => context.processM3U8(mediaUrl, text, realFetch) };
}

test('previous 360p fallback does not skip a clean Source backup by default', async () => {
    const h = harness(new Set(['site', 'autoplay']));
    const playlist = await h.process(ad);
    assert.equal(h.stream.ActiveBackupPlayerType, 'site');
    assert.deepEqual(h.tokenRequests, ['site']);
    assert.ok(playlist.includes('#backup-site'));
});

test('search continues to another clean Source backup before using 360p', async () => {
    const h = harness(new Set(['popout', 'autoplay']));
    await h.process(ad);
    assert.equal(h.stream.ActiveBackupPlayerType, 'popout');
    assert.deepEqual(h.tokenRequests, ['site', 'popout']);
});

test('360p remains available after all higher-quality alternatives contain ads', async () => {
    const h = harness(new Set(['autoplay']));
    const playlist = await h.process(ad);
    assert.equal(h.stream.ActiveBackupPlayerType, 'autoplay');
    assert.deepEqual(h.tokenRequests, ['site', 'popout', 'mobile_web', 'embed', 'autoplay']);
    assert.ok(playlist.includes('#backup-autoplay'));
});

test('a new break rechecks Source after the preceding break used 360p', async () => {
    const available = new Set(['autoplay']);
    const h = harness(available);
    await h.process(ad);
    assert.equal(h.stream.ActiveBackupPlayerType, 'autoplay');
    for (let i = 0; i < 3; i++) await h.process(clean);
    assert.equal(h.stream.IsShowingAd, false);
    // The post-ad reload's short minimal-request window is tested separately by the existing logic.
    h.stream.LastPlayerReload = 0;
    h.tokenRequests.length = 0;
    available.add('site');
    await h.process(ad);
    assert.equal(h.stream.ActiveBackupPlayerType, 'site');
    assert.ok(!h.tokenRequests.includes('autoplay'));
});

test('disabling low-quality fallback still excludes autoplay', async () => {
    const h = harness(new Set(['autoplay']), { PreferLowQualityBackup: false });
    await h.process(ad);
    assert.ok(!h.tokenRequests.includes('autoplay'));
});

test('explicit fast-autoplay opt-in preserves the existing fast fallback', async () => {
    const h = harness(new Set(['site', 'autoplay']), { FastAutoplayFirstTry: true });
    await h.process(ad);
    assert.equal(h.stream.ActiveBackupPlayerType, 'autoplay');
    assert.deepEqual(h.tokenRequests, ['autoplay']);
});
