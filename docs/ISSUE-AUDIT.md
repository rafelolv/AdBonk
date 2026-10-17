# Upstream issue audit

Historical audit of the previous fork-based engine. Stable `1.0.12` restores the original strategy; consult [BASELINE.md](BASELINE.md) for current behavior and retained guards. Previous fixes below are historical: catch-up acceleration and fork-specific recovery/ad-hiding layers are no longer in stable.

Reviewed on 2026-10-11 against the 18 open issues returned by the GitHub API: 13 in report set A and 5 in report set B. The review covers issue descriptions, text comments, and the current AdBonk code. This is an audit of open reports, not a review of every closed issue or pull request.

## Changes made

- **Live-only recovery:** tab-focus resume and worker-triggered recovery now require live content. A paused VOD or unknown content type receives no recovery action. Focus recovery uses the player-owned video instead of the first video in the DOM and resumes only the same element that was playing when the tab became hidden. This fixes a reproducible path consistent with baseline B #245; it does not prove that every FFZ/VOD interaction is resolved.
- **One monitor timer:** returning to the tab previously added a new self-rescheduling loop alongside the existing loop in both vaft variants. Focus now replaces the pending tick. This fixes duplicated background work, but the historical multi-hour freeze in baseline A #278 has not been reproduced or established as the same defect.
- **Experimental PiP protection:** experimental vaft lacked the stable script's standard PiP reload guard. It now uses pause/play instead of replacing the media instance when `document.pictureInPictureElement` is set, respecting an already paused player. This addresses a reproducible reload path relevant to baseline B #262; browser-native Firefox PiP and real ad transitions remain unverified.
- **Experimental retry scope:** background and focus retry callbacks check that the target is still the same live player before attempting playback. Experimental features remain separate from stable; none were promoted.

Versions: stable vaft `68.5.7.3` / internal `94`, experimental vaft `678.0.0.3` / internal `679`, and legacy video-swap-new `1.87.3` / internal `56`.

## baseline A reports

| Issue | Finding and disposition |
| --- | --- |
| #506 — Black screen while blocking ads | The reporter identified the stripping state; the maintainer explained that no clean stream was available. Backup swapping and recovery already exist in the imported fork. No safe fix can manufacture live segments that Twitch does not deliver. Current-session reproduction is still needed. |
| #504 — Firefox extension suggestion | A request to list TTV Ad Mute, covered by a retired solution catalog. No AdBonk code fix needed. |
| #503 — Android/iOS app instructions | Native mobile applications are outside a browser userscript's scope. No native-app blocking feature was added. |
| #499 — Changed web player structure | The upstream fix `3a1ff51d9cb2448cabdb25aba2e612ab8b02d8d3` is in the imported history. The stable, experimental, and legacy alternative player lookups already unwrap `player.playerInstance`. No duplicate patch applied; the standalone strip variant remains legacy and outside this correction. |
| #497 — Ads after Twitch updates | Mixed reports: script injection, unsupported managers, buffering, and delivery changes. Userscript-only installation and existing diagnostics address part of the setup problem. Current ad/playlist evidence is required for new detection changes; no speculative rules added. |
| #496 — Alternate Player moderator chat | A third-party Alternate Player extension report, not an AdBonk implementation defect. No code change. |
| #493 — Failed module overlay | Reported using removed uBlock resource variants. Comments do not establish a userscript root cause. Genuine error overlays remain visible; no broad CSS hiding added. |
| #477 — Legacy alternative appears offline | No sufficient failing playlist/network trace in the report. Needs a current reproduction before changing stream-end handling. |
| #473 — VOD UI lag | Live-only recovery removes unrelated playback actions on VODs. This does not establish or resolve the original UI-lag cause; a browser profile or reproduction is still needed. |
| #447 — Brave decode error 3000 | High-resolution codec fixes are already inherited. Later comments also describe hardware decoder failures at 1080p. No universal decode-error fix is established; needs browser/codec/error evidence. |
| #355 — Errors 1000/2000 | Mixed network, playlist, extension, and browser reports. Needs failing HTTP status and current console/playlist evidence. No blind retries or unbounded reloads added. |
| #329 — Legacy mute/volume changes | The `player_volume: 0.5` value discussed is an ad-notification payload, not a volume setter. Existing storage-preservation logic remains; cross-tab timing and site audio permissions need reproduction before changing it. |
| #278 — Browser freezes after hours | Fixed a separately reproducible multiplication of vaft monitor loops after focus changes. The historical multi-hour browser-close freeze remains unverified, including in legacy video-swap-new. |

