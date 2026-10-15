# Creating an AdBonk release

A release request means preparing a complete, readable GitHub release with downloadable packages, then checking that publication succeeded. Follow these rules for each request.

## Choose the version and scope

- Review changes since the previous release and the working tree. Preserve unrelated local changes.
- Follow the [version and synchronization policy](MAINTENANCE.md#version-policy). Stable userscript, package, and extensions must share one version, including releases that only change the extension interface or packaging.
- Stable releases use `v<stable-userscript-version>` and the title `AdBonk v<version>`. The tag must match `package.json` and the stable script's `@version`.
- Never reuse, move, or delete a published tag to ship new code. Never silently replace published packages. A code or packaging correction requires a new relevant version and release.
- Extension-only updates use the same shared release sequence: bump `package.json` and stable userscript metadata, rebuild both extensions, and publish a new `v<version>` tag. Preserve the userscript runtime and conflict counter when behavior is unchanged.
- A stable userscript release can include experimental extensions. Mark each artifact's status clearly; this does not promote the extensions. Use a GitHub prerelease for an actual preview of the main stable userscript, with an explicitly supported version/tag workflow.
- Documentation-only changes normally do not require a new release or runtime version bump.

## Write the release notes

Create `docs/releases/<tag>.md` from [RELEASE-TEMPLATE.md](RELEASE-TEMPLATE.md). Commit it with the release preparation and update `CHANGELOG.md`.

Write in English for someone installing AdBonk. Lead with what changed and why it matters. Use short paragraphs, a download table, and practical installation steps. Avoid promotional language, decorative badges, emoji-heavy headings, and a raw dump of commits or inherited history.

Include:

- Exact userscript and extension versions, filenames, and stable/experimental status.
- User-visible fixes or features since the previous release. Omit empty sections and unrelated maintenance details.
- Installation and update instructions appropriate to the shipped files. Distinguish the release snapshot from the main-branch userscript installation link.
- Migration requirements only when applicable. Never imply GitHub ZIPs automatically update unpacked extensions or store installations.
- Validation actually performed and material untested scenarios. Attribute maintainer/user reports separately from automated checks; do not turn one successful session into a broad compatibility claim.
- A link to report problems. Preserve the required copyright and permission notices in LICENSE. Keep presentation focused on AdBonk and its current maintainer; do not add old repository links or promotional attribution.

Link version-specific documentation through the release tag when possible. Use `docs/releases/v1.0.0.md` as a completed example. Remove every template placeholder before committing.

## Validate and publish

1. Run `npm run check` and build both extension packages with `npm run build:extension`. Run browser integration checks when the core or integration changed. Follow the live-playback checks in the maintenance guide and explicitly record unavailable checks.
2. Verify each package's manifest version, `build-info.json`, and bundled core against the intended stable source. Use only the current version's ZIPs; never attach old archives left in a local `dist/` directory. Include `vaft.user.js`, both browser ZIPs, and `LICENSE` for a combined release.
3. Check the notes, changelog, links, versions, and Git diff. Commit and push the prepared changes to `main` using the configured maintainer identity. Tag that exact commit with an annotated, unused release tag, then push the tag.
4. Watch the Release workflow to completion. If it fails, investigate and report the actual state; a pushed tag alone is not a published release. Do not move the tag as a recovery shortcut.
5. Check the published title, notes, tag, draft/prerelease status, expected assets, and asset hashes against the validated builds. Report the release URL, included versions, checks, and any material limitation.

GitHub publication and browser-store submission are separate operations. Do not claim store availability, Mozilla signing, or automatic store updates based on a GitHub release.
