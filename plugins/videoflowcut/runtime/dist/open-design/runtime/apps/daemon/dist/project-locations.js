import { lstat, mkdir, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expandHomePrefix } from './home-expansion.js';
import { isSafeId } from './projects.js';
export const BUILT_IN_PROJECT_LOCATION_ID = 'default';
export const PROJECT_MANIFEST_RELATIVE_PATH = path.join('.open-design', 'project.json');
export function builtInProjectLocation(projectsDir) {
    return {
        id: BUILT_IN_PROJECT_LOCATION_ID,
        name: 'OpenDesign projects',
        path: projectsDir,
        builtIn: true,
    };
}
export function allProjectLocations(projectsDir, external) {
    return [builtInProjectLocation(projectsDir), ...(external ?? [])];
}
export function locationProjectDir(location, projectId) {
    if (!isSafeId(projectId))
        throw new Error('invalid project id');
    return path.join(location.path, projectId);
}
function assertInsideLocation(locationRoot, projectDir) {
    const relative = path.relative(locationRoot, projectDir);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('project directory escapes project location');
    }
}
export async function createLocationProjectDir(location, projectId) {
    const root = await realpath(location.path);
    const target = locationProjectDir({ ...location, path: root }, projectId);
    await mkdir(target, { recursive: false });
    const info = await lstat(target);
    if (!info.isDirectory() || info.isSymbolicLink())
        throw new Error('project directory must be a real directory');
    const canonical = await realpath(target);
    assertInsideLocation(root, canonical);
    return canonical;
}
export async function canonicalLocationChildDir(location, childName) {
    const root = await realpath(location.path);
    if (!isSafeId(childName))
        throw new Error('invalid project directory name');
    const target = path.join(root, childName);
    const info = await lstat(target);
    if (!info.isDirectory() || info.isSymbolicLink())
        throw new Error('project directory must be a real directory');
    const canonical = await realpath(target);
    assertInsideLocation(root, canonical);
    return canonical;
}
export function manifestPath(projectDir) {
    return path.join(projectDir, PROJECT_MANIFEST_RELATIVE_PATH);
}
export async function ensureProjectLocation(locationPath) {
    const expanded = expandHomePrefix(locationPath.trim());
    if (!path.isAbsolute(expanded))
        throw new Error(`project location must be an absolute path: ${locationPath}`);
    await mkdir(expanded, { recursive: true });
    return realpath(expanded);
}
export async function writeProjectManifest(projectDir, manifest) {
    const file = manifestPath(projectDir);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(manifest, null, 2), 'utf8');
}
export async function readProjectManifest(projectDir) {
    try {
        const raw = await readFile(manifestPath(projectDir), 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            return null;
        const obj = parsed;
        if (obj.schemaVersion !== 1)
            return null;
        if (typeof obj.id !== 'string' || !isSafeId(obj.id))
            return null;
        if (typeof obj.name !== 'string' || !obj.name.trim())
            return null;
        const createdAt = typeof obj.createdAt === 'number' && Number.isFinite(obj.createdAt) ? obj.createdAt : Date.now();
        const updatedAt = typeof obj.updatedAt === 'number' && Number.isFinite(obj.updatedAt) ? obj.updatedAt : createdAt;
        return {
            schemaVersion: 1,
            id: obj.id,
            name: obj.name.trim(),
            createdAt,
            updatedAt,
            skillId: typeof obj.skillId === 'string' ? obj.skillId : null,
            designSystemId: typeof obj.designSystemId === 'string' ? obj.designSystemId : null,
        };
    }
    catch (err) {
        const e = err;
        if (e.code === 'ENOENT' || e.name === 'SyntaxError')
            return null;
        throw err;
    }
}
export async function scanProjectLocation(location) {
    const entries = await readdir(location.path, { withFileTypes: true });
    const found = [];
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        let dir;
        try {
            dir = await canonicalLocationChildDir(location, entry.name);
        }
        catch {
            continue;
        }
        const manifest = await readProjectManifest(dir);
        if (manifest)
            found.push({ dir, manifest });
    }
    return found;
}
//# sourceMappingURL=project-locations.js.map