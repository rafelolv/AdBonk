# Maintenance and publication

## Repository

The maintained project is [rafelolv/AdBonk](https://github.com/rafelolv/AdBonk), on branch `main`. The origin remote is `git@github.com:rafelolv/AdBonk.git`.

Install/update URL: `https://raw.githubusercontent.com/rafelolv/AdBonk/main/vaft/vaft.user.js`.

## Migrating an existing installation

AdBonk restarts public versioning at `1.0.0`. This is lower than the imported version numbers, so existing installations require a one-time manual reinstall. Open the install link and confirm replacing the installed script. If the manager refuses the lower version, back up local edits, remove that AdBonk variant, and install it again. Verify that the dashboard shows `1.0.0` and only one blocking variant is enabled. The script name, namespace, and update URLs remain the same; future updates increase from this new baseline.

If you installed a version whose update URL points to `master`, reinstall from the current `main` installation link in the README. Version `68.5.7.2` updates the stable script metadata to the new branch without changing runtime behavior. Other userscript variants also increment their metadata version suffix from `.1` to `.2`.

## Version policy

The package and all five userscripts start the AdBonk version sequence at `1.0.0`. This does not change their support status: stable, experimental, legacy, and companion scripts remain separate. The stable userscript and both extensions now share a single version; experimental, legacy, and companion variants advance independently when changed.

- Patch (`1.0.1`): fixes and small compatible updates.
- Minor (`1.1.0`): new compatible features.
- Major (`2.0.0`): breaking changes or changes that require users to migrate.

Use `package.json` as the canonical shared version for the stable userscript and both extension manifests. The stable userscript `@version` must match it. Even extension-only releases bump both the package and stable metadata; preserve runtime and conflict counters when behavior is unchanged. Release tags use the stable public version, such as `v1.0.0`. The runtime conflict counters (`95` in stable vaft at this reset) are separate from public versions and must never be reset for branding. Keep historical version references in the changelog and provenance documents.

## Updates and releases

For every release request, follow [Creating an AdBonk release](RELEASING.md), the [release notes template](RELEASE-TEMPLATE.md), and [Mozilla publication rules](FIREFOX-PUBLISH.md#publication-rules). Store metadata limits apply separately from GitHub notes; keep the tested 3,000-character Firefox note cap and check which requirements are automated versus manual.

1. Update the stable userscript when changing behavior. Keep experimental variants separate.
2. Increment the userscript `@version`; for behavior changes, also increment the internal conflict version in the affected userscript. For any stable-script or extension change, align `package.json` and stable `@version` to the same new version and rebuild both extensions. No separate extension version file is used.
3. Run `npm run check`, rebuild both extension packages, and follow the synchronization rules below. Test live streams separately with the userscript and each extension: preroll and midroll ads, channel switching, quality, mute, pause, background tabs, and broadcast end. Record any checks that could not be completed.
4. Document results in CHANGELOG.md, commit, and push `main`.
5. Write and commit `docs/releases/<tag>.md` before tagging. Push an annotated tag containing `v` followed by the exact stable version at the prepared commit. Never reuse a published tag. For a future shared `1.0.9` release, after updating and validating the appropriate files:

```bash
git tag -a v1.0.9 -m 'AdBonk 1.0.9'
git push origin v1.0.9
```

Automation validates files and tests, checks the tag version, requires nonempty English release notes at `docs/releases/<tag>.md`, and publishes the stable vaft userscript, both extension ZIPs, and the license. It does not create automatic commits or rewrite links to third-party repositories. Check GitHub Actions, release notes, attached assets, and hashes after publication.

## Review external patches

Review dependencies and playback impact before integrating external changes. Preserve AdBonk metadata, required license notices, and compatibility keys. Do not automatically promote experimental features or restore the removed integration.

## Extension builds

The stable userscript remains the single blocking source. `npm run build:extension` copies it verbatim into Chromium and Firefox packages under `dist/`; do not edit generated copies. Change adapters and popup files under `extension/` separately. The shared version is read from `package.json`; the build validates the stable userscript metadata against it. Interface or adapter changes advance the same version in package and userscript metadata, even when the blocking runtime is unchanged. Release `v1.0.1` bundles stable extension `1.0.5` with stable userscript `1.0.1`.

Run `npm run check` after changes. When browsers are available, `npm run test:extension:browser` checks actual extension installation and integration on loopback fixtures. Follow [the extension guide](EXTENSION.md) for limitations and installation. Release automation attaches both ZIPs, then submits Firefox through the [configured Mozilla workflow](FIREFOX-PUBLISH.md). No other store is automated.

Release `v1.0.8` builds both extensions and userscript as `1.0.8`. This maintenance update changes installation metadata and startup labels while preserving blocking behavior and internal conflict counters. Approved store versions remain separate from GitHub publication.

### Keep the userscript and extensions synchronized

| Change | Required versions and packages |
| --- | --- |
| Stable `vaft/vaft.user.js`, including metadata | Increment the shared package and stable userscript version together. Increment the internal conflict counter for behavior changes. Rebuild both extensions from the updated stable file. |
| Extension popup, adapter, or packaging | Increment the shared package and stable userscript metadata version, then rebuild both packages. Keep the blocking runtime and conflict counter unchanged unless behavior also changes. |
| Experimental or legacy userscript | Increment only the affected variant's version and behavior counter as appropriate. Do not automatically promote it into stable or the extension. |
| Documentation only | No runtime version bump is required. Run the required checks. |

For shared changes, run `npm run check` and `npm run test:extension:browser`. The unit checks rebuild both packages and verify that each bundled blocker matches the stable source byte-for-byte. The browser checks validate extension integration; they do not replace testing real streams with the userscript and both extensions, one installation method at a time. If a browser or live-ad scenario is unavailable, record that limitation explicitly.

Before distributing a ZIP, verify its `build-info.json`: `userscriptVersion` must match the intended stable public version, and `coreSha256` must match the stable source. Record the userscript and extension versions together in the changelog. Never edit a generated core copy or reuse an extension version after changing its bundled code.

Firefox submission runs after a successful GitHub release once the required Actions secrets are configured. Check the Firefox job and Mozilla Developer Hub separately: submission does not mean approval or immediate installation updates. Keep the approved store version distinct from the GitHub build until review completes. Use [Publish Firefox](FIREFOX-PUBLISH.md) for controlled submission of an existing release; other stores remain manual.

## Architecture overview

The userscript starts at `document-start`, hooks `fetch` and Worker, and injects serialized functions into the player worker. These analyze M3U8 playlists, identify ads, and try to obtain tokens/playlists for other player types. The page layer receives worker messages, monitors buffering, and handles recovery, reloads, and overlays.

Functions transferred with `.toString()` must be self-contained: a variable available in page scope may not exist inside the worker. Inherited settings use `twitchAdSolutions_*` localStorage keys, retained for compatibility. Logs use `[AD DEBUG] AdBonk` and the internal conflict version, while the userscript manager dashboard shows AdBonk and the public script version.
