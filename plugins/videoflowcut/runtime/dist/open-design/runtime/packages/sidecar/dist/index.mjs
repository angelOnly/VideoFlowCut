// src/paths.ts
import { dirname, join, resolve } from "node:path";
function resolveNamespace(options) {
  return options.contract.normalizeNamespace(
    options.namespace ?? options.env?.[options.contract.env.namespace] ?? options.contract.defaults.namespace
  );
}
function resolveProjectRoot(projectRoot) {
  if (typeof projectRoot !== "string" || projectRoot.trim().length === 0) {
    throw new Error("projectRoot must be a non-empty string");
  }
  return resolve(projectRoot);
}
function resolveProjectTmpRoot({
  contract,
  projectRoot
}) {
  return join(resolveProjectRoot(projectRoot), contract.defaults.projectTmpDirName);
}
function resolveSourceRuntimeRoot({
  contract,
  projectRoot,
  source
}) {
  return join(resolveProjectTmpRoot({ contract, projectRoot }), contract.normalizeSource(source));
}
function resolveSidecarBase({
  base,
  contract,
  env = process.env,
  projectRoot,
  source
}) {
  const explicitBase = base ?? env[contract.env.base];
  if (explicitBase != null && explicitBase.length > 0) return resolve(explicitBase);
  return resolve(resolveSourceRuntimeRoot({
    contract,
    projectRoot: projectRoot ?? process.cwd(),
    source
  }));
}
function resolveNamespaceRoot({
  base,
  contract,
  namespace
}) {
  return join(resolve(base), contract.normalizeNamespace(namespace));
}
function resolveRuntimeNamespaceRoot({
  contract,
  runtime,
  runtimeMode
}) {
  if (runtime.mode === runtimeMode) {
    return dirname(resolve(runtime.base));
  }
  return resolveNamespaceRoot({ base: runtime.base, contract, namespace: runtime.namespace });
}
function resolveRuntimeRoot({
  base,
  contract,
  namespace,
  runId
}) {
  return join(resolveNamespaceRoot({ base, contract, namespace }), "runs", runId);
}
function resolvePointerPath({ base, contract, namespace }) {
  return join(resolveNamespaceRoot({ base, contract, namespace }), "current.json");
}
function resolveManifestPath({ runtimeRoot }) {
  return join(runtimeRoot, "manifest.json");
}
function resolveLogsDir({
  app,
  contract,
  runtimeRoot
}) {
  return join(runtimeRoot, "logs", contract.normalizeApp(app));
}
function resolveLogFilePath({
  app,
  contract,
  fileName = "latest.log",
  runtimeRoot
}) {
  return join(resolveLogsDir({ app, contract, runtimeRoot }), fileName);
}
function resolveAppRuntimeDir({
  app,
  contract,
  namespaceRoot
}) {
  return join(namespaceRoot, contract.normalizeApp(app));
}
function resolveAppRuntimePath({
  app,
  contract,
  fileName,
  namespaceRoot
}) {
  if (fileName.length === 0 || fileName.includes("\0") || /[\\/]/.test(fileName)) {
    throw new Error(`app runtime fileName must be a simple path segment: ${fileName}`);
  }
  return join(resolveAppRuntimeDir({ app, contract, namespaceRoot }), fileName);
}

// src/net.ts
import { createServer as createNetServer } from "node:net";
async function closeServer(server) {
  if (!server.listening) return;
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => error == null ? resolveClose() : rejectClose(error));
  });
}
async function listenOnPort(port, host) {
  const server = createNetServer();
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen({ port, host, exclusive: true }, () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
  return server;
}

// src/port.ts
function parsePort(value, label) {
  if (value == null || value === "") return null;
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`${label} port must be an integer between 1 and 65535`);
  }
  return port;
}
function errorCode(error) {
  if (typeof error !== "object" || error == null || !("code" in error)) return null;
  const code = error.code;
  return code == null ? null : String(code);
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
async function allocateForcedPort(port, label, host, reserved) {
  if (reserved.has(port)) {
    throw new Error(`forced ${label} port ${port} conflicts with another managed port`);
  }
  let server = null;
  try {
    server = await listenOnPort(port, host);
  } catch (error) {
    throw new Error(`forced ${label} port ${port} is not available (${errorCode(error) ?? errorMessage(error)})`);
  } finally {
    if (server) await closeServer(server);
  }
  reserved.add(port);
  return { port, source: "forced" };
}
async function allocateDynamicPort(label, host, reserved) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const server = await listenOnPort(0, host);
    const address = server.address();
    await closeServer(server);
    if (address == null || typeof address === "string") {
      throw new Error(`failed to allocate dynamic ${label} port`);
    }
    if (!reserved.has(address.port)) {
      reserved.add(address.port);
      return { port: address.port, source: "dynamic" };
    }
  }
  throw new Error(`failed to allocate dynamic ${label} port without conflict`);
}
async function allocatePort({
  host = "127.0.0.1",
  label = "runtime",
  port,
  reserved = /* @__PURE__ */ new Set()
} = {}) {
  const forcedPort = parsePort(port, label);
  return forcedPort == null ? await allocateDynamicPort(label, host, reserved) : await allocateForcedPort(forcedPort, label, host, reserved);
}

// src/supervisor-exit.ts
import { constants } from "node:os";
function supervisorExitCode(code, signal, forwardedSignal) {
  if (forwardedSignal != null) return 0;
  if (signal != null) {
    const signalNumber = constants.signals[signal];
    return signalNumber != null ? 128 + signalNumber : 1;
  }
  return code ?? 1;
}
function signalFromSupervisorExitCode(code) {
  if (code == null || code <= 128) return null;
  const signalNumber = code - 128;
  for (const [name, value] of Object.entries(constants.signals)) {
    if (value === signalNumber) return name;
  }
  return null;
}

// src/json-ipc.ts
import { chmod, lstat, mkdir, rm } from "node:fs/promises";
import { createConnection } from "node:net";
import { createServer as createNetServer2 } from "node:net";
import { dirname as dirname2 } from "node:path";
import { StringDecoder } from "node:string_decoder";

// src/ipc-path.ts
function isWindowsNamedPipePath(value) {
  return typeof value === "string" && value.startsWith("\\\\.\\pipe\\");
}

