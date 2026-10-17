# Automatic Firefox submission

The Release workflow publishes the GitHub release, then calls **Publish Firefox** to submit the same version to the existing AdBonk listing. It uses Mozilla's official `web-ext` tool, pinned to `10.8.0`.

Submission does not bypass Mozilla review or guarantee immediate store availability. This automation does not change the public listing description, icon, or other browsers' stores.

## Publication rules

Last checked against Mozilla documentation on 2026-10-16. Recheck the linked sources before changing submission tooling, manifest permissions, data handling, listing fields, or package generation. A successful earlier upload does not guarantee a later version meets current requirements. These rules apply to Firefox submission; other stores have their own limits.

| Item | Mozilla requirement or AdBonk rule | Current enforcement |
| --- | --- | --- |
| Version notes | AMO accepts at most **3,000 characters per locale**. Keep English notes concise and lead with fixes; installation details can stay on GitHub. GitHub notes do not have this project-imposed limit. | The verifier conservatively caps the English text, including ellipsis and full-release link, without splitting Unicode surrogate pairs. Boundary, long-text, and Unicode tests run in `npm run check`. |
| Archive | Mozilla accepts `.zip`, `.xpi`, or `.crx`, with a maximum upload size of **200 MB**. AdBonk submits its Firefox ZIP. | Package contents, versions, hashes, and exact published ZIP equality are tested. The 200 MB upload cap is a manual release check, not a dedicated local automated guard. |
| Version format | Mozilla accepts one to four numeric components, up to nine digits per component, without leading zeroes on nonzero components. AdBonk uses the stricter shared three-part release sequence, such as `1.0.11`, without preview suffixes. Choose a new increasing version; never reuse a submitted version. | Shared version equality and stable tag shape are checked locally. Mozilla version history must be checked before retries; the local tag regex is not a complete store-version validator. |
| Add-on identity | Updates must identify the existing add-on. Preserve `adbonk@rafelolv.github.io` and submit to the existing `listed` channel. | The verifier rejects another add-on ID; the workflow explicitly selects `listed`. |
| Listing metadata | Existing name, summary, categories, and version license must satisfy AMO's requirements. The API can inherit the previous version's license. | This workflow updates version notes and packages, not listing text, icons, categories, or privacy-policy content. Check those in Developer Hub when relevant. |

