(async () => {
    const api = globalThis.browser || globalThis.chrome;
    const title = document.getElementById('status');
    const detail = document.getElementById('detail');
    const panel = document.getElementById('tab-status');
    const show = (state, heading, copy) => {
        panel.dataset.state = state;
        title.textContent = heading;
        detail.textContent = copy;
    };
    document.getElementById('version').textContent = api.runtime.getManifest().version;
    try {
        const [tab] = await api.tabs.query({ active: true, currentWindow: true });
        if (!tab || typeof tab.id !== 'number') throw new Error('No active tab');
        const status = await api.tabs.sendMessage(tab.id, { type: 'adbonk-status' }, { frameId: 0 });
        if (status?.conflict) {
            show('conflict', 'One blocker at a time', 'Disable your other Twitch ad blocker, then reload.');
        } else if (status?.initialized) {
            show('ready', 'Ready to bonk', 'AdBonk is loaded. Go watch your stream.');
        } else {
            show('unloaded', 'Give it a reload', 'Allow access to Twitch, then reload the page. Clips are skipped.');
        }
    } catch {
        show('outside', 'See you on Twitch', 'Open a live stream. On Twitch already? Check site access and reload.');
    }
})();
