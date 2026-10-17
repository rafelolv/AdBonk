// Verify the published package before any Mozilla credentials are used.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function prepareFirefoxPublish({ root, tag, archive, metadata }) {
    if (!/^v\d+\.\d+\.\d+$/.test(tag || '')) throw new Error('Expected a stable release tag such as v1.0.9');
    const version = tag.slice(1);
    const read = name => fs.readFileSync(path.join(root, name));
    const pkg = JSON.parse(read('package.json'));
    const core = read('vaft/vaft.user.js');
    const publicVersion = core.toString().match(/^\/\/ @version\s+(\S+)/m)?.[1];
    const manifest = JSON.parse(read('dist/firefox/manifest.json'));
    const info = JSON.parse(read('dist/firefox/build-info.json'));
    if ([pkg.version, publicVersion, manifest.version, info.version, info.userscriptVersion].some(value => value !== version)) {
        throw new Error('Release tag, userscript, package, and Firefox versions must match');
    }
    const addonId = manifest.browser_specific_settings?.gecko?.id;
    if (addonId !== 'adbonk@rafelolv.github.io') throw new Error('Unexpected Firefox add-on identity');
    if (!read('dist/firefox/blocker.js').equals(core) || info.coreSha256 !== createHash('sha256').update(core).digest('hex')) {
        throw new Error('Bundled blocker does not match the stable source');
    }
    if (!read('dist/firefox/LICENSE').equals(read('LICENSE'))) throw new Error('Packaged license differs from source');
    if (!fs.readFileSync(archive).equals(read(`dist/adbonk-firefox-${version}.zip`))) {
        throw new Error('Published Firefox archive differs from the reproducible build');
    }
    const notes = read(`docs/releases/${tag}.md`).toString().trim();
    if (!notes) throw new Error('Release notes are required');
    // AMO rejects release notes longer than 3000 characters. Keep the full notes on GitHub.
    let storeNotes = notes;
    if (storeNotes.length > 3000) {
        const footer = `\n\nFull release notes: https://github.com/rafelolv/AdBonk/releases/tag/${tag}`;
        const budget = 3000 - footer.length - 1;
        let prefix = '';
        for (const character of notes) {
            if (prefix.length + character.length > budget) break;
            prefix += character;
        }
        const boundary = prefix.lastIndexOf('\n\n');
        if (boundary > 0) prefix = prefix.slice(0, boundary);
        storeNotes = prefix.trimEnd() + '…' + footer;
    }
    // Existing listing metadata and license are retained; update only version notes.
    fs.writeFileSync(metadata, JSON.stringify({ version: { release_notes: { 'en-US': storeNotes } } }, null, 2) + '\n');
    return { version, addonId };
}

module.exports = { prepareFirefoxPublish };

if (require.main === module) {
    try {
        const [tag, archive, metadata] = process.argv.slice(2);
        if (!archive || !metadata) throw new Error('Usage: prepare-firefox-publish.js <tag> <published-zip> <metadata-output>');
        const result = prepareFirefoxPublish({ root: process.cwd(), tag, archive, metadata });
        console.log(`Verified Firefox ${result.version} for ${result.addonId}`);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
