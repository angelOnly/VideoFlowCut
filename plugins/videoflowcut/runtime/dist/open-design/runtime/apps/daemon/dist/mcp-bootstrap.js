import { spawn } from "node:child_process";
import { isAbsolute } from "node:path";
import { SidecarFactory } from "@open-design/sidecar";
import { APP_KEYS, MCP_BOOTSTRAP_CONTRACT, } from "@open-design/sidecar-proto";
import { resolveDaemonUrl as resolveDaemonUrlDefault } from "./daemon-url.js";
const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 60_000;
const DEFAULT_BOOTSTRAP_POLL_MS = 250;
export function planMcpDaemonBootstrap(options) {
    if (options.daemonReachable) {
        return { action: "none", reason: "daemon-ready" };
    }
    if (options.explicitDaemonUrl) {
        return { action: "none", reason: "explicit-daemon-url" };
    }
    const command = options.env.OD_MCP_BOOTSTRAP_COMMAND;
    if (command == null || command.length === 0) {
        return { action: "none", reason: "bootstrap-unavailable" };
    }
    if (!isAbsolute(command)) {
        return { action: "none", reason: "invalid-bootstrap-command" };
    }
    const args = parseBootstrapArgs(options.env.OD_MCP_BOOTSTRAP_ARGS);
    if (args == null || !args.includes("--headless")) {
        return { action: "none", reason: "invalid-bootstrap-args" };
    }
    const env = { ...options.env };
    delete env.ELECTRON_RUN_AS_NODE;
    delete env.OD_DAEMON_URL;
    for (const key of Object.keys(env)) {
        if (key.startsWith("OD_SIDECAR_"))
            delete env[key];
    }
    return { action: "spawn", args, command, env };
}
/** True when the registration was written under a managed outer. */
export function isManagedMcpBootstrapEnv(env) {
    return parseBootstrapArgs(env.OD_MCP_BOOTSTRAP_ARGS)?.includes(MCP_BOOTSTRAP_CONTRACT.MANAGED_ARG) === true;
}
/**
 * The discovery endpoints of a managed registration, or null when the
 * registration is not managed or is malformed; either way the caller keeps
 * the unmanaged bootstrap path.
 */
