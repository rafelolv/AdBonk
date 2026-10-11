# Firefox listing update

Update the existing [AdBonk listing](https://addons.mozilla.org/en-US/firefox/addon/adbonk/) through Mozilla's Developer Hub. Do not create a second add-on: keep `adbonk@rafelolv.github.io` and the existing update identity.

1. Upload `dist/adbonk-firefox-1.0.5.zip` as a new version on the existing listing.
2. Set the displayed name to **AdBonk**, and remove the listing's experimental flag if it is still selected.
3. Upload `extension/icons/128.png` as the listing icon. It has a real transparent background.
4. Use the English summary and description below and retain the MIT license and repository homepage.
5. Wait for Mozilla's signing/review before announcing that this specific store version is available. Publishing on GitHub does not complete this step.

## Summary

Bonk Twitch ads. A standalone extension using the AdBonk stable userscript.

## Description

AdBonk blocks ads on Twitch live streams using the same maintained blocking code as the AdBonk userscript, without requiring a userscript manager.

It looks for alternative streams without ads, tries higher-quality alternatives before repeating a previous 360p fallback, and uses recovery when needed. Ad breaks may still cause buffering or temporary quality drops, and Twitch changes can affect blocking.

Use either the extension or the userscript, with one Twitch ad blocker enabled at a time. Reload Twitch after installation or an update.

AdBonk continues pixeltris's TwitchAdSolutions with updates from ryanbr's fork. The project preserves the upstream credits and MIT license. Its maintainer works primarily in DevOps/SRE; fixes, issues, and pull requests are welcome.

Source, setup, and issues: https://github.com/rafelolv/AdBonk

## Version notes

Extension 1.0.5 bundles stable userscript 1.0.1. This update removes the Experimental label, adds the transparent mascot icon, and includes the higher-quality backup preference introduced since the first GitHub release.
