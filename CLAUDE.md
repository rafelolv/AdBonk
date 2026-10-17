# AdBonk

Maintained by rafelolv. Origin: rafelolv/AdBonk (`main`). Follow AGENTS.md and docs/MAINTENANCE.md.

## Stable blocking baseline

Stable `1.0.12` / internal conflict counter `98` restores the original blocking engine documented in [docs/BASELINE.md](docs/BASELINE.md). Stable userscript and both extensions share the package version and exact stable source.

- `vaft/vaft.user.js` is the single stable source. Experimental `vaft/vaft_testing.user.js` and legacy/companion scripts are separate and retain their previous logic.
- Detection uses the original `AdSignifier = 'stitched'`.
- Normal backup order is `embed`, `popout`, then `autoplay` (360p). The fallback is `embed`; native token requests use `popout`.
- The original 1,500ms post-reload request window can start at `autoplay`. Do not describe source-first behavior as unconditional.
- Preserve original playlist parsing, segment substitution, quality matching, HEVC handling, token requests, and ad-end reload/pause-play policy.
- Fork-specific flags such as `FastAutoplayFirstTry`, `PreferLowQualityBackup`, `BackupSwapFirst`, and `PinBackupPlayerType` are not read by stable. Existing stored settings are left intact for other variants.
- Stable has no catch-up acceleration, early-reload cascades, synthetic recovery playlists, separate-video ad hiding, or post-break frame monitor. Do not port those back implicitly.

## Retained integration adaptations

- AdBonk metadata, simple blocking notice, frame/clip guards, and monotonic duplicate counter.
- Live-only recovery and tab-focus resume use the player-owned video; focus does not resume a VOD or a replacement element. Real document visibility is preserved for other extensions.
- One monitor timer and fresh player lookup retain the original stall predicate and timings.
- Standard PiP recovery uses pause/play instead of replacing the media instance. Native Firefox PiP is not established as fixed.
- Delayed settings restoration checks the same player state and route and skips paused/non-live content.
- GQL request timeouts and propagated asynchronous failures prevent requests remaining pending; these are transport guards, not new backup-selection rules.

## Worker serialization

The generated worker serializes `stripAdSegments`, `getStreamUrlForResolution`, `processM3U8`, `hookWorkerFetch`, `declareOptions`, `getAccessToken`, `gqlRequest`, `parseAttributes`, `getWasmWorkerJs`, `getServerTimeFromM3u8`, and `replaceServerTimeInM3u8` using `.toString()`.

These functions cannot capture page-scope variables. Put shared settings in `declareOptions` or explicitly inject them in the worker bootstrap. The generated-worker regression test runs the actual blob in isolation to detect missing dependencies.

## Validation and publishing

Run `npm run check` and, for core/integration changes, `npm run test:extension:browser`. The stable suite tests pinned baseline equality, simulated playlist decisions, recovery, network failures, worker bootstrap, packages, and Firefox submission guards. `npm run test:legacy` is historical coverage of copied fork functions only.

Follow docs/RELEASING.md and docs/FIREFOX-PUBLISH.md for releases. Keep credentials only in Actions secrets, preserve the Firefox ID, and distinguish successful submission from Mozilla approval. Tests and store acceptance do not prove live Twitch ad-blocking performance.