// src/json-ipc.ts
async function readUnixSocketIdentity(socketPath) {
  if (isWindowsNamedPipePath(socketPath)) return null;
  const entry = await lstat(socketPath).catch(() => null);
  return entry?.isSocket() ? { dev: entry.dev, ino: entry.ino } : null;
}
async function removeOwnedUnixSocket(socketPath, owned) {
  if (owned == null) return;
  const current = await readUnixSocketIdentity(socketPath);
  if (current?.dev === owned.dev && current.ino === owned.ino) await rm(socketPath, { force: true });
}
var jsonIpcTraceSeq = 0;
function jsonIpcTraceEnabled() {
  const value = process.env.OD_JSON_IPC_TRACE;
  return value === "1" || value === "true" || value === "yes";
}
function nextJsonIpcTraceId() {
  jsonIpcTraceSeq += 1;
  return `ipc-${process.pid}-${jsonIpcTraceSeq}`;
}
function jsonIpcTraceDurationMs(startedAt) {
  return Number((process.hrtime.bigint() - startedAt) / 1000000n);
}
function summarizeJsonIpcMessage(message) {
  if (message == null || typeof message !== "object") return { type: typeof message };
  const input = message;
  const summary = { type: typeof input.type === "string" ? input.type : typeof input.type };
  if ("input" in input) {
    summary.hasInput = true;
    if (input.input != null && typeof input.input === "object") {
      summary.inputKeys = Object.keys(input.input).sort();
    } else {
      summary.inputType = typeof input.input;
    }
  }
  return summary;
}
function traceJsonIpc(event, details) {
  if (!jsonIpcTraceEnabled()) return;
  console.error("[open-design sidecar] json ipc trace", { event, ...details });
}
function errorCode2(error) {
  if (typeof error !== "object" || error == null || !("code" in error)) return null;
  const code = error.code;
  return code == null ? null : String(code);
}
function errorMessage2(error) {
  return error instanceof Error ? error.message : String(error);
}
function jsonIpcError(error) {
  return {
    ...errorCode2(error) == null ? {} : { code: errorCode2(error) },
    message: errorMessage2(error)
  };
}
async function staleUnixSocketExists(socketPath) {
  try {
    const stat = await lstat(socketPath);
    if (!stat.isSocket()) return false;
  } catch (error) {
    if (errorCode2(error) === "ENOENT") return false;
    throw error;
  }
  return await new Promise((resolveStale, rejectStale) => {
    const socket = createConnection(socketPath);
    let settled = false;
    const settle = (callback) => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      callback();
    };
    socket.once("connect", () => settle(() => resolveStale(false)));
    socket.once("error", (error) => {
      const code = errorCode2(error);
      if (code === "ENOENT" || code === "ECONNREFUSED") {
        settle(() => resolveStale(true));
        return;
      }
      settle(() => rejectStale(error));
    });
  });
}
async function prepareIpcPath(socketPath) {
  if (isWindowsNamedPipePath(socketPath)) return;
  await mkdir(dirname2(socketPath), { mode: 448, recursive: true });
  await chmod(dirname2(socketPath), 448);
  if (await staleUnixSocketExists(socketPath)) await rm(socketPath, { force: true });
}
async function createJsonIpcServer({
  handler,
  socketPath
}) {
  await prepareIpcPath(socketPath);
  const server = createNetServer2((socket) => {
    let buffer = "";
    const decoder = new StringDecoder("utf8");
    const traceId = nextJsonIpcTraceId();
    const startedAt = process.hrtime.bigint();
    traceJsonIpc("server.connection", { socketPath, traceId });
    socket.on("error", (error) => {
      traceJsonIpc("server.socket_error", {
        durationMs: jsonIpcTraceDurationMs(startedAt),
        error: error instanceof Error ? error.message : String(error),
        socketPath,
        traceId
      });
    });
    socket.on("close", () => {
      traceJsonIpc("server.socket_close", {
        durationMs: jsonIpcTraceDurationMs(startedAt),
        socketPath,
        traceId
      });
    });
    socket.on("data", async (chunk) => {
      traceJsonIpc("server.data", {
        bytes: chunk.byteLength,
        durationMs: jsonIpcTraceDurationMs(startedAt),
        socketPath,
        traceId
      });
      buffer += decoder.write(chunk);
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex < 0) return;
      const frame = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      let message;
      try {
        message = JSON.parse(frame);
      } catch (error) {
        traceJsonIpc("server.frame_parse_failed", {
          durationMs: jsonIpcTraceDurationMs(startedAt),
          error: error instanceof Error ? error.message : String(error),
          frameBytes: Buffer.byteLength(frame),
          socketPath,
          traceId
        });
        socket.end(
          `${JSON.stringify({
            ok: false,
            error: jsonIpcError(error)
          })}
`
        );
        return;
      }
      const messageSummary = summarizeJsonIpcMessage(message);
      traceJsonIpc("server.frame_parsed", {
        durationMs: jsonIpcTraceDurationMs(startedAt),
        frameBytes: Buffer.byteLength(frame),
        message: messageSummary,
        socketPath,
        traceId
      });
      try {
        traceJsonIpc("server.handler_start", {
          durationMs: jsonIpcTraceDurationMs(startedAt),
          message: messageSummary,
          socketPath,
          traceId
        });
        const result = await handler(message);
        traceJsonIpc("server.handler_success", {
          durationMs: jsonIpcTraceDurationMs(startedAt),
          message: messageSummary,
          socketPath,
          traceId
        });
        socket.end(`${JSON.stringify({ ok: true, result })}
`);
      } catch (error) {
        traceJsonIpc("server.handler_failed", {
          durationMs: jsonIpcTraceDurationMs(startedAt),
          error: error instanceof Error ? error.message : String(error),
          message: messageSummary,
          socketPath,
          traceId
        });
        socket.end(
          `${JSON.stringify({
            ok: false,
            error: jsonIpcError(error)
          })}
`
        );
      }
    });
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(socketPath, () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
  if (!isWindowsNamedPipePath(socketPath)) await chmod(socketPath, 384);
  const ownedSocket = await readUnixSocketIdentity(socketPath);
  return {
    async close() {
      await removeOwnedUnixSocket(socketPath, ownedSocket);
      await closeServer(server);
    }
  };
}
async function requestJsonIpc(socketPath, payload, { timeoutMs = 1500 } = {}) {
  return await new Promise((resolveRequest, rejectRequest) => {
    const socket = createConnection(socketPath);
    const traceId = nextJsonIpcTraceId();
    const startedAt = process.hrtime.bigint();
    let settled = false;
    let buffer = "";
    const decoder = new StringDecoder("utf8");
    const messageSummary = summarizeJsonIpcMessage(payload);
    traceJsonIpc("client.connect_start", { message: messageSummary, socketPath, timeoutMs, traceId });
    const settle = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };
    const timeout = setTimeout(() => {
      traceJsonIpc("client.timeout", {
        durationMs: jsonIpcTraceDurationMs(startedAt),
        message: messageSummary,
        socketPath,
        timeoutMs,
        traceId
      });
      socket.destroy();
      settle(() => rejectRequest(new Error(`IPC request timed out: ${socketPath}`)));
    }, timeoutMs);
    socket.on("connect", () => {
      traceJsonIpc("client.connected", {
        durationMs: jsonIpcTraceDurationMs(startedAt),
        message: messageSummary,
        socketPath,
        traceId
      });
      const frame = `${JSON.stringify(payload)}
`;
      traceJsonIpc("client.write_start", {
        bytes: Buffer.byteLength(frame),
        durationMs: jsonIpcTraceDurationMs(startedAt),
        message: messageSummary,
        socketPath,
        traceId
      });
      const flushed = socket.write(frame, () => {
        traceJsonIpc("client.write_callback", {
          durationMs: jsonIpcTraceDurationMs(startedAt),
          message: messageSummary,
          socketPath,
          traceId
        });
      });
      if (!flushed) {
        socket.once("drain", () => {
          traceJsonIpc("client.drain", {
            durationMs: jsonIpcTraceDurationMs(startedAt),
            message: messageSummary,
            socketPath,
            traceId
          });
        });
      }
    });
    socket.on("data", (chunk) => {
      traceJsonIpc("client.data", {
        bytes: chunk.byteLength,
        durationMs: jsonIpcTraceDurationMs(startedAt),
        message: messageSummary,
        socketPath,
        traceId
      });
      buffer += decoder.write(chunk);
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex < 0) return;
      socket.end();
      settle(() => {
        const response = JSON.parse(buffer.slice(0, newlineIndex));
        if (!response.ok) {
          traceJsonIpc("client.response_error", {
            durationMs: jsonIpcTraceDurationMs(startedAt),
            error: response.error?.message ?? "IPC request failed",
            message: messageSummary,
            socketPath,
            traceId
          });
          rejectRequest(new Error(response.error?.message ?? "IPC request failed"));
          return;
        }
        traceJsonIpc("client.response_success", {
          durationMs: jsonIpcTraceDurationMs(startedAt),
          message: messageSummary,
          socketPath,
          traceId
        });
        resolveRequest(response.result);
      });
    });
    socket.on("error", (error) => {
      traceJsonIpc("client.socket_error", {
        durationMs: jsonIpcTraceDurationMs(startedAt),
        error: error instanceof Error ? error.message : String(error),
        message: messageSummary,
        socketPath,
        traceId
      });
      settle(() => rejectRequest(error));
    });
    socket.on("close", () => {
      traceJsonIpc("client.socket_close", {
        durationMs: jsonIpcTraceDurationMs(startedAt),
        message: messageSummary,
        socketPath,
        traceId
      });
    });
  });
}

