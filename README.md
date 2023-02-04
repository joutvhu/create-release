# Create Release

GitHub Action to create release.

## Usage

See [action.yml](action.yml)

### Inputs

For more information on these inputs, see the [API Documentation](https://developer.github.com/v3/repos/releases/#input)

- `owner`: The name of the owner of the repo. Used to identify the owner of the repository.  Used when cutting releases for external repositories.  Default: Current owner
- `repo`: The name of the repository. Used to identify the repository on which to release.  Used when cutting releases for external repositories. Default: Current repository
- `tag_name`: The name of the tag for this release
- `name`: The name of the release
- `body`: Text describing the contents of the release. Optional, and not needed if using `body_path`.
- `body_path`: A file with contents describing the release. Optional, and not needed if using `body`.
- `draft`: `true` to create a draft (unpublished) release, `false` to create a published one. Default: `false`
- `prerelease`: `true` to identify the release as a prerelease. `false` to identify the release as a full release. Default: `false`
- `target_commitish` : Any branch or commit SHA the Git tag is created from, unused if the Git tag already exists. Default: SHA of current commit
- `discussion_category_name`: When provided this will generate a discussion of the specified category. The category must exist otherwise this will cause the action to fail. This isn't used with draft releases.
- `generate_release_notes`: Indicates if release notes should be automatically generated.
- `on_release_exists`: Indicate what to do if a release already exists. Options: `skip`, `error`, `update`, `update_only_draft`, `update_only_prerelease`, `update_only_draft/prerelease`, `update_only_draft_or_skip`, `update_only_prerelease_or_skip`, `update_only_draft/prerelease_or_skip`. Default `skip`.
- `remove_assets`: Indicates if existing release artifacts should be removed.

The `body_path` is valuable for dynamically creating a `.md` within code commits and even within the Github Action steps leading up to the `create-release`.

### Outputs

For more information on these outputs, see the [API Documentation](https://developer.github.com/v3/repos/releases/#response-4) for an example of what these outputs look like

- `id`: The release ID
- `html_url`: The URL users can navigate to in order to view the release. i.e. `https://github.com/octocat/Hello-World/releases/v1.0.0`
- `upload_url`: The URL for uploading assets to the release, which could be used by GitHub Actions for additional uses, for example the [`@actions/upload-release-asset`](https://www.github.com/actions/upload-release-asset) GitHub Action
- `tag_name`: The git tag associated with the release. ex: `v1.1.0`
- `prerelease`: Whether the release is a pre-release

### Example

```yaml
permissions:
  contents: write
steps:
  - name: Create Release
    id: create_release
    uses: joutvhu/create-release@v1
    with:
      tag_name: v1.0.0
      name: Release v1.0.0
      body: |
        Changes in this Release
        - First Change
        - Second Change
      draft: false
      prerelease: false
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This will create a [Release](https://help.github.com/en/articles/creating-releases), as well as a [release event](https://developer.github.com/v3/activity/events/types/#releaseevent), which could be handled by a third party service, or by GitHub Actions for additional uses, for example the [`@actions/upload-release-asset`](https://www.github.com/actions/upload-release-asset) GitHub Action.
