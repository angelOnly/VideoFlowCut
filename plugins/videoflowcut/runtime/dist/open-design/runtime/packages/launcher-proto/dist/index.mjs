// src/index.ts
import { isAbsolute, join, resolve, sep } from "node:path";
import { isReleaseChannel, RELEASE_CHANNELS } from "@open-design/release";
import { normalizeNamespace } from "@open-design/sidecar-proto";
var LAUNCHER_SCHEMA_VERSION = 1;
var LAUNCHER_AFTER_QUIT_FLAG = "--od-launcher-after-quit";
var LAUNCHER_AFTER_QUIT_TARGET_PID_ARG = "--od-launcher-target-pid";
var LAUNCHER_AFTER_QUIT_TIMEOUT_MS_ARG = "--od-launcher-timeout-ms";
var LAUNCHER_HANDOFF_RESUME_ARG = "--od-launcher-resume-handoff";
var LAUNCHER_DELEGATED_GENERATION_ARG = "--od-launcher-delegated-generation";
var LAUNCHER_DELEGATED_VERSION_ARG = "--od-launcher-delegated-version";
var LAUNCHER_CHANNELS = Object.freeze({
  BETA: RELEASE_CHANNELS.BETA,
  PRERELEASE: RELEASE_CHANNELS.PRERELEASE,
  STABLE: RELEASE_CHANNELS.STABLE
});
var LauncherProtocolError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "LauncherProtocolError";
  }
};
function numberPart(value) {
  return value != null && /^[0-9]+$/.test(value) ? Number(value) : 0;
}
function parseComparableLauncherVersion(value) {
  const cleaned = value.trim().replace(/^v/i, "").split("+", 1)[0] ?? "";
  const nightlyMatch = /^(\d+)\.(\d+)\.(\d+)\.nightly\.(\d+)$/i.exec(cleaned);
  if (nightlyMatch?.[1] != null && nightlyMatch[2] != null && nightlyMatch[3] != null && nightlyMatch[4] != null) {
    return {
      nums: [Number(nightlyMatch[1]), Number(nightlyMatch[2]), Number(nightlyMatch[3])],
      pre: ["nightly", nightlyMatch[4]]
    };
  }
  const prereleaseSeparator = cleaned.indexOf("-");
  const core = prereleaseSeparator === -1 ? cleaned : cleaned.slice(0, prereleaseSeparator);
  const prerelease = prereleaseSeparator === -1 ? "" : cleaned.slice(prereleaseSeparator + 1);
  const nums = core.split(".");
  return {
    nums: [numberPart(nums[0]), numberPart(nums[1]), numberPart(nums[2])],
    pre: prerelease.length === 0 ? [] : prerelease.split(".")
  };
}
function compareLauncherIdentifier(a, b) {
  const aNum = /^[0-9]+$/.test(a) ? Number(a) : null;
  const bNum = /^[0-9]+$/.test(b) ? Number(b) : null;
  if (aNum != null && bNum != null) return Math.sign(aNum - bNum);
  if (aNum != null) return -1;
  if (bNum != null) return 1;
  return a.localeCompare(b);
}
function compareLauncherVersions(a, b) {
  const left = parseComparableLauncherVersion(a);
  const right = parseComparableLauncherVersion(b);
  for (let index = 0; index < 3; index += 1) {
    const delta = (left.nums[index] ?? 0) - (right.nums[index] ?? 0);
    if (delta !== 0) return Math.sign(delta);
  }
  if (left.pre.length === 0 && right.pre.length === 0) return 0;
  if (left.pre.length === 0) return 1;
  if (right.pre.length === 0) return -1;
  const max = Math.max(left.pre.length, right.pre.length);
  for (let index = 0; index < max; index += 1) {
    const l = left.pre[index];
    const r = right.pre[index];
    if (l == null) return -1;
    if (r == null) return 1;
    const delta = compareLauncherIdentifier(l, r);
    if (delta !== 0) return delta;
  }
  return 0;
}
function normalizeLauncherChannel(value) {
  if (typeof value !== "string") throw new LauncherProtocolError("launcher channel must be a string");
  const channel = value.trim();
  if (channel !== value) throw new LauncherProtocolError("launcher channel must not contain leading or trailing whitespace");
  if (!isReleaseChannel(channel)) {
    throw new LauncherProtocolError(`unsupported launcher channel: ${value}`);
  }
  return channel;
}
function normalizeLauncherVersion(value) {
  if (typeof value !== "string") throw new LauncherProtocolError("launcher version must be a string");
  if (value.length === 0) throw new LauncherProtocolError("launcher version must not be empty");
  if (value !== value.trim()) throw new LauncherProtocolError("launcher version must not contain leading or trailing whitespace");
  if (value.includes("\0")) throw new LauncherProtocolError("launcher version must not contain null bytes");
  if (/[\\/]/.test(value)) throw new LauncherProtocolError(`launcher version must not contain path separators: ${value}`);
  if (value === "." || value === ".." || value.includes("..")) {
    throw new LauncherProtocolError(`launcher version must not contain relative path segments: ${value}`);
  }
  if (isAbsolute(value)) throw new LauncherProtocolError(`launcher version must not be absolute: ${value}`);
  return value;
}
function normalizePositiveInteger(value, label) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new LauncherProtocolError(`${label} must be a positive safe integer`);
  }
  return parsed;
}
function valueAfterArg(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] ?? null;
}
function normalizeLauncherHandoffId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/.test(value)) {
    throw new LauncherProtocolError("launcher handoff id must be 16-128 URL-safe characters");
  }
  return value;
}
function buildLauncherAfterQuitArgs(request) {
  return [
    LAUNCHER_AFTER_QUIT_FLAG,
    LAUNCHER_AFTER_QUIT_TARGET_PID_ARG,
    normalizePositiveInteger(request.targetPid, "launcher after-quit target pid").toString(),
    LAUNCHER_AFTER_QUIT_TIMEOUT_MS_ARG,
    normalizePositiveInteger(request.timeoutMs, "launcher after-quit timeout").toString()
  ];
}
function parseLauncherAfterQuitArgs(args) {
  if (!args.includes(LAUNCHER_AFTER_QUIT_FLAG)) return null;
  return {
    targetPid: normalizePositiveInteger(
      valueAfterArg(args, LAUNCHER_AFTER_QUIT_TARGET_PID_ARG),
      "launcher after-quit target pid"
    ),
    timeoutMs: normalizePositiveInteger(
      valueAfterArg(args, LAUNCHER_AFTER_QUIT_TIMEOUT_MS_ARG),
      "launcher after-quit timeout"
    )
  };
}
function normalizeLauncherGeneration(value) {
  const generation = typeof value === "string" && value.length > 0 ? Number(value) : value;
  if (typeof generation !== "number" || !Number.isSafeInteger(generation) || generation < 0) {
    throw new LauncherProtocolError(`launcher generation must be a non-negative safe integer: ${String(value)}`);
  }
  return generation;
}
function buildLauncherDelegatedArgs(pointer) {
  return [
    LAUNCHER_DELEGATED_GENERATION_ARG,
    normalizeLauncherGeneration(pointer.generation).toString(),
    LAUNCHER_DELEGATED_VERSION_ARG,
    normalizeLauncherVersion(pointer.version)
  ];
}
function parseLauncherDelegatedArgs(args) {
  if (!args.includes(LAUNCHER_DELEGATED_GENERATION_ARG)) return null;
  return {
    generation: normalizeLauncherGeneration(valueAfterArg(args, LAUNCHER_DELEGATED_GENERATION_ARG)),
    version: normalizeLauncherVersion(valueAfterArg(args, LAUNCHER_DELEGATED_VERSION_ARG))
  };
}
function buildLauncherHandoffResumeArgs(request) {
  return [LAUNCHER_HANDOFF_RESUME_ARG, normalizeLauncherHandoffId(request.handoffId)];
}
function parseLauncherHandoffResumeArgs(args) {
  if (!args.includes(LAUNCHER_HANDOFF_RESUME_ARG)) return null;
  return {
    handoffId: normalizeLauncherHandoffId(valueAfterArg(args, LAUNCHER_HANDOFF_RESUME_ARG))
  };
}
function normalizeLauncherNamespace(value) {
  try {
    return normalizeNamespace(value);
  } catch (error) {
    throw new LauncherProtocolError(error instanceof Error ? error.message : String(error));
  }
}
function normalizeRoot(root) {
  if (root.length === 0) throw new LauncherProtocolError("launcher root must not be empty");
  if (root.includes("\0")) throw new LauncherProtocolError("launcher root must not contain null bytes");
  if (!isAbsolute(root)) throw new LauncherProtocolError(`launcher root must be absolute: ${root}`);
  return resolve(root);
}
function assertUnderRoot(root, target) {
  const normalizedRoot = resolve(root);
  const normalizedTarget = resolve(target);
  if (normalizedTarget !== normalizedRoot && !normalizedTarget.startsWith(`${normalizedRoot}${sep}`)) {
    throw new LauncherProtocolError(`launcher path escapes root: ${normalizedTarget}`);
  }
  return normalizedTarget;
}
function resolveLauncherPaths(request) {
  const root = normalizeRoot(request.root);
  const channel = normalizeLauncherChannel(request.channel);
  const namespace = normalizeLauncherNamespace(request.namespace);
  const launcherPath = assertUnderRoot(root, join(root, "launcher"));
  const channelRoot = assertUnderRoot(root, join(launcherPath, "channels", channel));
  const namespaceRoot = assertUnderRoot(root, join(channelRoot, "namespaces", namespace));
  const stateRoot = assertUnderRoot(root, join(namespaceRoot, "state"));
  const updatesRoot = assertUnderRoot(root, join(namespaceRoot, "updates"));
  return {
    attemptsPath: assertUnderRoot(root, join(stateRoot, "attempt.json")),
    channel,
    channelRoot,
    cleanupPath: assertUnderRoot(root, join(stateRoot, "cleanup.json")),
    downloadsRoot: assertUnderRoot(root, join(updatesRoot, "downloads")),
    handoffPath: assertUnderRoot(root, join(stateRoot, "desktop-handoff.json")),
    installPath: assertUnderRoot(root, join(namespaceRoot, "install.json")),
    launcherPath,
    lockRoot: assertUnderRoot(root, join(stateRoot, "lock")),
    logsRoot: assertUnderRoot(root, join(namespaceRoot, "logs")),
    namespace,
    namespaceRoot,
    releasesRoot: assertUnderRoot(root, join(updatesRoot, "releases")),
    root,
    runtimePath: assertUnderRoot(root, join(namespaceRoot, "runtime.json")),
    stagingRoot: assertUnderRoot(root, join(updatesRoot, "staging")),
    stateRoot,
    updatesRoot,
    versionsRoot: assertUnderRoot(root, join(namespaceRoot, "versions"))
  };
}
function resolveLauncherVersionPaths(request) {
  const paths = resolveLauncherPaths(request);
  const version = normalizeLauncherVersion(request.version);
  const versionRoot = assertUnderRoot(paths.root, join(paths.versionsRoot, version));
  return {
    ...paths,
    manifestPath: assertUnderRoot(paths.root, join(versionRoot, "manifest.json")),
    payloadRoot: assertUnderRoot(paths.root, join(versionRoot, "payload")),
    version,
    versionRoot
  };
}
function normalizePointer(value) {
  if (value == null) return null;
  const version = normalizeLauncherVersion(value.version);
  if (!Number.isSafeInteger(value.generation) || value.generation < 0) {
    throw new LauncherProtocolError(`launcher generation must be a non-negative safe integer: ${value.generation}`);
  }
  return { generation: value.generation, version };
}
function normalizeRequiredPointer(value, label) {
  const pointer = normalizePointer(value);
  if (pointer == null) throw new LauncherProtocolError(`${label} is required`);
  return pointer;
}
function normalizeOptionalIsoString(value, label) {
  if (value == null) return void 0;
  if (typeof value !== "string" || value.length === 0) {
    throw new LauncherProtocolError(`${label} must be a non-empty string`);
  }
  return value;
}
function normalizeIsoString(value, label) {
  const normalized = normalizeOptionalIsoString(value, label);
  if (normalized == null) throw new LauncherProtocolError(`${label} is required`);
  return normalized;
}
function normalizeLauncherCleanupState(value) {
  if (value === "cleanup-deferred" || value === "cleanup-removed" || value === "deprecated" || value === "retained") {
    return value;
  }
  throw new LauncherProtocolError(`unsupported launcher cleanup state: ${String(value)}`);
}
function normalizeLauncherCleanupReason(value) {
  if (value === "cleanup-failed" || value === "current-bound-package" || value === "older-than-bound-package") {
    return value;
  }
  throw new LauncherProtocolError(`unsupported launcher cleanup reason: ${String(value)}`);
}
function normalizeCleanupError(value) {
  if (value == null) return void 0;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new LauncherProtocolError("launcher cleanup error must be an object");
  }
  const record = value;
  if (typeof record.code !== "string" || record.code.length === 0) {
    throw new LauncherProtocolError("launcher cleanup error code must be a non-empty string");
  }
  if (typeof record.message !== "string" || record.message.length === 0) {
    throw new LauncherProtocolError("launcher cleanup error message must be a non-empty string");
  }
  return { code: record.code, message: record.message };
}
function normalizeCleanupEntry(value) {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    throw new LauncherProtocolError("launcher cleanup entry must be an object");
  }
  const record = value;
  const rawGeneration = record.generation;
  if (typeof rawGeneration !== "number" || !Number.isSafeInteger(rawGeneration) || rawGeneration < 0) {
    throw new LauncherProtocolError(`launcher cleanup generation must be a non-negative safe integer: ${String(rawGeneration)}`);
  }
  const generation = rawGeneration;
  const version = normalizeLauncherVersion(record.version);
  const state = normalizeLauncherCleanupState(record.state);
  const reason = normalizeLauncherCleanupReason(record.reason);
  const error = normalizeCleanupError(record.error);
  const removedAt = normalizeOptionalIsoString(record.removedAt, "launcher cleanup removedAt");
  return {
    ...error == null ? {} : { error },
    generation,
    reason,
    ...removedAt == null ? {} : { removedAt },
    state,
    updatedAt: normalizeIsoString(record.updatedAt, "launcher cleanup updatedAt"),
    version
  };
}
function validateLauncherRuntimeDescriptor(runtime, expected) {
  if (runtime.schemaVersion !== LAUNCHER_SCHEMA_VERSION) {
    throw new LauncherProtocolError(`unsupported launcher runtime schemaVersion: ${String(runtime.schemaVersion)}`);
  }
  const channel = normalizeLauncherChannel(runtime.channel);
  const expectedChannel = normalizeLauncherChannel(expected.channel);
  if (channel !== expectedChannel) {
    throw new LauncherProtocolError(`launcher runtime channel ${channel} does not match expected channel ${expectedChannel}`);
  }
  const namespace = normalizeLauncherNamespace(runtime.namespace);
  const expectedNamespace = normalizeLauncherNamespace(expected.namespace);
  if (namespace !== expectedNamespace) {
    throw new LauncherProtocolError(`launcher runtime namespace ${namespace} does not match expected namespace ${expectedNamespace}`);
  }
  return {
    ...runtime,
    active: normalizePointer(runtime.active),
    channel,
    lastSuccessful: normalizePointer(runtime.lastSuccessful),
    namespace
  };
}
function validateLauncherAttemptDescriptor(attempt, expected) {
  if (attempt.schemaVersion !== LAUNCHER_SCHEMA_VERSION) {
    throw new LauncherProtocolError(`unsupported launcher attempt schemaVersion: ${String(attempt.schemaVersion)}`);
  }
  const channel = normalizeLauncherChannel(attempt.channel);
  const expectedChannel = normalizeLauncherChannel(expected.channel);
  if (channel !== expectedChannel) {
    throw new LauncherProtocolError(`launcher attempt channel ${channel} does not match expected channel ${expectedChannel}`);
  }
  const namespace = normalizeLauncherNamespace(attempt.namespace);
  const expectedNamespace = normalizeLauncherNamespace(expected.namespace);
  if (namespace !== expectedNamespace) {
    throw new LauncherProtocolError(`launcher attempt namespace ${namespace} does not match expected namespace ${expectedNamespace}`);
  }
  const pointer = normalizeRequiredPointer(attempt, "launcher attempt pointer");
  return {
    channel,
    generation: pointer.generation,
    namespace,
    schemaVersion: LAUNCHER_SCHEMA_VERSION,
    ...attempt.startedAt == null ? {} : {
      startedAt: normalizeIsoString(attempt.startedAt, "launcher attempt startedAt")
    },
    version: pointer.version
  };
}
function normalizeAbsoluteLauncherPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new LauncherProtocolError(`${label} must be a non-empty absolute path`);
  }
  if (!isAbsolute(value)) throw new LauncherProtocolError(`${label} must be absolute: ${value}`);
  return resolve(value);
}
function validateLauncherDesktopHandoffDescriptor(handoff, expected) {
  if (handoff.schemaVersion !== LAUNCHER_SCHEMA_VERSION) {
    throw new LauncherProtocolError(`unsupported launcher desktop handoff schemaVersion: ${String(handoff.schemaVersion)}`);
  }
  const channel = normalizeLauncherChannel(handoff.channel);
  const expectedChannel = normalizeLauncherChannel(expected.channel);
  if (channel !== expectedChannel) {
    throw new LauncherProtocolError(`launcher desktop handoff channel ${channel} does not match expected channel ${expectedChannel}`);
  }
  const namespace = normalizeLauncherNamespace(handoff.namespace);
  const expectedNamespace = normalizeLauncherNamespace(expected.namespace);
  if (namespace !== expectedNamespace) {
    throw new LauncherProtocolError(`launcher desktop handoff namespace ${namespace} does not match expected namespace ${expectedNamespace}`);
  }
  if (handoff.state !== "prepared" && handoff.state !== "armed" && handoff.state !== "confirmed") {
    throw new LauncherProtocolError(`unsupported launcher desktop handoff state: ${String(handoff.state)}`);
  }
  const target = handoff.target == null ? null : normalizePointer(handoff.target);
  if ((handoff.state === "armed" || handoff.state === "confirmed") && target == null) {
    throw new LauncherProtocolError(`${handoff.state} launcher desktop handoff requires a target pointer`);
  }
  if (handoff.state === "prepared" && target != null) {
    throw new LauncherProtocolError("prepared launcher desktop handoff must not include a target pointer");
  }
  if (handoff.outer == null || typeof handoff.outer !== "object") {
    throw new LauncherProtocolError("launcher desktop handoff outer identity is required");
  }
  return {
    channel,
    createdAt: normalizeIsoString(handoff.createdAt, "launcher desktop handoff createdAt"),
    handoffId: normalizeLauncherHandoffId(handoff.handoffId),
    namespace,
    outer: {
      executablePath: normalizeAbsoluteLauncherPath(
        handoff.outer.executablePath,
        "launcher desktop handoff outer executablePath"
      ),
      pid: normalizePositiveInteger(handoff.outer.pid, "launcher desktop handoff outer pid")
    },
    payloadExecutablePath: normalizeAbsoluteLauncherPath(
      handoff.payloadExecutablePath,
      "launcher desktop handoff payloadExecutablePath"
    ),
    previous: normalizeRequiredPointer(handoff.previous, "launcher desktop handoff previous pointer"),
    schemaVersion: LAUNCHER_SCHEMA_VERSION,
    source: normalizeRequiredPointer(handoff.source, "launcher desktop handoff source pointer"),
    state: handoff.state,
    ...target == null ? {} : { target },
    updatedAt: normalizeIsoString(handoff.updatedAt, "launcher desktop handoff updatedAt")
  };
}
function validateLauncherCleanupDescriptor(cleanup, expected) {
  if (cleanup.version !== LAUNCHER_SCHEMA_VERSION) {
    throw new LauncherProtocolError(`unsupported launcher cleanup version: ${String(cleanup.version)}`);
  }
  const channel = normalizeLauncherChannel(cleanup.channel);
  const expectedChannel = normalizeLauncherChannel(expected.channel);
  if (channel !== expectedChannel) {
    throw new LauncherProtocolError(`launcher cleanup channel ${channel} does not match expected channel ${expectedChannel}`);
  }
  const namespace = normalizeLauncherNamespace(cleanup.namespace);
  const expectedNamespace = normalizeLauncherNamespace(expected.namespace);
  if (namespace !== expectedNamespace) {
    throw new LauncherProtocolError(`launcher cleanup namespace ${namespace} does not match expected namespace ${expectedNamespace}`);
  }
  if (!Array.isArray(cleanup.versions)) {
    throw new LauncherProtocolError("launcher cleanup versions must be an array");
  }
  return {
    channel,
    ...cleanup.currentVersion == null ? {} : { currentVersion: normalizeLauncherVersion(cleanup.currentVersion) },
    namespace,
    updatedAt: normalizeIsoString(cleanup.updatedAt, "launcher cleanup updatedAt"),
    version: LAUNCHER_SCHEMA_VERSION,
    versions: cleanup.versions.map(normalizeCleanupEntry)
  };
}
function selectLauncherRuntimeTarget(input) {
  const active = normalizePointer(input.runtime.active);
  const lastSuccessful = normalizePointer(input.runtime.lastSuccessful);
  const delegated = input.delegated == null ? null : normalizePointer(input.delegated);
  const resume = input.resume == null ? null : normalizePointer(input.resume);
  const attempted = input.attempted == null ? null : {
    generation: input.attempted.generation,
    version: normalizeLauncherVersion(input.attempted.version)
  };
  if (active == null) {
    return lastSuccessful == null ? { reason: "no-runtime-target", selected: false } : { pointer: lastSuccessful, reason: "last-successful", selected: true };
  }
  if (attempted != null && attempted.version === active.version && attempted.generation === active.generation) {
    if (resume != null && resume.version === active.version && resume.generation === active.generation) {
      return { pointer: active, reason: "active-resume", selected: true };
    }
    if (delegated != null && delegated.version === active.version && delegated.generation === active.generation) {
      return { pointer: active, reason: "active-delegated", selected: true };
    }
    if (lastSuccessful == null) return { pointer: active, reason: "active", selected: true };
    return { pointer: lastSuccessful, reason: "last-successful", selected: true };
  }
  return { pointer: active, reason: "active", selected: true };
}
export {
  LAUNCHER_AFTER_QUIT_FLAG,
  LAUNCHER_AFTER_QUIT_TARGET_PID_ARG,
  LAUNCHER_AFTER_QUIT_TIMEOUT_MS_ARG,
  LAUNCHER_CHANNELS,
  LAUNCHER_DELEGATED_GENERATION_ARG,
  LAUNCHER_DELEGATED_VERSION_ARG,
  LAUNCHER_HANDOFF_RESUME_ARG,
  LAUNCHER_SCHEMA_VERSION,
  LauncherProtocolError,
  buildLauncherAfterQuitArgs,
  buildLauncherDelegatedArgs,
  buildLauncherHandoffResumeArgs,
  compareLauncherVersions,
  normalizeLauncherChannel,
  normalizeLauncherNamespace,
  normalizeLauncherVersion,
  parseLauncherAfterQuitArgs,
  parseLauncherDelegatedArgs,
  parseLauncherHandoffResumeArgs,
  resolveLauncherPaths,
  resolveLauncherVersionPaths,
  selectLauncherRuntimeTarget,
  validateLauncherAttemptDescriptor,
  validateLauncherCleanupDescriptor,
  validateLauncherDesktopHandoffDescriptor,
  validateLauncherRuntimeDescriptor
};
