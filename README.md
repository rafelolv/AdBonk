# TwitchClear

An independent continuation of [TwitchAdSolutions by pixeltris](https://github.com/pixeltris/TwitchAdSolutions), based on the updated [ryanbr fork](https://github.com/ryanbr/TwitchAdSolutions). Maintained by [rafelolv](https://github.com/rafelolv).

The initial focus is **stable vaft**: it intercepts Twitch stream playlists and looks for an alternative stream without ads. If none is available, it may remove ad segments, which can cause pauses, buffering, or temporarily reduced quality.

## Install with Tampermonkey

**Publication pending:** the links below will work after the code is published to `rafelolv/TwitchClear`. Use manual installation to test locally now.

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. For Chrome 138+ with Tampermonkey 5.3+, enable **Allow User Scripts** in the extension details. Developer Mode is an alternative; see the [official instructions](https://www.tampermonkey.net/faq.php?q=Q209).
3. Disable other Twitch-specific ad blockers, including older scripts and the `twitch.tv##+js(twitch-videoad)` rule if installed in uBlock Origin. Run only one ad-blocking variant of this project at a time.
4. After publication, open [Install TwitchClear — stable vaft](https://raw.githubusercontent.com/rafelolv/TwitchClear/master/vaft/vaft.user.js) and select **Install**.
5. Reload a Twitch live stream. Look for `[AD DEBUG]` in the browser console (F12) to confirm that the script loaded.

**Manual installation now:** open the Tampermonkey dashboard, select **Add a new script**, delete the example, paste the complete contents of [`vaft/vaft.user.js`](vaft/vaft.user.js), and save with Ctrl+S. Keep the script enabled and reload the stream. Use the `.user.js` file; the `-ublock-origin.js` variant is not for Tampermonkey. See the [official installation documentation](https://www.tampermonkey.net/faq.php?q=Q102).

`@updateURL` and `@downloadURL` point to this project. Tampermonkey can check for new versions after publication; you can also request an update check from its dashboard. Save local edits and reload the stream to apply them.

## Variants

| File | Purpose |
| --- | --- |
| `vaft/vaft.user.js` | Main stable script and starting point for maintenance |
| `vaft/vaft-ublock-origin.js` | Corresponding variant for uBlock Origin |
| `vaft/vaft_testing.user.js` | Experimental; test separately |
| `video-swap-new/` | Legacy alternative retained for comparison |
| `strip/strip.user.js` | Ad segment removal strategy |
| `vaft/twitch-brave-fix.user.js` | Optional Brave companion, excluded from the initial setup |

## Development

Requires Node.js 24. No npm dependencies are needed to validate the baseline:

```bash
npm run check
```

This checks the syntax of every JavaScript file and runs the inherited tests. Upstream tests use copied functions and do not replace testing the actual script in a live stream.

See the [baseline comparison](docs/BASELINE.md), [maintenance and publication guide](docs/MAINTENANCE.md), [historical changelog](CHANGELOG.md), and [upstream debugging guide](DEBUG.md). The [original ryanbr documentation](docs/README-ryanbr.md) is retained as a historical reference; its installation links point to that project.

## Credits and license

Git history and the MIT license are preserved. Credit goes to pixeltris, ryanbr, cleanlock, and the other contributors. Initial changes cover project identity, update URLs, documentation, and automation; script behavior was imported unchanged. See [LICENSE](LICENSE).
