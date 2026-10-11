// Runs after the unchanged blocker in the page's MAIN world. Read-only status only.
(() => {
    const startup = window.__adbonkExtensionStartup;
    if (!startup) return;
    const conflict = typeof startup.previousVersion === 'number' && startup.previousVersion >= startup.expectedVersion;
    const initialized = !conflict && window.twitchAdSolutionsVersion === startup.expectedVersion
        && typeof window.realFetch === 'function' && typeof Object.getOwnPropertyDescriptor(window, 'Worker')?.get === 'function';
    window.addEventListener('message', event => {
        const message = event.data;
        if (event.source !== window || !message || message.source !== 'adbonk-extension'
            || message.type !== 'status-request' || typeof message.id !== 'string' || message.id.length > 100) return;
        window.postMessage({
            source: 'adbonk-extension', type: 'status-response', id: message.id,
            status: { initialized, conflict, version: startup.version }
        }, window.location.origin);
    });
})();
