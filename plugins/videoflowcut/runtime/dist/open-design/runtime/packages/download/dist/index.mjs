// src/errors.ts
var MANAGED_DOWNLOAD_ERROR_CODES = Object.freeze({
  ABORTED: "aborted",
  CHECKSUM_MISMATCH: "checksum-mismatch",
  INVALID_TARGET: "invalid-target",
  NETWORK_EXHAUSTED: "network-exhausted",
  OUTPUT_CONFLICT: "output-conflict",
  STORE_CORRUPT: "store-corrupt",
  STORE_NOT_OWNED: "store-not-owned",
  TARGET_CONFLICT: "target-conflict",
  TARGET_LOCKED: "target-locked"
});
var ManagedDownloadError = class extends Error {
  code;
  details;
  constructor(code, message, details) {
    super(message);
    this.name = "ManagedDownloadError";
    this.code = code;
    if (details !== void 0) this.details = details;
  }
};

// src/constants.ts
var STORE_SENTINEL = ".open-design-download-root.json";
var STATE_DIR = ".state";
var PARTIAL_DIR = ".partial";
var LOCK_DIR = ".locks";
var STORE_SCHEMA_VERSION = 1;
var MANIFEST_SCHEMA_VERSION = 1;
var STORE_KIND = "open-design-managed-download-root";
var MANIFEST_KIND = "open-design-managed-download";
var DEFAULT_MAX_ATTEMPTS = 3;
var DEFAULT_PRUNE_OLDER_THAN_MS = 24 * 60 * 60 * 1e3;
var PID_REUSE_GRACE_MS = 1e3;
var PROCESS_STARTED_AT_MS = Date.now() - process.uptime() * 1e3;

// src/registry.ts
var activeTasks = /* @__PURE__ */ new Map();
var activeTargets = /* @__PURE__ */ new Map();
function activeKey(target) {
  return `${target.basePath}\0${target.targetKey}\0${target.identityDigest}`;
}
function targetActiveKey(target) {
  return `${target.basePath}\0${target.targetKey}`;
}
function waitForTask(task, options) {
  return new Promise((resolveWait, rejectWait) => {
    if (options.signal?.aborted) {
      rejectWait(new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.ABORTED, "download wait was aborted"));
      return;
    }
    const listener = options.onProgress;
    if (listener != null) task.listeners.add(listener);
    const cleanup = () => {
      if (listener != null) task.listeners.delete(listener);
      options.signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      rejectWait(new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.ABORTED, "download wait was aborted"));
    };
    options.signal?.addEventListener("abort", onAbort, { once: true });
    task.promise.then(
      (result) => {
        cleanup();
        resolveWait(result);
      },
      (error) => {
        cleanup();
        rejectWait(error);
      }
    );
  });
}

// src/run.ts
import { mkdir as mkdir4, rename as rename2, rm as rm5 } from "node:fs/promises";
import { dirname as dirname3 } from "node:path";

// src/fs-io.ts
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";
async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}
async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now().toString(36)}.tmp`;
  await writeFile(tmp, `${JSON.stringify(payload, null, 2)}
