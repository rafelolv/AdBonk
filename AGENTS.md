# TwitchClear

Independent continuation of TwitchAdSolutions. Read docs/BASELINE.md for provenance and docs/MAINTENANCE.md for the workflow.

- Use English for all project documentation, comments, user-facing text, metadata, and commit messages.
- Preserve MIT license, author credits, and Git history.
- Main supported entry point: vaft/vaft.user.js. Keep stable and experimental variants separate.
- Support userscript managers only. Do not restore uBlock Origin resources, scriptlets, installation options, or release artifacts.
- Worker functions are serialized with `.toString()`. They must not capture window-scope variables. See CLAUDE.md for imported architectural notes.
- Do not merge testing features into stable automatically.
- Update userscript @version for published changes. Bump the internal conflict version in the affected userscript for behavior changes. Initial metadata-only changes leave internal versions unchanged.
- Installation/update URLs must point to rafelolv/TwitchClear. Historical docs and author credits retain upstream links.
- Run npm run check after changes. Upstream tests copy functions; report their limits and validate player behavior in the browser.
- Never claim current live ad-blocking works based only on unit tests.
