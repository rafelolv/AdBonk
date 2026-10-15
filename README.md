<p align="center">
  <img src="assets/adbonk-banner.svg" alt="AdBonk — Bonk Twitch ads." width="1100">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/rafelolv/AdBonk/main/vaft/vaft.user.js"><strong>Install userscript</strong></a>
  &nbsp; · &nbsp;
  <a href="https://addons.mozilla.org/en-US/firefox/addon/adbonk/"><strong>Install for Firefox</strong></a>
  &nbsp; · &nbsp;
  <a href="#getting-started">Setup guide</a>
  &nbsp; · &nbsp;
  <a href="https://github.com/rafelolv/AdBonk/issues">Report a problem</a>
</p>

AdBonk blocks ads on Twitch live streams. Use it as a userscript or a standalone browser extension — both use the same blocking code.

I'm [rafelolv](https://github.com/rafelolv), a DevOps/SRE. Coding isn't the main focus of my work, but I'll do my best to maintain this project. Fixes, commits, and pull requests are always welcome.

## Getting started

Choose **one** installation method. You don't need to clone this repository or run commands for either standard setup.

| Your browser | Recommended setup | What you need |
| --- | --- | --- |
| Firefox | [AdBonk extension](https://addons.mozilla.org/en-US/firefox/addon/adbonk/) | Install directly from Mozilla Add-ons. No userscript manager needed. |
| Chrome, Brave, or Edge | [AdBonk userscript](https://raw.githubusercontent.com/rafelolv/AdBonk/main/vaft/vaft.user.js) | Install Tampermonkey or Violentmonkey first. |

### Firefox extension

1. Open **[AdBonk on Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/adbonk/)** and add it to Firefox.
2. Disable any older AdBonk userscript and other Twitch-specific ad blockers.
3. Reload Twitch and open a live stream.

Click the AdBonk icon to check its status. **“Ready on this page”** means its hooks loaded; watch a stream to check actual blocking. Store updates are reviewed separately, so the listed version may lag behind GitHub.

### Userscript: Chrome, Brave, Edge, or Firefox

A userscript manager is a browser extension that runs AdBonk on Twitch.

1. Install **[Tampermonkey](https://www.tampermonkey.net/)** or **[Violentmonkey](https://violentmonkey.github.io/)**.
2. Open **[Install userscript](https://raw.githubusercontent.com/rafelolv/AdBonk/main/vaft/vaft.user.js)** and confirm installation in your manager.
3. Disable other Twitch ad blockers, including the standalone AdBonk extension, then reload a live stream.

**Chrome + Tampermonkey:** if the script doesn't run, enable **Allow User Scripts** in Tampermonkey's extension details. Developer Mode is an alternative. [Permission setup](https://www.tampermonkey.net/faq.php?q=Q209).

<details>
<summary><strong>Other userscript managers</strong></summary>

| Manager | Status |
| --- | --- |
| [Tampermonkey](https://www.tampermonkey.net/) | Standard option, listed by the original project. |
| [Violentmonkey](https://violentmonkey.github.io/) | Standard alternative, listed by the original project. |
| [ScriptCat](https://scriptcat.org/) | Available to try; live Twitch compatibility still needs testing. |
| [Greasemonkey](https://www.greasespot.net/) | Not supported by the main script yet; a compatibility adaptation is needed. |

[Manager compatibility notes](docs/USERSCRIPT-MANAGERS.md).

</details>

## What to expect

During detected ad breaks, the player shows **“AdBonk is blocking ads”**. It looks for an alternative stream without ads and may remove ad segments when needed. You may notice buffering, pauses, or a temporary drop in quality.

AdBonk checks higher-quality alternatives before repeating a previous 360p fallback. If better clean streams aren't available, it can still use 360p to keep playback going. Twitch changes can affect blocking.

## Updates and other installation options

<details>
<summary><strong>How do I update?</strong></summary>

- **Userscript:** use your manager's update checker. The install link follows the stable script on `main`; you don't need to reinstall for each release.
- **Firefox store extension:** Firefox handles store updates after Mozilla approves them.
- **Locally loaded extension:** replace its files with the new package, reload the extension, and reload Twitch. GitHub doesn't update local installations automatically.

The stable userscript and extensions now share the same version number. Store approval can still delay an extension update. Keep one AdBonk installation enabled, and back up local script edits before updating because updates can replace them.

</details>

<details>
<summary><strong>Already using an older script with a higher version number?</strong></summary>

AdBonk restarted public versioning at `1.0.0`. If your manager still shows an inherited version such as `68.5.7.5`, open the install link and confirm replacement with the current version. If it refuses the lower version, back up local edits, remove the old script, and install again. This manual step is only needed once; automatic updates won't downgrade the inherited version.

</details>

<details>
<summary><strong>Load the standalone extension locally</strong></summary>

Download a browser package from **[GitHub Releases](https://github.com/rafelolv/AdBonk/releases)** and follow the **[extension installation guide](docs/EXTENSION.md)**.

Chromium packages can be loaded through Developer mode for free. The Firefox ZIP on GitHub is unsigned and intended for temporary installation; use Mozilla Add-ons for regular installation.

AdBonk is not published on the Chrome Web Store. Google charges a [$5 one-time developer registration fee](https://developer.chrome.com/docs/webstore/register) to publish there. What a generous way to support people sharing free, useful tools. Embarrassing, Google.

</details>

<details>
<summary><strong>Install a local userscript or test your own edits</strong></summary>

Open your manager's dashboard and create a new script. Delete the example code, paste the complete contents of [`vaft/vaft.user.js`](vaft/vaft.user.js), and save. Keep it enabled and reload Twitch.

You can test local edits without publishing them on GitHub. Use the complete `.user.js` file, including its metadata header. [Tampermonkey instructions](https://www.tampermonkey.net/faq.php?q=Q102) · [Violentmonkey instructions](https://violentmonkey.github.io/guide/creating-a-userscript/).

</details>

## Having trouble?

Check that AdBonk is enabled, has permission to run on Twitch, and is your only active Twitch ad blocker. Reload Twitch after changing settings.

### Extension conflicts

Disable other Twitch-specific ad blockers such as TTV-AB and Purple AdBlock. If problems persist, temporarily disable Twitch extensions such as 7TV or TwitchNoSub to help isolate the cause.

**[Report a userscript problem](https://github.com/rafelolv/AdBonk/issues/new?template=bug_report.yml)** or **[report an extension problem](https://github.com/rafelolv/AdBonk/issues/new?template=extension_bug.yml)**. Include your browser, AdBonk version, installation method, and what happened. For the userscript, include your manager's version too.

For diagnostics, open the browser console (**F12**) and look for `[AD DEBUG]`. Remove private tokens and authentication headers before sharing logs. [Known issues and investigated reports](docs/ISSUE-AUDIT.md).

## Why uBlock Origin support was removed

The old custom Twitch integration had recurring inconsistencies: it could stop being applied without a known cause. I don't want to spend limited maintenance time chasing those failures. AdBonk focuses on the userscript and extensions that bundle it; the userscript has been the more stable option in the project's experience. This concerns the custom integration, not uBlock Origin's general ad-blocking capabilities.

<details>
<summary><strong>Moving from the old uBlock Origin integration?</strong></summary>

Remove the old `twitch.tv##+js(twitch-videoad)` filter and the upstream script URL from `userResourcesLocation`. If it was the only resource URL, restore that setting to `unset`; otherwise keep your other resource URLs.

Remove any old Brave companion scriptlet filter and resource URL too. Restart the browser, then follow [Getting started](#getting-started).

</details>

## Contributing

Found a fix? Pull requests are welcome. Have an idea or an unresolved problem? Open an issue so we can discuss it.

The maintained script is **[`vaft/vaft.user.js`](vaft/vaft.user.js)**. Both extension packages use that same file. Experimental and legacy variants stay separate.

<details>
<summary><strong>Other script variants</strong></summary>

| File | Purpose |
| --- | --- |
| [`vaft/vaft_testing.user.js`](vaft/vaft_testing.user.js) | Experimental; test separately. |
| [`video-swap-new/`](video-swap-new/) | Legacy alternative retained for comparison. |
| [`strip/strip.user.js`](strip/strip.user.js) | Legacy strategy; not recommended for the standard setup. |
| [`vaft/twitch-brave-fix.user.js`](vaft/twitch-brave-fix.user.js) | Optional Brave companion; excluded from the standard setup. |

</details>

<details>
<summary><strong>Development and validation</strong></summary>

Requires **Node.js 24**, with no npm dependencies:

```bash
npm run check
```

This checks JavaScript syntax and runs 148 tests: 84 inherited, 30 player, 15 network, 6 quality, and 13 extension checks. The inherited tests use copied functions; regression tests extract shipped functions and use simulated browser/player or network state. Passing them does not establish that ad blocking works on a live stream. Test real playback separately.

[Maintenance and publication](docs/MAINTENANCE.md) · [Extension development](docs/EXTENSION.md) · [Upstream issue audit](docs/ISSUE-AUDIT.md).

</details>

## License

[MIT licensed](LICENSE).

[Changelog](CHANGELOG.md) · [Debugging guide](DEBUG.md).
