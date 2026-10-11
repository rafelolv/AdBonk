# Userscript manager compatibility

AdBonk is distributed as a userscript. Tampermonkey is not required specifically: the main script needs execution at `document-start` in the page's JavaScript context. It replaces page-level Worker/fetch hooks and reads Twitch's React player state; changing only the visible DOM is insufficient.

## Current options

| Manager | Status | Evidence and limits |
| --- | --- | --- |
| Tampermonkey | Standard option | Listed by the upstream project. This fork does not claim a new end-to-end validation of every browser/manager version. |
| Violentmonkey | Standard alternative | Listed by the upstream project. Its [metadata documentation](https://violentmonkey.github.io/api/metadata-block/#grant) describes `@grant none` as allowing direct access to page globals. |
| ScriptCat | Compatibility testing option | Its [metadata documentation](https://docs.scriptcat.org/en/docs/dev/meta/#grant) states that `@grant none` executes directly in the page environment, and it supports `document-start`. This matches the main userscript's metadata, but has not been tested in a live Twitch session with ScriptCat installed. |
| Greasemonkey | Main script not currently supported | [Greasemonkey's author guidance](https://www.greasespot.net/2017/09/greasemonkey-4-for-script-authors.html) documents different `@grant none`/page-access behavior. The [current execution wrapper](https://github.com/greasemonkey/greasemonkey/blob/master/src/user-script-obj.js) supplies `unsafeWindow` separately from `window`. The main AdBonk script hooks `window` directly and has no dedicated adapter for that environment. |

Statuses were reviewed on 2026-10-11. Matching metadata is evidence of expected compatibility, not proof of successful ad blocking.

## Page-context requirement

Keep the main script's `@grant none` and `@run-at document-start` metadata. Do not force content-script injection: a content-only environment may show startup logs while its hooks never reach Twitch's player.

Violentmonkey's [injection-context documentation](https://violentmonkey.github.io/api/metadata-block/#inject-into) distinguishes page and content modes. ScriptCat's [metadata documentation](https://docs.scriptcat.org/en/docs/dev/meta/#inject-into) makes the same distinction and defaults to page injection. Browser restrictions can still prevent or delay injection. A manager-specific fix must be reproduced and tested before changing the shared stable userscript.

## Greasemonkey and the Brave companion

The optional Brave companion accepts both `GM.xmlHttpRequest` and `GM_xmlHttpRequest`. That API compatibility does not establish that the main ad-blocking script works in Greasemonkey, nor that the companion's page hooks work there. The companion is aimed at Brave; installing it is not a Greasemonkey workaround.

Supporting Greasemonkey would require an adapter for page hooks, cross-context objects/functions, and startup timing, plus testing in Firefox with the actual extension. No untested adapter has been added to the stable script.

## Report a compatibility problem

Use one manager and one AdBonk blocking variant at a time. Include browser/version, manager/version, script/version, startup and worker-hook logs, and whether the problem also occurs in a standard manager. ScriptCat reports and contributions toward Greasemonkey compatibility are welcome; the issue form lists both explicitly.
