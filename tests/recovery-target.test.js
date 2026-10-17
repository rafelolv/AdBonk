// Exercise the shipped recovery code with multiple media elements and controlled timers.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../vaft/vaft.user.js'), 'utf8');

function extract(name) {
    const start = source.indexOf(`    function ${name}(`);
    if (start < 0) return '';
    return source.slice(start, source.indexOf('\n    }', start) + 6);
}

function video(overrides = {}) {
    return { dataset: {}, isConnected: true, tagName: 'VIDEO', muted: false, paused: false,
        ended: false, playbackRate: 1, currentTime: 10, readyState: 3,
        buffered: { length: 1, end: () => 20 }, ...overrides };
}

function harness() {
    const ad = video({ muted: true });
    const original = video();
    let current = original;
    let nextId = 0;
    const timers = new Map();
    const listeners = new Map();
    const storage = new Map();
    let plays = 0;
    let pauses = 0;
    const player = { core: { state: {} }, isPaused: () => current.paused,
        getHTMLVideoElement: () => current, pause() { pauses++; },
        play() { plays++; return Promise.resolve(); } };
    const state = { props: { content: { type: 'live' } }, setSrc() {} };
    let found = { player, state };
    const document = { location: { pathname: '/channel' },
        getElementsByTagName: () => [ad, current],
        addEventListener(name, fn) { listeners.set(name, fn); },
        removeEventListener(name) { listeners.delete(name); } };
    function schedule(fn, delay, repeat = false) {
        const id = ++nextId; timers.set(id, { fn, delay, repeat }); return id;
    }
    const ctx = vm.createContext({ document, getPlayerAndState: () => found,
        playerBufferState: {}, DriftCorrectionRate: 1.1, driftCatchUpInterval: null,
        driftCatchUpTimeout: null, driftCatchUpTarget: null,
        iosSoftReload: false, RecoverFromSilentMute: true,
        localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, val) => storage.set(key, val) },
        postTwitchWorkerMessage() {}, console: { log() {} },
        setTimeout: (fn, delay) => schedule(fn, delay), clearTimeout: id => timers.delete(id),
        setInterval: (fn, delay) => schedule(fn, delay, true), clearInterval: id => timers.delete(id),
        stopDriftCorrection() {} });
    new vm.Script(['getPlayerVideoElement', 'stopDriftCorrection', 'startDriftCorrection', 'doTwitchPlayerTask']
        .map(extract).join('\n')).runInContext(ctx);
    function fire(delay) {
        for (const [id, timer] of [...timers]) {
            if (timer.delay !== delay || !timers.has(id)) continue;
            if (!timer.repeat) timers.delete(id);
            timer.fn();
        }
    }
    return { ctx, ad, original, player, state, document, timers, listeners, storage, fire,
        current: () => current, replace: element => { current = element; },
        found: value => { found = value; }, plays: () => plays, pauses: () => pauses };
}

test('recovery selects the live player video ahead of an unmarked ad video', () => {
    const h = harness();
    assert.equal(h.ctx.getPlayerVideoElement(), h.original);
    const replacement = video(); h.replace(replacement);
    assert.equal(h.ctx.getPlayerVideoElement(), replacement);
});

test('recovery skips missing, disconnected, hidden-ad, VOD and unknown targets', () => {
    const h = harness();
    h.found(null); assert.equal(h.ctx.getPlayerVideoElement(), null);
    h.found({ player: h.player, state: h.state });
    for (const invalid of [null, video({ isConnected: false }), video({ dataset: { tasAdHidden: '1' } })]) {
        h.replace(invalid); assert.equal(h.ctx.getPlayerVideoElement(), null);
    }
    h.replace(h.original);
    for (const type of ['vod', undefined]) {
        h.state.props.content.type = type; assert.equal(h.ctx.getPlayerVideoElement(), null);
    }
});

test('post-reload recovery unmutes and seeks the player video, never the preceding ad', () => {
    const h = harness();
    h.ctx.doTwitchPlayerTask(false, true, 'early');
    h.fire(3000);
    assert.equal(h.original.muted, false);
    assert.equal(h.original.currentTime, 20);
    assert.equal(h.ad.muted, true);
    assert.equal(h.ad.currentTime, 10);
});

test('hard-reload restoration waits for an event from the current player video', () => {
    const h = harness();
    h.ctx.doTwitchPlayerTask(false, true, 'early');
    const replacement = video({ muted: true }); h.replace(replacement);
    h.listeners.get('canplay')({ target: h.ad });
    assert.equal(replacement.muted, true);
    h.listeners.get('canplay')({ target: replacement });
    assert.equal(replacement.muted, false);
    assert.equal(h.ad.muted, true);
    assert.equal(h.listeners.size, 0);
});

for (const change of ['channel', 'vod', 'player', 'pause']) {
    test(`pending reload recovery does not affect playback after ${change} change`, () => {
        const h = harness();
        h.ctx.doTwitchPlayerTask(false, true, 'early');
        const replacement = video({ muted: true }); h.replace(replacement);
        if (change === 'channel') h.document.location.pathname = '/other';
        if (change === 'vod') h.state.props.content.type = 'vod';
        if (change === 'player') h.found({ player: h.player, state: { props: { content: { type: 'live' } } } });
        if (change === 'pause') { h.ctx.playerBufferState.userPauseIntent = true; replacement.paused = true; }
        h.fire(3000); h.fire(4000); h.fire(5500);
        assert.equal(replacement.muted, true);
        assert.equal(replacement.currentTime, 10);
        assert.equal(replacement.playbackRate, 1);
        assert.equal(h.ad.muted, true);
        assert.equal(h.plays(), 1, 'Only the initial reload may request playback');
        assert.equal(h.listeners.size, 0);
    });
}

