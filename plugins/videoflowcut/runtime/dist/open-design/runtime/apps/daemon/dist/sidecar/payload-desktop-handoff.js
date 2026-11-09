import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { LAUNCHER_SCHEMA_VERSION, buildLauncherAfterQuitArgs, buildLauncherHandoffResumeArgs, normalizeLauncherVersion, resolveLauncherPaths, resolveLauncherVersionPaths, validateLauncherAttemptDescriptor, validateLauncherDesktopHandoffDescriptor, validateLauncherRuntimeDescriptor, } from "@open-design/launcher-proto";
import { releaseChannelFromNamespace, releaseChannelFromVersion } from "@open-design/release";
import { spawnSidecar } from "@open-design/sidecar";
import { APP_KEYS, SIDECAR_ENV, SIDECAR_MODES, SIDECAR_SOURCES, } from "@open-design/sidecar-proto";
import { holdParentMonitorExit } from "./parent-monitor-gate.js";
const HANDOFF_CONFIRM_TIMEOUT_MS = 60_000;
const HANDOFF_POLL_INTERVAL_MS = 100;
const HANDOFF_PAYLOAD_WAIT_TIMEOUT_MS = 60_000;
const PACKAGED_NAMESPACE_BASE_ROOT_ENV = "OD_PACKAGED_NAMESPACE_BASE_ROOT";
const SIDECAR_ONLY_ENV_KEYS = [
    "ELECTRON_RUN_AS_NODE",
    "OD_SIDECAR_BASE",
    "OD_SIDECAR_IPC_PATH",
    "OD_SIDECAR_NAMESPACE",
    "OD_SIDECAR_SOURCE",
    // Share Viewer debug override the packaged launcher forwarded to this
    // daemon. The replacement desktop forwards its own launch override, if any;
    // carrying this one over would make a one-off override sticky.
    "OD_SHARE_VIEWER_URL",
    "OD_SHARE_VIEWER_URLS",
    SIDECAR_ENV.TOOLS_DEV_PARENT_PID,
];
async function readJsonFile(filePath) {
    try {
        return JSON.parse(await readFile(filePath, "utf8"));
    }
    catch (error) {
        if (error.code === "ENOENT" || error instanceof SyntaxError)
            return null;
        throw error;
    }
}
async function writeJsonFile(filePath, value) {
    await mkdir(dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temporaryPath, filePath);
}
function samePointer(left, right) {
    return left != null && right != null &&
        left.generation === right.generation &&
        left.version === right.version;
}
async function canonicalPath(value) {
    return await realpath(value).catch(() => resolve(value));
}
async function samePath(left, right, platform) {
    const [normalizedLeft, normalizedRight] = await Promise.all([
        canonicalPath(left),
        canonicalPath(right),
    ]);
    return platform === "win32"
        ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
        : normalizedLeft === normalizedRight;
}
function containsPath(root, target) {
    const normalizedRoot = resolve(root);
    const normalizedTarget = resolve(target);
    return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${sep}`);
}
function desktopProcessEnv(env, runtimeRoot) {
    const desktopEnv = {
        ...env,
        [PACKAGED_NAMESPACE_BASE_ROOT_ENV]: dirname(dirname(runtimeRoot)),
    };
    for (const key of SIDECAR_ONLY_ENV_KEYS)
        delete desktopEnv[key];
    return desktopEnv;
}
async function resolvePayloadExecutable(options) {
    const versionPaths = resolveLauncherVersionPaths({
        channel: options.launcherPaths.channel,
        namespace: options.namespace,
        root: options.launcherPaths.root,
        version: options.appVersion,
    });
    const manifest = await readJsonFile(versionPaths.manifestPath);
    if (manifest == null ||
        manifest.schemaVersion !== LAUNCHER_SCHEMA_VERSION ||
        manifest.channel !== options.launcherPaths.channel ||
        manifest.namespace !== options.namespace ||
        manifest.version !== options.appVersion ||
        manifest.platform !== options.platform ||
        typeof manifest.entry?.executable !== "string")
        return null;
    const executablePath = resolve(versionPaths.versionRoot, manifest.entry.executable);
    if (!containsPath(versionPaths.versionRoot, executablePath))
        return null;
    const entry = await lstat(executablePath).catch(() => null);
    return entry != null && entry.isFile() && !entry.isSymbolicLink()
        ? executablePath
        : null;
}
async function readRuntime(launcherPaths) {
    const value = await readJsonFile(launcherPaths.runtimePath);
    if (value == null)
        return null;
    try {
        return validateLauncherRuntimeDescriptor(value, launcherPaths);
    }
    catch {
        return null;
    }
}
async function readAttempt(launcherPaths) {
    const value = await readJsonFile(launcherPaths.attemptsPath);
    if (value == null)
        return null;
    try {
        return validateLauncherAttemptDescriptor(value, launcherPaths);
    }
    catch {
        return null;
    }
}
async function resolveInstalledOuterIdentity(options) {
    if (!Number.isSafeInteger(options.outerPid) || options.outerPid <= 0)
        return null;
    const install = await readJsonFile(options.launcherPaths.installPath);
    if (install == null ||
        install.schemaVersion !== LAUNCHER_SCHEMA_VERSION ||
        install.channel !== options.launcherPaths.channel ||
        install.namespace !== options.launcherPaths.namespace ||
        typeof install.launchPath !== "string" ||
        !isAbsolute(install.launchPath))
        return null;
    const executablePath = options.platform === "darwin" && install.launchPath.endsWith(".app")
        ? await resolveMacBundleExecutable(install.launchPath)
        : install.launchPath;
    if (executablePath == null)
        return null;
    const entry = await lstat(executablePath).catch(() => null);
    if (entry == null || !entry.isFile() || entry.isSymbolicLink())
        return null;
    return { executablePath, pid: options.outerPid };
}
async function resolveMacBundleExecutable(bundlePath) {
    const executableRoot = join(bundlePath, "Contents", "MacOS");
    const entries = await readdir(executableRoot, { withFileTypes: true }).catch(() => []);
    const executables = entries.filter((entry) => entry.isFile() && !entry.isSymbolicLink());
    const executable = executables.length === 1 ? executables[0] : null;
    return executable == null ? null : join(executableRoot, executable.name);
}
export async function prepareLegacyPayloadDesktopHandoff(options) {
    if (options.source !== SIDECAR_SOURCES.PACKAGED &&
        options.source !== SIDECAR_SOURCES.TOOLS_PACK) {
        return { kind: "none", reason: "not-packaged" };
    }
    const platform = options.platform ?? process.platform;
    if (platform !== "darwin" && platform !== "win32") {
        return { kind: "none", reason: "unsupported-platform" };
    }
    const env = options.env ?? process.env;
    const installationRoot = env.OD_INSTALLATION_DIR;
    const rawAppVersion = env.OD_APP_VERSION;
    if (installationRoot == null ||
        !isAbsolute(installationRoot) ||
        rawAppVersion == null)
        return { kind: "none", reason: "missing-environment" };
    let appVersion;
    try {
        appVersion = normalizeLauncherVersion(rawAppVersion);
    }
    catch {
        return { kind: "none", reason: "invalid-launcher-state" };
    }
    const channel = releaseChannelFromVersion(appVersion)
        ?? releaseChannelFromNamespace(options.namespace, "default")
        ?? "stable";
    const launcherPaths = resolveLauncherPaths({
        channel,
        namespace: options.namespace,
        root: installationRoot,
    });
    const [runtime, attempt, outer, payloadExecutablePath, desktopStatus] = await Promise.all([
        readRuntime(launcherPaths),
        readAttempt(launcherPaths),
        resolveInstalledOuterIdentity({
            launcherPaths,
            outerPid: options.outerPid ?? 0,
            platform,
        }),
        resolvePayloadExecutable({
            appVersion,
            launcherPaths,
            namespace: options.namespace,
            platform,
        }),
        options.requestDesktopStatus?.().catch(() => null) ?? null,
    ]);
    if (runtime == null)
        return { kind: "none", reason: "invalid-runtime" };
    if (outer == null)
        return { kind: "none", reason: "invalid-install-anchor" };
    if (payloadExecutablePath != null && desktopStatus != null && desktopStatus.pid === outer.pid &&
        typeof desktopStatus.executablePath === "string" &&
        await samePath(desktopStatus.executablePath, payloadExecutablePath, platform)) {
        return { kind: "none", reason: "payload-desktop-active" };
    }
    if (desktopStatus != null && (desktopStatus.pid !== outer.pid ||
        typeof desktopStatus.executablePath !== "string" ||
        !(await samePath(desktopStatus.executablePath, outer.executablePath, platform))))
        return { kind: "none", reason: "desktop-identity-mismatch" };
    const existingRaw = await readJsonFile(launcherPaths.handoffPath);
    const existing = existingRaw == null
        ? null
        : (() => {
            try {
                return validateLauncherDesktopHandoffDescriptor(existingRaw, launcherPaths);
            }
            catch {
                return null;
            }
        })();
    if (existing?.state === "armed")
        return { kind: "none", reason: "already-armed" };
    const initialSource = runtime.active;
    const initialPrevious = runtime.lastSuccessful;
    const canCaptureInitialState = initialSource?.version === appVersion &&
        initialPrevious != null &&
        !samePointer(initialSource, initialPrevious) &&
        samePointer(attempt, initialSource);
    const canCaptureConfirmedBinding = existing?.state === "confirmed" &&
        existing.target != null &&
        initialSource?.version === appVersion &&
        samePointer(existing.source, existing.target) &&
        samePointer(existing.target, initialSource) &&
        samePointer(initialPrevious, initialSource);
    const canResumePreparedState = existing?.state === "prepared" &&
        existing.source.version === appVersion &&
        samePointer(runtime.active, existing.source) &&
        (samePointer(runtime.lastSuccessful, existing.previous) ||
            samePointer(runtime.lastSuccessful, existing.source));
    if (!canCaptureInitialState && !canCaptureConfirmedBinding && !canResumePreparedState) {
        return { kind: "none", reason: "launcher-state-not-eligible" };
    }
    if (payloadExecutablePath == null)
        return { kind: "none", reason: "invalid-payload" };
    const now = (options.now ?? (() => new Date()))().toISOString();
    const descriptor = canResumePreparedState && existing != null
        ? {
            ...existing,
            outer,
            payloadExecutablePath,
            updatedAt: now,
        }
        : {
            channel,
            createdAt: now,
            handoffId: (options.randomId ?? randomUUID)(),
            namespace: options.namespace,
            outer,
            payloadExecutablePath,
            previous: canCaptureConfirmedBinding && existing != null
                ? existing.previous
                : initialPrevious,
            schemaVersion: LAUNCHER_SCHEMA_VERSION,
            source: initialSource,
            state: "prepared",
            updatedAt: now,
        };
    await writeJsonFile(launcherPaths.handoffPath, descriptor);
    return {
        dataRoot: options.dataRoot,
        descriptor,
        kind: "prepared",
        launcherPaths,
        runtimeRoot: options.runtimeRoot,
        source: options.source,
    };
}
async function waitForOuterConfirm(prepared, options) {
    const deadline = Date.now() + options.confirmTimeoutMs;
    while (Date.now() < deadline) {
        const [runtime, attempt, status] = await Promise.all([
            readRuntime(prepared.launcherPaths),
            readAttempt(prepared.launcherPaths),
            options.requestDesktop("status").catch(() => null),
        ]);
        if (status?.pid === prepared.descriptor.outer.pid &&
            typeof status.executablePath === "string" &&
            await samePath(status.executablePath, prepared.descriptor.payloadExecutablePath, process.platform))
            return "payload-desktop-active";
        if (runtime != null &&
            attempt == null &&
            samePointer(runtime.active, prepared.descriptor.source) &&
            samePointer(runtime.lastSuccessful, prepared.descriptor.source) &&
            status?.state === "running" &&
            status.pid === prepared.descriptor.outer.pid &&
            typeof status.executablePath === "string" &&
            await samePath(status.executablePath, prepared.descriptor.outer.executablePath, process.platform))
            return "confirmed";
        await options.sleep(HANDOFF_POLL_INTERVAL_MS);
    }
    return "outer-not-confirmed";
}
export async function executeLegacyPayloadDesktopHandoff(prepared, options = {}) {
    if (options.requestDesktop == null)
        throw new Error("desktop sidecar client is required");
    const requestDesktop = options.requestDesktop;
    const confirmation = await waitForOuterConfirm(prepared, {
        confirmTimeoutMs: options.confirmTimeoutMs ?? HANDOFF_CONFIRM_TIMEOUT_MS,
        requestDesktop,
        sleep: options.sleep ?? (async (durationMs) => await sleep(durationMs)),
    });
    if (confirmation === "payload-desktop-active") {
        await rm(prepared.launcherPaths.handoffPath, { force: true });
        return { kind: "aborted", reason: confirmation };
    }
    if (confirmation === "outer-not-confirmed")
        return { kind: "aborted", reason: confirmation };
    const now = (options.now ?? (() => new Date()))().toISOString();
    const target = {
        generation: Math.max(prepared.descriptor.source.generation, prepared.descriptor.previous.generation) + 1,
        version: prepared.descriptor.source.version,
    };
    const armed = {
        ...prepared.descriptor,
        state: "armed",
        target,
        updatedAt: now,
    };
    const attempt = {
        channel: prepared.launcherPaths.channel,
        generation: target.generation,
        namespace: prepared.launcherPaths.namespace,
        schemaVersion: LAUNCHER_SCHEMA_VERSION,
        startedAt: now,
        version: target.version,
    };
    const runtime = {
        active: target,
        channel: prepared.launcherPaths.channel,
        lastSuccessful: prepared.descriptor.previous,
        namespace: prepared.launcherPaths.namespace,
        schemaVersion: LAUNCHER_SCHEMA_VERSION,
        updatedAt: now,
    };
    const desktopStamp = {
        app: APP_KEYS.DESKTOP,
        channel: prepared.launcherPaths.channel,
        mode: SIDECAR_MODES.RUNTIME,
        namespace: prepared.descriptor.namespace,
        source: prepared.source,
    };
    const args = [
        ...buildLauncherAfterQuitArgs({
            targetPid: prepared.descriptor.outer.pid,
            timeoutMs: HANDOFF_PAYLOAD_WAIT_TIMEOUT_MS,
        }),
        ...buildLauncherHandoffResumeArgs({ handoffId: prepared.descriptor.handoffId }),
    ];
    const persist = options.writeJsonFile ?? writeJsonFile;
    const releaseParentMonitor = holdParentMonitorExit();
    try {
        let generation;
        try {
            generation = await (options.spawn ?? spawnSidecar)({
                args,
                command: prepared.descriptor.payloadExecutablePath,
                cwd: dirname(prepared.descriptor.payloadExecutablePath),
                env: desktopProcessEnv(options.env ?? process.env, prepared.runtimeRoot),
                logFd: null,
                resources: {
                    dataRoot: prepared.dataRoot,
                    ownerPid: null,
                    port: 0,
                    runtimeRoot: prepared.runtimeRoot,
                },
                stamp: desktopStamp,
            });
        }
        catch {
            return { kind: "aborted", reason: "spawn-failed" };
        }
        try {
            await requestDesktop("shutdown");
        }
        catch {
            const cleanup = await generation.stop({ termGraceMs: 0 });
            if (cleanup.remainingPids.length > 0) {
                throw new Error(`payload desktop handoff rollback left generation: ${cleanup.remainingPids.join(", ")}`);
            }
            return { kind: "aborted", reason: "shutdown-failed" };
        }
        // Commit the armed journal and rewritten runtime/attempt state only after both
        // the payload child has actually spawned and the old desktop has accepted the
        // shutdown. Writing earlier would strand an "armed" journal on disk when
        // `spawn()` throws or the shutdown request fails: the next cold start bails out
        // of prepareLegacyPayloadDesktopHandoff() with reason "already-armed" and the
        // install stays pinned to the old desktop generation. The old desktop is still
        // alive while it acks the shutdown, and the payload waits for its pid to exit
        // before resuming, so these writes still land before the payload reads them.
        await persist(prepared.launcherPaths.handoffPath, armed);
        await persist(prepared.launcherPaths.attemptsPath, attempt);
        await persist(prepared.launcherPaths.runtimePath, runtime);
        return { kind: "scheduled", target };
    }
    finally {
        releaseParentMonitor();
    }
}
//# sourceMappingURL=payload-desktop-handoff.js.map