`, "utf8");
  await rename(tmp, path);
}
async function hashFile(path, algorithm) {
  const hash = createHash(algorithm);
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}
async function statFileSize(path) {
  try {
    const entry = await stat(path);
    return entry.isFile() ? entry.size : null;
  } catch {
    return null;
  }
}

// src/lock.ts
import { mkdir as mkdir2, rm, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname2 } from "node:path";
import { isProcessAlive } from "@open-design/platform";
function errorCode(error) {
  if (typeof error !== "object" || error == null || !("code" in error)) return null;
  const code = error.code;
  return code == null ? null : String(code);
}
function isDownloadLockFile(value) {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return false;
  const record = value;
  return typeof record.createdAt === "string" && typeof record.pid === "number" && Number.isInteger(record.pid) && record.pid > 0 && (record.processStartedAt == null || typeof record.processStartedAt === "string");
}
function parseTimeMs(value) {
  if (value == null) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function lockBelongsToCurrentProcess(lock) {
  if (lock.pid !== process.pid) return false;
  const ownerStartedAtMs = parseTimeMs(lock.processStartedAt);
  if (ownerStartedAtMs != null) return ownerStartedAtMs >= PROCESS_STARTED_AT_MS - PID_REUSE_GRACE_MS;
  const lockCreatedAtMs = parseTimeMs(lock.createdAt);
  return lockCreatedAtMs == null || lockCreatedAtMs >= PROCESS_STARTED_AT_MS - PID_REUSE_GRACE_MS;
}
function isLockProcessAlive(lock) {
  if (!isProcessAlive(lock.pid)) return false;
  if (lock.pid === process.pid) return lockBelongsToCurrentProcess(lock);
  return true;
}
async function clearStaleLock(target) {
  const lock = await readJson(target.lockPath);
  if (!isDownloadLockFile(lock) || isLockProcessAlive(lock)) return false;
  await rm(target.lockPath, { force: true }).catch(() => void 0);
  return true;
}
async function acquireLock(target) {
  await mkdir2(dirname2(target.lockPath), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await writeFile2(
        target.lockPath,
        `${JSON.stringify({
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          pid: process.pid,
          processStartedAt: new Date(PROCESS_STARTED_AT_MS).toISOString()
        })}
