// Verify the retained live-player integration around the restored blocking engine.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../vaft/vaft.user.js'), 'utf8');
function extract(name) {
    const start = source.indexOf(`    function ${name}(`);
    assert.ok(start >= 0, name);
    return source.slice(start, source.indexOf('\n    }', start) + 6);
}
function video(overrides = {}) {
    return { dataset: {}, isConnected: true, muted: false, paused: false, ended: false,
        playbackRate: 1, currentTime: 10, ...overrides };
}
function harness() {
    const ad = video({ muted: true }), original = video();
    let current = original, found;
    const timers = [], writes = [], reloads = [];
    let plays = 0, pauses = 0;
    const player = { core: { state: {} }, isPaused: () => current.paused,
        getHTMLVideoElement: () => current, pause() { pauses++; },
        play() { plays++; return Promise.resolve(); } };
    const state = { props: { content: { type: 'live' } }, setSrc: options => reloads.push(options) };
    found = { player, state };
    const document = { location: { pathname: '/channel' }, getElementsByTagName: () => [ad, current] };
    const ctx = vm.createContext({ document, getPlayerAndState: () => found, playerBufferState: {},
        localStorageHookFailed: true, console: { log() {} }, postTwitchWorkerMessage() {},
        localStorage: { getItem: key => key === 'video-quality' ? '{"default":"1080p60"}' : null,
            setItem: (key, value) => writes.push([key, value]) },
        setTimeout: fn => { timers.push(fn); return timers.length; } });
    vm.runInContext(['getPlayerVideoElement', 'doTwitchPlayerTask'].map(extract).join('\n'), ctx);
    return { ctx, ad, original, player, state, document, timers, writes, reloads,
        replace: element => { current = element; }, found: value => { found = value; },
        plays: () => plays, pauses: () => pauses };
}
test('recovery selects the live player video ahead of an unmarked ad video and follows replacement', () => {
    const h = harness(); assert.equal(h.ctx.getPlayerVideoElement(), h.original);
    const replacement = video(); h.replace(replacement); assert.equal(h.ctx.getPlayerVideoElement(), replacement);
});
test('recovery skips missing, disconnected, hidden-ad, VOD and unknown targets', () => {
    const h = harness(); h.found(null); assert.equal(h.ctx.getPlayerVideoElement(), null);
    h.found({ player: h.player, state: h.state });
    for (const invalid of [null, video({ isConnected: false }), video({ dataset: { tasAdHidden: '1' } })]) {
        h.replace(invalid); assert.equal(h.ctx.getPlayerVideoElement(), null);
    }
    h.replace(h.original);
    for (const type of ['vod', undefined]) { h.state.props.content.type = type; assert.equal(h.ctx.getPlayerVideoElement(), null); }
});
test('pause/play recovery uses the player controls and leaves auxiliary videos untouched', () => {
    const h = harness(); h.ctx.doTwitchPlayerTask(true, false);
    assert.equal(h.plays(), 1); assert.equal(h.pauses(), 1);
    assert.equal(h.ad.muted, true); assert.equal(h.ad.currentTime, 10); assert.equal(h.ad.playbackRate, 1);
});
test('reload keeps the original new-instance and token-refresh policy', () => {
    const h = harness(); h.ctx.doTwitchPlayerTask(false, true);
    assert.equal(h.reloads.length, 1);
    assert.equal(h.reloads[0].isNewMediaPlayerInstance, true); assert.equal(h.reloads[0].refreshAccessToken, true);
    assert.equal(h.plays(), 1);
    h.writes.length = 0; h.timers.forEach(fn => fn());
    assert.ok(h.writes.some(([key]) => key === 'video-quality'));
    assert.equal(h.original.playbackRate, 1); assert.equal(h.ad.muted, true);
});
for (const change of ['channel', 'vod', 'player', 'pause', 'missing']) {
    test(`pending reload settings do not affect playback after ${change} change`, () => {
        const h = harness(); h.ctx.doTwitchPlayerTask(false, true);
        const replacement = video({ muted: true }); h.replace(replacement); h.writes.length = 0;
        if (change === 'channel') h.document.location.pathname = '/other';
        if (change === 'vod') h.state.props.content.type = 'vod';
        if (change === 'player') h.found({ player: h.player, state: { props: { content: { type: 'live' } } } });
        if (change === 'pause') replacement.paused = true;
        if (change === 'missing') h.found(null);
        h.timers.forEach(fn => fn());
        assert.equal(h.writes.length, 0); assert.equal(replacement.muted, true);
        assert.equal(replacement.currentTime, 10); assert.equal(replacement.playbackRate, 1);
        assert.equal(h.plays(), 1);
    });
}
test('a deliberately paused player receives no reload or play request', () => {
    const h = harness(); h.original.paused = true; h.ctx.doTwitchPlayerTask(false, true);
    assert.equal(h.plays(), 0); assert.equal(h.pauses(), 0); assert.equal(h.reloads.length, 0);
});
test('standard PiP recovery keeps the media instance', () => {
    const h = harness(); h.document.pictureInPictureElement = h.original;
    h.ctx.doTwitchPlayerTask(false, true);
    assert.equal(h.reloads.length, 0); assert.equal(h.pauses(), 1); assert.equal(h.plays(), 1);
});
test('Twitch embed routes still resolve the live player-owned video', () => {
    const h = harness(); h.document.location.pathname = '/embed/channel';
    assert.equal(h.ctx.getPlayerVideoElement(), h.original);
});
