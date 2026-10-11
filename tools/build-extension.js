// No code transform: the stable userscript is copied verbatim into both packages.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const core = fs.readFileSync(path.join(root, 'vaft/vaft.user.js'));
const publicVersion = core.toString().match(/^\/\/ @version\s+(\S+)/m)?.[1];
const internalVersion = Number(core.toString().match(/const ourTwitchAdSolutionsVersion = (\d+)/)?.[1]);
if (version !== publicVersion || !/^\d+\.\d+\.\d+$/.test(version) || !internalVersion) throw new Error('Stable/package version mismatch');

// ZIP with stored entries, fixed timestamps, and no platform-specific tooling.
function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}
function zipDirectory(directory, destination) {
    const files = [];
    function collect(base, prefix = '') {
        for (const entry of fs.readdirSync(base, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
            const name = prefix + entry.name;
            if (entry.isDirectory()) collect(path.join(base, entry.name), name + '/');
            else files.push({ name: Buffer.from(name), bytes: fs.readFileSync(path.join(base, entry.name)) });
        }
    }
    collect(directory);
    const local = [], central = [];
    let offset = 0;
    for (const { name, bytes } of files) {
        const crc = crc32(bytes);
        const header = Buffer.alloc(30);
        header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x21, 12);
        header.writeUInt32LE(crc, 14); header.writeUInt32LE(bytes.length, 18); header.writeUInt32LE(bytes.length, 22); header.writeUInt16LE(name.length, 26);
        const index = Buffer.alloc(46);
        index.writeUInt32LE(0x02014b50, 0); index.writeUInt16LE(20, 4); index.writeUInt16LE(20, 6); index.writeUInt16LE(0x21, 14);
        index.writeUInt32LE(crc, 16); index.writeUInt32LE(bytes.length, 20); index.writeUInt32LE(bytes.length, 24); index.writeUInt16LE(name.length, 28); index.writeUInt32LE(offset, 42);
        local.push(header, name, bytes); central.push(index, name);
        offset += header.length + name.length + bytes.length;
    }
    const directoryBytes = Buffer.concat(central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(directoryBytes.length, 12); end.writeUInt32LE(offset, 16);
    fs.writeFileSync(destination, Buffer.concat([...local, directoryBytes, end]));
}

for (const browser of ['chromium', 'firefox']) {
    const directory = path.join(root, 'dist', browser);
    fs.rmSync(directory, { recursive: true, force: true });
    fs.mkdirSync(directory, { recursive: true });
    fs.cpSync(path.join(root, 'extension'), directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'blocker.js'), core);
    fs.copyFileSync(path.join(root, 'LICENSE'), path.join(directory, 'LICENSE'));
    fs.writeFileSync(path.join(directory, 'startup.js'), `// Build-generated public metadata; no secrets or settings.\nwindow.__adbonkExtensionStartup = { previousVersion: window.twitchAdSolutionsVersion, expectedVersion: ${internalVersion}, version: ${JSON.stringify(version)} };\n`);
    const manifest = {
        manifest_version: 3, name: 'AdBonk (Experimental)', version,
        description: 'Bonk Twitch ads. Experimental extension using the AdBonk stable userscript.',
        homepage_url: 'https://github.com/rafelolv/AdBonk',
        host_permissions: ['*://*.twitch.tv/*'],
        icons: { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png', 128: 'icons/128.png' },
        action: { default_title: 'AdBonk', default_popup: 'popup/popup.html' },
        content_scripts: [
            { matches: ['*://*.twitch.tv/*'], js: ['startup.js', 'blocker.js', 'status.js'], run_at: 'document_start', world: 'MAIN', all_frames: true },
            { matches: ['*://*.twitch.tv/*'], js: ['bridge.js'], run_at: 'document_start', world: 'ISOLATED' }
        ]
    };
    if (browser === 'chromium') manifest.minimum_chrome_version = '111';
    else manifest.browser_specific_settings = { gecko: { id: 'adbonk@rafelolv.github.io', strict_min_version: '140.0', data_collection_permissions: { required: ['none'] } } };
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    const digest = createHash('sha256').update(core).digest('hex');
    fs.writeFileSync(path.join(directory, 'build-info.json'), JSON.stringify({ version, source: 'vaft/vaft.user.js', coreSha256: digest }, null, 2) + '\n');
    zipDirectory(directory, path.join(root, 'dist', `adbonk-${browser}-${version}.zip`));
    console.log(`Built ${browser} ${version}; stable core SHA-256 ${digest}`);
}
