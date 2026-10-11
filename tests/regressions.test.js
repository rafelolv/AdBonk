// Exercise functions extracted from the shipped userscripts, not copied implementations.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scripts = ['vaft/vaft.user.js', 'vaft/vaft_testing.user.js', 'video-swap-new/video-swap-new.user.js'];

function loadFunctions(file, names, globals) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const functions = names.map(name => {
        const start = source.indexOf(`    function ${name}(`);
        if (start < 0 && name === 'schedulePlayerBufferingCheck') return '';
        assert.ok(start >= 0, `Missing ${name} in ${file}`);
        const end = source.indexOf('\n    }', start);
        assert.ok(end >= start, `Missing end of ${name}`);
        return source.slice(start, end + '\n    }'.length);
    }).join('\n');
    const context = vm.createContext(globals);
    new vm.Script(functions, { filename: file }).runInContext(context);
    return context;
}

function video() {
    return { paused: false, ended: false, plays: 0, play() { this.plays++; this.paused = false; return Promise.resolve(); } };
}

function visibilityHarness(file, type = 'live') {
    let currentVideo = video();
    const listeners = {};
    const state = { props: { content: { type } } };
    const document = {
        hidden: false,
        getElementById: () => null,
        getElementsByTagName: () => [currentVideo],
        addEventListener: (name, callback) => { listeners[name] = callback; }
    };
    const context = loadFunctions(file, ['onContentLoaded'], {
        document,
        getPlayerAndState: () => ({ state, player: { getHTMLVideoElement: () => currentVideo } }),
        playerBufferState: { userPauseIntent: false },
        backgroundResumeState: {},
        clearBackgroundResumeTimers() {},
        playPlayer: element => element.play(),
        localStorage: { getItem: () => null, setItem() {} },
        maskAsNative: fn => fn,
        setTimeout: () => 1,
        clearTimeout() {},
        console: { log() {} }
    });
    context.onContentLoaded();
    return {
        document, state,
        current: () => currentVideo,
        replace: () => { currentVideo = video(); return currentVideo; },
        visibility(hidden) { document.hidden = hidden; listeners.visibilitychange(); }
    };
}

for (const file of scripts) {
    test(`${file}: focus never resumes a VOD`, () => {
        const h = visibilityHarness(file, 'vod');
        h.visibility(true);
        h.current().paused = true;
        h.visibility(false);
        assert.equal(h.current().plays, 0);
    });
    test(`${file}: live-to-VOD navigation does not resume the VOD`, () => {
        const h = visibilityHarness(file);
        h.visibility(true);
        h.state.props.content.type = 'vod';
        h.current().paused = true;
        h.visibility(false);
        assert.equal(h.current().plays, 0);
    });
    test(`${file}: focus without a hide event does not resume a paused video`, () => {
        const h = visibilityHarness(file);
        h.current().paused = true;
        h.visibility(false);
        assert.equal(h.current().plays, 0);
    });
    test(`${file}: a live video playing before hiding can resume`, () => {
        const h = visibilityHarness(file);
        h.visibility(true);
        h.current().paused = true;
        h.visibility(false);
        assert.equal(h.current().plays, 1);
    });
    test(`${file}: a deliberately paused live video stays paused`, () => {
        const h = visibilityHarness(file);
        h.current().paused = true;
        h.visibility(true);
        h.visibility(false);
        assert.equal(h.current().plays, 0);
    });
    test(`${file}: a replacement video does not inherit resume permission`, () => {
        const h = visibilityHarness(file);
        h.visibility(true);
        h.replace().paused = true;
        h.visibility(false);
        assert.equal(h.current().plays, 0);
    });
    test(`${file}: focus recovery targets the player, not a separate ad video`, () => {
        const h = visibilityHarness(file);
        const ad = video();
        h.document.getElementsByTagName = () => [ad, h.current()];
        h.visibility(true);
        ad.paused = true;
        h.current().paused = true;
        h.visibility(false);
        assert.equal(ad.plays, 0);
        assert.equal(h.current().plays, 1);
    });
    test(`${file}: ad recovery never reloads or resumes a VOD`, () => {
        const name = file.startsWith('video-swap') ? 'reloadTwitchPlayer' : 'doTwitchPlayerTask';
        const context = loadFunctions(file, [name], {
            getPlayerAndState: () => ({ state: { props: { content: { type: 'vod' } } }, player: {
                isPaused() { assert.fail('VOD must be excluded before recovery accesses player controls'); }
            } }),
            console: { log() {} }
        });
        context[name](true, false);
    });
    test(`${file}: standard PiP recovery preserves the media instance`, () => {
        const name = file.startsWith('video-swap') ? 'reloadTwitchPlayer' : 'doTwitchPlayerTask';
        let pauses = 0;
        let plays = 0;
        const element = video();
        const player = {
            isPaused: () => false,
            getHTMLVideoElement: () => element,
            pause() { pauses++; },
            play() { plays++; return Promise.resolve(); }
        };
        const context = loadFunctions(file, [name], {
            document: { pictureInPictureElement: element },
            getPlayerAndState: () => ({ player, state: {
                props: { content: { type: 'live' } },
                setSrc() { assert.fail('PiP recovery must not replace the media instance'); }
            } }),
            playerBufferState: {},
            iosSoftReload: false,
            ReloadCooldownSeconds: 0,
            playPlayer: target => target.play(),
            console: { log() {} }
        });
        if (name === 'reloadTwitchPlayer') context[name](false, 'early');
        else context[name](false, true, 'early');
        assert.equal(pauses, 1);
        assert.equal(plays, 1);
    });
}

