# AdBonk

Independent continuation of TwitchAdSolutions. Read docs/BASELINE.md for provenance and docs/MAINTENANCE.md for the workflow.

- Use English for all project documentation, comments, user-facing text, metadata, and commit messages.
- Preserve MIT license, author credits, and Git history.
- Main supported entry point: vaft/vaft.user.js. Keep stable and experimental variants separate.
- Support userscript managers and the experimental Chromium/Firefox extension packages. Keep the stable userscript as the single blocking source; extension builds must copy it byte-for-byte. Do not restore uBlock Origin resources, scriptlets, installation options, or release artifacts.
- Worker functions are serialized with `.toString()`. They must not capture window-scope variables. See CLAUDE.md for imported architectural notes.
- Do not merge testing features into stable automatically.
- Update userscript @version for published changes. Bump the internal conflict version in the affected userscript for behavior changes. Initial metadata-only changes leave internal versions unchanged.
- Public versions restart at `1.0.0` for AdBonk. Use three-part semantic versions for subsequent updates; each variant advances independently. Never reset the inherited internal conflict counters to match a public version.
- The maintained branch is `main`. Installation/update URLs must point to rafelolv/AdBonk/main. Historical docs and author credits retain upstream links.
- Run npm run check after changes. Upstream tests copy functions; report their limits and validate player behavior in the browser.
- Never claim current live ad-blocking works based only on unit tests.
