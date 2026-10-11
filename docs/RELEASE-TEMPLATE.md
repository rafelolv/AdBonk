# Release notes template

Copy the content below into `docs/releases/<tag>.md`. Replace placeholders and remove instructions and sections that do not apply. The GitHub title is `AdBonk v<version>`; the body does not need to repeat it as a heading.

---

AdBonk — Bonk Twitch ads.

<One or two sentences describing the main change and its benefit.>

## Downloads

| File | Version | Status |
| --- | --- | --- |
| `vaft.user.js` | <stable version> | Stable userscript; recommended installation |
| `adbonk-chromium-<extension version>.zip` | <extension version> | Experimental Chromium extension |
| `adbonk-firefox-<extension version>.zip` | <extension version> | Experimental, unsigned Firefox extension for temporary installation |

Both extensions bundle the stable userscript byte-for-byte. Userscript and extension versions advance independently.

## Changes

- <User-visible change and its practical effect.>
- <Another relevant change, if applicable.>

## Install or update

- **Userscript:** [install AdBonk](https://raw.githubusercontent.com/rafelolv/AdBonk/main/vaft/vaft.user.js) with a supported userscript manager, or check for updates in your manager. This link follows `main`; the attached file is the release snapshot.
- **Chromium:** extract the Chromium ZIP and load its folder through Developer mode → Load unpacked. For an existing local installation, replace its files and reload the extension.
- **Firefox:** extract the unsigned ZIP and load `manifest.json` through `about:debugging` → This Firefox → Load Temporary Add-on. This installation is removed when Firefox restarts; persistent installation requires a Mozilla-signed package.

Use one installation method at a time and reload Twitch after updating. See the [extension guide](https://github.com/rafelolv/AdBonk/blob/<tag>/docs/EXTENSION.md). GitHub releases do not update browser-store installations.

<Add migration steps only if this release requires them. Adjust Firefox instructions if distributing an actually signed package.>

## Validation and known limitations

<Checks actually performed, their results, and material scenarios not tested. Identify maintainer reports separately from automated checks. Keep experimental status accurate.>

[Report a problem](https://github.com/rafelolv/AdBonk/issues) with your browser, installation method, version, and what happened. Fixes and pull requests are welcome.
