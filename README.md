# AdBonk

**Bonk Twitch ads.**

An independent continuation of [TwitchAdSolutions by pixeltris](https://github.com/pixeltris/TwitchAdSolutions), based on the updated [ryanbr fork](https://github.com/ryanbr/TwitchAdSolutions). Maintained by [rafelolv](https://github.com/rafelolv).

A huge thank you to [pixeltris](https://github.com/pixeltris) for starting TwitchAdSolutions and sharing it with the community. In my experience, it remains the best Twitch ad blocker, and even though the original project has been discontinued, it still works well today. AdBonk builds on that work with gratitude and aims to keep it going.

My background is in DevOps/SRE, and software development is not the main focus of my work. I'll do my best to maintain AdBonk and keep it working. Contributions, fixes, and pull requests are always welcome!

The initial focus is **stable vaft**: it intercepts Twitch stream playlists and looks for an alternative stream without ads. If none is available, it may remove ad segments, which can cause pauses, buffering, or temporarily reduced quality.

## Install with a userscript manager

The maintained branch is `main`. Install from the link below or use manual installation to test local changes.

Choose one manager for AdBonk:

| Manager | AdBonk compatibility |
| --- | --- |
| [Tampermonkey](https://www.tampermonkey.net/) | Standard installation option inherited from TwitchAdSolutions. |
| [Violentmonkey](https://violentmonkey.github.io/) | Alternative installation option inherited from TwitchAdSolutions. |
| [ScriptCat](https://scriptcat.org/) | Additional option to try: its documented execution mode matches the main script's requirements. Live Twitch compatibility has not yet been validated. |
| [Greasemonkey](https://www.greasespot.net/) | Not currently supported by the main ad-blocking script. It requires a separate compatibility adaptation. |

1. Install your chosen manager. Use Tampermonkey or Violentmonkey for the standard setup; ScriptCat is available for compatibility testing.
2. Enable the manager's required userscript permissions. For Chrome 138+ with Tampermonkey 5.3+, enable **Allow User Scripts** in the extension details. Developer Mode is an alternative; see the [official instructions](https://www.tampermonkey.net/faq.php?q=Q209).
3. Disable other Twitch-specific ad blockers, including older scripts. Run only one ad-blocking variant of this project at a time.
4. Open [Install AdBonk — stable vaft](https://raw.githubusercontent.com/rafelolv/AdBonk/main/vaft/vaft.user.js) and select **Install**.
5. Reload a Twitch live stream. Look for `[AD DEBUG]` in the browser console (F12) to confirm that the script loaded.

**Manual installation:** open your manager's dashboard/editor, create a new script, delete the example, paste the complete contents of [`vaft/vaft.user.js`](vaft/vaft.user.js), and save. Keep the script enabled and reload the stream. Use the `.user.js` file. Exact menu names vary by manager; see the [Tampermonkey instructions](https://www.tampermonkey.net/faq.php?q=Q102) or [Violentmonkey instructions](https://violentmonkey.github.io/guide/creating-a-userscript/).

`@updateURL` and `@downloadURL` point to this project. Use your manager's update checker to obtain new versions. Save local edits and reload the stream to apply them. Install AdBonk in only one manager at a time to avoid duplicate hooks.

See the [manager compatibility notes](docs/USERSCRIPT-MANAGERS.md) for the evidence behind these statuses and how to report compatibility problems.

## Why uBlock Origin support was removed

The uBlock Origin integration was removed because of recurring inconsistencies: the script could stop being applied without a known cause. The [original project's README](https://github.com/pixeltris/TwitchAdSolutions#applying-a-script-ublock-origin) documented this behavior and recommended the userscript versions instead.

Maintaining a second integration with unexplained failures is not a worthwhile use of this project's maintenance time. AdBonk therefore focuses on the userscript, which has been the more stable option in the project's experience. This decision concerns the custom Twitch script integration, not uBlock Origin's general ad-blocking capabilities.

### Migrating from the old integration

AdBonk supports userscript managers only. Remove the old `twitch.tv##+js(twitch-videoad)` filter and the upstream script URL from `userResourcesLocation` in uBlock Origin. If it was the only resource URL, restore `userResourcesLocation` to `unset`; otherwise keep your other resource URLs. Also remove any old Brave companion scriptlet filter and resource URL if installed. Restart the browser and install the userscript as described above.

## Extension conflicts

Disable other Twitch-specific ad blockers such as TTV-AB and Purple AdBlock before testing. If playback problems persist, temporarily disable Twitch extensions such as 7TV or TwitchNoSub to isolate the cause.

## Variants

| File | Purpose |
| --- | --- |
| `vaft/vaft.user.js` | Main stable script and starting point for maintenance |
| `vaft/vaft_testing.user.js` | Experimental; test separately |
| `video-swap-new/` | Legacy alternative retained for comparison |
| `strip/strip.user.js` | Ad segment removal strategy |
| `vaft/twitch-brave-fix.user.js` | Optional Brave companion, excluded from the initial setup |

## Development

Requires Node.js 24. No npm dependencies are needed to validate the baseline:

```bash
npm run check
```

This checks the syntax of every JavaScript file and runs the inherited tests. The 84 inherited upstream tests use copied functions. The 30 regression tests extract functions from the shipped userscripts and exercise visibility changes, VOD guards, PiP recovery, and monitor scheduling with mocked browser/player objects. Neither suite replaces testing the actual script in a live stream. See the [upstream issue audit](docs/ISSUE-AUDIT.md) for findings and remaining limitations.

See the [baseline comparison](docs/BASELINE.md), [maintenance and publication guide](docs/MAINTENANCE.md), [historical changelog](CHANGELOG.md), and [upstream debugging guide](DEBUG.md). The [original ryanbr documentation](https://github.com/ryanbr/TwitchAdSolutions#readme) remains available upstream as a historical reference.

## Credits and license

Git history and the MIT license are preserved. Credit goes to pixeltris, ryanbr, cleanlock, and the other contributors. Initial changes cover project identity, update URLs, documentation, and automation; script behavior was imported unchanged. See [LICENSE](LICENSE).
