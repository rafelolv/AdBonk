// Exercise the pinned original focus and recovery routines, without AdBonk-only target guards.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../vaft/vaft.user.js'), 'utf8');
function load(name, globals) {
    const start = source.indexOf(`    function ${name}(`);
    assert.ok(start >= 0, name);
    const ctx = vm.createContext(globals);
    vm.runInContext(source.slice(start, source.indexOf('\n    }', start) + 6), ctx);
    return ctx;
}
function harness() {
    let paused = false, plays = 0, pauses = 0;
    const timers = [], writes = [], reloads = [];
    const player = { core: { state: {} }, isPaused: () => paused,
        pause() { pauses++; }, play() { plays++; } };
    const state = { props: { content: { type: 'live' } }, setSrc: value => reloads.push(value) };
    const settings = new Map([['video-quality', '{"default":"1080p60"}']]);
    let found = { player, state };
    const ctx = load('doTwitchPlayerTask', { getPlayerAndState: () => found,
        playerBufferState: {}, localStorageHookFailed: true,
        localStorage: { getItem: key => settings.get(key) ?? null, setItem: (key, val) => writes.push([key, val]) },
        postTwitchWorkerMessage() {}, console: { log() {} },
        setTimeout(fn, delay) { assert.equal(delay, 3000); timers.push(fn); } });
    return { ctx, player, state, settings, timers, writes, reloads,
        pause: () => { paused = true; }, missing: () => { found = null; },
        plays: () => plays, pauses: () => pauses };
}
test('original recovery respects a player that is already paused', () => {
    const h = harness(); h.pause(); h.ctx.doTwitchPlayerTask(false, true);
    assert.equal(h.plays(), 0); assert.equal(h.pauses(), 0); assert.equal(h.reloads.length, 0);
});
test('original pause/play recovery uses player controls', () => {
    const h = harness(); h.ctx.doTwitchPlayerTask(true, false);
    assert.equal(h.plays(), 1); assert.equal(h.pauses(), 1); assert.equal(h.reloads.length, 0);
});
test('original recovery reloads with a new media instance and refreshed token', () => {
    const h = harness(); h.ctx.doTwitchPlayerTask(false, true);
    assert.equal(h.reloads.length, 1); assert.equal(h.reloads[0].isNewMediaPlayerInstance, true);
    assert.equal(h.reloads[0].refreshAccessToken, true); assert.equal(h.plays(), 1);
});
test('original settings fallback restores the captured quality after reload', () => {
    const h = harness(); h.ctx.doTwitchPlayerTask(false, true);
    h.settings.set('video-quality', '{"default":"auto"}'); h.writes.length = 0;
    h.timers.forEach(fn => fn());
    assert.deepEqual(h.writes, [['video-quality', '{"default":"1080p60"}']]);
});
test('original recovery does not schedule fallback writes when storage hooks work', () => {
    const h = harness(); h.ctx.localStorageHookFailed = false; h.ctx.doTwitchPlayerTask(false, true);
    assert.equal(h.timers.length, 0);
});
test('original recovery safely skips a missing player', () => {
    const h = harness(); h.missing(); h.ctx.doTwitchPlayerTask(true, false);
    assert.equal(h.plays(), 0); assert.equal(h.reloads.length, 0);
});
function focusHarness() {
    let hidden = false, plays = 0;
    const listeners = {};
    const video = { paused: false, ended: false, muted: true, play() { plays++; } };
    const document = { getElementsByTagName: () => [video],
        addEventListener: (name, fn) => { listeners[name] = fn; } };
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    const ctx = load('onContentLoaded', { document, chrome: {}, navigator: { userAgent: 'Chrome' },
        playerBufferState: {}, localStorage: { getItem: () => null, setItem() {} }, console: { log() {} } });
    ctx.onContentLoaded();
    return { document, video, plays: () => plays,
        visibility(value) { hidden = value; listeners.visibilitychange({ preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} }); } };
}
test('original focus behavior exposes visible state and resumes a previously playing muted Chrome video', () => {
    const h = focusHarness(); h.visibility(true); h.video.paused = true; h.visibility(false);
    assert.equal(h.document.visibilityState, 'visible'); assert.equal(h.document.hidden, false);
    assert.equal(h.plays(), 1);
});
test('original focus behavior keeps a video paused when it was paused before hiding', () => {
    const h = focusHarness(); h.video.paused = true; h.visibility(true); h.visibility(false);
    assert.equal(h.plays(), 0);
});
