import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readProjectFile, resolveProjectWritePath } from '../projects.js';
import { AUTHORED_MOTION_MANIFEST_CONTRACT, parseAuthoredMotionManifest, validateAuthoredMotionSource } from './authored-motion-manifest-v1.js';
const sha = (data) => createHash('sha256').update(data).digest('hex');
/** 与 VFC 相同的字段顺序：源码和清单的内容身份及字节数。 */
export const frozenMotionBundleHash = (source, manifest) => sha(JSON.stringify({ source: { sha256: source.sha256, bytes: source.bytes }, manifest: { sha256: manifest.sha256, bytes: manifest.bytes } }));
const part = (data) => ({ sha256: sha(data), bytes: data.length });
const safeRun = (value) => /^[A-Za-z0-9_-]{1,160}$/u.test(value);
const versionDir = (dataRoot, runId, version) => {
    if (!safeRun(runId) || !/^[a-f0-9]{64}$/u.test(version))
        throw new Error('MOTION_FROZEN_ID_INVALID');
    return path.join(dataRoot, 'runs', runId, 'frozen-motion', version);
};
/** 从已原子发布的回执发现阶段作品，不读取或复制源码。 */
export async function listFrozenWorks(dataRoot, project, runId) {
    if (!safeRun(runId))
        throw new Error('MOTION_FROZEN_ID_INVALID');
    const parent = path.join(dataRoot, 'runs', runId, 'frozen-motion');
    const entries = await readdir(parent).catch(error => {
        if (error.code === 'ENOENT')
            return [];
        throw error;
    });
    return Promise.all(entries.filter(value => /^[a-f0-9]{64}$/u.test(value)).sort().map(async (bundle) => {
        const receipt = JSON.parse(await readFile(path.join(parent, bundle, 'receipt.json'), 'utf8'));
        if (receipt.project !== project || receipt.run_id !== runId || receipt.bundle_sha256 !== bundle || receipt.frozen_version !== `${runId}_${bundle}`)
            throw new Error('MOTION_FROZEN_CORRUPT');
        return receipt;
    }));
}
function checkManifest(data, source) {
    const manifest = parseAuthoredMotionManifest(JSON.parse(data.toString('utf8')));
    if (manifest.sourceSha256 !== sha(source))
        throw new Error('MOTION_MANIFEST_INVALID: sourceSha256 与源码不一致');
    validateAuthoredMotionSource(source.toString('utf8'), manifest.work);
    return manifest;
}
/** 作者显式交件时才配对源码与清单；冻结阶段不得重新配对。 */
export async function prepareAuthoredWorkSubmission(projectsRoot, projectId, sourcePath, manifestPath, metadata) {
    const source = (await readProjectFile(projectsRoot, projectId, sourcePath, metadata)).buffer;
    const old = JSON.parse((await readProjectFile(projectsRoot, projectId, manifestPath, metadata)).buffer.toString('utf8'));
    // 相同作者交件重试必须返回同一身份，不能生成第二个随机提交。
    const { authorSubmissionId: _id, sourceSha256: _sha, ...authored } = old;
    const sourceSha256 = sha(source), declared = { ...authored, sourceFile: sourcePath };
    const manifest = { ...declared, authorSubmissionId: sha(JSON.stringify({ sourceSha256, manifest: declared })), sourceSha256 };
    const bytes = Buffer.from(JSON.stringify(manifest, null, 2));
    checkManifest(bytes, source);
    const target = await resolveProjectWritePath(projectsRoot, projectId, manifestPath, metadata);
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporary, bytes, { flag: 'wx' });
        await rename(temporary, target);
    }
    finally {
        await rm(temporary, { force: true });
    }
    return { authorSubmissionId: manifest.authorSubmissionId, contract_version: AUTHORED_MOTION_MANIFEST_CONTRACT, source_sha256: sha(source), manifest_sha256: sha(bytes) };
}
export async function freezeProjectWork(input) {
    if (!safeRun(input.runId))
        throw new Error('MOTION_FROZEN_ID_INVALID');
    // 回执丢失后从同一 Run 的已发布目录对账，不读取后来改变的工作文件。
    const parent = path.join(input.dataRoot, 'runs', input.runId, 'frozen-motion');
    const versions = await readdir(parent).catch(error => { if (error.code === 'ENOENT')
        return []; throw error; });
    for (const version of versions.filter(value => /^[a-f0-9]{64}$/u.test(value))) {
        const receipt = JSON.parse(await readFile(path.join(parent, version, 'receipt.json'), 'utf8'));
        if (receipt.project === input.project && receipt.run_id === input.runId && receipt.source.sha256 === input.sourceSha256 && receipt.manifest.sha256 === input.manifestSha256)
            return (await readFrozenWork(input.dataRoot, input.project, receipt.frozen_version)).receipt;
    }
    await input.assertSource?.();
    const source = (await readProjectFile(input.projectsRoot, input.project, input.sourcePath, input.metadata)).buffer;
    const manifest = (await readProjectFile(input.projectsRoot, input.project, input.manifestPath, input.metadata)).buffer;
    if (sha(source) !== input.sourceSha256 || sha(manifest) !== input.manifestSha256)
        throw new Error('MOTION_SUBMISSION_CHANGED');
    const declaration = checkManifest(manifest, source);
    if (declaration.sourceFile !== input.sourcePath)
        throw new Error('MOTION_SOURCE_PATH_MISMATCH');
    const sourcePart = part(source), manifestPart = part(manifest), bundle = frozenMotionBundleHash(sourcePart, manifestPart);
    const version = `${input.runId}_${bundle}`;
    const receipt = { project: input.project, run_id: input.runId, frozen_version: version, bundle_sha256: bundle, source: sourcePart, manifest: manifestPart };
    const target = versionDir(input.dataRoot, input.runId, bundle);
    await mkdir(parent, { recursive: true });
    const temporary = await mkdtemp(path.join(parent, '.freeze-'));
    try {
        await writeFile(path.join(temporary, 'source.html'), source);
        await writeFile(path.join(temporary, 'manifest.json'), manifest);
        await writeFile(path.join(temporary, 'receipt.json'), JSON.stringify(receipt));
        try {
            await rename(temporary, target);
        }
        catch (error) {
            if (!['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error.code ?? ''))
                throw error;
            const existing = await readFrozenWork(input.dataRoot, input.project, version);
            if (JSON.stringify(existing.receipt) !== JSON.stringify(receipt) || existing.source_base64 !== source.toString('base64') || existing.manifest_base64 !== manifest.toString('base64'))
                throw new Error('MOTION_FROZEN_CONFLICT');
        }
    }
    finally {
        await rm(temporary, { recursive: true, force: true });
    }
    return receipt;
}
export async function readFrozenWork(dataRoot, project, version, options) {
    const separator = version.lastIndexOf('_'), runId = version.slice(0, separator), bundle = version.slice(separator + 1);
    const dir = versionDir(dataRoot, runId, bundle);
    const [source, manifest, receiptBytes] = await Promise.all([readFile(path.join(dir, 'source.html')), readFile(path.join(dir, 'manifest.json')), readFile(path.join(dir, 'receipt.json'))]);
    const receipt = JSON.parse(receiptBytes.toString('utf8'));
    if (receipt.project !== project || receipt.run_id !== runId || receipt.frozen_version !== version || receipt.bundle_sha256 !== bundle || sha(source) !== receipt.source.sha256 || source.length !== receipt.source.bytes || sha(manifest) !== receipt.manifest.sha256 || manifest.length !== receipt.manifest.bytes || frozenMotionBundleHash(receipt.source, receipt.manifest) !== bundle)
        throw new Error('MOTION_FROZEN_CORRUPT');
    if (!options?.identityOnly)
        checkManifest(manifest, source);
    return { receipt, source_base64: source.toString('base64'), manifest_base64: manifest.toString('base64') };
}
//# sourceMappingURL=frozen-motion-work.js.map