// src/contract.ts
var DIAGNOSTICS_EXPORT_PATH = "/api/diagnostics/export";
var DIAGNOSTICS_FILENAME_PREFIX = "open-design-diagnostics";
var DIAGNOSTICS_CONTENT_TYPE = "application/zip";

// src/automatic.ts
import { createHash } from "node:crypto";
import { mkdir, open as open2, stat as stat2, writeFile } from "node:fs/promises";
import { join as join2 } from "node:path";
import { Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

// src/sources.ts
import { open, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

// src/redaction.ts
var SENSITIVE_KEY_RE = /token|password|secret|key|dsn|authorization|cookie/i;
var URL_QUERY_SECRET_RE = /([?&#])(token|password|secret|key|dsn|api[_-]?key|auth|access_token|refresh_token|id_token)(=)([^&\s#"']*)/gi;
var BARE_SECRET_RE = /(^|[\s,;])(access_token|refresh_token|id_token|api[_-]?key|password|secret|token|auth(?:orization)?)(=|:\s*)([^\s,;"']+)/gi;
var HTTP_AUTH_SCHEME_RE = /\b(Bearer|Token|Basic)\s+([A-Za-z0-9._~\-+/=:]{4,})/gi;
var REDACTED = "[REDACTED]";
function redactJsonValue(value, opts = {}) {
  if (Array.isArray(value)) return value.map((entry) => redactJsonValue(entry, opts));
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [key, raw] of Object.entries(value)) {
      if (SENSITIVE_KEY_RE.test(key) && typeof raw === "string" && raw.length > 0) {
        out[key] = REDACTED;
      } else {
        out[key] = redactJsonValue(raw, opts);
      }
    }
    return out;
  }
  if (typeof value === "string") return redactText(value, opts);
  return value;
}
function redactText(text, opts = {}) {
  let out = text.replace(HTTP_AUTH_SCHEME_RE, (_match, scheme) => `${scheme} ${REDACTED}`);
  out = out.replace(URL_QUERY_SECRET_RE, (_match, sep, name, eq) => `${sep}${name}${eq}${REDACTED}`);
  out = out.replace(BARE_SECRET_RE, (_match, lead, name, sep) => `${lead}${name}${sep}${REDACTED}`);
  out = out.replace(
    /("[^"\n]*(?:token|password|secret|api[_-]?key|authorization|cookie|dsn)[^"\n]*"\s*:\s*)"(?:\\.|[^"\\])*"/gi,
    (_match, prefix) => `${prefix}"${REDACTED}"`
  );
  const username = opts.username;
  if (username && username.length > 1) {
    const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`/Users/${escaped}(?=[/"\\s])`, "g"), "/Users/<USER>");
    out = out.replace(new RegExp(`\\\\Users\\\\${escaped}(?=[\\\\"\\s])`, "g"), "\\Users\\<USER>");
    out = out.replace(new RegExp(`/home/${escaped}(?=[/"\\s])`, "g"), "/home/<USER>");
  }
  return out;
}
function redactJsonText(text, opts = {}) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return redactText(text, opts);
  }
  return JSON.stringify(redactJsonValue(parsed, opts), null, 2);
}