export function parseManagedMcpDiscovery(env) {
    if (!isManagedMcpBootstrapEnv(env))
        return null;
    try {
        const parsed = JSON.parse(env[MCP_BOOTSTRAP_CONTRACT.DISCOVERY_ENV] ?? "");
        const isEndpointList = (value) => Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.length > 0);
        if (!isEndpointList(parsed.daemon) || !isEndpointList(parsed.desktop))
            return null;
        return { daemon: parsed.daemon, desktop: parsed.desktop };
    }
    catch {
        return null;
    }
}
export async function ensureMcpDaemonUrl(options = {}) {
    const env = options.env ?? process.env;
    const flagUrl = options.flagUrl ?? null;
    const resolveDaemonUrl = options.resolveDaemonUrl ?? resolveDaemonUrlDefault;
    const discoverTargetDaemonUrl = options.discoverTargetDaemonUrl ?? discoverDaemonUrlFromInheritedClient;
    const connectInherited = options.connectInherited ?? SidecarFactory.connectInherited;
    const probeDaemon = options.probeDaemon ?? probeDaemonHealth;
    const sleep = options.sleep ?? delay;
    const spawnBootstrap = options.spawnBootstrap ?? spawnBootstrapDetached;
    const timeoutMs = options.timeoutMs ?? DEFAULT_BOOTSTRAP_TIMEOUT_MS;
    const explicitDaemonUrl = (flagUrl != null && flagUrl.length > 0)
        || (env.OD_DAEMON_URL != null && env.OD_DAEMON_URL.length > 0);
    // A managed registration finds the namespace's daemon in whichever mode owns
    // it, and never asks the OS to reopen an app that is already running.
    const managedDiscovery = explicitDaemonUrl ? null : parseManagedMcpDiscovery(env);
    if (managedDiscovery != null) {
        return await ensureManagedMcpDaemonUrl(managedDiscovery, env, {
            probeDaemon,
            sleep,
            spawnBootstrap,
            statusAtEndpoint: options.statusAtEndpoint ?? readStatusAtEndpoint,
            timeoutMs,
        });
    }
    const registeredBootstrapTarget = !explicitDaemonUrl && connectInherited(env) != null;
    if (!explicitDaemonUrl && !registeredBootstrapTarget
        && (env.OD_MCP_BOOTSTRAP_COMMAND || env.OD_MCP_BOOTSTRAP_ARGS)) {
        throw new Error("The Open Design MCP registration is missing its runtime connection. Open the app and refresh the MCP registration, then restart this MCP session.");
    }
    let daemonUrl = registeredBootstrapTarget
        ? await discoverTargetDaemonUrl(env, 800)
        : await resolveDaemonUrl({
            allowLegacyDefault: false,
            env,
            flagUrl,
            timeoutMs: 800,
        });
    const daemonReachable = daemonUrl != null && await probeDaemon(daemonUrl);
    const plan = planMcpDaemonBootstrap({
        daemonReachable,
        env,
        explicitDaemonUrl,
    });
    if (plan.action === "none") {
        if (daemonUrl != null && (daemonReachable || explicitDaemonUrl))
            return daemonUrl;
        throw new Error(`The registered OpenDesign runtime is unavailable and cannot be launched (${plan.reason}).`);
    }
    await spawnBootstrap(plan);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await sleep(DEFAULT_BOOTSTRAP_POLL_MS);
        daemonUrl = registeredBootstrapTarget
            ? await discoverTargetDaemonUrl(env, 300)
            : await resolveDaemonUrl({
                allowLegacyDefault: false,
                env,
                flagUrl: null,
                timeoutMs: 300,
            });
        if (daemonUrl != null && await probeDaemon(daemonUrl))
            return daemonUrl;
    }
    throw new Error(`OpenDesign was launched headlessly but its daemon did not become ready within ${timeoutMs}ms.`);
}
async function ensureManagedMcpDaemonUrl(discovery, env, deps) {
    // The endpoints were resolved by the registering daemon. Never derive them
    // here: this process may not share the daemon's TMPDIR.
    const daemonEndpoints = [...new Set([
            ...(env.OD_SIDECAR_CLIENT_ENDPOINT ? [env.OD_SIDECAR_CLIENT_ENDPOINT] : []),
            ...discovery.daemon,
        ])];
    const findDaemon = async (timeoutMs) => {
        for (const endpoint of daemonEndpoints) {
            const status = await deps.statusAtEndpoint(endpoint, APP_KEYS.DAEMON, timeoutMs);
            if (status?.url != null && status.url.length > 0 && await deps.probeDaemon(status.url))
                return status.url;
        }
        return null;
    };
    const ownerRunning = async (timeoutMs) => {
        for (const endpoint of discovery.desktop) {
            if (await deps.statusAtEndpoint(endpoint, APP_KEYS.DESKTOP, timeoutMs) != null)
                return true;
        }
        return false;
    };
    const ready = await findDaemon(800);
    if (ready != null)
        return ready;
    if (!await ownerRunning(800)) {
        const plan = planMcpDaemonBootstrap({ daemonReachable: false, env, explicitDaemonUrl: false });
        if (plan.action !== "spawn") {
            throw new Error(`The registered OpenDesign runtime is unavailable and cannot be launched (${plan.reason}).`);
        }
        await deps.spawnBootstrap(plan);
    }
    // An owner that is already running (starting, restoring, or restarting its
    // daemon) is waited for, not reopened.
    const deadline = Date.now() + deps.timeoutMs;
    while (Date.now() < deadline) {
        await deps.sleep(DEFAULT_BOOTSTRAP_POLL_MS);
        const url = await findDaemon(300);
        if (url != null)
            return url;
    }
    throw new Error(`OpenDesign did not make its local service available within ${deps.timeoutMs}ms.`);
}
async function readStatusAtEndpoint(endpoint, app, timeoutMs) {
    const client = SidecarFactory.connectInherited({ OD_SIDECAR_CLIENT_ENDPOINT: endpoint });
    if (client == null)
        return null;
    try {
        return await client.status(app, { timeoutMs });
    }
    catch {
        return null;
    }
}
async function discoverDaemonUrlFromInheritedClient(env, timeoutMs) {
    const client = SidecarFactory.connectInherited(env);
    if (client == null)
        return null;
    try {
        const status = await client.status(APP_KEYS.DAEMON, { timeoutMs });
        return status.url;
    }
    catch {
        return null;
    }
}
function parseBootstrapArgs(raw) {
    if (raw == null || raw.length === 0)
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)
            || parsed.some((value) => typeof value !== "string")) {
            return null;
        }
        return [...parsed];
    }
    catch {
        return null;
    }
}
async function probeDaemonHealth(url) {
    try {
        const response = await fetch(`${url.replace(/\/$/u, "")}/api/health`, {
            signal: AbortSignal.timeout(800),
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
async function spawnBootstrapDetached(plan) {
    const child = spawn(plan.command, plan.args, {
        detached: true,
        env: plan.env,
        stdio: "ignore",
        windowsHide: true,
    });
    await new Promise((resolve, reject) => {
        child.once("spawn", resolve);
        child.once("error", reject);
    });
    child.unref();
}
async function delay(milliseconds) {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
//# sourceMappingURL=mcp-bootstrap.js.map