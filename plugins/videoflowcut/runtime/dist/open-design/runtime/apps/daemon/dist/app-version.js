import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, parse as parsePath } from 'node:path';
import { releaseChannelFromVersion } from '@open-design/release';
export const APP_VERSION_FALLBACK = '0.0.0';
export const UNKNOWN_APP_VERSION = 'unknown';
export function normalizeTelemetryAppVersion(value) {
    const version = cleanString(value);
    return version && version !== APP_VERSION_FALLBACK && version !== UNKNOWN_APP_VERSION
        ? version
        : null;
}
export function normalizeTelemetryAppVersionInfo(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const candidate = value;
    const version = normalizeTelemetryAppVersion(candidate.version);
    const channel = cleanString(candidate.channel);
    const platform = cleanString(candidate.platform);
    const arch = cleanString(candidate.arch);
    if (!version || !channel || !platform || !arch || typeof candidate.packaged !== 'boolean') {
        return null;
    }
    return { version, channel, packaged: candidate.packaged, platform, arch };
}
const processWithResources = process;
// The compiled daemon ships in two layouts depending on which tsconfig produced
// it: `dist/app-version.js` (rootDir=src, used by the `od` CLI) and
// `dist/src/app-version.js` (rootDir=., used by the packaged sidecar entry).
// A fixed relative path like `../package.json` only points at the daemon
// `package.json` in the first layout — in the sidecar layout it resolves to
// `dist/package.json`, which does not exist, so the version silently falls
// back to `APP_VERSION_FALLBACK`. Walk up from `import.meta.url` until we find
// a real `package.json` so both build outputs (and the TypeScript source
// during `tools-dev`) read the daemon's actual version. Callers that already
// inject the version via `OD_APP_VERSION` (packaged runtime) keep working
// because that env still wins inside `resolveAppVersionInfo`.
async function findNearestPackageJsonUrl(startUrl) {
    let currentDir;
    try {
        currentDir = dirname(fileURLToPath(startUrl));
    }
    catch {
        return null;
    }
    const root = parsePath(currentDir).root;
    while (true) {
        const candidate = join(currentDir, 'package.json');
        try {
            const stats = await stat(candidate);
            if (stats.isFile())
                return pathToFileURL(candidate);
        }
        catch {
            // try the parent directory
        }
        if (currentDir === root)
            return null;
        const parent = dirname(currentDir);
        if (parent === currentDir)
            return null;
        currentDir = parent;
    }
}
function cleanString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
export function inferReleaseChannelFromVersion(version) {
    return releaseChannelFromVersion(version)
        ?? version.match(/^\d+\.\d+\.\d+-([0-9A-Za-z-]+)/)?.[1]?.split('.')[0]
        ?? null;
}
export function isPackagedRuntime({ resourcesPath = processWithResources.resourcesPath, execPath = process.execPath, platform = process.platform, } = {}) {
    if (cleanString(resourcesPath))
        return true;
    const normalizedExecPath = cleanString(execPath)?.replace(/\\/g, '/').toLowerCase();
    if (!normalizedExecPath)
        return false;
    switch (platform) {
        case 'darwin':
            return normalizedExecPath.includes('/contents/resources/');
        case 'win32':
            return normalizedExecPath.includes('/resources/') || normalizedExecPath.includes('/app.asar');
        case 'linux':
            return normalizedExecPath.includes('/usr/share/')
                || normalizedExecPath.includes('/opt/')
                || normalizedExecPath.includes('/resources/');
        default:
            return normalizedExecPath.includes('/resources/') || normalizedExecPath.includes('/app.asar');
    }
}
export function resolveAppVersionInfo({ env = process.env, packageMetadata, resourcesPath, execPath, platform = process.platform, arch = process.arch, } = {}) {
    const packaged = isPackagedRuntime({ resourcesPath, execPath, platform });
    const version = cleanString(env.OD_APP_VERSION)
        ?? cleanString(packageMetadata?.version)
        ?? APP_VERSION_FALLBACK;
    const inferredChannel = inferReleaseChannelFromVersion(version);
    const channel = cleanString(env.OD_RELEASE_CHANNEL)
        ?? cleanString(env.OD_APP_CHANNEL)
        ?? inferredChannel
        ?? (packaged ? 'stable' : 'development');
    return { version, channel, packaged, platform, arch };
}
async function readPackageMetadata(packageJsonUrl) {
    try {
        const raw = await readFile(packageJsonUrl, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    }
    catch {
        return null;
    }
}
export async function readCurrentAppVersionInfo({ packageJsonUrl, packageMetadata, env, resourcesPath, execPath, platform, arch, } = {}) {
    const resolvedUrl = packageJsonUrl ?? await findNearestPackageJsonUrl(new URL(import.meta.url));
    const metadata = packageMetadata
        ?? (resolvedUrl ? await readPackageMetadata(resolvedUrl) : null);
    return resolveAppVersionInfo({ env, packageMetadata: metadata, resourcesPath, execPath, platform, arch });
}
//# sourceMappingURL=app-version.js.map