// src/sources.ts
var NEWLINE_BYTE = 10;
function alignTailToLineStart(data) {
  if (data.length === 0) return data;
  if (data[0] === NEWLINE_BYTE) return data.subarray(1);
  const firstNewline = data.indexOf(NEWLINE_BYTE);
  if (firstNewline === -1 || firstNewline + 1 >= data.length) return null;
  return data.subarray(firstNewline + 1);
}
async function readMaybeTail(absolutePath, tailBytes) {
  if (tailBytes == null || tailBytes <= 0) {
    const buf = await readFile(absolutePath);
    return { text: buf.toString("utf8"), bytes: buf.byteLength };
  }
  const info = await stat(absolutePath);
  if (info.size <= tailBytes) {
    const buf = await readFile(absolutePath);
    return { text: buf.toString("utf8"), bytes: buf.byteLength };
  }
  const fd = await open(absolutePath, "r");
  try {
    const start = info.size - tailBytes - 1;
    const buffer = Buffer.alloc(tailBytes + 1);
    const { bytesRead } = await fd.read(buffer, 0, tailBytes + 1, start);
    const aligned = alignTailToLineStart(buffer.subarray(0, bytesRead));
    if (aligned === null) {
      throw new Error(
        `no complete line fits the ${tailBytes}-byte tail window (the trailing record is larger than the cap); omitted rather than exporting a partial record`
      );
    }
    return { text: aligned.toString("utf8"), bytes: aligned.byteLength };
  } finally {
    await fd.close();
  }
}
async function collectLogSource(source, opts = {}) {
  try {
    if (source.kind === "binary") {
      const buf = await readFile(source.absolutePath);
      return { name: source.name, absolutePath: source.absolutePath, content: buf, bytes: buf.byteLength };
    }
    const { text, bytes } = await readMaybeTail(source.absolutePath, source.tailBytes);
    const redacted = source.kind === "json" ? redactJsonText(text, opts) : redactText(text, opts);
    return { name: source.name, absolutePath: source.absolutePath, content: redacted, bytes };
  } catch (error) {
    return {
      name: source.name,
      absolutePath: source.absolutePath,
      content: null,
      bytes: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
async function collectLogSources(sources, opts = {}) {
  return await Promise.all(sources.map((source) => collectLogSource(source, opts)));
}
var DEFAULT_CRASH_DIRS_DARWIN = [
  "/Library/Logs/DiagnosticReports"
];
async function findMacOSCrashReports(lookup) {
  if (process.platform !== "darwin") return [];
  const within = (lookup.withinDays ?? 7) * 24 * 60 * 60 * 1e3;
  const cutoff = Date.now() - within;
  const max = lookup.maxReports ?? 20;
  const dirs = lookup.searchDirs ?? [
    ...lookup.homeDir ? [join(lookup.homeDir, "Library/Logs/DiagnosticReports")] : [],
    ...DEFAULT_CRASH_DIRS_DARWIN
  ];
  const matches = lookup.matchSubstrings.map((entry) => entry.toLowerCase());
  const found = [];
  for (const dir of dirs) {
    let entries;
    try {
      entries = await readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const lower = entry.toLowerCase();
      if (!matches.some((needle) => lower.includes(needle))) continue;
      const absolutePath = join(dir, entry);
      try {
        const info = await stat(absolutePath);
        if (!info.isFile()) continue;
        if (info.mtimeMs < cutoff) continue;
        found.push({ absolutePath, mtimeMs: info.mtimeMs, name: entry });
      } catch {
        continue;
      }
    }
  }
  found.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return found.slice(0, max).map(({ absolutePath, name }) => ({
    name: `crash-reports/${name}`,
    absolutePath,
    kind: "text"
  }));
}
async function findCrashDumps(lookup) {
  const within = (lookup.withinDays ?? 14) * 24 * 60 * 60 * 1e3;
  const cutoff = Date.now() - within;
  const max = lookup.maxDumps ?? 10;
  const dirs = [lookup.dir, join(lookup.dir, "completed"), join(lookup.dir, "pending"), join(lookup.dir, "reports")];
  const found = [];
  for (const dir of dirs) {
    let entries;
    try {
      entries = await readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.toLowerCase().endsWith(".dmp")) continue;
      const absolutePath = join(dir, entry);
      try {
        const info = await stat(absolutePath);
        if (!info.isFile() || info.mtimeMs < cutoff) continue;
        found.push({ absolutePath, mtimeMs: info.mtimeMs, name: entry });
      } catch {
        continue;
      }
    }
  }
  found.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return found.slice(0, max).map(({ absolutePath, name }) => ({
    name: `crash-dumps/${name}`,
    absolutePath,
    kind: "binary"
  }));
}

// src/automatic.ts
var DIAGNOSTIC_CHUNK_BYTES = 4 * 1024 * 1024;
var DIAGNOSTIC_MAX_BYTES = 100 * 1024 * 1024;
var DIAGNOSTIC_DELIVERY_LOG_PREFIX = "[diagnostics] incident delivered";
async function readAutomaticTextTail(source, limit, signal) {
  const file = await open2(source.absolutePath, "r");
  try {
    let prepend2 = function(part) {
      lineBytes += part.length;
      pending = Buffer.concat([part, pending]).subarray(0, pendingLimit);
    }, retainLine2 = function() {
      if (!pending.toString("utf8").startsWith(DIAGNOSTIC_DELIVERY_LOG_PREFIX)) {
        if (lineBytes > remaining) return false;
        if (lineBytes > 0) retained.push(pending);
        remaining -= lineBytes;
      }
      pending = Buffer.alloc(0);
      lineBytes = 0;
      return remaining > 0;
    };
    var prepend = prepend2, retainLine = retainLine2;
    let position = (await file.stat()).size;
    const start = Math.max(0, source.startOffset ?? 0);
    const block = Buffer.alloc(64 * 1024);
    const retained = [];
    let remaining = limit;
    let pending = Buffer.alloc(0);
    let lineBytes = 0;
    const pendingLimit = Math.max(limit, Buffer.byteLength(DIAGNOSTIC_DELIVERY_LOG_PREFIX));
    while (position > start) {
      signal?.throwIfAborted();
      const length = Math.min(block.length, position - start);
      position -= length;
      const { bytesRead } = await file.read(block, 0, length, position);
      if (bytesRead !== length) throw new Error("log changed during collection");
      let end = bytesRead;
      for (let i = bytesRead - 1; i >= 0; i--) {
        if (block[i] !== 10) continue;
        prepend2(block.subarray(i + 1, end));
        if (!retainLine2()) return Buffer.concat(retained.reverse()).toString("utf8");
        end = i + 1;
      }
      prepend2(block.subarray(0, end));
    }
    if (start === 0) retainLine2();
    else {
      const { bytesRead } = await file.read(block, 0, 1, start - 1);
      if (bytesRead === 1 && block[0] === 10) retainLine2();
    }
    return Buffer.concat(retained.reverse()).toString("utf8");
  } finally {
    await file.close();
  }
}
async function buildAutomaticDiagnostics(input) {
  await mkdir(input.directory, { recursive: true, mode: 448 });
  const manifest = {
    version: 1,
    incidentId: input.incidentId,
    completeness: "complete",
    compressedBytes: 0,
    chunks: []
  };
  let remaining = 96 * 1024 * 1024;
  const notes = [];
  if (input.sources.length === 0) notes.push({ name: "logs", reason: "no_log_sources" });
  if (input.summary && typeof input.summary === "object" && "partial" in input.summary && input.summary.partial === true) {
    notes.push({ name: "incident", reason: "incident_summary_truncated" });
  }
  async function* records() {
    yield JSON.stringify({
      type: "incident",
      format: "diagnostic-jsonl-gzip-v1",
      summary: redactJsonValue(input.summary, input.redaction)
    }) + "\n";
    for (const source of input.sources) {
      input.signal?.throwIfAborted();
      if (source.kind === "binary" || /\.(dmp|core|zip)$/i.test(source.name)) continue;
      if (source.omitReason) {
        notes.push({ name: source.name, reason: source.omitReason });
        continue;
      }
      const size = await stat2(source.absolutePath).then((s) => s.size).catch(() => 0);
      const available = source.startOffset === void 0 ? Infinity : Math.max(0, size - source.startOffset);
      const limit = Math.min(source.tailBytes ?? DIAGNOSTIC_CHUNK_BYTES, DIAGNOSTIC_CHUNK_BYTES, remaining, available);
      if (available === 0) {
        notes.push({ name: source.name, reason: "consent_boundary" });
        continue;
      }
      if (limit <= 0) {
        notes.push({ name: source.name, reason: "incident_size_limit" });
        continue;
      }
      const file = source.kind === "text" ? await readAutomaticTextTail(source, limit, input.signal).then((content2) => ({ content: content2, error: false })).catch(() => ({ content: "", error: true })) : await collectLogSource({ ...source, tailBytes: limit }, input.redaction);
      input.signal?.throwIfAborted();
      if (file.error) {
        notes.push({ name: source.name, reason: "source_unavailable" });
        continue;
      }
      let lines = String(file.content ?? "").split("\n");
      if (source.selectLines) {
        lines = source.selectLines(lines);
        if (lines.length === 0) {
          notes.push({ name: source.name, reason: "no_matching_records" });
          continue;
        }
      }
      if (size > limit) notes.push({ name: source.name, reason: "tail_truncated" });
      const content = lines.filter((line) => !line.startsWith(DIAGNOSTIC_DELIVERY_LOG_PREFIX)).map((line) => redactJsonText(line, input.redaction)).join("\n");
      const encoded = JSON.stringify({ type: "file", name: source.name, content }) + "\n";
      const bytes = Buffer.byteLength(encoded);
      if (bytes > remaining) {
        notes.push({ name: source.name, reason: "incident_size_limit" });
        continue;
      }
      remaining -= bytes;
      yield encoded;
    }
    manifest.completeness = notes.length ? "partial" : "complete";
    yield JSON.stringify({ type: "collection", completeness: manifest.completeness, notes }) + "\n";
  }
  let pending = Buffer.alloc(0);
  async function flush(bytes) {
    input.signal?.throwIfAborted();
    manifest.compressedBytes += bytes.length;
    if (manifest.compressedBytes > DIAGNOSTIC_MAX_BYTES) throw new Error("diagnostic_size_limit");
    const index = manifest.chunks.length;
    await writeFile(join2(input.directory, String(index)), bytes, { mode: 384 });
    manifest.chunks.push({ index, sizeBytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
  }
  const output = new Writable({
    write(data, _encoding, callback) {
      void (async () => {
        pending = Buffer.concat([pending, data]);
        while (pending.length >= DIAGNOSTIC_CHUNK_BYTES) {
          await flush(pending.subarray(0, DIAGNOSTIC_CHUNK_BYTES));
          pending = pending.subarray(DIAGNOSTIC_CHUNK_BYTES);
        }
      })().then(() => callback(), callback);
    },
    final(callback) {
      void flush(pending).then(() => callback(), callback);
    }
  });
  await pipeline(Readable.from(records()), createGzip(), output, { signal: input.signal });
  return { manifest };
}

// src/manifest.ts
import { arch, platform, release, totalmem, type } from "node:os";
function buildManifest(context, files) {
  const warnings = [...context.warnings ?? []];
  for (const file of files) {
    if (file.error) warnings.push(`${file.name}: ${file.error}`);
  }
  return {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    app: context.app,
    source: context.source,
    namespace: context.namespace,
    endpoint: context.endpoint,
    daemonReachable: context.daemonReachable,
    files: files.map((file) => ({
      name: file.name,
      absolutePath: file.absolutePath,
      bytes: file.bytes,
      error: file.error
    })),
    warnings,
    extra: context.extra
  };
}
function buildMachineInfo(username) {
  return {
    hostname: "[REDACTED]",
    platform: platform(),
    release: release(),
    arch: arch(),
    type: type(),
    totalMemoryBytes: totalmem(),
    nodeVersion: process.version,
    pid: process.pid,
    ppid: process.ppid,
    cwd: process.cwd(),
    username: username ? "[REDACTED]" : void 0
  };
}
function diagnosticsFileName(prefix, now = /* @__PURE__ */ new Date()) {
  const iso = now.toISOString().replace(/[:.]/g, "-").replace(/-\d{3}Z$/, "Z");
  return `${prefix}-${iso}.zip`;
}

// src/zip.ts
import JSZip from "jszip";
var PLACEHOLDER_PREFIX = "; file unavailable: ";
function placeholderForMissing(file) {
  return `${PLACEHOLDER_PREFIX}${file.error ?? "unknown error"}
`;
}
async function buildDiagnosticsZip(input) {
  const redaction = input.redaction ?? {};
  const sources = [...input.sources];
  if (input.crashReports != null) {
    const crashes = await findMacOSCrashReports(input.crashReports);
    sources.push(...crashes);
  }
  if (input.crashDumps != null) {
    const dumps = await findCrashDumps(input.crashDumps);
    sources.push(...dumps);
  }
  const collected = await collectLogSources(sources, redaction);
  const manifest = buildManifest(input.context, collected);
  const machineInfo = buildMachineInfo(redaction.username);
  const zip = new JSZip();
  for (const file of collected) {
    zip.file(file.name, file.content ?? placeholderForMissing(file));
  }
  zip.file("summary/manifest.json", JSON.stringify(redactJsonValue(manifest, redaction), null, 2));
  zip.file("summary/machine-info.json", JSON.stringify(redactJsonValue(machineInfo, redaction), null, 2));
  for (const [name, value] of Object.entries(input.summaries ?? {})) {
    const safeName = name.replace(/[^A-Za-z0-9._-]/g, "_");
    zip.file(
      `summary/${safeName}`,
      JSON.stringify(redactJsonValue(value, redaction), null, 2)
    );
  }
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  return { zip: buffer, manifest, machineInfo };
}

// src/agent-logs.ts
import { readdir as readdir2, stat as stat3 } from "node:fs/promises";
import { join as join3 } from "node:path";
var DEFAULT_RUN_EVENT_TAIL_BYTES = 2 * 1024 * 1024;
var DEFAULT_MAX_RUN_EVENT_LOGS = 20;
var DEFAULT_AGENT_LOG_TAIL_BYTES = 2 * 1024 * 1024;
var DEFAULT_MAX_FILES_PER_AGENT = 3;
var SAFE_DIR_ENTRY = /^[A-Za-z0-9._-]+$/u;
async function statSafe(path) {
  try {
    const info = await stat3(path);
    return { mtimeMs: info.mtimeMs, isFile: info.isFile() };
  } catch {
    return null;
  }
}
async function buildRunEventLogSources(runsDir, options = {}) {
  if (!runsDir) return [];
  const maxRuns = options.maxRuns ?? DEFAULT_MAX_RUN_EVENT_LOGS;
  const tailBytes = options.tailBytes ?? DEFAULT_RUN_EVENT_TAIL_BYTES;
  let entries;
  try {
    entries = await readdir2(runsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!SAFE_DIR_ENTRY.test(entry.name)) continue;
    const absolutePath = join3(runsDir, entry.name, "events.jsonl");
    const info = await statSafe(absolutePath);
    if (!info || !info.isFile) continue;
    candidates.push({ runId: entry.name, absolutePath, mtimeMs: info.mtimeMs });
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates.slice(0, maxRuns).map(({ runId, absolutePath }) => ({
    name: `runs/${runId}/events.jsonl`,
    absolutePath,
    kind: "text",
    tailBytes
  }));
}
async function latestLogFilesIn(dir, max) {
  let names;
  try {
    names = await readdir2(dir);
  } catch {
    return [];
  }
  const candidates = [];
  for (const name of names) {
    if (!name.endsWith(".log")) continue;
    if (!SAFE_DIR_ENTRY.test(name)) continue;
    const absolutePath = join3(dir, name);
    const info = await statSafe(absolutePath);
    if (!info || !info.isFile) continue;
    candidates.push({ name, absolutePath, mtimeMs: info.mtimeMs });
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates.slice(0, max).map(({ name, absolutePath }) => ({ name, absolutePath }));
}
async function buildAgentCliLogSources(options) {
  const home = options.homeDir?.trim();
  if (!home) return [];
  const maxFiles = options.maxFilesPerAgent ?? DEFAULT_MAX_FILES_PER_AGENT;
  const tailBytes = options.tailBytes ?? DEFAULT_AGENT_LOG_TAIL_BYTES;
  const xdg = options.xdgDataHome?.trim();
  const openCodeUserLogDir = xdg ? join3(xdg, "opencode", "log") : join3(home, ".local", "share", "opencode", "log");
  const claudeDir = options.claudeConfigDir?.trim() || join3(home, ".claude");
  const codexHome = options.codexHome?.trim() || join3(home, ".codex");
  const agentDirs = [
    // Claude Code operational logs (bash-commands / cost-tracker / daemon).
    { agent: "claude", dir: claudeDir },
    // Codex tracing logs (codex-tui.log can be very large — tail-bounded).
    { agent: "codex", dir: join3(codexHome, "log") },
    // OpenCode session logs (provider errors live here in headless mode).
    { agent: "opencode", dir: openCodeUserLogDir }
  ];
  const amrHome = options.amrOpenCodeHome?.trim();
  const dataDir = options.dataDir?.trim();
  const amrOpenCodeHome = amrHome || (dataDir ? join3(dataDir, "amr", "opencode-home") : "");
  if (amrOpenCodeHome) {
    agentDirs.push({
      agent: "amr",
      dir: join3(amrOpenCodeHome, ".local", "share", "opencode", "log")
    });
  }
  const sources = [];
  for (const { agent, dir } of agentDirs) {
    const files = await latestLogFilesIn(dir, maxFiles);
    for (const file of files) {
      sources.push({
        name: `agent-cli-logs/${agent}/${file.name}`,
        absolutePath: file.absolutePath,
        kind: "text",
        tailBytes
      });
    }
  }
  return sources;
}
export {
  DIAGNOSTICS_CONTENT_TYPE,
  DIAGNOSTICS_EXPORT_PATH,
  DIAGNOSTICS_FILENAME_PREFIX,
  DIAGNOSTIC_CHUNK_BYTES,
  DIAGNOSTIC_DELIVERY_LOG_PREFIX,
  DIAGNOSTIC_MAX_BYTES,
  buildAgentCliLogSources,
  buildAutomaticDiagnostics,
  buildDiagnosticsZip,
  buildMachineInfo,
  buildManifest,
  buildRunEventLogSources,
  collectLogSource,
  collectLogSources,
  diagnosticsFileName,
  findCrashDumps,
  findMacOSCrashReports,
  redactJsonText,
  redactJsonValue,
  redactText
};