// src/stamp.ts
import { createHash } from "node:crypto";
import { tmpdir, userInfo } from "node:os";
import { join as join2 } from "node:path";
import { readProcessStamp } from "@open-design/platform";
var SIDECAR_STAMP_FIELDS = ["channel", "namespace", "source", "mode", "app"];
var SIDECAR_STAMP_FLAGS = Object.freeze({
  channel: "--od-stamp-channel",
  namespace: "--od-stamp-namespace",
  source: "--od-stamp-source",
  mode: "--od-stamp-mode",
  app: "--od-stamp-app"
});
var SIDECAR_LIFECYCLE_FLAG = "--od-sidecar-lifecycle";
var SIDECAR_LAUNCHER_LIFECYCLE = "launcher";
var SIDECAR_LAUNCHER_ARG = `${SIDECAR_LIFECYCLE_FLAG}=${SIDECAR_LAUNCHER_LIFECYCLE}`;
var SIDECAR_SUPERVISED_CONTEXT_ENV = "OD_SIDECAR_SUPERVISED_CONTEXT";
function normalizeStampToken(value, field) {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    throw new Error(`sidecar stamp ${field} must be a non-empty string without surrounding whitespace`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) {
    throw new Error(`sidecar stamp ${field} contains unsupported characters: ${value}`);
  }
  return value;
}
function normalizeSidecarStamp(input) {
  if (typeof input !== "object" || input == null || Array.isArray(input)) {
    throw new Error("sidecar stamp must be an object");
  }
  const value = input;
  const unexpected = Object.keys(value).filter((field) => !SIDECAR_STAMP_FIELDS.includes(field));
  if (unexpected.length > 0) throw new Error(`sidecar stamp contains unsupported fields: ${unexpected.join(", ")}`);
  return {
    channel: normalizeStampToken(value.channel, "channel"),
    namespace: normalizeStampToken(value.namespace, "namespace"),
    source: normalizeStampToken(value.source, "source"),
    mode: normalizeStampToken(value.mode, "mode"),
    app: normalizeStampToken(value.app, "app")
  };
}
var SIDECAR_STAMP_CONTRACT = Object.freeze({
  normalizeStamp: normalizeSidecarStamp,
  normalizeStampCriteria: normalizeSidecarStamp,
  stampFields: SIDECAR_STAMP_FIELDS,
  stampFlags: SIDECAR_STAMP_FLAGS
});
function readCurrentSidecarArgvStamp() {
  const stamp = readProcessStamp(process.argv.slice(1), SIDECAR_STAMP_CONTRACT);
  if (stamp == null) throw new Error("the five-field sidecar argv stamp is required");
  return stamp;
}
function readCurrentSidecarStamp() {
  return readSupervisedSidecarContext()?.stamp ?? readCurrentSidecarArgvStamp();
}
function serializeSupervisedSidecarContext(stampInput, generationPid, resources) {
  if (!Number.isSafeInteger(generationPid) || generationPid <= 0) {
    throw new Error("sidecar generation pid must be a positive safe integer");
  }
  return JSON.stringify({ generationPid, resources, stamp: normalizeSidecarStamp(stampInput) });
}
function readSupervisedSidecarContext(env = process.env) {
  const serialized = env[SIDECAR_SUPERVISED_CONTEXT_ENV];
  if (serialized == null) return null;
  let value;
  try {
    value = JSON.parse(serialized);
  } catch (error) {
    throw new Error(`${SIDECAR_SUPERVISED_CONTEXT_ENV} must contain valid JSON`, { cause: error });
  }
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    throw new Error(`${SIDECAR_SUPERVISED_CONTEXT_ENV} must contain a context object`);
  }
  const context = value;
  const generationPid = Number(context.generationPid);
  if (!Number.isSafeInteger(generationPid) || generationPid <= 0) {
    throw new Error(`${SIDECAR_SUPERVISED_CONTEXT_ENV} contains an invalid generation pid`);
  }
  return Object.freeze({
    generationPid,
    resources: context.resources,
    stamp: normalizeSidecarStamp(context.stamp)
  });
}
function isCurrentSidecarLauncher() {
  return process.argv.slice(1).includes(SIDECAR_LAUNCHER_ARG);
}
function isSidecarLauncherCommand(command) {
  return command.split(/\s+/).some((token) => token.replace(/^['"]|['"]$/g, "") === SIDECAR_LAUNCHER_ARG);
}
function createSidecarLauncherArgs(stamp) {
  const normalized = normalizeSidecarStamp(stamp);
  return [
    ...SIDECAR_STAMP_FIELDS.map((field) => `${SIDECAR_STAMP_FLAGS[field]}=${normalized[field]}`),
    SIDECAR_LAUNCHER_ARG
  ];
}
function removeSidecarLauncherArgs(args) {
  const stampPrefixes = SIDECAR_STAMP_FIELDS.map((field) => `${SIDECAR_STAMP_FLAGS[field]}=`);
  return args.filter(
    (argument) => argument !== SIDECAR_LAUNCHER_ARG && !stampPrefixes.some((prefix) => argument.startsWith(prefix))
  );
}
function sidecarStampKey(stamp) {
  const value = normalizeSidecarStamp(stamp);
  return SIDECAR_STAMP_FIELDS.map((field) => `${field}=${value[field]}`).join("\n");
}
function resolveSidecarClientEndpoint(stamp) {
  return resolvePrivateIpcPath(stamp);
}
function resolvePrivateIpcPath(stamp, platform = process.platform) {
  const principal = platform === "win32" ? (() => {
    try {
      return userInfo().username;
    } catch {
      return process.env.USERNAME ?? process.env.USER ?? "unknown";
    }
  })() : String(process.getuid?.() ?? process.env.USER ?? "unknown");
  const digest = createHash("sha256").update(`${principal}
${sidecarStampKey(stamp)}`).digest("hex").slice(0, 32);
  if (platform === "win32") return `\\\\.\\pipe\\open-design-sidecar-${digest}`;
  const endpoint = join2(tmpdir(), `od-sidecar-${principal}`, `${digest}.sock`);
  return platform === "darwin" && Buffer.byteLength(endpoint) > 103 ? join2("/tmp", `od-sidecar-${principal}`, `${digest}.sock`) : endpoint;
}

// src/client.ts
var RESOURCES_ENV = "OD_SIDECAR_RESOURCES";
var CONTROL_STATUS = "sidecar:status";
var CONTROL_STOP = "sidecar:stop";
var CONTROL_DESCRIBE = "sidecar:describe";
var BUSINESS_INVOKE = "sidecar:invoke";
var INHERITED_ENDPOINT_ENV = "OD_SIDECAR_CLIENT_ENDPOINT";
var SUPERVISOR_HANDOFF = "sidecar:supervisor-handoff";
var SUPERVISOR_HANDOFF_ACCEPTED = "sidecar:supervisor-handoff-accepted";
var SIDECAR_SUPERVISOR_TARGET_ENV = "OD_SIDECAR_SUPERVISOR_TARGET";
function prepareSidecarLaunchEnvironment(env, resources) {
  const launchEnv = {
    ...env,
    [RESOURCES_ENV]: JSON.stringify({
      dataRoot: resources.dataRoot,
      ownerPid: resources.ownerPid,
      port: resources.port,
      runtimeRoot: resources.runtimeRoot
    })
  };
  delete launchEnv[INHERITED_ENDPOINT_ENV];
  delete launchEnv[SIDECAR_SUPERVISED_CONTEXT_ENV];
  delete launchEnv[SIDECAR_SUPERVISOR_TARGET_ENV];
  return launchEnv;
}
function newSidecarGenerationEnvironment(env) {
  const launchEnv = { ...env };
  delete launchEnv[INHERITED_ENDPOINT_ENV];
  delete launchEnv[RESOURCES_ENV];
  delete launchEnv[SIDECAR_SUPERVISED_CONTEXT_ENV];
  delete launchEnv[SIDECAR_SUPERVISOR_TARGET_ENV];
  return launchEnv;
}
async function handoffCurrentSidecarGeneration(request, options = {}) {
  if (typeof process.send !== "function") {
    throw new Error("current sidecar generation has no supervisor control channel");
  }
  if (typeof request.command !== "string" || request.command.length === 0) {
    throw new Error("sidecar generation handoff command must be a non-empty string");
  }
  const requestId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const timeoutMs = options.timeoutMs ?? 5e3;
  await new Promise((resolve2, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      process.off("message", onMessage);
    };
    const finish = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error == null) resolve2();
      else reject(error);
    };
    const onMessage = (message) => {
      const response = message;
      if (response?.type === SUPERVISOR_HANDOFF_ACCEPTED && response.requestId === requestId) finish();
    };
    const timer = setTimeout(
      () => finish(new Error(`sidecar supervisor did not accept generation handoff within ${timeoutMs}ms`)),
      timeoutMs
    );
    process.on("message", onMessage);
    process.send?.({ request, requestId, type: SUPERVISOR_HANDOFF }, (error) => {
      if (error != null) finish(error);
    });
  });
}
var sidecarSupervisorProtocol = Object.freeze({
  handoff: SUPERVISOR_HANDOFF,
  handoffAccepted: SUPERVISOR_HANDOFF_ACCEPTED
});
function normalizeSidecarLaunchResources(input) {
  if (typeof input !== "object" || input == null || Array.isArray(input)) {
    throw new Error("sidecar launch resources must contain a resource object");
  }
  const value = input;
  if (value.dataRoot != null && (typeof value.dataRoot !== "string" || value.dataRoot.length === 0)) {
    throw new Error("sidecar dataRoot must be null or a non-empty string");
  }
  if (typeof value.runtimeRoot !== "string" || value.runtimeRoot.length === 0) {
    throw new Error("sidecar runtimeRoot must be a non-empty string");
  }
  const port = Number(value.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("sidecar port must be an integer between 0 and 65535");
  }
  const ownerPid = value.ownerPid == null ? null : Number(value.ownerPid);
  if (ownerPid != null && (!Number.isSafeInteger(ownerPid) || ownerPid <= 0)) {
    throw new Error("sidecar ownerPid must be null or a positive safe integer");
  }
  return Object.freeze({ dataRoot: value.dataRoot == null ? null : value.dataRoot, ownerPid, port, runtimeRoot: value.runtimeRoot });
}
function readCurrentResources(context) {
  const resources = normalizeSidecarLaunchResources(context.resources);
  return Object.freeze({ ...resources, pid: context.generationPid });
}
function assertEnvelope(message) {
  if (typeof message !== "object" || message == null || Array.isArray(message)) {
    throw new Error("invalid sidecar request");
  }
  const request = message;
  if (request.type === CONTROL_DESCRIBE) return { type: CONTROL_DESCRIBE };
  if (request.type === CONTROL_STATUS) {
    if (request.targetPid != null && (!Number.isSafeInteger(request.targetPid) || Number(request.targetPid) <= 0)) {
      throw new Error("invalid sidecar status target");
    }
    return { targetPid: request.targetPid == null ? null : Number(request.targetPid), type: CONTROL_STATUS };
  }
  if (request.type === CONTROL_STOP) {
    if (request.targetPids != null && (!Array.isArray(request.targetPids) || !request.targetPids.every((pid) => Number.isSafeInteger(pid) && Number(pid) > 0))) throw new Error("invalid sidecar stop targets");
    const targetPids = request.targetPids == null ? null : request.targetPids.map(Number);
    return { targetPids, type: CONTROL_STOP };
  }
  if (request.type !== BUSINESS_INVOKE || typeof request.app !== "string" || typeof request.action !== "string") {
    throw new Error("invalid sidecar request");
  }
  return { action: request.action, app: request.app, input: request.input, type: BUSINESS_INVOKE };
}
var SidecarClient = class {
  resources;
  stamp;
  #handlers;
  #lifecycle;
  #ipcServer = null;
  #runtime = null;
  #startPromise = null;
  #stopPromise = null;
  #supervisorTimer = null;
  #signalHandler = () => {
    this.#stopAndExit();
  };
  #resolveStopped;
  #stopped = new Promise((resolve2) => {
    this.#resolveStopped = resolve2;
  });
  constructor(options) {
    const context = readSupervisedSidecarContext();
    if (context == null) throw new Error("SidecarFactory.create() requires a supervised sidecar context");
    this.stamp = context.stamp;
    this.resources = readCurrentResources(context);
    this.#handlers = options.handlers ?? {};
    this.#lifecycle = options.lifecycle;
  }
  start() {
    if (this.#stopPromise != null) return Promise.reject(new Error("sidecar client is stopping"));
    if (this.#startPromise != null) return this.#startPromise;
    const attempt = this.#start();
    this.#startPromise = attempt;
    void attempt.catch(() => {
      if (this.#startPromise === attempt) this.#startPromise = null;
    });
    return attempt;
  }
  async #start() {
    if (isCurrentSidecarLauncher()) {
      throw new Error("a sidecar launcher must bootstrap a generation before starting server lifecycle");
    }
    let runtime;
    let runtimeStarted = false;
    try {
      this.#ipcServer = await createJsonIpcServer({
        socketPath: resolvePrivateIpcPath(this.stamp),
        handler: async (message) => {
          const request = assertEnvelope(message);
          if (request.type === CONTROL_DESCRIBE) {
            return { ready: runtimeStarted, resources: this.resources, stamp: this.stamp };
          }
          if (!runtimeStarted) throw new Error("sidecar runtime is starting");
          if (request.type === CONTROL_STATUS) {
            if (request.targetPid != null && request.targetPid !== this.resources.pid) {
              throw new Error(
                `sidecar endpoint belongs to generation ${this.resources.pid}, expected ${request.targetPid}`
              );
            }
            return await this.#lifecycle.status(runtime);
          }
          if (request.type === CONTROL_STOP) {
            if (request.targetPids != null && !request.targetPids.includes(this.resources.pid)) {
              return { accepted: false };
            }
            setImmediate(() => {
              this.#stopAndExit();
            });
            return { accepted: true };
          }
          if (request.type !== BUSINESS_INVOKE) throw new Error("invalid sidecar request");
          if (request.app !== this.stamp.app) throw new Error(`sidecar request targets ${request.app}, not ${this.stamp.app}`);
          const handler = this.#handlers[request.action];
          if (handler == null) throw new Error(`unknown ${this.stamp.app} action: ${request.action}`);
          return await handler(request.input);
        }
      });
      runtime = await this.#lifecycle.start(this.resources);
      runtimeStarted = true;
      this.#runtime = runtime;
      for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, this.#signalHandler);
      this.#supervisorTimer = setInterval(() => {
        try {
          process.kill(this.resources.pid, 0);
        } catch {
          if (this.#supervisorTimer != null) clearInterval(this.#supervisorTimer);
          this.#supervisorTimer = null;
          this.#stopAndExit();
        }
      }, 1e3);
      this.#supervisorTimer.unref();
      this.#publishEndpoint();
    } catch (error) {
      this.#runtime = null;
      if (runtimeStarted) await this.#lifecycle.stop(runtime).catch(() => void 0);
      await this.#ipcServer?.close().catch(() => void 0);
      this.#ipcServer = null;
      this.#clearEndpoint();
      throw error;
    }
  }
  #publishEndpoint() {
    process.env[INHERITED_ENDPOINT_ENV] = resolvePrivateIpcPath(this.stamp);
  }
  #clearEndpoint() {
    if (process.env[INHERITED_ENDPOINT_ENV] === resolvePrivateIpcPath(this.stamp)) {
      delete process.env[INHERITED_ENDPOINT_ENV];
    }
  }
  stop() {
    this.#stopPromise ??= this.#stop();
    return this.#stopPromise;
  }
  #stopAndExit() {
    void this.stop().finally(() => process.exit(0));
  }
  async #stop() {
    try {
      await this.#startPromise?.catch(() => void 0);
      for (const signal of ["SIGINT", "SIGTERM"]) process.off(signal, this.#signalHandler);
      if (this.#supervisorTimer != null) clearInterval(this.#supervisorTimer);
      this.#supervisorTimer = null;
      await this.#ipcServer?.close();
      this.#ipcServer = null;
      if (this.#runtime != null) await this.#lifecycle.stop(this.#runtime);
      this.#runtime = null;
    } finally {
      this.#clearEndpoint();
      this.#resolveStopped();
    }
  }
  waitUntilStopped() {
    return this.#stopped;
  }
  async invoke(app, action, input, options) {
    const target = normalizeSidecarStamp({ ...this.stamp, app });
    return await requestJsonIpc(
      resolvePrivateIpcPath(target),
      { action, app: target.app, input, type: BUSINESS_INVOKE },
      options
    );
  }
  async status(app, options) {
    const target = normalizeSidecarStamp({ ...this.stamp, app });
    return await requestJsonIpc(resolvePrivateIpcPath(target), { type: CONTROL_STATUS }, options);
  }
  async requestStop(app, options) {
    const target = normalizeSidecarStamp({ ...this.stamp, app });
    return await requestJsonIpc(resolvePrivateIpcPath(target), { type: CONTROL_STOP }, options);
  }
};
var SidecarFactory = Object.freeze({
  connectInherited(env = process.env) {
    const endpoint = env[INHERITED_ENDPOINT_ENV];
    if (endpoint == null || endpoint.length === 0) return null;
    return {
      async invoke(app, action, input, options) {
        return await requestJsonIpc(endpoint, { action, app, input, type: BUSINESS_INVOKE }, options);
      },
      async requestStop(_app, options) {
        return await requestJsonIpc(endpoint, { type: CONTROL_STOP }, options);
      },
      async status(_app, options) {
        return await requestJsonIpc(endpoint, { type: CONTROL_STATUS }, options);
      }
    };
  },
  create(options) {
    return new SidecarClient(options);
  },
  inheritedEnvironment(env = process.env) {
    const endpoint = env[INHERITED_ENDPOINT_ENV];
    return endpoint == null || endpoint.length === 0 ? {} : { [INHERITED_ENDPOINT_ENV]: endpoint };
  },
  /**
   * Creates the environment for an entrypoint that must bootstrap a new
   * generation instead of remaining attached to the caller's supervisor.
   */
  newGenerationEnvironment(env = process.env) {
    return newSidecarGenerationEnvironment(env);
  }
});
var sidecarProtocol = Object.freeze({
  describe: CONTROL_DESCRIBE,
  resourcesEnv: RESOURCES_ENV,
  status: CONTROL_STATUS,
  stop: CONTROL_STOP
});

// src/lifecycle-lock.ts
import { createHash as createHash2 } from "node:crypto";
import { createServer } from "node:net";
import { userInfo as userInfo2 } from "node:os";
async function withSidecarLifecycleLock(stampInputs, operation, options = {}) {
  if (stampInputs.length === 0) return await operation();
  if (process.platform !== "win32") return await operation();
  const lockPath = resolveWindowsLifecycleLockPath(stampInputs);
  const timeoutMs = normalizeTimeoutMs(options.timeoutMs);
  const deadline = Date.now() + timeoutMs;
  let server = null;
  while (server == null) {
    server = await tryListen(lockPath);
    if (server != null) break;
    if (Date.now() >= deadline) {
      throw new Error(`timed out waiting for sidecar lifecycle lock after ${timeoutMs}ms`);
    }
    await new Promise((resolve2) => setTimeout(resolve2, 25));
  }
  try {
    return await operation();
  } finally {
    await closeServer2(server);
  }
}
function resolveWindowsLifecycleLockPath(stampInputs) {
  const principal = (() => {
    try {
      return userInfo2().username;
    } catch {
      return process.env.USERNAME ?? "unknown";
    }
  })();
  const resourceSet = [...new Set(stampInputs.map((stamp) => sidecarStampKey(normalizeSidecarStamp(stamp))))].sort().join("\n---\n");
  const digest = createHash2("sha256").update(`${principal}
${resourceSet}`).digest("hex").slice(0, 32);
  return `\\\\.\\pipe\\open-design-sidecar-lifecycle-${digest}`;
}
async function tryListen(path) {
  const server = createServer((socket) => socket.destroy());
  return await new Promise((resolve2, reject) => {
    const onError = (error) => {
      server.removeListener("listening", onListening);
      if (error.code === "EADDRINUSE") resolve2(null);
      else reject(error);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve2(server);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen({ exclusive: true, path });
  });
}
async function closeServer2(server) {
  await new Promise((resolve2, reject) => {
    server.close((error) => error == null ? resolve2() : reject(error));
  });
}
function normalizeTimeoutMs(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 12e4;
}

// src/operations.ts
import { fileURLToPath } from "node:url";
import {
  captureProcessSnapshotsByPids,
  createProcessStampArgs,
  isProcessAlive as isProcessAlive3,
  listProcessSnapshots,
  matchesStampedProcess as matchesStampedProcess3,
  spawnBackgroundProcess,
  spawnLoggedProcess,
  stopProcesses as stopProcesses2
} from "@open-design/platform";

// src/generation.ts
import { lstat as lstat2, rm as rm2 } from "node:fs/promises";
import { createConnection as createConnection2 } from "node:net";
import {
  captureProcessSnapshot as captureProcessSnapshot2,
  isProcessAlive as isProcessAlive2,
  matchesStampedProcess as matchesStampedProcess2
} from "@open-design/platform";

// src/process-tree.ts
import {
  captureStampedProcessSnapshot,
  captureStampedProcessSetSnapshot,
  collectProcessTreePids,
  readProcessStampFromCommand
} from "@open-design/platform";
async function captureSidecarGenerationSnapshot(stamp) {
  const snapshot = await captureStampedProcessSnapshot(stamp, SIDECAR_STAMP_CONTRACT);
  const matches = snapshot.matches.filter(({ command }) => !isSidecarLauncherCommand(command));
  const matchedPids = new Set(matches.map(({ pid }) => pid));
  return {
    matches,
    processes: snapshot.processes,
    roots: matches.filter(({ ppid }) => !matchedPids.has(ppid))
  };
}
async function captureSidecarGenerationSetSnapshot(stamps) {
  const snapshot = await captureStampedProcessSetSnapshot(stamps, SIDECAR_STAMP_CONTRACT);
  return snapshot.entries.map((entry) => {
    const matches = entry.matches.filter(({ command }) => !isSidecarLauncherCommand(command));
    const matchedPids = new Set(matches.map(({ pid }) => pid));
    return {
      matches,
      processes: snapshot.processes,
      roots: matches.filter(({ ppid }) => !matchedPids.has(ppid)),
      stamp: entry.criteria
    };
  });
}
function collectSidecarGenerationPids(processes, rootPids, stampInput) {
  const stampKey = sidecarStampKey(stampInput);
  const roots = new Set(rootPids.filter((pid) => typeof pid === "number"));
  const ownedProcesses = processes.filter((processInfo) => {
    if (roots.has(processInfo.pid)) return true;
    const nestedStamp = readProcessStampFromCommand(processInfo.command, SIDECAR_STAMP_CONTRACT);
    return nestedStamp == null || sidecarStampKey(nestedStamp) === stampKey;
  });
  return collectProcessTreePids(ownedProcesses, [...roots]);
}

// src/process-retirement.ts
import {
  captureProcessSnapshot,
  isProcessAlive,
  matchesStampedProcess,
  signalProcesses,
  stopProcesses
} from "@open-design/platform";
async function retireFencedSidecarProcessTree(ref, options) {
  return await retireSidecarProcessTree(
    ref,
    options,
    (processInfo) => processInfo.pid === ref.rootPid && (ref.startedAtMs == null || processInfo.startedAtMs === ref.startedAtMs) && matchesStampedProcess(processInfo, ref.stamp, SIDECAR_STAMP_CONTRACT),
    (initialPids) => initialPids
  );
}
async function retireSidecarProcessTree(ref, options, ownsRoot, termTargets) {
  const snapshots = options.knownSnapshots ?? await captureProcessSnapshot();
  const rootOwnedAtEntry = snapshots.some(ownsRoot);
  if (!rootOwnedAtEntry) return alreadyStoppedResult();
  const initialPids = collectSidecarGenerationPids(snapshots, [ref.rootPid], ref.stamp);
  if (!options.gracefulStopInitiated) signalProcesses(termTargets(initialPids), "SIGTERM");
  const graceMs = normalizeGraceMs(options.stopOptions?.termGraceMs, 5e3);
  const deadline = Date.now() + graceMs;
  const remainingInitialPids = () => initialPids.filter(isProcessAlive);
  let remaining = remainingInitialPids();
  while (remaining.length > 0 && Date.now() < deadline) {
    await new Promise((resolve2) => setTimeout(resolve2, 100));
    remaining = remainingInitialPids();
  }
  if (remaining.length === 0) return stoppedResult(initialPids);
  const latestSnapshots = await captureProcessSnapshot();
  const rootStillOwned = latestSnapshots.some(ownsRoot);
  const forceTargets = rootStillOwned ? collectSidecarGenerationPids(latestSnapshots, [ref.rootPid], ref.stamp) : remainingInitialPids();
  if (forceTargets.length === 0) return stoppedResult(initialPids);
  const forced = await stopProcesses(forceTargets, {
    killGraceMs: options.stopOptions?.killGraceMs,
    termGraceMs: 0
  });
  const matchedPids = [.../* @__PURE__ */ new Set([...initialPids, ...forceTargets])];
  return {
    alreadyStopped: false,
    forcedPids: forced.forcedPids,
    matchedPids,
    remainingPids: forced.remainingPids,
    stoppedPids: matchedPids.filter((pid) => !forced.remainingPids.includes(pid))
  };
}
function normalizeGraceMs(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}
function alreadyStoppedResult() {
  return {
    alreadyStopped: true,
    forcedPids: [],
    matchedPids: [],
    remainingPids: [],
    stoppedPids: []
  };
}
function stoppedResult(matchedPids) {
  return {
    alreadyStopped: false,
    forcedPids: [],
    matchedPids,
    remainingPids: [],
    stoppedPids: matchedPids
  };
}

// src/generation.ts
var AmbiguousSidecarGenerationsError = class extends Error {
  rootPids;
  constructor(rootPids) {
    super(`cannot mutate sidecar with multiple stamped generation roots: ${rootPids.join(", ")}`);
    this.name = "AmbiguousSidecarGenerationsError";
    this.rootPids = Object.freeze([...rootPids]);
  }
};
function sidecarGenerationRef(stampInput, rootPid, startedAtMs) {
  if (!Number.isSafeInteger(rootPid) || rootPid <= 0) {
    throw new Error("sidecar generation root pid must be a positive safe integer");
  }
  return Object.freeze({
    rootPid,
    ...Number.isSafeInteger(startedAtMs) && (startedAtMs ?? 0) > 0 ? { startedAtMs } : {},
    stamp: normalizeSidecarStamp(stampInput)
  });
}
async function describeSidecarGeneration(stampInput, timeoutMs = 2e3) {
  const stamp = normalizeSidecarStamp(stampInput);
  let description;
  try {
    description = await requestJsonIpc(
      resolvePrivateIpcPath(stamp),
      { type: sidecarProtocol.describe },
      { timeoutMs }
    );
  } catch {
    return null;
  }
  const describedStamp = normalizeSidecarStamp(description.stamp);
  if (JSON.stringify(describedStamp) !== JSON.stringify(stamp)) {
    throw new Error("sidecar endpoint described a different stamp");
  }
  if (!Number.isSafeInteger(description.resources.pid) || description.resources.pid <= 0) {
    throw new Error("sidecar endpoint described an invalid pid");
  }
  if (!Number.isInteger(description.resources.port) || description.resources.port < 0 || description.resources.port > 65535) {
    throw new Error("sidecar endpoint described an invalid port");
  }
  if (typeof description.ready !== "boolean") throw new Error("sidecar endpoint described invalid readiness");
  return description;
}
async function observeSidecarGeneration(stampInput, descriptionTimeoutMs = 2e3) {
  return (await observeSidecarGenerations([stampInput], descriptionTimeoutMs))[0];
}
async function observeSidecarGenerations(stampInputs, descriptionTimeoutMs = 2e3) {
  const stamps = uniqueNormalizedStamps(stampInputs);
  const descriptionTimeouts = stamps.map((_, index) => normalizeGracefulRequestTimeoutMs(
    typeof descriptionTimeoutMs === "number" ? descriptionTimeoutMs : descriptionTimeoutMs[index]
  ));
  let retryDeadline = null;
  let ambiguousReobservationUsed = false;
  while (true) {
    try {
      return await observeSidecarGenerationsOnce(stamps, descriptionTimeouts);
    } catch (error) {
      if (error instanceof AmbiguousSidecarGenerationsError) {
        if (ambiguousReobservationUsed) throw error;
        const transitioned = await waitForAmbiguousRootExit(error.rootPids, 1e3);
        if (!transitioned) throw error;
        ambiguousReobservationUsed = true;
        continue;
      }
      if (!isTransientGenerationObservation(error)) throw error;
      if (retryDeadline == null) retryDeadline = Date.now() + 1e3;
      else if (Date.now() >= retryDeadline) throw error;
      await new Promise((resolve2) => setTimeout(resolve2, 50));
    }
  }
}
async function observeSidecarGenerationsOnce(stamps, descriptionTimeoutMs) {
  const endpoints = await Promise.all(stamps.map(readPrivateEndpointIdentity));
  const snapshots = await captureSidecarGenerationSetSnapshot(stamps);
  const endpointsAfterCapture = await Promise.all(stamps.map(readPrivateEndpointIdentity));
  const descriptions = await Promise.all(
    stamps.map(async (stamp, index) => await describeSidecarGeneration(stamp, descriptionTimeoutMs[index]))
  );
  const endpointsAfterDescribe = await Promise.all(stamps.map(readPrivateEndpointIdentity));
  return stamps.map((stamp, index) => {
    const endpoint = endpoints[index] ?? null;
    if (!samePrivateEndpointIdentity(endpoint, endpointsAfterCapture[index] ?? null)) {
      throw new Error("cannot mutate sidecar because endpoint ownership changed during process discovery");
    }
    if (!samePrivateEndpointIdentity(endpoint, endpointsAfterDescribe[index] ?? null)) {
      throw new Error("cannot mutate sidecar because endpoint ownership changed during description");
    }
    const snapshot = snapshots[index];
    if (snapshot.roots.length > 1) {
      throw new AmbiguousSidecarGenerationsError(snapshot.roots.map(({ pid }) => pid));
    }
    const description = descriptions[index] ?? null;
    const rootPid = snapshot.roots[0]?.pid ?? null;
    if (description != null && rootPid !== description.resources.pid) {
      throw new Error(
        `cannot mutate sidecar because endpoint pid ${description.resources.pid} is not the stamped generation root`
      );
    }
    return {
      description,
      endpoint,
      processes: snapshot.processes,
      ref: rootPid == null ? null : sidecarGenerationRef(stamp, rootPid, snapshot.roots[0]?.startedAtMs),
      stamp
    };
  });
}
function isTransientGenerationObservation(error) {
  if (!(error instanceof Error)) return false;
  return error.message.startsWith("cannot mutate sidecar because endpoint");
}
async function waitForAmbiguousRootExit(rootPids, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (rootPids.some((pid) => !isProcessAlive2(pid))) return true;
    await new Promise((resolve2) => setTimeout(resolve2, 50));
  }
  return rootPids.some((pid) => !isProcessAlive2(pid));
}
async function retireObservedSidecarGeneration(observation, options = {}) {
  return (await retireObservedSidecarGenerations([{ observation, options }]))[0];
}
async function retireObservedSidecarGenerations(requests) {
  const baseResults = await Promise.all(requests.map(async ({ observation, options = {} }) => observation.ref == null ? alreadyStoppedResult2() : await retireSidecarGeneration(observation.ref, options, observation.processes)));
  const replacementSnapshots = await captureSidecarGenerationSetSnapshot(
    requests.map(({ observation }) => observation.stamp)
  );
  return await Promise.all(requests.map(async ({ observation }, index) => {
    const base = baseResults[index];
    const replacements = replacementSnapshots[index].roots.filter(({ pid }) => isProcessAlive2(pid));
    const remainingPids = [.../* @__PURE__ */ new Set([
      ...base.remainingPids,
      ...replacements.map(({ pid }) => pid)
    ])];
    let staleEndpointRemoved = false;
    if (remainingPids.length === 0 && (observation.ref != null || await privateEndpointRefusesConnections(observation.stamp))) {
      staleEndpointRemoved = await removeOwnedPrivateEndpoint(observation.stamp, observation.endpoint);
    }
    return {
      ...base,
      alreadyStopped: base.alreadyStopped && remainingPids.length === 0,
      remainingPids,
      staleEndpointRemoved
    };
  }));
}
async function retireKnownSidecarGeneration(ref, options = {}) {
  const endpoint = await readPrivateEndpointIdentity(ref.stamp);
  const description = await describeSidecarGeneration(ref.stamp);
  const endpointAfterDescribe = await readPrivateEndpointIdentity(ref.stamp);
  if (!samePrivateEndpointIdentity(endpoint, endpointAfterDescribe)) {
    throw new Error("cannot retire sidecar generation because endpoint ownership changed during description");
  }
  const ownsEndpoint = description?.resources.pid === ref.rootPid;
  const result = await retireSidecarGeneration(ref, options);
  const replacementExists = (await captureSidecarGenerationSnapshot(ref.stamp)).roots.some(({ pid }) => isProcessAlive2(pid));
  let staleEndpointRemoved = false;
  if (result.remainingPids.length === 0 && !replacementExists && (ownsEndpoint || description == null && await privateEndpointRefusesConnections(ref.stamp))) {
    staleEndpointRemoved = await removeOwnedPrivateEndpoint(ref.stamp, endpoint);
  }
  return { ...result, staleEndpointRemoved };
}
async function retireSidecarGeneration(ref, options = {}, knownSnapshots) {
  const snapshots = knownSnapshots ?? await captureProcessSnapshot2();
  const rootOwnedAtEntry = snapshots.some(
    (processInfo) => processInfo.pid === ref.rootPid && (ref.startedAtMs == null || processInfo.startedAtMs === ref.startedAtMs) && matchesStampedProcess2(processInfo, ref.stamp, SIDECAR_STAMP_CONTRACT)
  );
  if (!rootOwnedAtEntry) return alreadyStoppedResult2();
  let gracefulAccepted = false;
  try {
    const response = await requestJsonIpc(
      resolvePrivateIpcPath(ref.stamp),
      { targetPids: [ref.rootPid], type: sidecarProtocol.stop },
      { timeoutMs: normalizeGracefulRequestTimeoutMs(options.gracefulRequestTimeoutMs) }
    );
    gracefulAccepted = response.accepted === true;
  } catch {
  }
  const result = await retireFencedSidecarProcessTree(ref, {
    gracefulStopInitiated: gracefulAccepted,
    knownSnapshots: snapshots,
    stopOptions: options
  });
  return { ...result, gracefulAccepted };
}
function normalizeGracefulRequestTimeoutMs(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 2e3;
}
function alreadyStoppedResult2() {
  return {
    alreadyStopped: true,
    forcedPids: [],
    gracefulAccepted: false,
    matchedPids: [],
    remainingPids: [],
    stoppedPids: []
  };
}
function uniqueNormalizedStamps(stampInputs) {
  const unique = /* @__PURE__ */ new Map();
  for (const input of stampInputs) {
    const stamp = normalizeSidecarStamp(input);
    unique.set(JSON.stringify(stamp), stamp);
  }
  return [...unique.values()];
}
function samePrivateEndpointIdentity(left, right) {
  return left == null || right == null ? left === right : left.dev === right.dev && left.ino === right.ino;
}
async function readPrivateEndpointIdentity(stamp) {
  if (process.platform === "win32") return null;
  const entry = await lstat2(resolvePrivateIpcPath(stamp)).catch(() => null);
  return entry?.isSocket() ? { dev: entry.dev, ino: entry.ino } : null;
}
async function removeOwnedPrivateEndpoint(stamp, owned) {
  if (owned == null) return false;
  const current = await readPrivateEndpointIdentity(stamp);
  if (current?.dev !== owned.dev || current.ino !== owned.ino) return false;
  await rm2(resolvePrivateIpcPath(stamp), { force: true });
  return true;
}
async function privateEndpointRefusesConnections(stamp) {
  if (process.platform === "win32") return false;
  return await new Promise((resolveProbe) => {
    const socket = createConnection2(resolvePrivateIpcPath(stamp));
    socket.once("connect", () => {
      socket.destroy();
      resolveProbe(false);
    });
    socket.once("error", (error) => {
      socket.destroy();
      resolveProbe(error.code === "ECONNREFUSED");
    });
  });
}

// src/operations.ts
var SidecarLaunchConvergenceError = class extends Error {
  launcherPid;
  constructor(message, launcherPid) {
    super(message);
    this.name = "SidecarLaunchConvergenceError";
    this.launcherPid = launcherPid;
  }
};
var RESTART_READY_TIMEOUT_MS = 3e4;
var BOOTSTRAP_READY_TIMEOUT_MS = 9e4;
var EXISTING_GENERATION_STABILITY_MS = 750;
var SIDECAR_LAUNCHER_RETRY_EXIT_CODE = 75;
var restartTails = /* @__PURE__ */ new Map();
var SidecarBootstrapGenerationRetiredError = class extends Error {
  constructor(pid) {
    super(`sidecar bootstrap generation ${pid} exited before a generation became ready`);
    this.name = "SidecarBootstrapGenerationRetiredError";
  }
};
function resolveSidecarLauncherExitCode(error) {
  return error instanceof SidecarBootstrapGenerationRetiredError ? SIDECAR_LAUNCHER_RETRY_EXIT_CODE : 1;
}
function registerSidecarProcess(stampInput, resources) {
  const stamp = normalizeSidecarStamp(stampInput);
  const context = readSupervisedSidecarContext();
  if (context == null) throw new Error("current process is missing its supervised sidecar context");
  if (JSON.stringify(context.stamp) !== JSON.stringify(stamp)) {
    throw new Error("current process carries a different sidecar resource identity");
  }
  process.env[SIDECAR_SUPERVISED_CONTEXT_ENV] = serializeSupervisedSidecarContext(
    stamp,
    context.generationPid,
    resources
  );
  return stamp;
}
async function bootstrapSidecarProcess(stampInput, resources, options = {}) {
  const stamp = normalizeSidecarStamp(stampInput);
  if (readSupervisedSidecarContext() != null) {
    registerSidecarProcess(stamp, resources);
    return false;
  }
  const launched = await (options.launch ?? launchSidecar)({
    args: removeSidecarLauncherArgs(options.args ?? process.argv.slice(1)),
    command: options.command ?? process.execPath,
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? process.env,
    logFd: null,
    resources,
    stamp
  });
  try {
    await (options.waitUntilReady ?? waitForBootstrappedSidecarReady)(stamp, launched.pid, BOOTSTRAP_READY_TIMEOUT_MS);
  } catch (error) {
    const cleanup = await retireKnownSidecarGeneration(sidecarGenerationRef(stamp, launched.pid), { termGraceMs: 0 });
    if (cleanup.remainingPids.length > 0) {
      throw new AggregateError(
        [error, new Error(`failed to retire rejected bootstrap generation: ${cleanup.remainingPids.join(", ")}`)],
        "sidecar bootstrap failed and cleanup was incomplete"
      );
    }
    throw error;
  }
  return true;
}
async function launchSidecar(request) {
  return await spawnBackgroundProcess(sidecarSpawnRequest(request));
}
async function spawnSidecarLauncher(request) {
  const stamp = normalizeSidecarStamp(request.stamp);
  const { args = [], command, env, resources, ...spawnRequest } = request;
  const child = await spawnLoggedProcess({
    ...spawnRequest,
    args: [
      ...removeSidecarLauncherArgs(args),
      ...createSidecarLauncherArgs(stamp)
    ],
    command,
    env: prepareSidecarLaunchEnvironment(env ?? process.env, resources)
  });
  if (child.pid == null) throw new Error("spawned sidecar launcher has no pid");
  return child;
}
async function convergeSidecarLaunch(request, options = {}) {
  const stamp = normalizeSidecarStamp(request.stamp);
  const ownerStamps = (options.ownerStamps ?? [stamp]).map(normalizeSidecarStamp);
  const timeoutMs = normalizeDuration(options.timeoutMs, 45e3);
  const stabilityMs = normalizeDuration(options.stabilityMs, EXISTING_GENERATION_STABILITY_MS);
  const retryDelayMs = normalizeDuration(options.retryDelayMs, 250);
  const deadline = Date.now() + timeoutMs;
  let attempts = 0;
  let lastLauncher = null;
  let lastExit = null;
  while (Date.now() < deadline) {
    attempts += 1;
    const launcher = await spawnSidecarLauncher({ ...request, stamp });
    lastLauncher = launcher;
    const readExit = observeChildExit(launcher);
    let stableOwnerPid = null;
    let stableSince = 0;
    let exitedAt = null;
    while (Date.now() < deadline) {
      const exit = readExit();
      if (exit != null && exitedAt == null) {
        exitedAt = Date.now();
        lastExit = exit;
      }
      if (exit != null && (exit.code !== 0 && exit.code !== SIDECAR_LAUNCHER_RETRY_EXIT_CODE || exit.signal != null)) {
        throw new SidecarLaunchConvergenceError(
          `sidecar launcher exited before convergence code=${exit.code ?? "null"} signal=${exit.signal ?? "null"}`,
          launcher.pid
        );
      }
      const descriptions = await Promise.all(ownerStamps.map(
        async (candidate) => await describeSidecarGeneration(candidate)
      ));
      const description = descriptions.find((candidate) => candidate?.ready === true) ?? null;
      const ownerPid = description?.resources.pid ?? null;
      const ownerSnapshot = ownerPid == null ? null : (await captureProcessSnapshotsByPids([ownerPid]))[0] ?? null;
      const generationStable = ownerSnapshot != null && description != null && matchesStampedProcess3(ownerSnapshot, description.stamp, SIDECAR_STAMP_CONTRACT) && !isSidecarLauncherCommand(ownerSnapshot.command);
      const launcherConverged = exit != null && exit.signal == null && (exit.code === 0 || exit.code === SIDECAR_LAUNCHER_RETRY_EXIT_CODE);
      if (launcherConverged && generationStable && description != null && ownerPid != null) {
        if (stableOwnerPid !== ownerPid) {
          stableOwnerPid = ownerPid;
          stableSince = Date.now();
        }
        if (Date.now() - stableSince >= stabilityMs) {
          return { attempts, description, launcherProcess: launcher };
        }
      } else {
        stableOwnerPid = null;
        stableSince = 0;
      }
      if (exitedAt != null && !generationStable && Date.now() - exitedAt >= retryDelayMs) break;
      await new Promise((resolve2) => setTimeout(resolve2, 50));
    }
    if (Date.now() < deadline) {
      await new Promise((resolve2) => setTimeout(resolve2, retryDelayMs));
    }
  }
  if (lastLauncher != null && isProcessAlive3(lastLauncher.pid)) {
    await stopProcesses2([lastLauncher.pid], { killGraceMs: 1e3, termGraceMs: 1e3 });
  }
  const exitSuffix = lastExit == null ? "" : `; last launcher exit code=${lastExit.code ?? "null"} signal=${lastExit.signal ?? "null"}`;
  throw new SidecarLaunchConvergenceError(
    `sidecar launcher did not leave one stable ready generation after ${attempts} attempt(s) within ${timeoutMs}ms${exitSuffix}`,
    lastLauncher?.pid ?? 0
  );
}
function observeChildExit(child) {
  let exit = child.exitCode != null || child.signalCode != null ? { code: child.exitCode, signal: child.signalCode } : null;
  child.once("exit", (code, signal) => {
    exit = { code, signal };
  });
  return () => exit;
}
function normalizeDuration(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}
function sidecarSpawnRequest(request) {
  const stamp = normalizeSidecarStamp(request.stamp);
  const { args = [], command, env, resources, ...spawnRequest } = request;
  const preparedEnv = prepareSidecarLaunchEnvironment(env ?? process.env, resources);
  const supervisorEntry = import.meta.url.endsWith(".ts") ? fileURLToPath(new URL("./supervisor.ts", import.meta.url)) : fileURLToPath(new URL("./supervisor.mjs", import.meta.url));
  return {
    ...spawnRequest,
    args: [
      ...import.meta.url.endsWith(".ts") ? ["--import", "tsx"] : [],
      supervisorEntry,
      ...createProcessStampArgs(stamp, SIDECAR_STAMP_CONTRACT)
    ],
    command: process.execPath,
    env: {
      ...preparedEnv,
      ELECTRON_RUN_AS_NODE: "1",
      [SIDECAR_SUPERVISOR_TARGET_ENV]: JSON.stringify({
        args: removeSidecarLauncherArgs(args),
        command,
        electronRunAsNode: preparedEnv.ELECTRON_RUN_AS_NODE ?? null
      })
    }
  };
}
async function spawnSidecar(request) {
  const stamp = normalizeSidecarStamp(request.stamp);
  const child = await spawnLoggedProcess(sidecarSpawnRequest({
    ...request,
    // A Windows generation must have its own process group so tree discovery
    // and retirement cannot cross into the launching shell. This is a
    // platform invariant, not a caller preference.
    detached: process.platform === "win32" ? true : request.detached,
    stamp
  }));
  if (child.pid == null) throw new Error("spawned sidecar process has no pid");
  const rootPid = child.pid;
  const rootSnapshot = process.platform === "win32" ? (await captureProcessSnapshotsByPids([rootPid]))[0] ?? null : null;
  const ref = sidecarGenerationRef(stamp, rootPid, rootSnapshot?.startedAtMs);
  const childProcess = child;
  let stopTask = null;
  return {
    process: childProcess,
    stamp,
    stop(options = {}) {
      stopTask ??= retireKnownSidecarGeneration(ref, options).finally(() => {
        stopTask = null;
      });
      return stopTask;
    }
  };
}
async function findSidecarProcesses(stamp) {
  const exact = normalizeSidecarStamp(stamp);
  const matches = (await listProcessSnapshots()).filter(
    (processInfo) => matchesStampedProcess3(processInfo, exact, SIDECAR_STAMP_CONTRACT) && !isSidecarLauncherCommand(processInfo.command)
  );
  const matchedPids = new Set(matches.map(({ pid }) => pid));
  return matches.filter(({ ppid }) => !matchedPids.has(ppid));
}
async function getSidecarStatus(stamp, options) {
  const exact = normalizeSidecarStamp(stamp);
  return await requestJsonIpc(
    resolvePrivateIpcPath(exact),
    { targetPid: options?.generationPid, type: sidecarProtocol.status },
    options == null ? void 0 : { timeoutMs: options.timeoutMs }
  );
}
async function invokeSidecar(stamp, action, input, options) {
  const exact = normalizeSidecarStamp(stamp);
  return await requestJsonIpc(
    resolvePrivateIpcPath(exact),
    { action, app: exact.app, input, type: "sidecar:invoke" },
    options
  );
}
async function stopSidecar(stamp, options = {}) {
  const exact = normalizeSidecarStamp(stamp);
  return await retireObservedSidecarGeneration(
    await observeSidecarGeneration(exact, options.gracefulRequestTimeoutMs),
    options
  );
}
async function stopSidecars(requests) {
  if (requests.length === 0) {
    return { ...emptyStopSetResult(), results: [] };
  }
  const normalized = /* @__PURE__ */ new Map();
  for (const request of requests) {
    const stamp = normalizeSidecarStamp(request.stamp);
    normalized.set(JSON.stringify(stamp), { options: request.options, stamp });
  }
  const unique = [...normalized.values()];
  const observations = await observeSidecarGenerations(
    unique.map(({ stamp }) => stamp),
    unique.map(({ options }) => options?.gracefulRequestTimeoutMs ?? 2e3)
  );
  const stopped = await retireObservedSidecarGenerations(observations.map((observation, index) => ({
    observation,
    options: unique[index].options
  })));
  const results = stopped.map((result, index) => ({ result, stamp: unique[index].stamp }));
  const matchedPids = [...new Set(stopped.flatMap(({ matchedPids: pids }) => pids))];
  const remainingPids = [...new Set(stopped.flatMap(({ remainingPids: pids }) => pids))];
  const stoppedPids = [...new Set(stopped.flatMap(({ stoppedPids: pids }) => pids))];
  const forcedPids = [...new Set(stopped.flatMap(({ forcedPids: pids }) => pids))];
  return {
    alreadyStopped: stopped.every(({ alreadyStopped }) => alreadyStopped),
    forcedPids,
    gracefulAccepted: stopped.some(({ gracefulAccepted }) => gracefulAccepted),
    matchedPids,
    remainingPids,
    results,
    stoppedPids
  };
}
function emptyStopSetResult() {
  return {
    alreadyStopped: true,
    forcedPids: [],
    gracefulAccepted: false,
    matchedPids: [],
    remainingPids: [],
    stoppedPids: []
  };
}
async function restartSidecar(request, options = {}) {
  const stamp = normalizeSidecarStamp(request.stamp);
  return await serializeRestart(stamp, async () => await restartSidecarGeneration({ ...request, stamp }, options));
}
async function restartSidecarGeneration(request, options) {
  const stamp = normalizeSidecarStamp(request.stamp);
  const inspected = await observeSidecarGeneration(stamp);
  const previous = inspected.description;
  const requestedPort = request.resources.port;
  const knownPort = previous?.resources.port ?? 0;
  if (options.requireConcretePort === true && requestedPort === 0 && knownPort === 0) {
    throw new Error("cannot restart sidecar without a concrete port");
  }
  const stop = await retireObservedSidecarGeneration(inspected, options.stop ?? {});
  if (stop.remainingPids.length > 0) {
    throw new Error(`cannot restart sidecar while prior generation remains: ${stop.remainingPids.join(", ")}`);
  }
  const replacements = (await captureSidecarGenerationSnapshot(stamp)).roots;
  if (replacements.length > 0) {
    throw new Error(`cannot restart sidecar because another generation appeared: ${replacements.map(({ pid }) => pid).join(", ")}`);
  }
  const reusedPort = options.reuseKnownPort !== false && requestedPort === 0 && knownPort > 0;
  const launched = await launchSidecar({
    ...request,
    resources: {
      ...request.resources,
      port: reusedPort ? knownPort : requestedPort
    },
    stamp
  });
  try {
    await waitForOwnedSidecarReady(stamp, launched.pid);
  } catch (error) {
    const cleanup = await retireKnownSidecarGeneration(sidecarGenerationRef(stamp, launched.pid), { termGraceMs: 0 });
    if (cleanup.remainingPids.length > 0) {
      throw new AggregateError(
        [error, new Error(`failed to retire rejected restart generation: ${cleanup.remainingPids.join(", ")}`)],
        "sidecar restart failed and cleanup was incomplete"
      );
    }
    throw error;
  }
  return { pid: launched.pid, reusedPort, stop };
}
async function serializeRestart(stamp, operation) {
  const key = JSON.stringify(normalizeSidecarStamp(stamp));
  const previous = restartTails.get(key) ?? Promise.resolve();
  let release;
  const tail = new Promise((resolve2) => {
    release = resolve2;
  });
  restartTails.set(key, tail);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (restartTails.get(key) === tail) restartTails.delete(key);
  }
}
async function waitForOwnedSidecarReady(stamp, pid, timeoutMs = RESTART_READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const description = await describeSidecarGeneration(stamp);
    if (description?.resources.pid === pid && description.ready) return;
    if (description != null && description.resources.pid !== pid) {
      throw new Error(`sidecar restart lost endpoint ownership to pid ${description.resources.pid}`);
    }
    if (!isProcessAlive3(pid)) throw new Error(`sidecar restart generation ${pid} exited before becoming ready`);
    await new Promise((resolve2) => setTimeout(resolve2, 50));
  }
  throw new Error(`sidecar restart did not acquire endpoint ownership for pid ${pid}`);
}
async function waitForBootstrappedSidecarReady(stamp, pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let stableExisting = null;
  while (Date.now() < deadline) {
    const description = await describeSidecarGeneration(stamp);
    if (description?.resources.pid === pid && description.ready) return;
    if (description?.ready === true && description.resources.pid !== pid && !isProcessAlive3(pid)) {
      const observedExisting = stableExisting;
      if (observedExisting == null || observedExisting.pid !== description.resources.pid) {
        stableExisting = { pid: description.resources.pid, since: Date.now() };
      } else if (Date.now() - observedExisting.since >= EXISTING_GENERATION_STABILITY_MS) {
        return;
      }
    } else {
      stableExisting = null;
    }
    if (!isProcessAlive3(pid) && description == null) {
      throw new SidecarBootstrapGenerationRetiredError(pid);
    }
    await new Promise((resolve2) => setTimeout(resolve2, 50));
  }
  throw new Error(`sidecar bootstrap did not leave a ready generation for pid ${pid}`);
}
export {
  SIDECAR_STAMP_FIELDS,
  SIDECAR_STAMP_FLAGS,
  SidecarClient,
  SidecarFactory,
  SidecarLaunchConvergenceError,
  allocatePort,
  bootstrapSidecarProcess,
  convergeSidecarLaunch,
  findSidecarProcesses,
  getSidecarStatus,
  handoffCurrentSidecarGeneration,
  invokeSidecar,
  isCurrentSidecarLauncher,
  launchSidecar,
  normalizeSidecarStamp,
  readCurrentSidecarStamp,
  registerSidecarProcess,
  resolveAppRuntimeDir,
  resolveAppRuntimePath,
  resolveLogFilePath,
  resolveLogsDir,
  resolveManifestPath,
  resolveNamespace,
  resolveNamespaceRoot,
  resolvePointerPath,
  resolveProjectRoot,
  resolveProjectTmpRoot,
  resolveRuntimeNamespaceRoot,
  resolveRuntimeRoot,
  resolveSidecarBase,
  resolveSidecarClientEndpoint,
  resolveSidecarLauncherExitCode,
  resolveSourceRuntimeRoot,
  restartSidecar,
  signalFromSupervisorExitCode,
  spawnSidecar,
  spawnSidecarLauncher,
  stopSidecar,
  stopSidecars,
  supervisorExitCode,
  withSidecarLifecycleLock
};