`,
        { flag: "wx" }
      );
      return { path: target.lockPath };
    } catch (error) {
      if (errorCode(error) === "EEXIST") {
        const staleLockCleared = attempt === 0 && await clearStaleLock(target);
        if (staleLockCleared) continue;
        throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.TARGET_LOCKED, `download target is locked: ${target.bucket}/${target.fileName}`);
      }
      throw error;
    }
  }
  throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.TARGET_LOCKED, `download target is locked: ${target.bucket}/${target.fileName}`);
}
async function releaseLock(lock) {
  if (lock == null) return;
  await rm(lock.path, { force: true }).catch(() => void 0);
}

// src/manifest.ts
import { readFile as readFile2 } from "node:fs/promises";
function errorCode2(error) {
  if (typeof error !== "object" || error == null || !("code" in error)) return null;
  const code = error.code;
  return code == null ? null : String(code);
}
function isChecksum(value) {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return false;
  const checksum = value;
  return (checksum.algorithm === "sha256" || checksum.algorithm === "sha512") && typeof checksum.value === "string";
}
function isManifest(value) {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return false;
  const record = value;
  return record.kind === MANIFEST_KIND && record.schemaVersion === MANIFEST_SCHEMA_VERSION && typeof record.bucket === "string" && typeof record.fileName === "string" && typeof record.targetKey === "string" && typeof record.identityDigest === "string" && typeof record.urlDigest === "string" && isChecksum(record.checksum) && (record.state === "complete" || record.state === "partial") && typeof record.createdAt === "string" && typeof record.updatedAt === "string";
}
async function readManifest(path) {
  try {
    const parsed = JSON.parse(await readFile2(path, "utf8"));
    return isManifest(parsed) ? parsed : "invalid";
  } catch (error) {
    if (errorCode2(error) === "ENOENT") return null;
    return "invalid";
  }
}
function manifestMatchesTarget(manifest, target) {
  return manifest.bucket === target.bucket && manifest.fileName === target.fileName && manifest.targetKey === target.targetKey && manifest.identityDigest === target.identityDigest && manifest.urlDigest === target.urlDigest && manifest.checksum.algorithm === target.checksum.algorithm && manifest.checksum.value.toLowerCase() === target.checksum.value;
}
function createManifest(target, state, patch = {}) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    bucket: target.bucket,
    checksum: target.checksum,
    createdAt: now,
    fileName: target.fileName,
    identityDigest: target.identityDigest,
    kind: MANIFEST_KIND,
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    state,
    targetKey: target.targetKey,
    updatedAt: now,
    urlDigest: target.urlDigest,
    ...patch
  };
}

// src/prune.ts
import { readdir as readdir3, rm as rm3, stat as stat2 } from "node:fs/promises";
import { join as join2 } from "node:path";
import { removePathBestEffort } from "@open-design/platform";

// src/store.ts
import { lstat, mkdir as mkdir3, readdir as readdir2, rm as rm2 } from "node:fs/promises";
import { join } from "node:path";
var OS_MANAGED_ROOT_ARTIFACTS = /* @__PURE__ */ new Set([".DS_Store", "Thumbs.db", "desktop.ini", ".localized"]);
function isOsManagedRootArtifact(name) {
  return OS_MANAGED_ROOT_ARTIFACTS.has(name);
}
async function verifiedOsManagedRootArtifacts(basePath, entries) {
  const candidates = entries.filter((entry) => isOsManagedRootArtifact(entry));
  if (candidates.length === 0) return /* @__PURE__ */ new Set();
  const verified = await Promise.all(
    candidates.map(async (entry) => {
      try {
        const entryStat = await lstat(join(basePath, entry));
        return entryStat.isFile() && !entryStat.isSymbolicLink() ? entry : null;
      } catch {
        return null;
      }
    })
  );
  return new Set(verified.filter((entry) => entry != null));
}
function isStoreSentinel(value) {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return false;
  const record = value;
  return record.kind === STORE_KIND && record.schemaVersion === STORE_SCHEMA_VERSION && typeof record.createdAt === "string";
}
async function writeSentinel(basePath) {
  await writeJson(join(basePath, STORE_SENTINEL), {
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    kind: STORE_KIND,
    schemaVersion: STORE_SCHEMA_VERSION
  });
}
async function resetOwnedBase(basePath) {
  const sentinel = await readJson(join(basePath, STORE_SENTINEL));
  if (!isStoreSentinel(sentinel)) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.STORE_NOT_OWNED, `download base is not owned: ${basePath}`);
  }
  const entries = await readdir2(basePath).catch(() => []);
  for (const entry of entries) {
    await rm2(join(basePath, entry), { force: true, recursive: true }).catch(() => void 0);
  }
  await writeSentinel(basePath);
  await ensureStoreDirs(basePath);
}
async function ensureStoreDirs(basePath) {
  await mkdir3(join(basePath, STATE_DIR), { recursive: true });
  await mkdir3(join(basePath, PARTIAL_DIR), { recursive: true });
  await mkdir3(join(basePath, LOCK_DIR), { recursive: true });
}
async function ensureManagedBase(basePath) {
  await mkdir3(basePath, { recursive: true });
  const entry = await lstat(basePath);
  if (!entry.isDirectory() || entry.isSymbolicLink()) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.STORE_NOT_OWNED, `download base is not an owned directory: ${basePath}`);
  }
  const sentinelPath = join(basePath, STORE_SENTINEL);
  const sentinel = await readJson(sentinelPath);
  if (sentinel == null) {
    const entries = await readdir2(basePath);
    const osArtifacts = await verifiedOsManagedRootArtifacts(basePath, entries);
    const content = entries.filter((name) => !osArtifacts.has(name));
    if (content.length > 0) {
      throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.STORE_NOT_OWNED, `download base is not empty and has no ownership marker: ${basePath}`);
    }
    await writeSentinel(basePath);
  } else if (!isStoreSentinel(sentinel)) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.STORE_NOT_OWNED, `download base has an invalid ownership marker: ${basePath}`);
  }
  await ensureStoreDirs(basePath);
}

// src/target.ts
import { createHash as createHash2 } from "node:crypto";
import { isAbsolute, resolve } from "node:path";
import { pathContains } from "@open-design/platform";
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function digest(value) {
  return createHash2("sha256").update(value).digest("hex");
}
function normalizeChecksum(input) {
  if (input.algorithm !== "sha256" && input.algorithm !== "sha512") {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, `unsupported checksum algorithm: ${String(input.algorithm)}`);
  }
  const value = input.value.trim().toLowerCase();
  const expectedLength = input.algorithm === "sha256" ? 64 : 128;
  if (!new RegExp(`^[0-9a-f]{${expectedLength}}$`).test(value)) {
    throw new ManagedDownloadError(
      MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET,
      `${input.algorithm} checksum must be ${expectedLength} hex characters`
    );
  }
  return { algorithm: input.algorithm, value };
}
function normalizeSegment(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, `${label} must be a non-empty string`);
  }
  if (value === "." || value === ".." || value.includes("\0") || /[\\/]/.test(value) || isAbsolute(value)) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, `${label} must be a safe single path segment`);
  }
  return value;
}
function normalizeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("only http and https URLs are supported");
    }
    return url.toString();
  } catch (error) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, errorMessage(error));
  }
}
function normalizeBasePath(basePath) {
  if (typeof basePath !== "string" || basePath.length === 0 || basePath.includes("\0")) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, "basePath must be a non-empty path");
  }
  const resolved = resolve(basePath);
  if (!isAbsolute(resolved)) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, `basePath must resolve to an absolute path: ${basePath}`);
  }
  return resolved;
}
function targetFromOptions(options) {
  const basePath = normalizeBasePath(options.basePath);
  const bucket = normalizeSegment(options.bucket, "bucket");
  const fileName = normalizeSegment(options.fileName, "fileName");
  const checksum = normalizeChecksum(options.payload.checksum);
  const url = normalizeUrl(options.payload.url);
  const urlDigest = digest(url);
  const identityDigest = digest(`${url}\0${checksum.algorithm}\0${checksum.value}`);
  const targetKey = digest(`${bucket}\0${fileName}`);
  const finalPath = resolve(basePath, bucket, fileName);
  const manifestPath = resolve(basePath, STATE_DIR, `${targetKey}.json`);
  const partialPath = resolve(basePath, PARTIAL_DIR, `${targetKey}.partial`);
  const lockPath = resolve(basePath, LOCK_DIR, `${targetKey}.lock`);
  for (const path of [finalPath, manifestPath, partialPath, lockPath]) {
    if (!pathContains(basePath, path)) {
      throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, "resolved managed download path escaped basePath");
    }
  }
  return { basePath, bucket, checksum, fileName, finalPath, identityDigest, lockPath, manifestPath, partialPath, targetKey, url, urlDigest };
}

// src/prune.ts
async function removeEntriesOlderThan(root, olderThan) {
  const warnings = [];
  let removed = 0;
  const entries = await readdir3(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const path = join2(root, entry.name);
    const info = await stat2(path).catch(() => null);
    if (info == null || info.mtimeMs > olderThan) continue;
    const result = await removePathBestEffort(path);
    if (result.removed) removed += 1;
    else if (result.error != null) warnings.push(result.error);
  }
  return { removed, warnings };
}
async function pruneManagedDownloads(options) {
  const basePath = normalizeBasePath(options.basePath);
  await ensureManagedBase(basePath);
  const olderThan = (options.now?.getTime() ?? Date.now()) - (options.olderThanMs ?? DEFAULT_PRUNE_OLDER_THAN_MS);
  const roots = [join2(basePath, STATE_DIR), join2(basePath, PARTIAL_DIR), join2(basePath, LOCK_DIR)];
  let removed = 0;
  const warnings = [];
  for (const root of roots) {
    const result = await removeEntriesOlderThan(root, olderThan);
    removed += result.removed;
    warnings.push(...result.warnings);
  }
  const bucketEntries = await readdir3(basePath, { withFileTypes: true }).catch(() => []);
  for (const entry of bucketEntries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const result = await removeEntriesOlderThan(join2(basePath, entry.name), olderThan);
    removed += result.removed;
    warnings.push(...result.warnings);
    const remaining = await readdir3(join2(basePath, entry.name)).catch(() => null);
    if (remaining != null && remaining.length === 0) await rm3(join2(basePath, entry.name), { force: true, recursive: true }).catch(() => void 0);
  }
  return { removed, warnings };
}

// src/transfer.ts
import { createWriteStream } from "node:fs";
import { rm as rm4 } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline as pipeline2 } from "node:stream/promises";
function errorMessage2(error) {
  return error instanceof Error ? error.message : String(error);
}
function contentLength(response) {
  const raw = response.headers.get("content-length");
  if (raw == null) return void 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : void 0;
}
function validatorsFromResponse(response) {
  const etag = response.headers.get("etag") ?? void 0;
  const lastModified = response.headers.get("last-modified") ?? void 0;
  return etag == null && lastModified == null ? void 0 : { ...etag == null ? {} : { etag }, ...lastModified == null ? {} : { lastModified } };
}
function validatorsConflict(saved, response) {
  if (saved == null) return false;
  const etag = response.headers.get("etag") ?? void 0;
  const lastModified = response.headers.get("last-modified") ?? void 0;
  if (saved.etag != null && etag != null && saved.etag !== etag) return true;
  if (saved.lastModified != null && lastModified != null && saved.lastModified !== lastModified) return true;
  return false;
}
function parseContentRange(value) {
  if (value == null) return null;
  const match = /^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i.exec(value.trim());
  if (match?.[1] == null || match[2] == null || match[3] == null) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  const totalBytes = match[3] === "*" ? void 0 : Number(match[3]);
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) return null;
  if (totalBytes != null && (!Number.isInteger(totalBytes) || totalBytes <= end)) return null;
  return { start, end, ...totalBytes == null ? {} : { totalBytes } };
}
async function emitExistingProgress(path, totalBytes, emit) {
  const existing = await statFileSize(path);
  if (existing == null || existing <= 0) return;
  emit({ receivedBytes: existing, sessionReceivedBytes: 0, ...totalBytes == null ? {} : { totalBytes } });
}
async function writeResponseBodyToPartial(response, target, options) {
  if (response.body == null) throw new Error("download response did not include a body");
  let receivedBytes = options.startBytes;
  let sessionReceivedBytes = 0;
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      receivedBytes += chunk.byteLength;
      sessionReceivedBytes += chunk.byteLength;
      options.emit({
        receivedBytes,
        sessionReceivedBytes,
        ...options.totalBytes == null ? {} : { totalBytes: options.totalBytes }
      });
      callback(null, chunk);
    }
  });
  await pipeline2(
    Readable.fromWeb(response.body),
    meter,
    createWriteStream(target.partialPath, { flags: options.startBytes > 0 ? "a" : "w" })
  );
}
async function tryResumeDownload(target, manifest, fetchImpl, emit, requestHeaders) {
  const partialBytes = await statFileSize(target.partialPath);
  if (partialBytes == null || partialBytes <= 0) return "restart";
  const response = await fetchImpl(target.url, {
    headers: {
      ...requestHeaders ?? {},
      ...manifest.validators?.etag == null ? {} : { "If-Range": manifest.validators.etag },
      Range: `bytes=${partialBytes}-`
    }
  });
  if (response.status !== 206) return "restart";
  const range = parseContentRange(response.headers.get("content-range"));
  if (range == null || range.start !== partialBytes || validatorsConflict(manifest.validators, response)) {
    return "restart";
  }
  const totalBytes = range.totalBytes ?? manifest.totalBytes ?? partialBytes + (contentLength(response) ?? 0);
  await emitExistingProgress(target.partialPath, totalBytes, emit);
  await writeJson(target.manifestPath, {
    ...manifest,
    state: "partial",
    totalBytes,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    validators: manifest.validators ?? validatorsFromResponse(response)
  });
  await writeResponseBodyToPartial(response, target, { emit, startBytes: partialBytes, totalBytes });
  return { resumed: true, totalBytes };
}
async function downloadFromZero(target, fetchImpl, emit, requestHeaders) {
  await rm4(target.partialPath, { force: true }).catch(() => void 0);
  const response = await fetchImpl(target.url, { headers: requestHeaders });
  if (!response.ok) throw new Error(`download request returned HTTP ${response.status}`);
  const totalBytes = contentLength(response);
  const validators = validatorsFromResponse(response);
  await writeJson(target.manifestPath, createManifest(target, "partial", { totalBytes, validators }));
  await writeResponseBodyToPartial(response, target, { emit, startBytes: 0, totalBytes });
  return { resumed: false, totalBytes };
}
async function downloadWithRetries(target, manifest, options) {
  let lastError;
  let nextManifest = manifest;
  let resumed = false;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      if (nextManifest?.state === "partial") {
        const resume = await tryResumeDownload(target, nextManifest, options.fetchImpl, options.emit, options.requestHeaders);
        if (resume !== "restart") return { ...resume, resumed: true };
        await rm4(target.partialPath, { force: true }).catch(() => void 0);
        nextManifest = null;
      }
      const full = await downloadFromZero(target, options.fetchImpl, options.emit, options.requestHeaders);
      resumed = resumed || full.resumed;
      return { ...full, resumed };
    } catch (error) {
      lastError = error;
      const partialBytes = await statFileSize(target.partialPath);
      if (partialBytes != null && partialBytes > 0) {
        nextManifest = {
          ...nextManifest ?? createManifest(target, "partial"),
          state: "partial",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await writeJson(target.manifestPath, nextManifest).catch(() => void 0);
      }
    }
  }
  throw new ManagedDownloadError(
    MANAGED_DOWNLOAD_ERROR_CODES.NETWORK_EXHAUSTED,
    `download failed after ${options.maxAttempts} attempts: ${errorMessage2(lastError)}`
  );
}

// src/run.ts
async function suspiciousReset(target) {
  await resetOwnedBase(target.basePath);
  return { manifest: null, reset: true };
}
async function loadReusableState(target) {
  const manifest = await readManifest(target.manifestPath);
  const finalExists = await pathExists(target.finalPath);
  const partialExists = await pathExists(target.partialPath);
  if (manifest === "invalid") {
    return await suspiciousReset(target);
  }
  if (manifest == null) {
    if (finalExists || partialExists) return await suspiciousReset(target);
    return { manifest: null };
  }
  if (!manifestMatchesTarget(manifest, target)) {
    return await suspiciousReset(target);
  }
  if (manifest.state === "complete") {
    if (!finalExists) return await suspiciousReset(target);
    const actual = await hashFile(target.finalPath, target.checksum.algorithm).catch(() => null);
    if (actual !== target.checksum.value) return await suspiciousReset(target);
    const bytes = await statFileSize(target.finalPath);
    if (bytes == null) return await suspiciousReset(target);
    return {
      manifest,
      result: {
        bucket: target.bucket,
        bytes,
        checksum: target.checksum,
        fileName: target.fileName,
        path: target.finalPath,
        reusedComplete: true,
        resumed: false,
        urlDigest: target.urlDigest
      }
    };
  }
  if (!partialExists) return await suspiciousReset(target);
  return { manifest };
}
async function runManagedDownload(target, options) {
  await ensureManagedBase(target.basePath);
  await pruneManagedDownloads({ basePath: target.basePath }).catch(() => void 0);
  let lock = await acquireLock(target);
  try {
    let state = await loadReusableState(target);
    if (state.result != null) return state.result;
    if (state.reset === true) {
      await releaseLock(lock);
      lock = null;
      await ensureManagedBase(target.basePath);
      lock = await acquireLock(target);
      state = await loadReusableState(target);
      if (state.result != null) return state.result;
      if (state.reset === true) {
        throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.STORE_CORRUPT, "download state kept resetting after base cleanup");
      }
    }
    const download = await downloadWithRetries(target, state.manifest, options);
    const actual = await hashFile(target.partialPath, target.checksum.algorithm).catch((error) => {
      throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.STORE_CORRUPT, `downloaded partial could not be hashed: ${errorMessage3(error)}`);
    });
    if (actual !== target.checksum.value) {
      await resetOwnedBase(target.basePath).catch(() => void 0);
      throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.CHECKSUM_MISMATCH, "downloaded file checksum did not match requested payload", {
        actual,
        expected: target.checksum.value
      });
    }
    await mkdir4(dirname3(target.finalPath), { recursive: true });
    if (await pathExists(target.finalPath)) {
      const existing = await hashFile(target.finalPath, target.checksum.algorithm).catch(() => null);
      if (existing !== target.checksum.value) {
        await resetOwnedBase(target.basePath).catch(() => void 0);
        throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.STORE_CORRUPT, "existing complete file did not match requested payload");
      }
      await rm5(target.partialPath, { force: true }).catch(() => void 0);
    } else {
      await rename2(target.partialPath, target.finalPath);
    }
    const bytes = await statFileSize(target.finalPath);
    if (bytes == null) throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.STORE_CORRUPT, "complete file is missing after promotion");
    await writeJson(target.manifestPath, createManifest(target, "complete", { totalBytes: download.totalBytes }));
    return {
      bucket: target.bucket,
      bytes,
      checksum: target.checksum,
      fileName: target.fileName,
      path: target.finalPath,
      reusedComplete: false,
      resumed: download.resumed,
      urlDigest: target.urlDigest
    };
  } finally {
    await releaseLock(lock);
  }
}
function errorMessage3(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/managed-download.ts
async function managedDownload(options) {
  const target = targetFromOptions(options);
  const key = activeKey(target);
  const targetKey = targetActiveKey(target);
  const existingForTarget = activeTargets.get(targetKey);
  if (existingForTarget != null && existingForTarget !== key) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.TARGET_CONFLICT, `download target is already active with a different identity: ${target.bucket}/${target.fileName}`);
  }
  const existing = activeTasks.get(key);
  if (existing != null) return await waitForTask(existing, options);
  const listeners = /* @__PURE__ */ new Set();
  const emit = (progress) => {
    for (const listener of listeners) listener(progress);
  };
  const task = {
    listeners,
    targetKey,
    promise: runManagedDownload(target, {
      emit,
      fetchImpl: options.fetch ?? globalThis.fetch,
      maxAttempts: options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      requestHeaders: options.payload.headers
    })
  };
  activeTasks.set(key, task);
  activeTargets.set(targetKey, key);
  task.promise.finally(() => {
    activeTasks.delete(key);
    if (activeTargets.get(targetKey) === key) activeTargets.delete(targetKey);
  }).catch(() => void 0);
  return await waitForTask(task, options);
}

// src/copy.ts
import { isAbsolute as isAbsolute2, resolve as resolve2 } from "node:path";
import { atomicCopyFile } from "@open-design/platform";

// src/remove.ts
import { readdir as readdir4, rm as rm6 } from "node:fs/promises";
import { join as join3 } from "node:path";
import { removePathBestEffort as removePathBestEffort2 } from "@open-design/platform";
async function inspectManagedDownload(options) {
  const target = targetFromOptions({
    ...options,
    payload: {
      checksum: { algorithm: "sha256", value: "0".repeat(64) },
      url: "https://example.invalid/"
    }
  });
  await ensureManagedBase(target.basePath);
  const rawManifest = await readManifest(target.manifestPath);
  const manifest = rawManifest === "invalid" ? "unreadable" : rawManifest?.state ?? "missing";
  return {
    bucket: target.bucket,
    complete: await pathExists(target.finalPath),
    fileName: target.fileName,
    manifest,
    path: target.finalPath
  };
}
async function removeManagedDownload(options) {
  const target = targetFromOptions({
    ...options,
    payload: {
      checksum: { algorithm: "sha256", value: "0".repeat(64) },
      url: "https://example.invalid/"
    }
  });
  if (activeTargets.has(targetActiveKey(target))) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.TARGET_LOCKED, `download target is active: ${target.bucket}/${target.fileName}`);
  }
  await ensureManagedBase(target.basePath);
  await Promise.all([
    removePathBestEffort2(target.finalPath),
    removePathBestEffort2(target.partialPath, { recursive: false }),
    removePathBestEffort2(target.manifestPath, { recursive: false }),
    removePathBestEffort2(target.lockPath, { recursive: false })
  ]);
  const bucketPath = join3(target.basePath, target.bucket);
  const entries = await readdir4(bucketPath).catch(() => null);
  if (entries != null && entries.length === 0) await rm6(bucketPath, { force: true, recursive: true }).catch(() => void 0);
  return { removed: true };
}

// src/copy.ts
var copyLeases = /* @__PURE__ */ new Map();
function errorMessage4(error) {
  return error instanceof Error ? error.message : String(error);
}
function acquireCopyLease(target) {
  const key = targetActiveKey(target);
  const state = copyLeases.get(key) ?? { clearRequested: false, count: 0, removeOptions: null };
  state.count += 1;
  copyLeases.set(key, state);
  return { key };
}
async function requestClearAfterCopy(target) {
  const key = targetActiveKey(target);
  const state = copyLeases.get(key);
  if (state != null && state.count > 1) {
    state.clearRequested = true;
    state.removeOptions = { basePath: target.basePath, bucket: target.bucket, fileName: target.fileName };
    return "deferred";
  }
  await removeManagedDownload({ basePath: target.basePath, bucket: target.bucket, fileName: target.fileName });
  return "removed";
}
async function releaseCopyLease(lease) {
  const state = copyLeases.get(lease.key);
  if (state == null) return;
  state.count -= 1;
  if (state.count > 0) return;
  copyLeases.delete(lease.key);
  if (state.clearRequested && state.removeOptions != null) {
    await removeManagedDownload(state.removeOptions).catch(() => void 0);
  }
}
async function downloadCopyAndClear(options) {
  const target = targetFromOptions(options);
  if (typeof options.outputPath !== "string" || options.outputPath.length === 0 || options.outputPath.includes("\0")) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, "outputPath must be a non-empty path");
  }
  const outputPath = resolve2(options.outputPath);
  if (!isAbsolute2(outputPath)) {
    throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.INVALID_TARGET, `outputPath must resolve to an absolute path: ${options.outputPath}`);
  }
  const lease = acquireCopyLease(target);
  try {
    const downloaded = await managedDownload(options);
    const existingOutput = await statFileSize(outputPath);
    if (existingOutput != null) {
      const existingDigest = await hashFile(outputPath, target.checksum.algorithm).catch(() => null);
      if (existingDigest !== target.checksum.value) {
        throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.OUTPUT_CONFLICT, `output already exists with different bytes: ${outputPath}`);
      }
    } else {
      await atomicCopyFile(downloaded.path, outputPath);
      const copiedDigest = await hashFile(outputPath, target.checksum.algorithm);
      if (copiedDigest !== target.checksum.value) {
        throw new ManagedDownloadError(MANAGED_DOWNLOAD_ERROR_CODES.CHECKSUM_MISMATCH, "copied output checksum did not match requested payload");
      }
    }
    let cleanup = "removed";
    let cleanupWarning;
    try {
      cleanup = await requestClearAfterCopy(target);
    } catch (error) {
      cleanupWarning = errorMessage4(error);
    }
    return {
      bytes: downloaded.bytes,
      cleanup,
      ...cleanupWarning == null ? {} : { cleanupWarning },
      outputPath,
      reusedComplete: downloaded.reusedComplete,
      resumed: downloaded.resumed
    };
  } finally {
    await releaseCopyLease(lease);
  }
}
export {
  MANAGED_DOWNLOAD_ERROR_CODES,
  ManagedDownloadError,
  downloadCopyAndClear,
  inspectManagedDownload,
  managedDownload,
  pruneManagedDownloads,
  removeManagedDownload
};
