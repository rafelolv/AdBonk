# Automatic Firefox submission

The Release workflow publishes the GitHub release, then calls **Publish Firefox** to submit the same version to the existing AdBonk listing. It uses Mozilla's official `web-ext` tool, pinned to `10.8.0`.

Submission does not bypass Mozilla review or guarantee immediate store availability. This automation does not change the public listing description, icon, or other browsers' stores.

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
