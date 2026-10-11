# TwitchClear initial baseline

Compared on 2026-10-11 using complete clones, without modifying the source repositories.

| Source | Branch | Commit |
| --- | --- | --- |
| pixeltris/TwitchAdSolutions | master | `c51ef2fe8f667f9dc9216eb550924cf0d732ce27` |
| ryanbr/TwitchAdSolutions | master | `e4dfb26755cb440f9ec6a2430a9b131fa1de062a` |

The original was archived on 2026-03-05. The latest commit in the inspected ryanbr baseline is dated 2026-08-27. `git rev-list --left-right --count pixeltris/master...ryanbr/master` returned `0 813`: no commits exclusive to pixeltris and 813 exclusive to ryanbr. The adopted baseline therefore comes entirely from ryanbr; this snapshot contains no original-only fixes to reapply.

The diff between the two tips covers 20 files, 16,593 insertions, and 956 deletions. This includes experimental changes and documentation; the count does not represent 813 distinct fixes.

## Imported fixes and features

- Buffering recovery, reload cooldown, and player reload limits.
- Switching to alternative streams before removing segments, with a low-quality fallback when needed.
- Handling mute state, stale player references, and recycled video elements.
- Improvements for AV1/HEVC codecs and missing playlist `CODECS` attributes.
- Guards for auxiliary frames, the clip editor, and workers already intercepted.
- Hiding separate video ads when accessible in the page DOM.
- CSAI ad logging and timeouts in the GQL request path.
- Tests, benchmarks, debugging documentation, and experimental variants.

See [CHANGELOG.md](../CHANGELOG.md) for the previous maintainer's details and qualifications. These describe imported code; they do not establish effectiveness in current Twitch sessions.

## Initial TwitchClear changes

- Project name and namespace in all five userscripts.
- Update/download URLs pointing to `rafelolv/TwitchClear`.
- A `.1` suffix on userscript versions: vaft `68.5.7.1`, testing `678.0.0.1`, video-swap-new `1.87.1`, strip `1.10.1`, and Brave fix `1.3.1.1`.
- English documentation, upstream remotes, validation of all JavaScript files, and releases triggered by tags.
- Preserved runtime logic, internal conflict versions, and author credits.

## Removed integration

TwitchClear supports userscript managers only. All five inherited uBlock Origin resource files, their installation instructions, bug-report choices, and release artifacts were removed. The validator now compiles ordinary JavaScript directly. Upstream historical changelog entries retain their original references; they do not describe supported installation methods.

## Validation and limitations

`npm run check` compiles every JavaScript file without executing browser code and runs the 84 inherited tests. The tests contain copied functions; they do not exercise the complete integration or every recent change. The pipeline does not establish that workers, the player, or ad handling work in a real session.

No live-stream validation with Tampermonkey has been performed. SSAI appears in playlists and may be handled by switching streams or removing segments; CSAI may occur outside playlists, and diagnostic hooks do not guarantee blocking. Videos in cross-origin iframes may also be inaccessible to the script. Reduced quality and pauses during ads remain possible.
