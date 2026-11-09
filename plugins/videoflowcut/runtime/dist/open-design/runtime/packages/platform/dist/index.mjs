// src/command.ts
import { extname } from "node:path";
function quoteWindowsCommandArg(value) {
  if (!/[\s"&<>|^%]/.test(value)) return value;
  const escaped = value.replace(/"/g, '""').replace(/%/g, '"^%"');
  return `"${escaped}"`;
}
function buildCmdShimInvocation(command, args, env) {
  const inner = [command, ...args].map(quoteWindowsCommandArg).join(" ");
  return {
    args: ["/d", "/s", "/c", `"${inner}"`],
    command: env.ComSpec ?? process.env.ComSpec ?? "cmd.exe",
    windowsVerbatimArguments: true
  };
}
var nodeLoadablePackageManagerExtensions = /* @__PURE__ */ new Set([".js", ".cjs", ".mjs"]);
function createCommandInvocation({ args = [], command, env = process.env }) {
  if (process.platform === "win32" && /\.(bat|cmd)$/i.test(command)) {
    return buildCmdShimInvocation(command, args, env);
  }
  return { args, command };
}
function createPackageManagerInvocation(args, env = process.env) {
  const execPath = env.npm_execpath;
  if (execPath) {
    if (nodeLoadablePackageManagerExtensions.has(extname(execPath).toLowerCase())) {
      return { args: [execPath, ...args], command: process.execPath };
    }
    return createCommandInvocation({ args, command: execPath, env });
  }
  if (process.platform === "win32") {
    return buildCmdShimInvocation("corepack", ["pnpm", ...args], env);
  }
  return { args: ["pnpm", ...args], command: "corepack" };
}

// src/proxy-env.ts
import { execFileSync } from "node:child_process";
var CANONICAL_PROXY_ENV_KEYS = /* @__PURE__ */ new Map([
  ["all_proxy", "ALL_PROXY"],
  ["http_proxy", "HTTP_PROXY"],
  ["https_proxy", "HTTPS_PROXY"],
  ["node_use_env_proxy", "NODE_USE_ENV_PROXY"],
  ["no_proxy", "NO_PROXY"]
]);
function defaultSystemProxyCommandRunner(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 2e3,
    windowsHide: true
  });
}
function canonicalProxyEnvKey(key) {
  return CANONICAL_PROXY_ENV_KEYS.get(key.toLowerCase()) ?? null;
}
function deleteProxyEnvVariants(env, canonicalKey) {
  for (const existingKey of Object.keys(env)) {
    if (existingKey.toLowerCase() === canonicalKey.toLowerCase()) delete env[existingKey];
  }
}
function setCanonicalProxyEnvValue(env, canonicalKey, value, platform) {
  deleteProxyEnvVariants(env, canonicalKey);
  if (canonicalKey === "NODE_USE_ENV_PROXY") {
    env.NODE_USE_ENV_PROXY = value;
    return;
  }
  addProxyEnvValue(env, canonicalKey, value, platform);
}
function mergeProxyAwareEnv(platform, ...sources) {
  const merged = {};
  for (const source of sources) {
    const proxyEntries = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(source)) {
      if (value == null) continue;
      const canonicalKey = canonicalProxyEnvKey(key);
      if (canonicalKey) {
        const current = proxyEntries.get(canonicalKey);
        const preferLowercase = key === key.toLowerCase();
        if (!current || preferLowercase || !current.preferLowercase) {
          proxyEntries.set(canonicalKey, { preferLowercase, value });
        }
        continue;
      }
      merged[key] = value;
    }
    for (const [canonicalKey, entry] of proxyEntries) {
      setCanonicalProxyEnvValue(merged, canonicalKey, entry.value, platform);
    }
  }
  if (hasProxyEndpointEnv(merged) && !hasCanonicalProxyEnv(merged, "NODE_USE_ENV_PROXY")) {
    merged.NODE_USE_ENV_PROXY = "1";
  }
  return merged;
}
function hasCanonicalProxyEnv(env, canonicalKey) {
  return Object.keys(env).some((key) => key.toLowerCase() === canonicalKey.toLowerCase());
}
function hasProxyEndpointEnv(env) {
  return ["ALL_PROXY", "HTTP_PROXY", "HTTPS_PROXY"].some((key) => {
    for (const [envKey, value] of Object.entries(env)) {
      if (envKey.toLowerCase() === key.toLowerCase() && value?.trim()) return true;
    }
    return false;
  });
}
function addProxyEnvValue(env, key, value, platform) {
  const trimmed = value.trim();
  if (!trimmed) return;
  env[key] = trimmed;
  if (platform !== "win32") env[key.toLowerCase()] = trimmed;
}
function normalizeBypassToken(token) {
  const trimmed = token.trim();
  if (!trimmed) return [];
  if (trimmed === "<local>") return ["<local>", "localhost", "127.0.0.1", "[::1]", ".local"];
  if (trimmed === "::1") return ["[::1]"];
  if (trimmed.startsWith("*.")) return [`.${trimmed.slice(2)}`];
  return [trimmed];
}
function buildNoProxyValue(tokens) {
  const seen = /* @__PURE__ */ new Set();
  const values = [];
  for (const token of tokens) {
    for (const normalized of normalizeBypassToken(token)) {
      if (!seen.has(normalized)) {
        seen.add(normalized);
        values.push(normalized);
      }
    }
  }
  return values.length > 0 ? values.join(",") : null;
}
function preserveWildcardNoProxyValue(noProxy) {
  return noProxy?.split(",").some((token) => token.trim() === "*") ? "*" : void 0;
}
function normalizeProxyUrl(raw, scheme) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `${scheme}://${trimmed}`;
}
function bracketIpv6Authority(authority) {
  if (authority.startsWith("[") || !authority.includes(":")) return authority;
  const portSeparatorIndex = authority.lastIndexOf(":");
  if (portSeparatorIndex <= 0) return authority;
  const host = authority.slice(0, portSeparatorIndex);
  const port = authority.slice(portSeparatorIndex + 1);
  if (!host.includes(":") || !/^\d+$/.test(port)) return authority;
  return `[${host}]:${port}`;
}
function normalizeAuthorityProxyUrl(raw, scheme) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `${scheme}://${bracketIpv6Authority(trimmed)}`;
}
function normalizeHostPortProxyUrl(host, port, scheme) {
  const trimmedHost = host?.trim() ?? "";
  const trimmedPort = port?.trim() ?? "";
  if (!trimmedHost || !trimmedPort) return null;
  const normalizedHost = trimmedHost.includes(":") && !trimmedHost.startsWith("[") && !trimmedHost.endsWith("]") ? `[${trimmedHost}]` : trimmedHost;
  return normalizeProxyUrl(`${normalizedHost}:${trimmedPort}`, scheme);
}
function finalizeSystemProxyEnv(values, platform) {
  const hasProxy = Boolean(values.httpProxy || values.httpsProxy || values.allProxy);
  const noProxy = hasProxy ? preserveWildcardNoProxyValue(values.noProxy) ?? buildNoProxyValue([
    ...values.noProxy ? values.noProxy.split(",") : [],
    "localhost",
    "127.0.0.1",
    "[::1]"
  ]) : null;
  const env = {};
  if (values.httpProxy) addProxyEnvValue(env, "HTTP_PROXY", values.httpProxy, platform);
  if (values.httpsProxy) addProxyEnvValue(env, "HTTPS_PROXY", values.httpsProxy, platform);
  if (values.allProxy) addProxyEnvValue(env, "ALL_PROXY", values.allProxy, platform);
  if (noProxy) addProxyEnvValue(env, "NO_PROXY", noProxy, platform);
  if (hasProxy) env.NODE_USE_ENV_PROXY = "1";
  return env;
}
function parseMacosScutilProxyOutput(stdout, platform = "darwin") {
  const scalars = /* @__PURE__ */ new Map();
  const exceptions = [];
  let inExceptions = false;
  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^ExceptionsList\s*:\s*<array>\s*\{$/.test(line)) {
      inExceptions = true;
      continue;
    }
    if (inExceptions) {
      if (line === "}") {
        inExceptions = false;
        continue;
      }
      const match2 = line.match(/^\d+\s*:\s*(.+)$/);
      if (match2) exceptions.push(match2[1].trim());
      continue;
    }
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*)\s*:\s*(.+)$/);
    if (match) scalars.set(match[1], match[2].trim());
  }
  const httpProxy = scalars.get("HTTPEnable") === "1" ? normalizeHostPortProxyUrl(scalars.get("HTTPProxy"), scalars.get("HTTPPort"), "http") : null;
  const httpsProxy = scalars.get("HTTPSEnable") === "1" ? normalizeHostPortProxyUrl(scalars.get("HTTPSProxy"), scalars.get("HTTPSPort"), "http") : null;
  const allProxy = scalars.get("SOCKSEnable") === "1" ? normalizeHostPortProxyUrl(scalars.get("SOCKSProxy"), scalars.get("SOCKSPort"), "socks5") : null;
  return finalizeSystemProxyEnv(
    {
      allProxy,
      httpProxy,
      httpsProxy,
      noProxy: buildNoProxyValue([
        ...exceptions,
        ...scalars.get("ExcludeSimpleHostnames") === "1" ? ["<local>"] : []
      ])
    },
    platform
  );
}
function parseRegistryValue(stdout, valueName) {
  const match = stdout.match(new RegExp(`^\\s*${valueName}\\s+REG_\\w+\\s+(.+)$`, "m"));
  return match ? match[1].trim() : null;
}
function parseWindowsInternetSettingsProxyOutput(input, platform = "win32") {
  const enabled = parseRegistryValue(input.proxyEnable, "ProxyEnable");
  if (enabled == null || !/^(1|0x1)$/i.test(enabled)) return {};
  const proxyServer = parseRegistryValue(input.proxyServer ?? "", "ProxyServer") ?? "";
  const proxyOverride = parseRegistryValue(input.proxyOverride ?? "", "ProxyOverride") ?? "";
  if (!proxyServer.trim()) return {};
  let httpProxy = null;
  let httpsProxy = null;
  let allProxy = null;
  if (proxyServer.includes("=")) {
    for (const segment of proxyServer.split(";")) {
      const [kind, rawValue] = segment.split("=", 2);
      const value = rawValue?.trim();
      if (!kind || !value) continue;
      const lowerKind = kind.trim().toLowerCase();
      if (lowerKind === "http") httpProxy = normalizeAuthorityProxyUrl(value, "http");
      else if (lowerKind === "https") httpsProxy = normalizeAuthorityProxyUrl(value, "http");
      else if (lowerKind === "socks") allProxy = normalizeAuthorityProxyUrl(value, "socks5");
    }
  } else {
    const shared = normalizeAuthorityProxyUrl(proxyServer, "http");
    httpProxy = shared;
    httpsProxy = shared;
  }
  return finalizeSystemProxyEnv(
    {
      allProxy,
      httpProxy,
      httpsProxy,
      noProxy: buildNoProxyValue(proxyOverride.split(/[;,]/))
    },
    platform
  );
}
function resolveSystemProxyEnv(options = {}) {
  const platform = options.platform ?? process.platform;
  const runCommand = options.runCommand ?? defaultSystemProxyCommandRunner;
  const tryRun = (command, args) => {
    try {
      return runCommand(command, args);
    } catch {
      return "";
    }
  };
  try {
    if (platform === "darwin") {
      return parseMacosScutilProxyOutput(tryRun("scutil", ["--proxy"]), platform);
    }
    if (platform === "win32") {
      return parseWindowsInternetSettingsProxyOutput(
        {
          proxyEnable: tryRun("reg", [
            "query",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
            "/v",
            "ProxyEnable"
          ]),
          proxyOverride: tryRun("reg", [
            "query",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
            "/v",
            "ProxyOverride"
          ]),
          proxyServer: tryRun("reg", [
            "query",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
            "/v",
            "ProxyServer"
          ])
        },
        platform
      );
    }
  } catch {
    return {};
  }
  return {};
}