The 3,000-character note limit was confirmed by the AMO API rejecting the first `1.0.11` submission. [The failed run](https://github.com/rafelolv/AdBonk/actions/runs/38993004212) returned `version.release_notes: Ensure this field has no more than 3000 characters.` The corrected submission succeeded without changing the published tag or package.

### Source, permissions, and privacy

Follow [Mozilla Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/): request only necessary permissions, keep packaged extension logic self-contained, avoid remote executable code and obfuscation, and do not weaken page security headers. Preserve reviewable source and reproducible build instructions; if adding minification, transpilation, or other build transformations, reassess source-submission requirements and supply the required sources rather than assuming a GitHub URL is sufficient.

Keep listing descriptions and manifest data declarations accurate. Reassess Twitch-bound requests as well as any new endpoint, telemetry, or diagnostics transmission against Mozilla's disclosure and consent requirements; do not infer compliance simply because data is not sent to AdBonk's own server. Recheck the current `data_collection_permissions` declaration whenever data handling changes. Policy compliance and disclosure are manual reviews, not proven by passing tests.

Before submitting a changed package, run the pinned Mozilla tool's `web-ext lint --source-dir dist/firefox --no-config-discovery`. Resolve errors and review warnings; record a justified warning rather than silently ignoring it. The current workflow's remote upload validation remains separate from this local lint check. Do not advertise Android support based only on successful desktop validation. Provide reviewer testing instructions and a suitable test account through Mozilla's reviewer-only fields if required; never include credentials in public release notes or the repository.

### Failures and retries

- Keep GitHub release creation, Mozilla submission, signing, review, and public availability distinct. A `web-ext sign` success with `--approval-timeout 0` confirms submission, not approval or a downloaded signed package. GitHub ZIPs remain unsigned.
- Read the API response before retrying. A `400` can be invalid metadata; `401`/`403` require checking authentication or authorization. For a `429`, honor the service's retry guidance. Do not add blind or unlimited retries.
- After a timeout or ambiguous response, check Developer Hub for an existing submission of the same version before another upload. Do not delete a pending version or move a Git tag as a recovery shortcut.
- If only submission metadata or automation needs correction, fix it on `main` and run **Publish Firefox** there with the existing release tag. The retained verifier supports older tags. If package contents need correction, create a new shared version and release.
- Never enable verbose credential/configuration dumps while diagnosing a failure. Report the relevant redacted response and actual submission state.

Sources: [submission formats and size](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/), [manifest version format](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/version), [add-on identity](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/), [AMO API metadata and license inheritance](https://mozilla.github.io/addons-server/topics/api/addons), and [web-ext signing and lint options](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).

## One-time setup

1. Generate Mozilla API credentials in [API key management](https://addons.mozilla.org/developers/addon/api/key/). Revoke and replace credentials that were shared in chat, logs, or other exposed locations.
2. Open [AdBonk → Settings → Secrets and variables → Actions](https://github.com/rafelolv/AdBonk/settings/secrets/actions).
3. Create two **repository secrets**, using these exact names:

| GitHub secret | Mozilla value |
| --- | --- |
| `AMO_JWT_ISSUER` | JWT issuer |
| `AMO_JWT_SECRET` | JWT secret |

The account must be authorized to update the existing add-on, whose ID remains `adbonk@rafelolv.github.io`.

No credentials belong in source files, workflow YAML values, repository variables, release assets, or a local `.env` file. Only secret references appear in the workflows. Credentials are available only in the credential check and Mozilla submission steps; do not enable verbose logging or dump tool configuration.

Without both secrets, the Firefox job fails with a setup message. The already-created GitHub release remains available.

## Future releases

Follow [the release guide](RELEASING.md): update the shared version, test, write release notes, and publish the version tag. After the GitHub release succeeds, Firefox submission starts automatically in the same workflow run. It is intentionally not based on `release: published`, because GitHub releases created by `GITHUB_TOKEN` do not trigger another workflow through that event.

Before submission, the job checks the stable tag, rebuilds the tagged source, downloads the Firefox ZIP attached to that release, and requires an exact byte match. It also checks the shared version, add-on ID, bundled blocker hash, license, and release notes. Missing or different packages stop the job before the Mozilla API is used.

The tool submits through the `listed` channel and includes the committed English release notes. Notes over Mozilla's 3,000-character limit are shortened at a paragraph boundary where possible, with a link to the complete GitHub release; the original notes and packages are unchanged. It does not wait for review. A successful step means **submitted**, not **approved**; track the actual version in [Mozilla Developer Hub](https://addons.mozilla.org/developers/addons).

## Existing releases and retries

Open **Actions → Publish Firefox → Run workflow**, choose `main`, and enter an existing stable release tag, such as `v1.0.8`. This runs only Firefox submission; it does not recreate the GitHub release or replace its assets. The verifier is kept from the automation checkout before checking out the older release, so existing tagged packages can be verified too.

Check Mozilla's version history before retrying an interrupted run. If the same version is already submitted or awaiting review, do not submit it again; continue tracking that submission. A duplicate version can fail at Mozilla. For a code correction, increment the shared version and publish a new release rather than overwrite an existing version.

## Validation

Run `npm run check` for the project and publication guard tests. The tests use temporary fixtures, no network, no credentials, and never upload an add-on. A real submission can only be confirmed after repository secrets are configured and the workflow is run.

References: [Mozilla command reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign), [GitHub workflow triggering](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow).
