# Maintenance and publication

## Local layout

The parent directory contains three complete checkouts:

- `upstream-pixeltris/`: the archived original, retained for reference.
- `upstream-ryanbr/`: the inspected maintenance fork, retained for reference.
- `AdBonk/`: the project to maintain; make changes here.

AdBonk preserves Git history and the `master` branch. Remotes: `origin` points to `git@github.com:rafelolv/AdBonk.git`; `ryanbr` and `pixeltris` point to the public source repositories. Configuring a remote does not create a GitHub repository.

## Create the GitHub repository

The SSH key authenticated as `rafelolv`. SSH authorizes Git operations, but repository creation requires the authenticated API or GitHub website. Neither `gh` nor API authentication was configured in the initial environment.

For an independent repository, open [GitHub — new repository](https://github.com/new), choose owner `rafelolv`, name `AdBonk`, and public visibility. **Do not initialize a README, license, or .gitignore**: these already exist in local history. This creates an independent project with the source history and credits.

If you prefer GitHub to identify it as a fork, use [Fork ryanbr's repository](https://github.com/ryanbr/TwitchAdSolutions/fork), choose owner `rafelolv`, and name it `AdBonk`. The local baseline already derives from that fork. Then push the local branch normally.

Once the repository exists, run inside `AdBonk/`:

```bash
git push -u origin master
```

Do not push all inherited tags during the initial publication. After confirming the push, remove the publication-pending notice from the README, commit, and push that update. The installation URL will be:

`https://raw.githubusercontent.com/rafelolv/AdBonk/master/vaft/vaft.user.js`

## Updates and releases

1. Update the stable userscript when changing behavior. Keep experimental variants separate.
2. Increment the userscript `@version`; for behavior changes, also increment the internal conflict version in the affected userscript.
3. Run `npm run check` and test live streams: preroll and midroll ads, channel switching, quality, mute, pause, background tabs, and broadcast end.
4. Document results in CHANGELOG.md, commit, and push `master`.
5. To create a release, push a tag containing `v` followed by the exact stable version. For the initial baseline, when ready to publish:

```bash
git tag -a v68.5.7.1 -m 'AdBonk initial baseline'
git push origin v68.5.7.1
```

Automation validates files and tests, checks the tag version, and publishes the stable vaft userscript with the license. It does not create automatic commits or rewrite links to third-party repositories. Check GitHub Actions after publication; hosted execution has not yet been validated during this local setup.

## Incorporate upstream changes

```bash
git fetch ryanbr
git fetch pixeltris
git log --oneline master..ryanbr/master
git diff master...ryanbr/master -- vaft/vaft.user.js
```

Review commits and integrate them on a working branch. Fixes may depend on other commits; check dependencies before cherry-picking. Merges can reintroduce upstream namespaces, URLs, workflows, and documentation: preserve AdBonk's identity and author credits. Do not automatically promote experimental scripts to stable or reintroduce the removed uBlock Origin integration.

## Architecture overview

The userscript starts at `document-start`, hooks `fetch` and Worker, and injects serialized functions into the player worker. These analyze M3U8 playlists, identify ads, and try to obtain tokens/playlists for other player types. The page layer receives worker messages, monitors buffering, and handles recovery, reloads, and overlays.

Functions transferred with `.toString()` must be self-contained: a variable available in page scope may not exist inside the worker. Inherited settings use `twitchAdSolutions_*` localStorage keys, retained for compatibility. Logs still use `[AD DEBUG] TwitchAdSolutions` and the upstream internal version, while the Tampermonkey dashboard shows AdBonk and the public version with the `.1` suffix.