// src/process.ts
import { execFile, spawn } from "node:child_process";
import { posix, win32 } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
function snapshotBudget(options) {
  if (options.timeoutMs === void 0) return {};
  if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new RangeError("Process snapshot timeout must be a positive integer");
  }
  return { timeout: options.timeoutMs, killSignal: "SIGKILL" };
}
function normalizedGraceMs(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : void 0;
}
function normalizeExecutablePath(path, platform) {
  const normalized = platform === "win32" ? win32.normalize(path) : posix.normalize(path);
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}
function processCommandExactlyRunsExecutable(command, executablePath, platform = process.platform) {
  const trimmed = command.trim();
  if (normalizeExecutablePath(trimmed, platform) === normalizeExecutablePath(executablePath, platform)) {
    return true;
  }
  if (platform !== "win32" || trimmed.length < 2 || !trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    return false;
  }
  return normalizeExecutablePath(trimmed.slice(1, -1), platform) === normalizeExecutablePath(executablePath, platform);
}
function errorCode(error) {
  if (typeof error !== "object" || error == null || !("code" in error)) return null;
  const code = error.code;
  return code == null ? null : String(code);
}
function createProcessStampArgs(stamp, contract) {
  const normalized = contract.normalizeStamp(stamp);
  return contract.stampFields.map((field) => {
    const value = normalized[field];
    if (typeof value !== "string") {
      throw new Error(`process stamp field ${field} must normalize to a string`);
    }
    return `${contract.stampFlags[field]}=${value}`;
  });
}
function commandArgs(command) {
  return command.trim().split(/\s+/).filter((part) => part.length > 0);
}
function readFlagValue(args, flagName) {
  const inlinePrefix = `${flagName}=`;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === flagName) return args[index + 1] ?? null;
    if (typeof argument === "string" && argument.startsWith(inlinePrefix)) {
      return argument.slice(inlinePrefix.length);
    }
  }
  return null;
}
function readProcessStamp(args, contract) {
  try {
    const input = Object.fromEntries(
      contract.stampFields.map((field) => [field, readFlagValue(args, contract.stampFlags[field])])
    );
    return contract.normalizeStamp(input);
  } catch {
    return null;
  }
}
function readProcessStampFromCommand(command, contract) {
  return readProcessStamp(commandArgs(command), contract);
}
function matchesProcessStamp(stamp, criteria, contract) {
  const normalizedStamp = contract.normalizeStamp(stamp);
  const normalizedCriteria = contract.normalizeStampCriteria(criteria ?? {});
  return contract.stampFields.every((field) => {
    const expected = normalizedCriteria[field];
    return expected == null || normalizedStamp[field] === expected;
  });
}
function matchesStampedProcess(processInfo, criteria, contract) {
  const stamp = readProcessStampFromCommand(processInfo.command, contract);
  return stamp != null && matchesProcessStamp(stamp, criteria, contract);
}
function createLoggedStdio(logFd) {
  return logFd == null ? ["ignore", "ignore", "ignore"] : ["ignore", logFd, logFd];
}
async function waitForChildSpawn(child) {
  await new Promise((resolveSpawn, rejectSpawn) => {
    child.once("error", rejectSpawn);
    child.once("spawn", resolveSpawn);
  });
}
async function spawnBackgroundProcess(request) {
  const invocation = createCommandInvocation(request);
  const child = spawn(invocation.command, invocation.args, {
    cwd: request.cwd,
    detached: request.detached ?? true,
    env: request.env,
    stdio: createLoggedStdio(request.logFd),
    windowsHide: process.platform === "win32",
    windowsVerbatimArguments: invocation.windowsVerbatimArguments
  });
  await waitForChildSpawn(child);
  if (child.pid == null) throw new Error(`failed to spawn background process: ${invocation.command}`);
  child.unref();
  return { pid: child.pid };
}
async function spawnLoggedProcess(request) {
  const invocation = createCommandInvocation(request);
  const child = spawn(invocation.command, invocation.args, {
    cwd: request.cwd,
    detached: request.detached ?? false,
    env: request.env,
    stdio: createLoggedStdio(request.logFd),
    windowsHide: process.platform === "win32",
    windowsVerbatimArguments: invocation.windowsVerbatimArguments
  });
  await waitForChildSpawn(child);
  if (child.pid == null) throw new Error(`failed to spawn process: ${invocation.command}`);
  return child;
}
function isProcessAlive(pid) {
  if (typeof pid !== "number") return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (errorCode(error) === "ESRCH") return false;
    return true;
  }
}
async function waitForProcessExit(pid, timeoutMs = 5e3) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!isProcessAlive(pid)) return true;
    await sleep(100);
  }
  return !isProcessAlive(pid);
}
function parsePsOutput(stdout) {
  return stdout.split(/\r?\n/).map((line) => {
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);
    if (!match) return null;
    return { pid: Number(match[1]), ppid: Number(match[2]), command: match[3] };
  }).filter((snapshot) => snapshot != null);
}
async function listPosixProcessSnapshots(options = {}) {
  const stdout = await new Promise((resolveList, rejectList) => {
    execFile("ps", ["-axo", "pid=,ppid=,command="], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, ...snapshotBudget(options) }, (error, out) => {
      if (error) rejectList(error);
      else resolveList(out);
    });
  });
  return parsePsOutput(stdout);
}
async function listWindowsProcessSnapshots(options = {}) {
  const command = [
    "$ErrorActionPreference = 'Stop'",
    "Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, CommandLine, @{Name='StartedAtMs';Expression={([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds()}} | ConvertTo-Json -Compress"
  ].join("; ");
  const stdout = await new Promise((resolveList, rejectList) => {
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, ...snapshotBudget(options) }, (error, out) => {
      if (error) rejectList(error);
      else resolveList(out);
    });
  });
  return parseWindowsProcessSnapshots(stdout);
}
async function captureProcessSnapshotsByPids(pids) {
  const exactPids = [...new Set(pids.filter((pid) => Number.isSafeInteger(pid) && pid > 0))];
  if (exactPids.length === 0) return [];
  if (process.platform !== "win32") {
    const wanted = new Set(exactPids);
    return (await captureProcessSnapshot()).filter(({ pid }) => wanted.has(pid));
  }
  const filter = exactPids.map((pid) => `ProcessId = ${pid}`).join(" OR ");
  const command = [
    "$ErrorActionPreference = 'Stop'",
    `Get-CimInstance Win32_Process -Filter "${filter}" | Select-Object ProcessId, ParentProcessId, CommandLine, @{Name='StartedAtMs';Expression={([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds()}} | ConvertTo-Json -Compress`
  ].join("; ");
  const stdout = await new Promise((resolveList, rejectList) => {
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8", maxBuffer: 1024 * 1024 }, (error, out) => {
      if (error) rejectList(error);
      else resolveList(out);
    });
  });
  return parseWindowsProcessSnapshots(stdout);
}
function parseWindowsProcessSnapshots(stdout) {
  const payload = stdout.trim();
  if (!payload) return [];
  const records = JSON.parse(payload);
  return (Array.isArray(records) ? records : [records]).map((record) => {
    const pid = Number(record.ProcessId);
    const ppid = Number(record.ParentProcessId);
    const startedAtMs = Number(record.StartedAtMs);
    const commandLine = record.CommandLine?.trim();
    if (!commandLine || Number.isNaN(pid) || Number.isNaN(ppid)) return null;
    return {
      command: commandLine,
      pid,
      ppid,
      ...Number.isSafeInteger(startedAtMs) && startedAtMs > 0 ? { startedAtMs } : {}
    };
  }).filter((snapshot) => snapshot != null);
}
async function captureProcessSnapshot(options = {}) {
  return process.platform === "win32" ? await listWindowsProcessSnapshots(options) : await listPosixProcessSnapshots(options);
}
async function listProcessSnapshots() {
  try {
    return await captureProcessSnapshot();
  } catch {
    return [];
  }
}
function selectStampedProcessesAtInvocation(snapshots, criteria, contract, invokedAtMs, platform = process.platform) {
  const matches = snapshots.filter((snapshot) => matchesStampedProcess(snapshot, criteria, contract));
  if (platform !== "win32") return matches;
  return matches.filter((snapshot) => {
    if (snapshot.startedAtMs == null || snapshot.startedAtMs === invokedAtMs) {
      throw new Error(`cannot establish process generation boundary for pid ${snapshot.pid}`);
    }
    if (snapshot.startedAtMs > invokedAtMs) return false;
    return snapshot.startedAtMs < invokedAtMs;
  });
}
async function captureStampedProcessSnapshot(criteria, contract) {
  const invokedAtMs = Date.now();
  const processes = await captureProcessSnapshot();
  const matches = selectStampedProcessesAtInvocation(processes, criteria, contract, invokedAtMs);
  const matchedPids = new Set(matches.map(({ pid }) => pid));
  return {
    matches,
    processes,
    roots: matches.filter(({ ppid }) => !matchedPids.has(ppid))
  };
}
async function captureStampedProcessSetSnapshot(criteriaSet, contract) {
  const invokedAtMs = Date.now();
  const processes = process.platform === "win32" ? await captureWindowsStampedProcessTrees(criteriaSet, contract) : await captureProcessSnapshot();
  return {
    entries: criteriaSet.map((criteria) => {
      const matches = selectStampedProcessesAtInvocation(
        processes,
        criteria,
        contract,
        invokedAtMs
      );
      const matchedPids = new Set(matches.map(({ pid }) => pid));
      return {
        criteria,
        matches,
        processes,
        roots: matches.filter(({ ppid }) => !matchedPids.has(ppid))
      };
    }),
    processes
  };
}
async function captureWindowsStampedProcessTrees(criteriaSet, contract) {
  if (criteriaSet.length === 0) return [];
  const clauses = criteriaSet.map((criteria) => {
    const normalized = contract.normalizeStampCriteria(criteria);
    const fields = contract.stampFields.flatMap((field) => {
      const value = normalized[field];
      if (typeof value !== "string") return [];
      const needle = `${contract.stampFlags[field]}=${value}`.replaceAll("'", "''");
      return [`CommandLine LIKE '%${needle}%'`];
    });
    return fields.length === 0 ? "CommandLine IS NOT NULL" : `(${fields.join(" AND ")})`;
  });
  const rootFilter = [...new Set(clauses)].join(" OR ");
  const powershellRootFilter = `'${rootFilter.replaceAll("'", "''")}'`;
  const command = [
    "$ErrorActionPreference = 'Stop'",
    `$roots = @(Get-CimInstance Win32_Process -Filter ${powershellRootFilter})`,
    "$all = [System.Collections.Generic.List[object]]::new()",
    "$seen = @{}",
    "$frontier = [System.Collections.Generic.List[int]]::new()",
    "foreach ($process in $roots) { $pidValue = [int]$process.ProcessId; if (-not $seen.ContainsKey($pidValue)) { $seen[$pidValue] = $true; $all.Add($process); $frontier.Add($pidValue) } }",
    "while ($frontier.Count -gt 0) {",
    `  $childFilter = (($frontier | ForEach-Object { "ParentProcessId = $_" }) -join ' OR ')`,
    "  $frontier = [System.Collections.Generic.List[int]]::new()",
    "  $children = @(Get-CimInstance Win32_Process -Filter $childFilter)",
    "  foreach ($process in $children) { $pidValue = [int]$process.ProcessId; if (-not $seen.ContainsKey($pidValue)) { $seen[$pidValue] = $true; $all.Add($process); $frontier.Add($pidValue) } }",
    "}",
    "$all | Select-Object ProcessId, ParentProcessId, CommandLine, @{Name='StartedAtMs';Expression={([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds()}} | ConvertTo-Json -Compress"
  ].join("; ");
  const stdout = await new Promise((resolveList, rejectList) => {
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }, (error, out) => {
      if (error) rejectList(error);
      else resolveList(out);
    });
  });
  return parseWindowsProcessSnapshots(stdout);
}
function collectProcessTreePids(processes, rootPids) {
  const queue = [...new Set(rootPids.filter((pid) => typeof pid === "number"))];
  const visited = /* @__PURE__ */ new Set();
  const childrenByParent = /* @__PURE__ */ new Map();
  for (const processInfo of processes) {
    const children = childrenByParent.get(processInfo.ppid) ?? [];
    children.push(processInfo.pid);
    childrenByParent.set(processInfo.ppid, children);
  }
  while (queue.length > 0) {
    const pid = queue.shift();
    if (pid == null || visited.has(pid)) continue;
    visited.add(pid);
    for (const childPid of childrenByParent.get(pid) ?? []) {
      if (!visited.has(childPid)) queue.push(childPid);
    }
  }
  return [...visited].sort((left, right) => right - left);
}
function selectOwnedProcessTree(known, current) {
  const validTime = (value) => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
  const currentByPid = new Map(current.map((entry) => [entry.pid, entry]));
  const selected = /* @__PURE__ */ new Map();
  const queue = known.flatMap((entry) => {
    const live = currentByPid.get(entry.pid);
    return live && validTime(entry.startedAtMs) && live.startedAtMs === entry.startedAtMs ? [live] : [];
  });
  for (let index = 0; index < queue.length; index++) {
    const parent = queue[index];
    if (selected.has(parent.pid)) continue;
    selected.set(parent.pid, parent);
    queue.push(...current.filter((entry) => entry.ppid === parent.pid && validTime(entry.startedAtMs) && entry.startedAtMs >= parent.startedAtMs));
  }
  return [...selected.values()];
}
var LSTART_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parsePosixProcessIdentities(stdout) {
  const identities = [];
  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(\d+)\s+(\d+)\s+(\d+)\s+[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(\d{4})\s*(.*)$/
    );
    if (!match) continue;
    const month = LSTART_MONTHS.indexOf(match[4]);
    const startedAtMs = month < 0 ? Number.NaN : new Date(
      Number(match[9]),
      month,
      Number(match[5]),
      Number(match[6]),
      Number(match[7]),
      Number(match[8])
    ).getTime();
    identities.push({
      command: (match[10] ?? "").trim(),
      pid: Number(match[1]),
      ppid: Number(match[2]),
      processGroupId: Number(match[3]),
      startedAtMs: Number.isFinite(startedAtMs) ? startedAtMs : null,
      startedAtResolutionMs: 1e3
    });
  }
  return identities;
}
async function readProcessIdentities(pids) {
  const exactPids = [...new Set(pids.filter((pid) => Number.isSafeInteger(pid) && pid > 0))];
  const result = /* @__PURE__ */ new Map();
  if (exactPids.length === 0) return result;
  if (process.platform === "win32") {
    for (const snapshot of await captureProcessSnapshotsByPids(exactPids)) {
      result.set(snapshot.pid, {
        command: snapshot.command,
        pid: snapshot.pid,
        ppid: snapshot.ppid,
        processGroupId: null,
        startedAtMs: snapshot.startedAtMs ?? null,
        startedAtResolutionMs: 1
      });
    }
    return result;
  }
  const stdout = await new Promise((resolveList, rejectList) => {
    execFile(
      "ps",
      ["-o", "pid=,ppid=,pgid=,lstart=,command=", "-p", exactPids.join(",")],
      { encoding: "utf8", env: { ...process.env, LC_ALL: "C" }, maxBuffer: 8 * 1024 * 1024 },
      (error, out, err) => {
        if (!error || out.length > 0) {
          resolveList(out);
          return;
        }
        if (error.code === 1 && err.trim().length === 0) {
          resolveList("");
          return;
        }
        rejectList(error);
      }
    );
  });
  const wanted = new Set(exactPids);
  for (const identity of parsePosixProcessIdentities(stdout)) {
    if (wanted.has(identity.pid)) result.set(identity.pid, identity);
  }
  return result;
}
function isProcessGroupAlive(processGroupId) {
  if (process.platform === "win32" || typeof processGroupId !== "number" || !Number.isSafeInteger(processGroupId) || processGroupId <= 0) {
    return false;
  }
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch (error) {
    return errorCode(error) === "EPERM";
  }
}
async function terminateProcessGroup(processGroupId, options = {}) {
  if (!isProcessGroupAlive(processGroupId)) {
    return { alreadyStopped: true, forced: false, survived: false };
  }
  const signalGroup = (signal) => {
    try {
      process.kill(-processGroupId, signal);
    } catch {
    }
  };
  const waitForGroupExit = async (timeoutMs) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (!isProcessGroupAlive(processGroupId)) return true;
      await sleep(25);
    }
    return !isProcessGroupAlive(processGroupId);
  };
  signalGroup("SIGTERM");
  if (await waitForGroupExit(normalizedGraceMs(options.termGraceMs) ?? 5e3)) {
    return { alreadyStopped: false, forced: false, survived: false };
  }
  signalGroup("SIGKILL");
  const gone = await waitForGroupExit(normalizedGraceMs(options.killGraceMs) ?? 5e3);
  return { alreadyStopped: false, forced: true, survived: !gone };
}
function signalProcesses(pids, signal, onSignal) {
  for (const pid of pids) {
    try {
      process.kill(pid, signal);
    } catch (error) {
      if (errorCode(error) !== "ESRCH") throw error;
      continue;
    }
    onSignal?.(pid, signal);
  }
}
async function waitForProcessesToExit(pids, timeoutMs = 5e3) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const remaining = pids.filter(isProcessAlive);
    if (remaining.length === 0) return [];
    await sleep(100);
  }
  return pids.filter(isProcessAlive);
}
async function stopProcesses(pids, options = {}) {
  const uniquePids = [...new Set(pids)].filter((pid) => typeof pid === "number" && pid !== process.pid).sort((left, right) => right - left);
  if (uniquePids.length === 0) {
    return { alreadyStopped: true, forcedPids: [], matchedPids: [], remainingPids: [], stoppedPids: [] };
  }
  signalProcesses(uniquePids, "SIGTERM", options.onSignal);
  const remainingAfterTerm = await waitForProcessesToExit(
    uniquePids,
    normalizedGraceMs(options.termGraceMs)
  );
  if (remainingAfterTerm.length === 0) {
    return { alreadyStopped: false, forcedPids: [], matchedPids: uniquePids, remainingPids: [], stoppedPids: uniquePids };
  }
  signalProcesses(remainingAfterTerm, "SIGKILL", options.onSignal);
  const remainingAfterKill = await waitForProcessesToExit(
    remainingAfterTerm,
    normalizedGraceMs(options.killGraceMs)
  );
  const stoppedPids = uniquePids.filter((pid) => !remainingAfterKill.includes(pid));
  return { alreadyStopped: false, forcedPids: remainingAfterTerm, matchedPids: uniquePids, remainingPids: remainingAfterKill, stoppedPids };
}

