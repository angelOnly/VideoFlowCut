// src/supervisor.ts
import { spawn } from "node:child_process";
import {
  captureProcessSnapshot as captureProcessSnapshot2,
  stopProcesses as stopProcesses2
} from "@open-design/platform";

// src/json-ipc.ts
import { chmod, lstat, mkdir, rm } from "node:fs/promises";
import { createConnection } from "node:net";
import { createServer as createNetServer } from "node:net";
import { dirname } from "node:path";
import { StringDecoder } from "node:string_decoder";

// src/ipc-path.ts
function isWindowsNamedPipePath(value) {
  return typeof value === "string" && value.startsWith("\\\\.\\pipe\\");
}

// src/net.ts
async function closeServer(server) {
  if (!server.listening) return;
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => error == null ? resolveClose() : rejectClose(error));
  });
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
function errorCode(error) {
  if (typeof error !== "object" || error == null || !("code" in error)) return null;
  const code = error.code;
  return code == null ? null : String(code);
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function jsonIpcError(error) {
  return {
    ...errorCode(error) == null ? {} : { code: errorCode(error) },
    message: errorMessage(error)
  };
}
async function staleUnixSocketExists(socketPath) {
  try {
    const stat = await lstat(socketPath);
    if (!stat.isSocket()) return false;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return false;
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
      const code = errorCode(error);
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
  await mkdir(dirname(socketPath), { mode: 448, recursive: true });
  await chmod(dirname(socketPath), 448);
  if (await staleUnixSocketExists(socketPath)) await rm(socketPath, { force: true });
}
async function createJsonIpcServer({
  handler,
  socketPath
}) {
  await prepareIpcPath(socketPath);
  const server = createNetServer((socket) => {
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
import { join } from "node:path";
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
  const stamp2 = readProcessStamp(process.argv.slice(1), SIDECAR_STAMP_CONTRACT);
  if (stamp2 == null) throw new Error("the five-field sidecar argv stamp is required");
  return stamp2;
}
function serializeSupervisedSidecarContext(stampInput, generationPid, resources2) {
  if (!Number.isSafeInteger(generationPid) || generationPid <= 0) {
    throw new Error("sidecar generation pid must be a positive safe integer");
  }
  return JSON.stringify({ generationPid, resources: resources2, stamp: normalizeSidecarStamp(stampInput) });
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
function sidecarStampKey(stamp2) {
  const value = normalizeSidecarStamp(stamp2);
  return SIDECAR_STAMP_FIELDS.map((field) => `${field}=${value[field]}`).join("\n");
}
function resolvePrivateIpcPath(stamp2, platform = process.platform) {
  const principal = platform === "win32" ? (() => {
    try {
      return userInfo().username;
    } catch {
      return process.env.USERNAME ?? process.env.USER ?? "unknown";
    }
  })() : String(process.getuid?.() ?? process.env.USER ?? "unknown");
  const digest = createHash("sha256").update(`${principal}
${sidecarStampKey(stamp2)}`).digest("hex").slice(0, 32);
  if (platform === "win32") return `\\\\.\\pipe\\open-design-sidecar-${digest}`;
  const endpoint = join(tmpdir(), `od-sidecar-${principal}`, `${digest}.sock`);
  return platform === "darwin" && Buffer.byteLength(endpoint) > 103 ? join("/tmp", `od-sidecar-${principal}`, `${digest}.sock`) : endpoint;
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
function newSidecarGenerationEnvironment(env) {
  const launchEnv = { ...env };
  delete launchEnv[INHERITED_ENDPOINT_ENV];
  delete launchEnv[RESOURCES_ENV];
  delete launchEnv[SIDECAR_SUPERVISED_CONTEXT_ENV];
  delete launchEnv[SIDECAR_SUPERVISOR_TARGET_ENV];
  return launchEnv;
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
  const ownerPid2 = value.ownerPid == null ? null : Number(value.ownerPid);
  if (ownerPid2 != null && (!Number.isSafeInteger(ownerPid2) || ownerPid2 <= 0)) {
    throw new Error("sidecar ownerPid must be null or a positive safe integer");
  }
  return Object.freeze({ dataRoot: value.dataRoot == null ? null : value.dataRoot, ownerPid: ownerPid2, port, runtimeRoot: value.runtimeRoot });
}
function readSidecarLaunchResources(env = process.env) {
  const serialized = env[RESOURCES_ENV];
  if (serialized == null) throw new Error(`${RESOURCES_ENV} is required`);
  try {
    return normalizeSidecarLaunchResources(JSON.parse(serialized));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`${RESOURCES_ENV} must contain valid JSON`, { cause: error });
    throw error;
  }
}
function readCurrentResources(context) {
  const resources2 = normalizeSidecarLaunchResources(context.resources);
  return Object.freeze({ ...resources2, pid: context.generationPid });
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
  #stopped = new Promise((resolve) => {
    this.#resolveStopped = resolve;
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
    const target2 = normalizeSidecarStamp({ ...this.stamp, app });
    return await requestJsonIpc(
      resolvePrivateIpcPath(target2),
      { action, app: target2.app, input, type: BUSINESS_INVOKE },
      options
    );
  }
  async status(app, options) {
    const target2 = normalizeSidecarStamp({ ...this.stamp, app });
    return await requestJsonIpc(resolvePrivateIpcPath(target2), { type: CONTROL_STATUS }, options);
  }
  async requestStop(app, options) {
    const target2 = normalizeSidecarStamp({ ...this.stamp, app });
    return await requestJsonIpc(resolvePrivateIpcPath(target2), { type: CONTROL_STOP }, options);
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

// src/process-retirement.ts
import {
  captureProcessSnapshot,
  isProcessAlive,
  matchesStampedProcess,
  signalProcesses,
  stopProcesses
} from "@open-design/platform";

// src/process-tree.ts
import {
  captureStampedProcessSnapshot,
  captureStampedProcessSetSnapshot,
  collectProcessTreePids,
  readProcessStampFromCommand
} from "@open-design/platform";
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
async function retireSupervisedSidecarTargetTree(ref, options) {
  return await retireSidecarProcessTree(
    ref,
    options,
    (processInfo) => processInfo.pid === ref.rootPid && processInfo.ppid === ref.supervisorPid,
    () => [ref.rootPid]
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
    await new Promise((resolve) => setTimeout(resolve, 100));
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

// src/supervisor-exit.ts
import { constants } from "node:os";
function supervisorExitCode(code, signal, forwardedSignal2) {
  if (forwardedSignal2 != null) return 0;
  if (signal != null) {
    const signalNumber = constants.signals[signal];
    return signalNumber != null ? 128 + signalNumber : 1;
  }
  return code ?? 1;
}

// src/supervisor.ts
function readTarget() {
  const serialized = process.env[SIDECAR_SUPERVISOR_TARGET_ENV];
  if (serialized == null) throw new Error(`${SIDECAR_SUPERVISOR_TARGET_ENV} is required`);
  const value = JSON.parse(serialized);
  if (typeof value.command !== "string" || !Array.isArray(value.args) || !value.args.every((arg) => typeof arg === "string")) {
    throw new Error(`${SIDECAR_SUPERVISOR_TARGET_ENV} is invalid`);
  }
  return {
    args: value.args,
    command: value.command,
    electronRunAsNode: typeof value.electronRunAsNode === "string" ? value.electronRunAsNode : null
  };
}
var target = readTarget();
var stamp = readCurrentSidecarArgvStamp();
var resources = readSidecarLaunchResources();
function supervisedEnvironment(env, electronRunAsNode) {
  const childEnv = {
    ...env,
    [SIDECAR_SUPERVISED_CONTEXT_ENV]: serializeSupervisedSidecarContext(stamp, process.pid, resources)
  };
  delete childEnv[SIDECAR_SUPERVISOR_TARGET_ENV];
  delete childEnv[sidecarProtocol.resourcesEnv];
  if (electronRunAsNode == null) delete childEnv.ELECTRON_RUN_AS_NODE;
  else childEnv.ELECTRON_RUN_AS_NODE = electronRunAsNode;
  return childEnv;
}
function spawnTarget(next) {
  return spawn(next.command, next.args, {
    cwd: next.cwd ?? process.cwd(),
    env: supervisedEnvironment(next.env ?? process.env, next.electronRunAsNode),
    stdio: ["inherit", "inherit", "inherit", "ipc"],
    windowsHide: true
  });
}
var child = spawnTarget(target);
var pendingHandoff = null;
function acceptChildMessage(message) {
  const envelope = message;
  if (envelope?.type !== sidecarSupervisorProtocol.handoff || typeof envelope.requestId !== "string") return;
  const request = envelope.request;
  if (request == null || typeof request.command !== "string" || request.command.length === 0 || pendingHandoff != null) return;
  pendingHandoff = request;
  child.send?.({ requestId: envelope.requestId, type: sidecarSupervisorProtocol.handoffAccepted });
}
var ownerPid = resources.ownerPid;
var ownerShutdownTask = null;
var ownerExpired = false;
async function stopTargetAfterOwnerDeath() {
  ownerExpired = true;
  if (child.pid == null) return;
  const rootPid = child.pid;
  let snapshots;
  try {
    snapshots = await captureProcessSnapshot2();
  } catch {
    const gracefulStopInitiated2 = await requestTargetStop();
    if (!gracefulStopInitiated2) {
      try {
        child.kill("SIGTERM");
      } catch {
      }
    }
    const stopped2 = await stopProcesses2([rootPid], { killGraceMs: 1e3, termGraceMs: 5e3 });
    reportOwnerlessSurvivors(stopped2.remainingPids);
    return;
  }
  const gracefulStopInitiated = await requestTargetStop();
  const stopped = await retireSupervisedSidecarTargetTree({
    rootPid,
    stamp,
    supervisorPid: process.pid
  }, {
    gracefulStopInitiated,
    knownSnapshots: snapshots,
    stopOptions: { killGraceMs: 1e3, termGraceMs: 5e3 }
  });
  reportOwnerlessSurvivors(stopped.remainingPids);
}
async function requestTargetStop() {
  try {
    const response = await requestJsonIpc(
      resolvePrivateIpcPath(stamp),
      { targetPids: [process.pid], type: sidecarProtocol.stop },
      { timeoutMs: 750 }
    );
    return response.accepted === true;
  } catch {
    return false;
  }
}
function reportOwnerlessSurvivors(remainingPids) {
  if (remainingPids.length === 0) return;
  console.error(`sidecar supervisor could not stop ownerless target: ${remainingPids.join(", ")}`);
  process.exitCode = 1;
}
var ownerTimer = ownerPid == null ? null : setInterval(() => {
  try {
    process.kill(ownerPid, 0);
  } catch {
    if (ownerTimer != null) clearInterval(ownerTimer);
    ownerShutdownTask ??= stopTargetAfterOwnerDeath().catch((error) => {
      console.error("sidecar supervisor failed to stop ownerless target", error);
      process.exitCode = 1;
    });
  }
}, 1e3);
ownerTimer?.unref();
var forwardedSignal = null;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    forwardedSignal = signal;
    if (child.pid != null) {
      try {
        child.kill(signal);
      } catch {
      }
    }
  });
}
function observeTarget() {
  child.on("message", acceptChildMessage);
  child.once("error", (error) => {
    console.error("sidecar supervisor failed to spawn target", error);
    process.exitCode = 1;
  });
  child.once("exit", (code, signal) => {
    const handoff = pendingHandoff;
    pendingHandoff = null;
    if (handoff != null && forwardedSignal == null && !ownerExpired) {
      child = spawnTarget({
        args: [...handoff.args ?? []],
        command: handoff.command,
        cwd: handoff.cwd,
        electronRunAsNode: handoff.env?.ELECTRON_RUN_AS_NODE ?? null,
        env: handoff.env
      });
      observeTarget();
      return;
    }
    if (ownerTimer != null) clearInterval(ownerTimer);
    process.exitCode = supervisorExitCode(code, signal, forwardedSignal);
  });
}
observeTarget();
