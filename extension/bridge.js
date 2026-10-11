// Runs in the isolated extension world. Exposes only a bounded status request.
(() => {
    const api = globalThis.browser || globalThis.chrome;
    api.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (sender.id !== api.runtime.id || request?.type !== 'adbonk-status') return false;
        const id = crypto.randomUUID();
        let finished = false;
        let timer;
        const finish = result => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            window.removeEventListener('message', receive);
            sendResponse(result);
        };
        const receive = event => {
            const message = event.data;
            if (event.source !== window || message?.source !== 'adbonk-extension'
                || message.type !== 'status-response' || message.id !== id) return;
            const status = message.status;
            if (!status || typeof status.initialized !== 'boolean' || typeof status.conflict !== 'boolean'
                || typeof status.version !== 'string' || status.version.length > 40) return;
            finish({ initialized: status.initialized, conflict: status.conflict, version: status.version });
        };
        window.addEventListener('message', receive);
        timer = setTimeout(() => finish({ unavailable: true }), 1500);
        window.postMessage({ source: 'adbonk-extension', type: 'status-request', id }, window.location.origin);
        return true;
    });
})();