// src/fs.ts
import { copyFile, mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
function errorCode2(error) {
  if (typeof error !== "object" || error == null || !("code" in error)) return null;
  const code = error.code;
  return code == null ? null : String(code);
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function pathContains(root, target) {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(target);
  const rel = relative(resolvedRoot, resolvedTarget);
  return rel === "" || rel.length > 0 && !rel.startsWith("..") && !isAbsolute(rel);
}
function destinationExistsError(destinationPath) {
  const error = new Error(`destination already exists: ${destinationPath}`);
  error.code = "EEXIST";
  return error;
}
async function atomicCopyFile(sourcePath, destinationPath, options = {}) {
  const source = resolve(sourcePath);
  const destination = resolve(destinationPath);
  if (source === destination) {
    const entry = await stat(destination);
    if (!entry.isFile()) throw new Error(`destination is not a file: ${destination}`);
    return { bytesCopied: entry.size, replaced: true };
  }
  const destinationDir = dirname(destination);
  await mkdir(destinationDir, { recursive: true });
  const existing = await stat(destination).catch((error) => {
    if (errorCode2(error) === "ENOENT") return null;
    throw error;
  });
  if (existing != null && options.overwrite !== true) {
    throw destinationExistsError(destination);
  }
  const tempPath = join(
    destinationDir,
    `.${basename(destination)}.${process.pid}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}.tmp`
  );
  try {
    await copyFile(source, tempPath);
    if (options.overwrite === true) {
      await rm(destination, { force: true });
    }
    await rename(tempPath, destination);
    const copied = await stat(destination);
    return { bytesCopied: copied.size, replaced: existing != null };
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => void 0);
    throw error;
  }
}
async function removePathBestEffort(path, options = {}) {
  try {
    await rm(path, { force: true, recursive: options.recursive ?? true });
    return { removed: true };
  } catch (error) {
    return { error: errorMessage(error), removed: false };
  }
}
async function readLogTail(filePath, maxLines = 80) {
  try {
    const payload = await readFile(filePath, "utf8");
    return payload.split(/\r?\n/).filter((line) => line.length > 0).slice(-maxLines);
  } catch {
    return [];
  }
}

// src/http.ts
import { setTimeout as sleep2 } from "node:timers/promises";
function errorMessage2(error) {
  return error instanceof Error ? error.message : String(error);
}
async function waitForHttpOk(url, { timeoutMs = 2e4 } = {}) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return true;
      lastError = new Error(`HTTP ${response.status} from ${url}`);
    } catch (error) {
      lastError = new Error(errorMessage2(error));
    }
    await sleep2(150);
  }
  throw new Error(`timed out waiting for ${url}${lastError ? ` (${lastError.message})` : ""}`);
}

