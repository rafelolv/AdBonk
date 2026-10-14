# Maintenance and publication

## Local layout

The parent directory contains three complete checkouts:

- `upstream-pixeltris/`: the archived original, retained for reference.
- `upstream-ryanbr/`: the inspected maintenance fork, retained for reference.
- `AdBonk/`: the project to maintain; make changes here.

AdBonk preserves Git history and uses the `main` branch. Remotes: `origin` points to `git@github.com:rafelolv/AdBonk.git`; `ryanbr` and `pixeltris` point to the public source repositories. Configuring a remote does not create a GitHub repository.

## GitHub repository

The repository is published at [rafelolv/AdBonk](https://github.com/rafelolv/AdBonk). Its default branch is `main`. The initial GitHub README commit was merged with the imported project history during the branch migration. The instructions below are retained for creating a new copy.

The SSH key authenticated as `rafelolv`. SSH authorizes Git operations, but repository creation requires the authenticated API or GitHub website. Neither `gh` nor API authentication was configured in the initial environment.

For an independent repository, open [GitHub — new repository](https://github.com/new), choose owner `rafelolv`, name `AdBonk`, and public visibility. **Do not initialize a README, license, or .gitignore**: these already exist in local history. This creates an independent project with the source history and credits.

If you prefer GitHub to identify it as a fork, use [Fork ryanbr's repository](https://github.com/ryanbr/TwitchAdSolutions/fork), choose owner `rafelolv`, and name it `AdBonk`. The local baseline already derives from that fork. Then push the local branch normally.

Once the repository exists, run inside `AdBonk/`:

```bash
git push -u origin main
```

Do not push all inherited tags during the initial publication. The installation URL will be:

`https://raw.githubusercontent.com/rafelolv/AdBonk/main/vaft/vaft.user.js`

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

For every release request, follow [Creating an AdBonk release](RELEASING.md) and the [release notes template](RELEASE-TEMPLATE.md).

1. Update the stable userscript when changing behavior. Keep experimental variants separate.
2. Increment the userscript `@version`; for behavior changes, also increment the internal conflict version in the affected userscript. For any stable-script or extension change, align `package.json` and stable `@version` to the same new version and rebuild both extensions. No separate extension version file is used.
3. Run `npm run check`, rebuild both extension packages, and follow the synchronization rules below. Test live streams separately with the userscript and each extension: preroll and midroll ads, channel switching, quality, mute, pause, background tabs, and broadcast end. Record any checks that could not be completed.
4. Document results in CHANGELOG.md, commit, and push `main`.
5. Write and commit `docs/releases/<tag>.md` before tagging. Push an annotated tag containing `v` followed by the exact stable version at the prepared commit. Use a new tag: `v1.0.0`, `v1.0.1`, and `v1.0.7` must not be reused. For a future shared `1.0.8` release, after updating and validating the appropriate files:

```bash
git tag -a v1.0.8 -m 'AdBonk 1.0.8'
git push origin v1.0.8
```

Automation validates files and tests, checks the tag version, requires nonempty English release notes at `docs/releases/<tag>.md`, and publishes the stable vaft userscript, both extension ZIPs, and the license. It does not create automatic commits or rewrite links to third-party repositories. Check GitHub Actions, release notes, attached assets, and hashes after publication.

## Incorporate upstream changes

```bash
git fetch ryanbr
git fetch pixeltris
git log --oneline main..ryanbr/master
git diff main...ryanbr/master -- vaft/vaft.user.js
```

Review commits and integrate them on a working branch. Fixes may depend on other commits; check dependencies before cherry-picking. Merges can reintroduce upstream namespaces, URLs, workflows, and documentation: preserve AdBonk's identity and author credits. Do not automatically promote experimental scripts to stable or reintroduce the removed uBlock Origin integration.

## Extension builds

The stable userscript remains the single blocking source. `npm run build:extension` copies it verbatim into Chromium and Firefox packages under `dist/`; do not edit generated copies. Change adapters and popup files under `extension/` separately. The shared version is read from `package.json`; the build validates the stable userscript metadata against it. Interface or adapter changes advance the same version in package and userscript metadata, even when the blocking runtime is unchanged. Release `v1.0.1` bundles stable extension `1.0.5` with stable userscript `1.0.1`.

Run `npm run check` after changes. When browsers are available, `npm run test:extension:browser` checks actual extension installation and integration on loopback fixtures. Follow [the extension guide](EXTENSION.md) for limitations, temporary installation, and store publication. Release automation attaches both ZIPs to tagged releases; it does not sign or submit extensions to browser stores.

The current source builds both extensions and userscript as `1.0.7`. This shared baseline is higher than earlier independent extension versions, preserving the update path. This update adds userscript icon metadata and smaller toolbar artwork; the stable script body and internal conflict counter are unchanged. The existing release and approved store versions are separate snapshots.

### Keep the userscript and extensions synchronized

| Change | Required versions and packages |
| --- | --- |
| Stable `vaft/vaft.user.js`, including metadata | Increment the shared package and stable userscript version together. Increment the internal conflict counter for behavior changes. Rebuild both extensions from the updated stable file. |
| Extension popup, adapter, or packaging | Increment the shared package and stable userscript metadata version, then rebuild both packages. Keep the blocking runtime and conflict counter unchanged unless behavior also changes. |
| Experimental or legacy userscript | Increment only the affected variant's version and behavior counter as appropriate. Do not automatically promote it into stable or the extension. |
| Documentation only | No runtime version bump is required. Run the required checks. |

For shared changes, run `npm run check` and `npm run test:extension:browser`. The unit checks rebuild both packages and verify that each bundled blocker matches the stable source byte-for-byte. The browser checks validate extension integration; they do not replace testing real streams with the userscript and both extensions, one installation method at a time. If a browser or live-ad scenario is unavailable, record that limitation explicitly.

Before distributing a ZIP, verify its `build-info.json`: `userscriptVersion` must match the intended stable public version, and `coreSha256` must match the stable source. Record the userscript and extension versions together in the changelog. Never edit a generated core copy or reuse an extension version after changing its bundled code.

Publishing to GitHub does not update store installations. Submit rebuilt packages through the existing Chrome and Firefox listings, using their new extension version, and track review/signing status separately. Keep the last approved store version distinct from the latest GitHub build until review completes.

## Architecture overview

The userscript starts at `document-start`, hooks `fetch` and Worker, and injects serialized functions into the player worker. These analyze M3U8 playlists, identify ads, and try to obtain tokens/playlists for other player types. The page layer receives worker messages, monitors buffering, and handles recovery, reloads, and overlays.

Functions transferred with `.toString()` must be self-contained: a variable available in page scope may not exist inside the worker. Inherited settings use `twitchAdSolutions_*` localStorage keys, retained for compatibility. Logs still use `[AD DEBUG] TwitchAdSolutions` and the upstream internal version, while the userscript manager dashboard shows AdBonk and the public script version.
