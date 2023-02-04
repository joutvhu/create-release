import * as core from '@actions/core';
import {getOctokit} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods';
import {getInputs, ReleaseInputs, setOutputs} from './io-helper';

export function isSuccessStatusCode(statusCode?: number): boolean {
    if (!statusCode) return false;
    return statusCode >= 200 && statusCode < 300;
}

export async function deleteReleaseAssets(
    github: InstanceType<typeof GitHub>,
    params: RestEndpointMethodTypes['repos']['listReleaseAssets']['parameters']
) {
    try {
        const releaseAssets = await github.paginate(github.rest.repos.listReleaseAssets, params);
        for (const asset of releaseAssets) {
            core.debug(`Deleting existing release asset ${asset.name}`);
            try {
                await github.rest.repos.deleteReleaseAsset({
                    asset_id: asset.id,
                    owner: params.owner,
                    repo: params.repo
                });
            } catch (e: any) {
                core.warning(e.message);
            }
        }
    } catch (e: any) {
        core.warning(e.message);
    }
}

(async function run() {
    try {
        const inputs: ReleaseInputs = getInputs();
        const github = getOctokit(process.env.GITHUB_TOKEN as string);

        core.info(`Start create release with:\n  owner: ${inputs.owner}\n  repo: ${inputs.repo}`);

        let releaseData: RestEndpointMethodTypes['repos']['getReleaseByTag']['response']['data'] | undefined;
        try {
            const releaseResponse = await github.rest.repos.getReleaseByTag({
                owner: inputs.owner,
                repo: inputs.repo,
                tag: inputs.tag
            });

            releaseData = releaseResponse.data;
        } catch (e: any) {
            core.warning(`Unexpected http ${e.status} during get release: ${e.message}`);
        }

        if (releaseData != null) {
            if (inputs.onReleaseExists === 'error')
                throw new Error('Release already exists.');
            if (inputs.onReleaseExists.startsWith('update')) {
                let errorMessage: string | undefined;
                if (inputs.onReleaseExists.startsWith('update_only_draft') &&
                    !releaseData.draft) {
                    errorMessage = `Tried to update '${releaseData.name ?? 'release'}' which is neither a draft.`;
                } else if (inputs.onReleaseExists.startsWith('update_only_prerelease') &&
                    !releaseData.prerelease) {
                    errorMessage = `Tried to update '${releaseData.name ?? 'release'}' which is neither a prerelease.`;
                } else if (inputs.onReleaseExists.startsWith('update_only_draft/prerelease') &&
                    !releaseData.draft && !releaseData.prerelease) {
                    errorMessage = `Tried to update '${releaseData.name ?? 'release'}' which is neither a draft or prerelease.`;
                }

                if (errorMessage != null) {
                    if (inputs.onReleaseExists.endsWith('_or_skip')) {
                        setOutputs(releaseData, inputs.debug);
                        core.warning(errorMessage);
                    } else
                        throw new Error(errorMessage);
                } else {
                    core.debug(`Updating release ${releaseData.id}`);
                    const updateResponse = await github.rest.repos.updateRelease({
                        release_id: releaseData.id,
                        owner: inputs.owner,
                        repo: inputs.repo,
                        tag_name: inputs.tag,
                        name: inputs.name,
                        body: inputs.body,
                        target_commitish: inputs.targetCommitish,
                        discussion_category_name: inputs.discussionCategoryName,
                        generate_release_notes: inputs.generateReleaseNotes,
                        draft: inputs.draft,
                        prerelease: inputs.prerelease,
                        make_latest: inputs.makeLatest
                    });

                    if (!isSuccessStatusCode(updateResponse.status))
                        throw new Error(`Unexpected http ${updateResponse.status} during update release.`);

                    if (inputs.removeAssets) {
                        core.debug(`Deleting release assets.`);
                        await deleteReleaseAssets(github, {
                            release_id: updateResponse.data.id,
                            owner: inputs.owner,
                            repo: inputs.repo
                        });
                    }

                    setOutputs(updateResponse.data, inputs.debug);
                    core.info('Update release has finished successfully.');
                }
            } else {
                setOutputs(releaseData, inputs.debug);
                core.warning('Release already exists.');
            }
        } else {
            core.debug(`Creating release ${inputs.name}`);
            const createResponse = await github.rest.repos.createRelease({
                owner: inputs.owner,
                repo: inputs.repo,
                tag_name: inputs.tag,
                name: inputs.name,
                body: inputs.body,
                target_commitish: inputs.targetCommitish,
                discussion_category_name: inputs.discussionCategoryName,
                generate_release_notes: inputs.generateReleaseNotes,
                draft: inputs.draft,
                prerelease: inputs.prerelease,
                make_latest: inputs.makeLatest
            });

            if (!isSuccessStatusCode(createResponse.status))
                throw new Error(`Unexpected http ${createResponse.status} during create release.`);

            setOutputs(createResponse.data, inputs.debug);
            core.info('Create release has finished successfully.');
        }
    } catch (err: any) {
        core.setFailed(err.message);
    }
})();
