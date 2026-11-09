import { randomUUID } from 'node:crypto';
import { renameSync } from 'node:fs';
import { lstat, mkdir, open, readFile, readdir, realpath, rename, rm, writeFile, } from 'node:fs/promises';
import path from 'node:path';
function identityOf(value) {
    return { dev: String(value.dev), ino: String(value.ino) };
}
function sameIdentity(expected, actual) {
    return Boolean(expected &&
        expected.dev === String(actual.dev) &&
        expected.ino === String(actual.ino));
}
async function exists(target) {
    try {
        await lstat(target);
        return true;
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return false;
        throw error;
    }
}
async function inspectOwnedDirectory(target, expected, label) {
    const info = await lstat(target);
    if (info.isSymbolicLink() ||
        !info.isDirectory() ||
        !sameIdentity(expected, info)) {
        throw new Error(`${label} identity changed; refusing mutation`);
    }
    return info;
}
async function removeOwnedDirectory(target, expected) {
    if (!(await exists(target)))
        return;
    await inspectOwnedDirectory(target, expected, 'promotion-owned directory');
    const quarantine = `${target}.cleanup-${process.pid}-${randomUUID()}`;
    await rename(target, quarantine);
    const moved = await lstat(quarantine);
    if (!sameIdentity(expected, moved)) {
        try {
            await rename(quarantine, target);
        }
        catch {
            // Preserve the unexpected directory at quarantine if restoration races.
        }
        throw new Error('promotion-owned directory identity changed during cleanup');
    }
    await rm(quarantine, { recursive: true, force: false });
}
async function defaultSyncDirectory(directory) {
    const handle = await open(directory, 'r');
    try {
        await handle.sync();
    }
    finally {
        await handle.close();
    }
}
function directorySync(durability) {
    return durability?.syncDirectory ?? defaultSyncDirectory;
}
async function syncFile(filePath) {
    const handle = await open(filePath, 'r');
    try {
        await handle.sync();
    }
    finally {
        await handle.close();
    }
}
async function writeJournal(journalPath, record, syncDirectory) {
    const journalDir = path.dirname(journalPath);
    const journalDirExisted = await exists(journalDir);
    await mkdir(journalDir, { recursive: true });
    if (!journalDirExisted) {
        // Persist the directory entry itself before relying on fsyncs of files
        // contained by a newly-created journal directory.
        await syncDirectory(path.dirname(journalDir));
    }
    const tempPath = `${journalPath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(record, null, 2)}\n`, {
        encoding: 'utf8',
        mode: 0o600,
    });
    await syncFile(tempPath);
    await rename(tempPath, journalPath);
    await syncDirectory(journalDir);
}
async function removeJournal(journalPath, syncDirectory) {
    await rm(journalPath, { force: true });
    await syncDirectory(path.dirname(journalPath));
}
function expectedStagePrefix(liveDir) {
    return `.${path.basename(liveDir)}.od-pull-stage-`;
}
function expectedRecoveryPrefix(liveDir) {
    return `.${path.basename(liveDir)}.od-pull-recovery-`;
}
async function validatePromotionPaths(input) {
    const liveDir = path.resolve(input.liveDir);
    const stageDir = path.resolve(input.stageDir);
    if (!path.isAbsolute(input.liveDir) || !path.isAbsolute(input.stageDir)) {
        throw new Error('team mirror promotion paths must be absolute');
    }
    if (path.dirname(liveDir) !== path.dirname(stageDir)) {
        throw new Error('team mirror stage must be on the live directory filesystem');
    }
    if (!path.basename(stageDir).startsWith(expectedStagePrefix(liveDir))) {
        throw new Error('team mirror stage has an invalid name');
    }
    if (input.recoveryDir) {
        const recoveryDir = path.resolve(input.recoveryDir);
        if (path.dirname(recoveryDir) !== path.dirname(liveDir)) {
            throw new Error('team mirror recovery must be beside the live directory');
        }
        const expectedName = input.id
            ? `${expectedRecoveryPrefix(liveDir)}${input.id}`
            : expectedRecoveryPrefix(liveDir);
        if (input.id
            ? path.basename(recoveryDir) !== expectedName
            : !path.basename(recoveryDir).startsWith(expectedName)) {
            throw new Error('team mirror recovery has an invalid name');
        }
    }
    if (input.allowedProjectsRoot) {
        const [root, parent] = await Promise.all([
            realpath(input.allowedProjectsRoot),
            realpath(path.dirname(liveDir)),
        ]);
        if (parent !== root) {
            throw new Error('team mirror journal points outside the projects root');
        }
    }
}
async function rollbackPromotion(record, journalPath, syncDirectory) {
    const projectParent = path.dirname(record.liveDir);
    const recoveryExists = await exists(record.recoveryDir);
    if (recoveryExists) {
        await inspectOwnedDirectory(record.recoveryDir, record.recoveryIdentity, 'team mirror recovery');
        if (await exists(record.liveDir)) {
            // Once a stage was promoted, only its exact persisted inode may be
            // removed. An unexpected live tree belongs to the caller and is retained.
            await removeOwnedDirectory(record.liveDir, record.promotedIdentity);
            await syncDirectory(projectParent);
        }
        await rename(record.recoveryDir, record.liveDir);
        await syncDirectory(projectParent);
    }
    else if (!record.liveExisted &&
        await exists(record.liveDir)) {
        // `stage -> live` may reach disk before the following promoted-journal
        // rewrite. The inode is the durable truth; phase can still be `prepared`.
        await removeOwnedDirectory(record.liveDir, record.promotedIdentity);
        await syncDirectory(projectParent);
    }
    if (await exists(record.stageDir)) {
        await removeOwnedDirectory(record.stageDir, record.promotedIdentity);
        await syncDirectory(projectParent);
    }
    await removeJournal(journalPath, syncDirectory);
}
export async function promoteAuthorizedTeamProjectStage(input) {
    const liveDir = path.resolve(input.liveDir);
    const stageDir = path.resolve(input.stageDir);
    await validatePromotionPaths({ liveDir, stageDir });
    await inspectOwnedDirectory(stageDir, input.expectedStageIdentity, 'team mirror stage');
    const scopeStillAuthorized = () => {
        if (input.isScopeStillAuthorized) {
            return input.isScopeStillAuthorized();
        }
        if (!input.getActiveWorkspaceSnapshot ||
            input.expectedWorkspaceId == null ||
            input.activeWorkspaceGeneration == null) {
            return false;
        }
        const snapshot = input.getActiveWorkspaceSnapshot();
        return (snapshot.workspaceId === input.expectedWorkspaceId &&
            snapshot.generation === input.activeWorkspaceGeneration);
    };
    if (!scopeStillAuthorized()) {
        await removeOwnedDirectory(stageDir, input.expectedStageIdentity);
        throw new Error(input.isScopeStillAuthorized
            ? 'team mirror workspace scope changed while the project was staged'
            : 'active workspace changed while the team mirror was staged');
    }
    if (!input.isExpectedVersion()) {
        await removeOwnedDirectory(stageDir, input.expectedStageIdentity);
        throw new Error('stale team mirror stage version');
    }
    const id = randomUUID();
    const journalPath = path.join(input.journalDir, `${id}.json`);
    const recoveryDir = path.join(path.dirname(liveDir), `${expectedRecoveryPrefix(liveDir)}${id}`);
    const syncDirectory = directorySync(input.durability);
    const renameDirectorySync = input.durability?.renameDirectorySync ?? renameSync;
    const liveExisted = await exists(liveDir);
    let originalLiveIdentity;
    if (liveExisted) {
        const live = await lstat(liveDir);
        if (live.isSymbolicLink() || !live.isDirectory()) {
            throw new Error('live team mirror must be a real directory');
        }
        originalLiveIdentity = identityOf(live);
    }
    const record = {
        schemaVersion: 1,
        id,
        receipt: input.receipt,
        liveDir,
        stageDir,
        recoveryDir,
        liveExisted,
        phase: 'prepared',
        promotedIdentity: input.expectedStageIdentity,
        ...(originalLiveIdentity
            ? { recoveryIdentity: originalLiveIdentity }
            : {}),
    };
    await writeJournal(journalPath, record, syncDirectory);
    try {
        if (liveExisted) {
            await inspectOwnedDirectory(liveDir, originalLiveIdentity, 'live team mirror');
            await inspectOwnedDirectory(stageDir, input.expectedStageIdentity, 'team mirror stage');
            // A pair of awaited renames leaves a JavaScript-observable ENOENT
            // window at `liveDir`; durability work between them made that window
            // last seconds on a busy disk. Keep the two same-filesystem namespace
            // mutations in one synchronous critical section so daemon readers can
            // observe either the complete old tree or the complete promoted tree,
            // never an absent path. The already-durable `prepared` journal covers
            // a process crash after either syscall.
            renameDirectorySync(liveDir, recoveryDir);
            try {
                renameDirectorySync(stageDir, liveDir);
            }
            catch (error) {
                try {
                    renameDirectorySync(recoveryDir, liveDir);
                }
                catch (restoreError) {
                    throw new AggregateError([error, restoreError], 'team mirror swap failed and immediate live recovery failed');
                }
                throw error;
            }
            const recovery = await inspectOwnedDirectory(recoveryDir, originalLiveIdentity, 'team mirror recovery');
            if (!sameIdentity(record.recoveryIdentity, recovery)) {
                throw new Error('team mirror recovery identity changed after live move');
            }
        }
        else {
            await inspectOwnedDirectory(stageDir, input.expectedStageIdentity, 'team mirror stage');
            await rename(stageDir, liveDir);
        }
        await inspectOwnedDirectory(liveDir, input.expectedStageIdentity, 'promoted team mirror');
        record.phase = 'promoted';
        await syncDirectory(path.dirname(liveDir));
        await writeJournal(journalPath, record, syncDirectory);
        // No await may be introduced between these final local guards and the
        // synchronous SQLite transaction.
        if (!scopeStillAuthorized() ||
            !input.isExpectedVersion()) {
            throw new Error('team mirror promotion became stale');
        }
        input.validateReceipt();
        const result = input.commit();
        try {
            if (await exists(recoveryDir)) {
                // This barrier also gives post-commit cleanup failures a safe boundary:
                // the committed promoted tree and journal remain recoverable, and the
                // old recovery tree has not been touched yet.
                await syncDirectory(path.dirname(liveDir));
                await removeOwnedDirectory(recoveryDir, record.recoveryIdentity);
                await syncDirectory(path.dirname(liveDir));
            }
            await removeJournal(journalPath, syncDirectory);
        }
        catch (error) {
            // Cleanup is maintenance after the durable SQLite+live commit boundary.
            // Report it for observability, retain the journal for startup recovery,
            // and still return the committed result so callers advance their cursor.
            try {
                input.onPostCommitCleanupError?.(error);
            }
            catch {
                // Observer failures cannot turn a committed materialization into a
                // failed pull or make it eligible for rollback.
            }
        }
        return result;
    }
    catch (error) {
        try {
            await rollbackPromotion(record, journalPath, syncDirectory);
        }
        catch (rollbackError) {
            throw new AggregateError([error, rollbackError], `team mirror promotion failed and old tree recovery was retained at ${recoveryDir}`);
        }
        throw error;
    }
}
function parseIdentity(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return undefined;
    const identity = value;
    return typeof identity.dev === 'string' && typeof identity.ino === 'string'
        ? { dev: identity.dev, ino: identity.ino }
        : undefined;
}
function parseReceipt(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const receipt = value;
    return receipt.schemaVersion === 1 &&
        typeof receipt.workspaceId === 'string' &&
        typeof receipt.resourceTeamId === 'string' &&
        typeof receipt.viewerMemberId === 'string' &&
        typeof receipt.ownerMemberId === 'string' &&
        typeof receipt.projectId === 'string' &&
        typeof receipt.resourceId === 'string' &&
        receipt.ref === 'published' &&
        Number.isSafeInteger(receipt.version) &&
        typeof receipt.versionId === 'string' &&
        typeof receipt.manifestDigest === 'string' &&
        receipt.lifecycleState === 'active' &&
        typeof receipt.authorizedAt === 'string' &&
        typeof receipt.expiresAt === 'string'
        ? receipt
        : null;
}
function parseJournal(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const record = value;
    const receipt = parseReceipt(record.receipt);
    const promotedIdentity = parseIdentity(record.promotedIdentity);
    const recoveryIdentity = parseIdentity(record.recoveryIdentity);
    if (record.schemaVersion !== 1 ||
        typeof record.id !== 'string' ||
        !receipt ||
        typeof record.liveDir !== 'string' ||
        typeof record.stageDir !== 'string' ||
        typeof record.recoveryDir !== 'string' ||
        typeof record.liveExisted !== 'boolean' ||
        !promotedIdentity ||
        (record.phase !== 'prepared' &&
            record.phase !== 'live-moved' &&
            record.phase !== 'promoted') ||
        (record.liveExisted && !recoveryIdentity)) {
        return null;
    }
    return {
        schemaVersion: 1,
        id: record.id,
        receipt,
        liveDir: record.liveDir,
        stageDir: record.stageDir,
        recoveryDir: record.recoveryDir,
        liveExisted: record.liveExisted,
        phase: record.phase,
        promotedIdentity,
        ...(recoveryIdentity ? { recoveryIdentity } : {}),
    };
}
export async function recoverAuthorizedTeamProjectPromotions(input) {
    let entries;
    try {
        entries = await readdir(input.journalDir);
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return;
        throw error;
    }
    const syncDirectory = directorySync(input.durability);
    for (const name of entries.filter((entry) => entry.endsWith('.json'))) {
        const journalPath = path.join(input.journalDir, name);
        try {
            const record = parseJournal(JSON.parse(await readFile(journalPath, 'utf8')));
            if (!record) {
                throw new Error(`invalid team mirror promotion journal: ${journalPath}`);
            }
            await validatePromotionPaths({
                liveDir: record.liveDir,
                stageDir: record.stageDir,
                recoveryDir: record.recoveryDir,
                id: record.id,
                allowedProjectsRoot: input.allowedProjectsRoot,
            });
            if (input.isCommitted(record)) {
                await inspectOwnedDirectory(record.liveDir, record.promotedIdentity, 'committed team mirror');
                if (await exists(record.recoveryDir)) {
                    await removeOwnedDirectory(record.recoveryDir, record.recoveryIdentity);
                    await syncDirectory(path.dirname(record.liveDir));
                }
                if (await exists(record.stageDir)) {
                    await removeOwnedDirectory(record.stageDir, record.promotedIdentity);
                    await syncDirectory(path.dirname(record.liveDir));
                }
                await removeJournal(journalPath, syncDirectory);
                continue;
            }
            if (input.isSuperseded?.(record)) {
                // A newer authorized receipt/live tree owns `liveDir`. Only remove
                // paths whose exact inodes belong to this older journal.
                if (await exists(record.recoveryDir)) {
                    await removeOwnedDirectory(record.recoveryDir, record.recoveryIdentity);
                    await syncDirectory(path.dirname(record.liveDir));
                }
                if (await exists(record.stageDir)) {
                    await removeOwnedDirectory(record.stageDir, record.promotedIdentity);
                    await syncDirectory(path.dirname(record.liveDir));
                }
                await removeJournal(journalPath, syncDirectory);
                continue;
            }
            await rollbackPromotion(record, journalPath, syncDirectory);
        }
        catch (error) {
            if (!input.onError)
                throw error;
            input.onError(error);
        }
    }
}
//# sourceMappingURL=team-mirror-promotion.js.map