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
            title.textContent = 'Another blocker is already loaded';
            detail.textContent = 'Disable the AdBonk userscript or other TwitchAdSolutions scripts, then reload the page.';
        } else if (status?.initialized) {
            title.textContent = 'AdBonk is loaded';
            detail.textContent = 'The script hooks are installed on this page. During detected ad breaks, look for the notice in the player.';
        } else {
            title.textContent = 'AdBonk did not initialize';
            detail.textContent = 'Reload the Twitch page and check site permissions. Clips and auxiliary frames are skipped.';
        }
    } catch {
        title.textContent = 'Open a Twitch live stream';
        detail.textContent = 'AdBonk runs on Twitch. If you just installed it, allow access to Twitch and reload the page.';
    }
})();
