# AdBonk

Independent continuation of TwitchAdSolutions. Read docs/BASELINE.md for provenance and docs/MAINTENANCE.md for the workflow.

- Use English for all project documentation, comments, user-facing text, metadata, and commit messages.
- Preserve MIT license, author credits, and Git history.
- Main supported entry point: vaft/vaft.user.js. Keep stable and experimental variants separate.
- Support userscript managers and the stable Chromium/Firefox extension packages. The maintainer promoted the extension after reported successful local use in Firefox and Chrome. Keep the stable userscript as the single blocking source; extension builds must copy it byte-for-byte. Do not restore uBlock Origin resources, scriptlets, installation options, or release artifacts.
- Worker functions are serialized with `.toString()`. They must not capture window-scope variables. See CLAUDE.md for imported architectural notes.
- Do not merge testing features into stable automatically.
- Update userscript @version for published changes. Bump the internal conflict version in the affected userscript for behavior changes. Initial metadata-only changes leave internal versions unchanged.
- Use one shared three-part semantic version for the stable userscript, both extensions, and release tag. `package.json` is the canonical version source; the stable `@version` must match it. Experimental, legacy, and companion scripts retain separate versions. Never reset inherited internal conflict counters to match public versions.
- For any published stable-script or extension change, including icons, popup, or packaging, increment the shared package version and stable userscript `@version`, and rebuild both extensions. Extension-only changes update userscript metadata only; do not alter its runtime or internal conflict counter unless blocking behavior changes. Do not restore a separate extension version file.
- The build must reject a mismatch between `package.json` and stable userscript `@version`. Both manifest versions and build-info version fields must equal that shared version. Never ship changed bundled core under an unchanged version.
- Validate shared changes in both distribution formats: run `npm run check` (which rebuilds and verifies both packages), and run `npm run test:extension:browser` when changing the core or integration. Test real Twitch playback with the userscript and each extension separately; report unavailable checks rather than claiming compatibility. Extension-only changes must keep the stable runtime body unchanged; its version metadata advances with the shared release version.
- Edit the stable core only in `vaft/vaft.user.js`, never in `dist/` or a browser-specific copy. Experimental/legacy script changes do not automatically enter the extension. GitHub publication does not update installed store extensions: submit the new packages to their existing store listings and track pending review separately.
- The maintained branch is `main`. Installation/update URLs must point to rafelolv/AdBonk/main. Historical docs and author credits retain upstream links.
- Run npm run check after changes. Upstream tests copy functions; report their limits and validate player behavior in the browser.
- Never claim current live ad-blocking works based only on unit tests.

## Release requests

When the user asks to create a release, follow [docs/RELEASING.md](docs/RELEASING.md) and use [docs/RELEASE-TEMPLATE.md](docs/RELEASE-TEMPLATE.md). Prepare, validate, publish, and verify the release when authorized; do not stop at creating a tag. Write concise English notes for users, with artifact versions and support status, relevant changes, installation/update instructions, and actual validation results and limits. Extensions are stable; experimental userscript variants remain experimental. Store availability and signing are separate from release stability. Never reuse a published tag or silently replace published packages. Report the final release URL and attached files.
