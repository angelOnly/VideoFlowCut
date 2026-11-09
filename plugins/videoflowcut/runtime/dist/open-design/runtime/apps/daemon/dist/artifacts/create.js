import { Buffer } from 'node:buffer';
import { inferLegacyManifest, validateArtifactManifestInput } from './manifest.js';
export class ArtifactManifestRequiredError extends Error {
    code = 'ARTIFACT_MANIFEST_REQUIRED';
    constructor(name) {
        super(`artifactManifest is required for ${name}; no safe default manifest can be inferred`);
    }
}
export class ArtifactManifestInvalidError extends Error {
    code = 'ARTIFACT_MANIFEST_INVALID';
    constructor(message) {
        super(`invalid artifactManifest: ${message}`);
    }
}
export function buildCreateArtifactRequestBody(input) {
    return {
        name: input.name,
        content: input.content,
        encoding: input.encoding === 'base64' ? 'base64' : 'utf8',
        artifact: true,
        overwrite: false,
        ...(input.artifactManifest === undefined ? {} : { artifactManifest: input.artifactManifest }),
    };
}
export function resolveCreateArtifactManifest(input) {
    const manifest = input.artifactManifest !== undefined && input.artifactManifest !== null
        ? input.artifactManifest
        : inferLegacyManifest(input.name);
    if (manifest) {
        const validated = validateArtifactManifestInput(manifest, input.name);
        if (!validated.ok) {
            throw new ArtifactManifestInvalidError(validated.error);
        }
        return validated.value;
    }
    throw new ArtifactManifestRequiredError(input.name);
}
export async function createProjectArtifactFile(options) {
    const { input } = options;
    const body = input.encoding === 'base64'
        ? Buffer.from(input.content, 'base64')
        : Buffer.from(input.content, 'utf8');
    return await options.writeProjectFile(options.projectsRoot, options.projectId, input.name, body, {
        overwrite: false,
        artifactManifest: resolveCreateArtifactManifest(input),
    }, options.metadata);
}
export async function postCreateArtifactRequest(args) {
    const response = await fetch(`${args.baseUrl.replace(/\/$/, '')}/api/projects/${encodeURIComponent(args.projectId)}/files`, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            ...args.headers,
        },
        body: JSON.stringify(buildCreateArtifactRequestBody(args.input)),
    });
    const text = await response.text();
    let body = text;
    if (text.length > 0) {
        try {
            body = JSON.parse(text);
        }
        catch {
            body = { message: text };
        }
    }
    if (!response.ok) {
        const error = new Error(`daemon artifact endpoint failed with ${response.status}`);
        error.details = body;
        error.status = response.status;
        throw error;
    }
    return body;
}
//# sourceMappingURL=create.js.map