## baseline B reports

| Issue | Finding and disposition |
| --- | --- |
| #262 — PiP interrupted during ads | Restored the missing standard PiP reload guard in experimental vaft and tested the stable/legacy guards. Native Firefox PiP and full live ad transitions still require browser reproduction. |
| #249 — Separate video ads and resized stream | The imported stable code already matches Amazon ad-CDN video elements, hides/mutes/pauses them, and restores recycled nodes. An upstream commenter confirmed improvement after that update. Focus recovery now also avoids selecting a separate ad video. Empty wrappers, layout changes, and cross-origin iframe ads remain unverified; no generic container hiding added. |
| #247 — Separate ad above chat | Same inherited separate-video guard as #249. Accessible video elements are handled; cross-origin iframe and wrapper layout behavior are not claimed fixed. |
| #245 — FFZ/VOD auto-resume | Reproduced a VOD-resume path in the actual extracted userscript functions and fixed it in stable vaft, experimental vaft, and legacy video-swap-new. Extension-specific confirmation is still required. |
| #129 — uBlock/Firefox rollback loops | The reported uBlock installation path was removed from AdBonk. Related low-quality fallback, stripping delays, and background recovery are broader playback concerns; they are not all declared fixed by removing the integration. |

## Validation

- All 9 JavaScript files compile successfully.
- All 84 inherited tests pass.
- All 30 new regression tests pass. They extract functions from the shipped scripts rather than copying their implementations; browser and player state are mocked.
- Before the fixes, the initial 26-case suite passed 6 cases and failed 20. A later PiP regression also failed in experimental vaft before restoring the guard.
- Chrome headless passed 12 additional visibility checks using actual DOM video elements and dispatched visibility events, with mocked media playback/player state in an isolated temporary profile.
- The 17 stable-vaft, 16 experimental-vaft, and 18 legacy-alternative functions serialized into worker blobs were compared with the previous commit and are unchanged.
- No authenticated Twitch session, live ad break, native Firefox PiP session, multi-hour playback session, or FFZ installation was tested. No claim of zero regressions or complete resolution of all reports is made.

## Browser follow-up

Use the stable userscript only. Confirm preroll and midroll handling, deliberate pause/mute, live-to-VOD navigation without reloading the page, repeated tab switching, standard and Firefox-native PiP, and FFZ enabled/disabled. For unresolved cases, record browser version, userscript version, channel, relevant `[AD DEBUG]` output, and failing request status; remove authentication headers and private tokens before sharing logs.

## Recovery follow-up (2026-10-16)

AdBonk `1.0.11` / stable internal `97` addresses two scoped follow-ups:

- [AdBonk #1](https://github.com/rafelolv/AdBonk/issues/1): recovery selects the video owned by the current live player. Pending reload callbacks verify the original player state and channel route, skip VODs and deliberate pauses, and ignore media events from auxiliary videos.
- [AdBonk #2](https://github.com/rafelolv/AdBonk/issues/2): drift correction owns a specific video and its previous speed. Every cleanup path restores that target if its rate is still the temporary catch-up rate; unrelated speed changes are preserved. Ad-start cancellation uses the same cleanup, and stale callbacks cannot affect a newer operation.

All 176 automated tests pass. The 22 new cases extract the shipped recovery functions; 21 fail against the previous stable implementation. Chromium and Firefox extension fixture checks pass. Playlist-processing and backup-selection functions are unchanged. These fixes do not establish that all historical freezing, PiP, or FFZ reports are resolved. Live Twitch ad breaks, native Firefox PiP, and third-party extension interactions still require manual validation.
