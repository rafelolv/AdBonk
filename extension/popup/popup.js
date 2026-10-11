(async () => {
    const api = globalThis.browser || globalThis.chrome;
    const title = document.getElementById('status');
    const detail = document.getElementById('detail');
    document.getElementById('version').textContent = api.runtime.getManifest().version;
    try {
        const [tab] = await api.tabs.query({ active: true, currentWindow: true });
        if (!tab || typeof tab.id !== 'number') throw new Error('No active tab');
        const status = await api.tabs.sendMessage(tab.id, { type: 'adbonk-status' }, { frameId: 0 });
        if (status?.conflict) {
            title.textContent = 'Another script is running';
            detail.textContent = 'Turn off your other Twitch ad-blocking script, then reload the stream.';
        } else if (status?.initialized) {
            title.textContent = 'Ready on this page';
            detail.textContent = 'AdBonk has loaded. When it detects ads, a notice appears in the player.';
        } else {
            title.textContent = 'Not loaded on this page';
            detail.textContent = 'Allow access to Twitch and reload the page. AdBonk skips clips.';
        }
    } catch {
        title.textContent = 'Open a Twitch live stream';
        detail.textContent = 'Open a live stream to use AdBonk. If this is already Twitch, check site access and reload.';
    }
})();
