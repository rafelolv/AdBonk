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

The package and all five userscripts start the AdBonk version sequence at `1.0.0`. This does not change their support status: stable, experimental, legacy, and companion scripts remain separate. Each variant increments its public version when it changes; unchanged variants do not need a bump.

- Patch (`1.0.1`): fixes and small compatible updates.
- Minor (`1.1.0`): new compatible features.
- Major (`2.0.0`): breaking changes or changes that require users to migrate.

Keep `package.json` aligned with the stable userscript. Release tags use the stable public version, such as `v1.0.0`. The runtime conflict counters (`95` in stable vaft at this reset) are separate from public versions and must never be reset for branding. Keep historical version references in the changelog and provenance documents.

## Updates and releases

1. Update the stable userscript when changing behavior. Keep experimental variants separate.
2. Increment the userscript `@version`; for behavior changes, also increment the internal conflict version in the affected userscript.
3. Run `npm run check` and test live streams: preroll and midroll ads, channel switching, quality, mute, pause, background tabs, and broadcast end.
4. Document results in CHANGELOG.md, commit, and push `main`.
5. To create a release, push a tag containing `v` followed by the exact stable version. For the `1.0.0` baseline, when ready to publish:

```bash
git tag -a v1.0.0 -m 'AdBonk 1.0.0'
git push origin v1.0.0
```

Automation validates files and tests, checks the tag version, and publishes the stable vaft userscript with the license. It does not create automatic commits or rewrite links to third-party repositories. Check GitHub Actions after publication; hosted execution has not yet been validated during this local setup.

## Incorporate upstream changes

```bash
git fetch ryanbr
git fetch pixeltris
git log --oneline main..ryanbr/master
git diff main...ryanbr/master -- vaft/vaft.user.js
```

Review commits and integrate them on a working branch. Fixes may depend on other commits; check dependencies before cherry-picking. Merges can reintroduce upstream namespaces, URLs, workflows, and documentation: preserve AdBonk's identity and author credits. Do not automatically promote experimental scripts to stable or reintroduce the removed uBlock Origin integration.

## Architecture overview

The userscript starts at `document-start`, hooks `fetch` and Worker, and injects serialized functions into the player worker. These analyze M3U8 playlists, identify ads, and try to obtain tokens/playlists for other player types. The page layer receives worker messages, monitors buffering, and handles recovery, reloads, and overlays.

Functions transferred with `.toString()` must be self-contained: a variable available in page scope may not exist inside the worker. Inherited settings use `twitchAdSolutions_*` localStorage keys, retained for compatibility. Logs still use `[AD DEBUG] TwitchAdSolutions` and the upstream internal version, while the userscript manager dashboard shows AdBonk and the public script version.
