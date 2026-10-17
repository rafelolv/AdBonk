# Firefox listing update

New release versions can be [submitted automatically through GitHub Actions](FIREFOX-PUBLISH.md). Configure the repository secrets once. The workflow submits version files and notes; use the manual instructions below for listing text/icon changes or as a fallback. Do not manually upload a version that the workflow already submitted.

Update the existing [AdBonk listing](https://addons.mozilla.org/en-US/firefox/addon/adbonk/) through Mozilla's Developer Hub. Do not create a second add-on: keep `adbonk@rafelolv.github.io` and the existing update identity.

1. Upload `dist/adbonk-firefox-<version>.zip` as a new version on the existing listing.
2. Set the displayed name to **AdBonk**, and remove the listing's experimental flag if it is still selected.
3. Upload `extension/icons/128.png` as the listing icon. It has a real transparent background.
4. Use the English summary and description below and retain the MIT license and repository homepage.
5. Wait for Mozilla's signing/review before announcing that this specific store version is available. Publishing on GitHub does not complete this step.

## Summary

Bonk Twitch ads. A standalone extension using the AdBonk stable userscript.

## Description

AdBonk blocks ads on Twitch live streams using the same maintained blocking code as the AdBonk userscript, without requiring a userscript manager.

It looks for alternative streams without ads and uses a lower-quality fallback when needed. Ad breaks may still cause buffering or temporary quality drops, and Twitch changes can affect blocking.

Use either the extension or the userscript, with one Twitch ad blocker enabled at a time. Reload Twitch after installation or an update.

AdBonk is maintained by rafelolv, who works primarily in DevOps/SRE. Fixes, issues, and pull requests are welcome. License: MIT.

Source, setup, and issues: https://github.com/rafelolv/AdBonk

## Version notes

Copy the relevant version's user-facing fixes from `docs/releases/<tag>.md`. Keep Firefox notes within 3,000 characters per locale; the submission helper links the full GitHub release when shortening is needed. Do not claim an unchanged runtime or source-first behavior unless that is true for the version being submitted. Stable `1.0.12` restores the blocking strategy documented in [BASELINE.md](BASELINE.md).
