# AdBonk browser extension

Install AdBonk directly as a browser extension, without a userscript manager. The extension is a secondary installation option. The userscript remains the primary supported entry point.

**Blocking logic is unchanged.** Both packages include a byte-for-byte copy of `vaft/vaft.user.js`, including its existing worker hooks, playlist handling, fallback selection, and player recovery. The build does not transform that file or maintain a second blocker implementation.

## Status

| Browser | Package | Minimum version |
| --- | --- | --- |
| Chromium browsers | `adbonk-chromium-1.0.5.zip` | Chromium 111; real-browser checks used Chrome 154. |
| Firefox desktop | `adbonk-firefox-1.0.5.zip` | Firefox 140; real-browser checks used Firefox 157. |

Release `v1.0.1` includes these packages with stable userscript `1.0.1`. The maintainer promoted the extension to stable after reporting successful local use in Firefox and Chrome. Chromium variants such as Brave and Edge have not been tested individually.

**Firefox:** [Mozilla Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/adbonk-experimental/) for regular installation. The original URL slug is retained; the store may still show an older name or version until the maintainer submits the update and Mozilla approves it. The GitHub ZIP is unsigned and intended for temporary installation, even though the extension is stable.

**Chrome, Brave and Edge:** the extension is not on the Chrome Web Store. Use the userscript for the standard setup, or load the Chromium package locally as described below. Google's [$5 one-time registration fee](https://developer.chrome.com/docs/webstore/register) applies to developers publishing in that store; users can install AdBonk's userscript and unpacked extension for free.

Use either the extension or the userscript, and disable other Twitch-specific ad blockers. After installing or updating the extension, reload existing Twitch tabs.

## Get the packages

Download the ZIP files from [GitHub Releases](https://github.com/rafelolv/AdBonk/releases). You can also build them locally with Node.js 24:

```bash
npm run build:extension
```

No npm installation or dependency download is required. Packages and unpacked directories appear in `dist/`. The stable userscript's current install/update URL remains unchanged.

## Chromium: load the unpacked extension

1. Extract the Chromium ZIP into a folder. If you built locally, use `dist/chromium` directly.
2. Open `chrome://extensions` (or your browser's extensions page) and enable **Developer mode**.
3. Choose **Load unpacked** and select the folder containing `manifest.json`.
4. Disable the AdBonk userscript and other Twitch-specific ad blockers. Allow the extension to run on Twitch, then reload a live stream.
5. Click the AdBonk icon to check whether its hooks loaded.

Keep that folder on disk. To update an unpacked extension, replace its files, click **Reload** on the extensions page, and reload Twitch. This development installation does not automatically update from GitHub.

## Firefox: load a temporary add-on

1. Extract the Firefox ZIP. If you built locally, use `dist/firefox` directly.
2. Open `about:debugging`, choose **This Firefox**, and click **Load Temporary Add-on**.
3. Select `manifest.json` inside the Firefox package.
4. Allow access to Twitch if prompted, disable the AdBonk userscript and other Twitch-specific ad blockers, then reload the stream.

The temporary add-on is removed when Firefox restarts. Regular persistent installation requires a Mozilla-signed build, distributed through Mozilla Add-ons or a signed self-distributed package. Do not treat the unsigned ZIP as a ready-to-install signed add-on. [Mozilla temporary installation instructions](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

## What the popup means

- **Ready on this page:** the expected main-page fetch and Worker hooks initialized. This is not proof that an ad was blocked or that a live stream works.
- **Another script is running:** an equal/newer TwitchAdSolutions conflict counter was present before the extension ran. Disable the duplicate and reload the page.
- **Not loaded on this page:** check site permissions and reload. Clips and auxiliary frames are intentionally skipped by the unchanged core.
- **Open a Twitch live stream:** the active tab has no reachable extension status bridge. Open Twitch or reload an existing Twitch tab after installation.

The popup reads status only. It does not change player settings or capture authentication headers, playlist URLs, or viewing history. It sends no telemetry. The blocker still makes its normal Twitch requests and uses Twitch's existing page state, as it does in the userscript.

## Architecture and permissions

The extension version is tracked separately in `extension/version.json`; changing its interface does not require a userscript update.

`tools/build-extension.js` copies the stable script and packages the shared adapters and popup into separate Manifest V3 builds. It adds only:

- A startup snapshot and read-only status responder in `MAIN` world, alongside the stable script at `document_start`.
- An isolated-world bridge that forwards a small, validated status response to the popup and cleans up after success or timeout.
- Browser-specific manifest metadata, icons, license, and a core SHA-256 in `build-info.json`.

Access is limited to `*://*.twitch.tv/*`. No broad all-sites, browsing-history, network interception, or background-service permissions are requested. The page can observe or interfere with the MAIN-world code and status; status is informational and is never used to authorize a privileged action. [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), [Firefox content scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts).

## Validation

```bash
npm run check
npm run test:extension:browser
```

The first command runs the inherited and regression suites, plus 13 extension tests for packaged core equality, manifest scope, ZIP contents, status messages, cleanup, and popup states.

The optional browser command requires current Chrome and Firefox binaries. Set `ADBONK_CHROME` or `ADBONK_FIREFOX` to override their paths. It creates temporary profiles and installs fixture copies of the packages; only those copies gain loopback-page access. Firefox's fixture also has a test-only background script to open the popup. Production packages retain Twitch-only permissions and no background script.

Real Chrome 154 and Firefox 157 checks passed for early MAIN-world hooks, page status, skipped clips and auxiliary frames, embedded-frame injection, duplicate detection, the actual isolated bridge, and the popup version. These local fixture checks do not exercise a real Twitch video worker, authenticated playback, real ads, native PiP, or long viewing sessions.

## Store publication

Store publication remains a separate step: supply store descriptions/screenshots, privacy disclosures, signing credentials, and pass browser/store review. The adapter does not fetch AdBonk code from GitHub at runtime; it bundles the core. The inherited core still reads and evaluates Twitch's own worker code as part of worker injection. This behavior requires explicit review during store submission; packaging does not establish store approval.

For future changes, test real preroll and midroll ads, channel changes, VOD navigation, pause/mute, quality, background tabs, and PiP in both browsers. Report findings using the extension issue form. Stable status reflects the maintainer's release decision, not a guarantee against future Twitch changes.
