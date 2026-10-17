# Release notes template

Copy the content below into `docs/releases/<tag>.md`. Replace placeholders and remove instructions and sections that do not apply. The GitHub title is `AdBonk v<version>`; the body does not need to repeat it as a heading.

Firefox store notes have a 3,000-character limit per locale. Lead with the relevant fixes; the publication verifier shortens long notes and links the full GitHub release. Follow [Mozilla publication rules](FIREFOX-PUBLISH.md#publication-rules) before submission. Full GitHub notes may remain longer.

---

AdBonk — Bonk Twitch ads.

<One or two sentences describing the main change and its benefit.>

## Downloads

| File | Version | Status |
| --- | --- | --- |
| `vaft.user.js` | <version> | Stable userscript; recommended installation |
| `adbonk-chromium-<version>.zip` | <version> | Stable Chromium extension for local installation |
| `adbonk-firefox-<version>.zip` | <version> | Stable Firefox extension; unsigned ZIP for temporary installation |

The stable userscript and both extensions share the same version. Both extensions bundle the userscript byte-for-byte.

## Changes

- <User-visible change and its practical effect.>
- <Another relevant change, if applicable.>

## Install or update

- **Userscript:** [install AdBonk](https://raw.githubusercontent.com/rafelolv/AdBonk/main/vaft/vaft.user.js) with a supported userscript manager, or check for updates in your manager. This link follows `main`; the attached file is the release snapshot.
- **Chromium:** extract the Chromium ZIP and load its folder through Developer mode → Load unpacked. For an existing local installation, replace its files and reload the extension.
- **Firefox:** use the [Mozilla Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/adbonk/) for regular installation; check the listed version because store updates require separate submission and review. For local testing, extract the unsigned ZIP and load `manifest.json` through `about:debugging` → This Firefox → Load Temporary Add-on. Temporary installation is removed when Firefox restarts.

Use one installation method at a time and reload Twitch after updating. See the [extension guide](https://github.com/rafelolv/AdBonk/blob/<tag>/docs/EXTENSION.md). Local extensions require manual updates; store updates follow Mozilla submission and review.

<Add migration steps only if this release requires them. Adjust Firefox instructions if distributing an actually signed package.>

## Validation and known limitations

<Checks actually performed, their results, and material scenarios not tested. Identify maintainer reports separately from automated checks. Keep each artifact's support status accurate.>

[Report a problem](https://github.com/rafelolv/AdBonk/issues) with your browser, installation method, version, and what happened. Fixes and pull requests are welcome.
