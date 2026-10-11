# Upstream issue audit

Reviewed on 2026-10-11 against the 18 open issues returned by the GitHub API: 13 in pixeltris/TwitchAdSolutions and 5 in ryanbr/TwitchAdSolutions. The review covers issue descriptions, text comments, and the current AdBonk code. This is an audit of open reports, not a review of every closed issue or pull request.

## Changes made

- **Live-only recovery:** tab-focus resume and worker-triggered recovery now require live content. A paused VOD or unknown content type receives no recovery action. Focus recovery uses the player-owned video instead of the first video in the DOM and resumes only the same element that was playing when the tab became hidden. This fixes a reproducible path consistent with ryanbr #245; it does not prove that every FFZ/VOD interaction is resolved.
- **One monitor timer:** returning to the tab previously added a new self-rescheduling loop alongside the existing loop in both vaft variants. Focus now replaces the pending tick. This fixes duplicated background work, but the historical multi-hour freeze in pixeltris #278 has not been reproduced or established as the same defect.
- **Experimental PiP protection:** experimental vaft lacked the stable script's standard PiP reload guard. It now uses pause/play instead of replacing the media instance when `document.pictureInPictureElement` is set, respecting an already paused player. This addresses a reproducible reload path relevant to ryanbr #262; browser-native Firefox PiP and real ad transitions remain unverified.
- **Experimental retry scope:** background and focus retry callbacks check that the target is still the same live player before attempting playback. Experimental features remain separate from stable; none were promoted.

Versions: stable vaft `68.5.7.3` / internal `94`, experimental vaft `678.0.0.3` / internal `679`, and legacy video-swap-new `1.87.3` / internal `56`.

## pixeltris reports

| Issue | Finding and disposition |
| --- | --- |
| [#506 — Black screen while blocking ads](https://github.com/pixeltris/TwitchAdSolutions/issues/506) | The reporter identified the stripping state; the maintainer explained that no clean stream was available. Backup swapping and recovery already exist in the imported fork. No safe fix can manufacture live segments that Twitch does not deliver. Current-session reproduction is still needed. |
| [#504 — Firefox extension suggestion](https://github.com/pixeltris/TwitchAdSolutions/issues/504) | A request to list TTV Ad Mute, already present in `full-list.md`. No AdBonk code fix needed. |
| [#503 — Android/iOS app instructions](https://github.com/pixeltris/TwitchAdSolutions/issues/503) | Native mobile applications are outside a browser userscript's scope. No native-app blocking feature was added. |
| [#499 — Changed web player structure](https://github.com/pixeltris/TwitchAdSolutions/issues/499) | The upstream fix `3a1ff51d9cb2448cabdb25aba2e612ab8b02d8d3` is in the imported history. The stable, experimental, and legacy alternative player lookups already unwrap `player.playerInstance`. No duplicate patch applied; the standalone strip variant remains legacy and outside this correction. |
| [#497 — Ads after Twitch updates](https://github.com/pixeltris/TwitchAdSolutions/issues/497) | Mixed reports: script injection, unsupported managers, buffering, and delivery changes. Userscript-only installation and existing diagnostics address part of the setup problem. Current ad/playlist evidence is required for new detection changes; no speculative rules added. |
| [#496 — Alternate Player moderator chat](https://github.com/pixeltris/TwitchAdSolutions/issues/496) | A third-party Alternate Player extension report, not an AdBonk implementation defect. No code change. |
| [#493 — Failed module overlay](https://github.com/pixeltris/TwitchAdSolutions/issues/493) | Reported using removed uBlock resource variants. Comments do not establish a userscript root cause. Genuine error overlays remain visible; no broad CSS hiding added. |
| [#477 — Legacy alternative appears offline](https://github.com/pixeltris/TwitchAdSolutions/issues/477) | No sufficient failing playlist/network trace in the report. Needs a current reproduction before changing stream-end handling. |
| [#473 — VOD UI lag](https://github.com/pixeltris/TwitchAdSolutions/issues/473) | Live-only recovery removes unrelated playback actions on VODs. This does not establish or resolve the original UI-lag cause; a browser profile or reproduction is still needed. |
| [#447 — Brave decode error 3000](https://github.com/pixeltris/TwitchAdSolutions/issues/447) | High-resolution codec fixes are already inherited. Later comments also describe hardware decoder failures at 1080p. No universal decode-error fix is established; needs browser/codec/error evidence. |
| [#355 — Errors 1000/2000](https://github.com/pixeltris/TwitchAdSolutions/issues/355) | Mixed network, playlist, extension, and browser reports. Needs failing HTTP status and current console/playlist evidence. No blind retries or unbounded reloads added. |
| [#329 — Legacy mute/volume changes](https://github.com/pixeltris/TwitchAdSolutions/issues/329) | The `player_volume: 0.5` value discussed is an ad-notification payload, not a volume setter. Existing storage-preservation logic remains; cross-tab timing and site audio permissions need reproduction before changing it. |
| [#278 — Browser freezes after hours](https://github.com/pixeltris/TwitchAdSolutions/issues/278) | Fixed a separately reproducible multiplication of vaft monitor loops after focus changes. The historical multi-hour browser-close freeze remains unverified, including in legacy video-swap-new. |

## ryanbr reports

| Issue | Finding and disposition |
| --- | --- |
| [#262 — PiP interrupted during ads](https://github.com/ryanbr/TwitchAdSolutions/issues/262) | Restored the missing standard PiP reload guard in experimental vaft and tested the stable/legacy guards. Native Firefox PiP and full live ad transitions still require browser reproduction. |
| [#249 — Separate video ads and resized stream](https://github.com/ryanbr/TwitchAdSolutions/issues/249) | The imported stable code already matches Amazon ad-CDN video elements, hides/mutes/pauses them, and restores recycled nodes. An upstream commenter confirmed improvement after that update. Focus recovery now also avoids selecting a separate ad video. Empty wrappers, layout changes, and cross-origin iframe ads remain unverified; no generic container hiding added. |
| [#247 — Separate ad above chat](https://github.com/ryanbr/TwitchAdSolutions/issues/247) | Same inherited separate-video guard as #249. Accessible video elements are handled; cross-origin iframe and wrapper layout behavior are not claimed fixed. |
| [#245 — FFZ/VOD auto-resume](https://github.com/ryanbr/TwitchAdSolutions/issues/245) | Reproduced a VOD-resume path in the actual extracted userscript functions and fixed it in stable vaft, experimental vaft, and legacy video-swap-new. Extension-specific confirmation is still required. |
| [#129 — uBlock/Firefox rollback loops](https://github.com/ryanbr/TwitchAdSolutions/issues/129) | The reported uBlock installation path was removed from AdBonk. Related low-quality fallback, stripping delays, and background recovery are broader playback concerns; they are not all declared fixed by removing the integration. |

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
