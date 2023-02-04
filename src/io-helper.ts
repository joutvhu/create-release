import * as core from '@actions/core';
import {InputOptions} from '@actions/core';
import {context} from '@actions/github';
import {Inputs, Outputs} from './constants';
const fs = require('fs');

export interface ReleaseInputs {
    owner: string;
    repo: string;

    tag: string;
    name?: string;
    body?: string;
    targetCommitish?: string;
    discussionCategoryName?: string;
    generateReleaseNotes?: boolean;

    draft: boolean;
    prerelease: boolean;
    makeLatest: boolean;

    onReleaseExists: 'skip' | 'error' | 'update' | 'update_only_unreleased' | 'update_only_unreleased_or_skip';
    removeAssets?: boolean;

    debug: boolean;
}

export function isBlank(value: any): boolean {
    return value === null || value === undefined || (value.length !== undefined && value.length === 0);
}

export function isNotBlank(value: any): boolean {
    return value !== null && value !== undefined && (value.length === undefined || value.length > 0);
}

export function getBooleanInput(name: string, options?: InputOptions): boolean {
    const value = core.getInput(name, options);
    return isNotBlank(value) &&
        ['y', 'yes', 't', 'true', 'e', 'enable', 'enabled', 'on', 'ok', '1']
            .includes(value.trim().toLowerCase());
}

/**
 * Helper to get all the inputs for the action
 */
export function getInputs(): ReleaseInputs {
    const result: ReleaseInputs | any = {
        draft: false,
        prerelease: false
    };

    result.owner = core.getInput(Inputs.Owner, {required: false});
    if (isBlank(result.owner))
        result.owner = context.repo.owner;

    result.repo = core.getInput(Inputs.Repo, {required: false});
    if (isBlank(result.repo))
        result.repo = context.repo.repo;

    const tag = core.getInput(Inputs.TagName, {required: true});
    if (isNotBlank(tag))
        result.tag = tag.trim();

    const name = core.getInput(Inputs.ReleaseName, {required: true});
    if (isNotBlank(name))
        result.name = name.trim();

    const body = core.getInput(Inputs.Body, {required: false});
    if (isNotBlank(body))
        result.body = body.trim();
    const bodyPath = core.getInput(Inputs.BodyPath, {required: false});
    if (isNotBlank(body)) {
        try {
            result.body = fs.readFileSync(bodyPath, {encoding: 'utf8'});
        } catch (e: any) {
            core.warning(e.message);
        }
    }

    const commitish = core.getInput(Inputs.Commitish, {required: false});
    if (isNotBlank(commitish))
        result.targetCommitish = commitish.trim();

    const discussionCategoryName = core.getInput(Inputs.DiscussionCategoryName, {required: false});
    if (isNotBlank(discussionCategoryName))
        result.discussionCategoryName = discussionCategoryName.trim();

    result.generateReleaseNotes = getBooleanInput(Inputs.GenerateReleaseNotes, {required: false});

    const onReleaseExists = core.getInput(Inputs.OnReleaseExists, {required: false});
    if (isNotBlank(onReleaseExists))
        result.onReleaseExists = onReleaseExists.trim();
    else
        result.onReleaseExists = 'skip';

    result.removeAssets = getBooleanInput(Inputs.RemoveAssets, {required: false});

    result.draft = getBooleanInput(Inputs.Draft, {required: false});
    result.prerelease = getBooleanInput(Inputs.Prerelease, {required: false});
    result.makeLatest = getBooleanInput(Inputs.MakeLatest, {required: false});

    result.debug = getBooleanInput(Inputs.Debug, {required: false});

    return result;
}

export function setOutputs(response: any, log?: boolean) {
    // Get the outputs for the created release from the response
    let message = '';
    for (const key in Outputs) {
        const field: string = (Outputs as any)[key];
        if (log)
            message += `\n  ${field}: ${JSON.stringify(response[field])}`;
        core.setOutput(field, response[field]);
    }

    if (log)
        core.info('Outputs:' + message);
}