// src/toolchain.ts
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute as isAbsolute2, join as join2 } from "node:path";
function resolveUserScopedHome(raw, home) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length === 0) return null;
  if (value === "~") return home;
  if (value.startsWith("~/") || value.startsWith("~\\")) {
    return join2(home, value.slice(2));
  }
  return isAbsolute2(value) ? value : null;
}
function wellKnownUserToolchainBins(options = {}) {
  const home = options.home ?? homedir();
  const includeSystemBins = options.includeSystemBins ?? process.platform !== "win32";
  const env = options.env ?? process.env;
  const dirs = [];
  const vpHome = resolveUserScopedHome(env.VP_HOME, home);
  if (vpHome) {
    dirs.push(join2(vpHome, "bin"));
  }
  const npmPrefixRaw = env.NPM_CONFIG_PREFIX ?? env.npm_config_prefix;
  if (typeof npmPrefixRaw === "string") {
    const npmPrefix = npmPrefixRaw.trim();
    if (npmPrefix.length > 0) {
      dirs.push(join2(npmPrefix, "bin"));
      if (process.platform === "win32") {
        dirs.push(npmPrefix);
      }
    }
  }
  if (process.platform === "win32") {
    dirs.push(join2(home, "AppData", "Roaming", "npm"));
  }
  dirs.push(
    join2(home, ".local", "bin"),
    join2(home, ".vite-plus", "bin"),
    join2(home, ".kimi-code", "bin"),
    join2(home, ".opencode", "bin"),
    join2(home, ".grok", "bin"),
    join2(home, ".bun", "bin"),
    join2(home, ".volta", "bin"),
    join2(home, ".asdf", "shims"),
    join2(home, "Library", "pnpm"),
    join2(home, ".cargo", "bin"),
    // Common user-level npm prefixes for sudo-free global installs.
    // ~/.npm-global is the dominant non-canonical convention shipped
    // in most third-party "fix npm EACCES" tutorials, and
    // ~/.npm-packages is the second-most common variant. Without
    // these, GUI-launched daemons miss `npm i -g`'d CLIs even though
    // they resolve cleanly from the user's shell. See open-design
    // issue #442.
    join2(home, ".npm-global", "bin"),
    join2(home, ".npm-packages", "bin"),
    // Other common user-level toolchains that install CLI shims outside the
    // Node ecosystem but still ship agent CLIs (or their dependencies):
    // Deno's install root, Go's default GOBIN, and pyenv's shim dir. All are
    // best-effort — a missing dir contributes nothing.
    join2(home, ".deno", "bin"),
    join2(home, "go", "bin"),
    join2(home, ".pyenv", "shims")
  );
  if (process.platform === "win32") {
    dirs.push(join2(home, "scoop", "shims"));
    const appData = typeof env.APPDATA === "string" ? env.APPDATA.trim() : "";
    if (appData.length > 0) {
      dirs.push(join2(appData, "npm"));
    }
  }
  const miseDataOverride = resolveUserScopedHome(env.MISE_DATA_DIR, home);
  const miseData = miseDataOverride || join2(home, ".local", "share", "mise");
  dirs.push(join2(miseData, "shims"));
  if (!miseDataOverride) {
    dirs.push(join2(home, ".mise", "shims"));
  }
  dirs.push(join2(home, ".nix-profile", "bin"));
  if (includeSystemBins) {
    dirs.push("/opt/homebrew/bin", "/usr/local/bin");
    dirs.push("/run/current-system/sw/bin");
    dirs.push("/nix/var/nix/profiles/default/bin");
  }
  const miseInstalls = join2(miseData, "installs");
  dirs.push(...existingMiseNpmPackageBinDirs(miseInstalls));
  const nodeInstallRoots = [
    {
      root: join2(miseInstalls, "node"),
      segments: ["bin"]
    },
    {
      root: join2(home, ".nvm", "versions", "node"),
      segments: ["bin"]
    },
    {
      root: join2(home, ".local", "share", "fnm", "node-versions"),
      segments: ["installation", "bin"]
    },
    {
      root: join2(home, ".fnm", "node-versions"),
      segments: ["installation", "bin"]
    }
  ];
  if (process.platform === "win32") {
    const fnmDirOverride = typeof env.FNM_DIR === "string" ? env.FNM_DIR.trim() : "";
    const fnmRoots = [];
    if (fnmDirOverride.length > 0) {
      fnmRoots.push(fnmDirOverride);
    } else {
      for (const base of [env.LOCALAPPDATA, env.APPDATA]) {
        const trimmed = typeof base === "string" ? base.trim() : "";
        if (trimmed.length > 0) fnmRoots.push(join2(trimmed, "fnm"));
      }
    }
    for (const fnmRoot of fnmRoots) {
      nodeInstallRoots.push({ root: join2(fnmRoot, "node-versions"), segments: ["installation"] });
    }
  }
  for (const installRoot of nodeInstallRoots) {
    for (const dir of existingChildBinDirs(installRoot.root, installRoot.segments)) {
      dirs.push(dir);
    }
  }
  return dirs;
}
function existingMiseNpmPackageBinDirs(root) {
  const out = [];
  for (const packageName of ["npm-openai-codex"]) {
    const packageRoot = join2(root, packageName);
    out.push(...existingChildBinDirs(packageRoot, ["bin"]));
  }
  return out;
}
function existingChildBinDirs(root, segments) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(root, { encoding: "utf8", withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of sortVersionedDirEntries(entries)) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const candidate = join2(root, entry.name, ...segments);
    if (existsSync(candidate)) out.push(candidate);
  }
  return out;
}
function sortVersionedDirEntries(entries) {
  return [...entries].sort((left, right) => compareVersionLikeDirNames(left.name, right.name));
}
function compareVersionLikeDirNames(left, right) {
  const leftSemver = parseVersionLikeDirName(left);
  const rightSemver = parseVersionLikeDirName(right);
  if (leftSemver && rightSemver) {
    for (let index = 0; index < leftSemver.length; index += 1) {
      const difference = rightSemver[index] - leftSemver[index];
      if (difference !== 0) return difference;
    }
  } else if (leftSemver) {
    return -1;
  } else if (rightSemver) {
    return 1;
  }
  return left.localeCompare(right);
}
function parseVersionLikeDirName(name) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(name);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
export {
  atomicCopyFile,
  captureProcessSnapshot,
  captureProcessSnapshotsByPids,
  captureStampedProcessSetSnapshot,
  captureStampedProcessSnapshot,
  collectProcessTreePids,
  createCommandInvocation,
  createPackageManagerInvocation,
  createProcessStampArgs,
  isProcessAlive,
  isProcessGroupAlive,
  listProcessSnapshots,
  matchesProcessStamp,
  matchesStampedProcess,
  mergeProxyAwareEnv,
  parseMacosScutilProxyOutput,
  parseWindowsInternetSettingsProxyOutput,
  pathContains,
  processCommandExactlyRunsExecutable,
  readFlagValue,
  readLogTail,
  readProcessIdentities,
  readProcessStamp,
  readProcessStampFromCommand,
  removePathBestEffort,
  resolveSystemProxyEnv,
  selectOwnedProcessTree,
  signalProcesses,
  spawnBackgroundProcess,
  spawnLoggedProcess,
  stopProcesses,
  terminateProcessGroup,
  waitForHttpOk,
  waitForProcessExit,
  wellKnownUserToolchainBins
};
