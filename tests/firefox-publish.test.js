// Exercise submission guards without network access or store credentials.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { prepareFirefoxPublish } = require('../tools/prepare-firefox-publish.js');

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adbonk-publish-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const write = (name, data) => {
        const filename = path.join(root, name);
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename, typeof data === 'string' ? data : JSON.stringify(data));
    };
    const core = '// @version 1.0.9\nconsole.log("fixture");';
    write('package.json', { version: '1.0.9' });
    write('vaft/vaft.user.js', core);
    write('LICENSE', 'test license');
    write('dist/firefox/LICENSE', 'test license');
    write('dist/firefox/blocker.js', core);
    write('dist/firefox/manifest.json', { version: '1.0.9', browser_specific_settings: { gecko: { id: 'adbonk@rafelolv.github.io' } } });
    write('dist/firefox/build-info.json', { version: '1.0.9', userscriptVersion: '1.0.9', coreSha256: createHash('sha256').update(core).digest('hex') });
    write('dist/adbonk-firefox-1.0.9.zip', 'reproducible archive fixture');
    write('published.zip', 'reproducible archive fixture');
    write('docs/releases/v1.0.9.md', 'Maintenance update.');
    const args = { root, tag: 'v1.0.9', archive: path.join(root, 'published.zip'), metadata: path.join(root, 'metadata.json') };
    return { root, write, args, prepare: () => prepareFirefoxPublish(args) };
}

test('verified publication generates version notes without credentials', t => {
    const f = fixture(t);
    assert.deepEqual(f.prepare(), { version: '1.0.9', addonId: 'adbonk@rafelolv.github.io' });
    assert.deepEqual(JSON.parse(fs.readFileSync(f.args.metadata)), { version: { release_notes: { 'en-US': 'Maintenance update.' } } });
});

test('publication rejects branch names and preview tags before writing metadata', t => {
    const f = fixture(t);
    for (const tag of ['main', '../v1.0.9', 'v1.0.9-beta.1', 'v1.0.9; echo invalid']) {
        assert.throws(() => prepareFirefoxPublish({ ...f.args, tag }), /stable release tag/);
    }
    assert.equal(fs.existsSync(f.args.metadata), false);
});

test('publication rejects a mismatch between the tag and bundled version', t => {
    const f = fixture(t);
    f.write('dist/firefox/build-info.json', { version: '1.0.8', userscriptVersion: '1.0.9' });
    assert.throws(f.prepare, /versions must match/);
    assert.equal(fs.existsSync(f.args.metadata), false);
});

test('publication rejects another Firefox add-on identity', t => {
    const f = fixture(t);
    f.write('dist/firefox/manifest.json', { version: '1.0.9', browser_specific_settings: { gecko: { id: 'another-addon@example.invalid' } } });
    assert.throws(f.prepare, /add-on identity/);
});

test('publication rejects an archive different from the published release', t => {
    const f = fixture(t);
    f.write('published.zip', 'different published content');
    assert.throws(f.prepare, /archive differs/);
    assert.equal(fs.existsSync(f.args.metadata), false);
});

test('publication rejects a changed blocker or an empty release note', t => {
    const f = fixture(t);
    f.write('dist/firefox/blocker.js', 'unexpected blocker');
    assert.throws(f.prepare, /Bundled blocker/);
    f.write('dist/firefox/blocker.js', '// @version 1.0.9\nconsole.log("fixture");');
    f.write('docs/releases/v1.0.9.md', '  \n');
    assert.throws(f.prepare, /Release notes are required/);
    assert.equal(fs.existsSync(f.args.metadata), false);
});