test('a deliberately paused player receives no reload or play request', () => {
    const h = harness(); h.original.paused = true; h.ctx.playerBufferState.userPauseIntent = true;
    h.ctx.doTwitchPlayerTask(false, true, 'early');
    assert.equal(h.plays(), 0); assert.equal(h.pauses(), 0); assert.equal(h.timers.size, 0);
});

test('drift completion restores the original speed and clears both timers', () => {
    const h = harness(); h.original.playbackRate = 1.25;
    h.ctx.startDriftCorrection(h.original);
    assert.equal(h.original.playbackRate, 1.1);
    h.original.currentTime = 19.5; h.fire(500);
    assert.equal(h.original.playbackRate, 1.25); assert.equal(h.timers.size, 0);
});

test('drift replacement restores the old target before starting the new one', () => {
    const h = harness(); h.original.playbackRate = 1.25; h.ctx.startDriftCorrection(h.original);
    const replacement = video({ playbackRate: 0.9 }); h.replace(replacement);
    h.ctx.startDriftCorrection(replacement);
    assert.equal(h.original.playbackRate, 1.25); assert.equal(replacement.playbackRate, 1.1);
    h.fire(30000);
    assert.equal(replacement.playbackRate, 0.9); assert.equal(h.timers.size, 0);
});

for (const change of ['video', 'channel', 'vod', 'disconnect', 'pause', 'error']) {
    test(`drift cancellation restores its original target after ${change}`, () => {
        const h = harness(); h.ctx.startDriftCorrection(h.original);
        const replacement = video({ playbackRate: 0.9 });
        if (change === 'video') h.replace(replacement);
        if (change === 'channel') h.document.location.pathname = '/other';
        if (change === 'vod') h.state.props.content.type = 'vod';
        if (change === 'disconnect') h.original.isConnected = false;
        if (change === 'pause') h.original.paused = true;
        if (change === 'error') h.original.buffered.end = () => { throw new Error('Unavailable buffer'); };
        h.fire(500);
        assert.equal(h.original.playbackRate, 1); assert.equal(replacement.playbackRate, 0.9);
        assert.equal(h.timers.size, 0);
    });
}

test('explicit drift cancellation restores the target even when the player is unavailable', () => {
    const h = harness(); h.ctx.startDriftCorrection(h.original); h.found(null);
    h.ctx.stopDriftCorrection();
    assert.equal(h.original.playbackRate, 1); assert.equal(h.timers.size, 0);
});

test('the shipped ad-start handler restores the accelerated video, not its replacement', () => {
    const h = harness(); h.original.playbackRate = 1.25;
    h.ctx.startDriftCorrection(h.original);
    const replacement = video({ playbackRate: 0.9 }); h.replace(replacement);
    h.ctx.e = { data: { key: 'UpdateAdBlockBanner', hasAds: true } };
    h.ctx.updateAdblockBanner = () => {};
    const start = source.indexOf("if (e.data.key == 'UpdateAdBlockBanner')");
    const end = source.indexOf("} else if (e.data.key == 'PauseResumePlayer')", start);
    assert.ok(start >= 0 && end > start);
    new vm.Script(source.slice(start, end) + '}').runInContext(h.ctx);
    assert.equal(h.original.playbackRate, 1.25);
    assert.equal(replacement.playbackRate, 0.9);
    assert.equal(h.timers.size, 0);
});

test('stale drift callbacks cannot cancel a newer correction', () => {
    const h = harness(); h.ctx.startDriftCorrection(h.original);
    const stale = [...h.timers.values()].map(t => t.fn);
    const replacement = video(); h.replace(replacement); h.ctx.startDriftCorrection(replacement);
    stale.forEach(fn => fn());
    assert.equal(replacement.playbackRate, 1.1); assert.equal(h.timers.size, 2);
    h.ctx.stopDriftCorrection(); assert.equal(replacement.playbackRate, 1);
});

test('drift correction respects a speed change made during catch-up', () => {
    const h = harness(); h.ctx.startDriftCorrection(h.original);
    h.original.playbackRate = 1.5; h.fire(500);
    assert.equal(h.original.playbackRate, 1.5); assert.equal(h.timers.size, 0);
});

test('drift correction skips ad, paused, VOD and absent targets', () => {
    const h = harness();
    h.ctx.startDriftCorrection(h.ad); assert.equal(h.ad.playbackRate, 1);
    h.original.paused = true; h.ctx.startDriftCorrection(h.original);
    assert.equal(h.original.playbackRate, 1);
    h.original.paused = false; h.state.props.content.type = 'vod'; h.ctx.startDriftCorrection(h.original);
    assert.equal(h.original.playbackRate, 1);
    assert.doesNotThrow(() => h.ctx.startDriftCorrection(null)); assert.equal(h.timers.size, 0);
});
