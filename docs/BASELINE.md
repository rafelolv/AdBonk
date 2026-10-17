# Stable blocking baseline

AdBonk `1.0.12` restores the original blocking engine after the maintainer reported better real-world results with that version than with the accumulated fork changes. This is a compatibility decision based on that report, not a measured guarantee of better results for every viewer.

Version `1.0.13` also restores the exact original focus and player-task routines at the maintainer's request. The added VOD/target/route guards and PiP-specific reload diversion from `1.0.12` are removed. The original buffer monitor still checks for live content, and the original player task still skips paused playback.

## Pinned reference

- Reference script version: `37.0.0`.
- Commit: `f8f86706daf90daa534b26bce5b2f01238667d5f`.
- Original complete file SHA-256: `06861594a5e6e984ec3da73a4f25d84bea6a816b97ab7cbf4c80fa205583b3ee`.
- [Immutable reference source](https://github.com/pixeltris/TwitchAdSolutions/blob/f8f86706daf90daa534b26bce5b2f01238667d5f/vaft/vaft.user.js).

Required copyright and permission notices remain in [LICENSE](../LICENSE). AdBonk presentation, maintainer metadata, updates, extension identity, and Git history remain with this project.

## What matches the reference

`tests/blocking-baseline.json` pins twelve function hashes: options, playlist processing, segment substitution, resolution matching, attribute parsing, token requests, server-time parsing/replacement, page fetch interception, worker loading, focus handling, and player recovery. The tests require byte-identical function bodies.

Worker fetch interception also matches the reference after normalizing two documented adaptations: the AdBonk diagnostic label and returning the asynchronous processing promise so failures reject instead of leaving requests pending. The generated worker is evaluated separately with its actual serialized dependencies.

The regular backup order is `embed → popout → autoplay (360p)`, with `embed` fallback. The original 1,500ms post-reload window can start directly at `autoplay`. Original ad detection, cached encodings, blank-media ad substitution, HEVC handling, and end-of-ad reload decisions are preserved.

## Deliberate integration differences

- Current AdBonk metadata, icons, installation/update URLs, simple player notice, shared version `1.0.13`, and internal conflict counter `99`.
- Clip and auxiliary-frame exclusions, with Twitch embeds still supported.
- A single buffer-monitor timer and fresh player lookup retain the original live-only stall predicate. Focus and player-task routines are now byte-identical to the reference, including its visibility overrides, DOM video selection, original paused-player check, and unscoped delayed storage restoration. There is no added VOD/target/route or PiP guard in those routines.
- Bounded GQL transport (5-second page fetch, 15-second worker wait) and propagated asynchronous processing errors.

The fork's additional ad markers, pinned/fast backup search, synthetic recovery segments, early-reload/decoder recovery heuristics, separate-video ad hiding, and speed catch-up are removed from stable. Stable no longer reads the related fork-only localStorage settings. Stored preferences are not deleted; experimental and legacy variants remain unchanged.

This is the same blocking strategy, not a claim that the entire branded userscript is byte-identical to its reference. Changing the pinned functions or restoring fork behavior requires an explicit maintenance decision and new validation; do not update hash expectations merely to make a test pass.

## Validation and limits

`npm run check` runs 89 current tests: 21 experimental/legacy and shared-timer regressions, 22 baseline/playlist cases, 15 network cases, 8 stable original focus/recovery cases, 13 extension cases, 9 Firefox-publication cases, and 1 generated-worker bootstrap case.

The older 84 copied-function assertions remain accessible via `npm run test:legacy`; they are excluded from stable validation because their fork behavior is no longer the stable implementation. Acceleration-specific tests are replaced by an assertion that stable never sets playback speed; fork-quality tests are replaced by original-strategy scenarios and baseline hashes.

Chromium and Firefox extension fixtures pass. Mozilla web-ext lint reports zero errors and one existing Android minimum-version warning; this does not establish Android support. No authenticated Twitch preroll/midroll or long-session comparison was run by the agent. The maintainer must compare real playback with one blocker enabled at a time, reloading Twitch after updating. The original strategy can still buffer, use 360p, or fail to obtain a clean stream.