test('experimental background recovery never resumes a VOD or a replaced player', () => {
    let currentVideo = video();
    const state = { props: { content: { type: 'vod' } } };
    const timers = [];
    const context = loadFunctions('vaft/vaft_testing.user.js', ['clearBackgroundResumeTimers', 'scheduleBackgroundResume'], {
        document: { hidden: true },
        getPlayerAndState: () => ({ state, player: { getHTMLVideoElement: () => currentVideo } }),
        backgroundResumeState: { chains: 0, timers: [] },
        BackgroundResumeMaxChains: 2,
        BackgroundResumeRetryDelaysMs: [150, 600],
        playerBufferState: {},
        playPlayer: target => target.play(),
        setTimeout(fn) { timers.push(fn); return timers.length; },
        clearTimeout() {},
        console: { log() {} }
    });
    context.scheduleBackgroundResume(currentVideo);
    assert.equal(currentVideo.plays, 0);
    assert.equal(timers.length, 0);
    state.props.content.type = 'live';
    context.scheduleBackgroundResume(currentVideo);
    assert.equal(currentVideo.plays, 1);
    currentVideo.paused = true;
    currentVideo.isConnected = true;
    state.props.content.type = 'vod';
    timers.forEach(fn => fn());
    assert.equal(currentVideo.plays, 1);
    state.props.content.type = 'live';
    const oldVideo = currentVideo;
    currentVideo = video();
    timers.forEach(fn => fn());
    assert.equal(oldVideo.plays, 1);
    assert.equal(currentVideo.plays, 0);
});

for (const file of scripts.slice(0, 2)) {
    test(`${file}: tab focus does not multiply recurring monitor timers`, () => {
        let nextId = 0;
        const timers = new Map();
        const listeners = {};
        const context = loadFunctions(file, ['schedulePlayerBufferingCheck', 'monitorPlayerBuffering'], {
            document: { hidden: false, addEventListener: (name, fn) => { listeners[name] = fn; } },
            getPlayerAndState: () => null,
            playerBufferState: { inAdBreak: false, isLive: false },
            DisablePostBreakWedge: true,
            isActivelyStrippingAds: false,
            hideTwitchAdOverlays() {},
            PlayerBufferingDelay: 1000,
            setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, delay }); return id; },
            clearTimeout: id => timers.delete(id),
            console
        });
        context.monitorPlayerBuffering();
        assert.equal(timers.size, 1);
        for (let i = 0; i < 10; i++) {
            listeners.visibilitychange();
            assert.equal(timers.size, 1, 'Focus should replace the pending tick');
            const [id, timer] = timers.entries().next().value;
            assert.equal(timer.delay, 100);
            timers.delete(id);
            timer.fn();
            assert.equal(timers.size, 1, 'Each tick should schedule exactly one successor');
        }
    });
}
