// Thin wrapper over `codex mcp add|remove|get` so the Settings panel can
// offer a one-click "Install to Codex" toggle instead of asking the user
// to paste TOML into ~/.codex/config.toml. We shell out to the bundled
// Codex CLI rather than rewriting config.toml ourselves so we inherit
// Codex's own merge / dedupe / validation rules.
//
// CodexRunner is injected so tests can stub spawn without poking the
// global child_process module; production uses defaultCodexRunner which
// is a thin spawn() wrapper with a 30s timeout.
import { spawn } from 'node:child_process';
import { createCommandInvocation } from '@open-design/platform';
import { resolveAgentBin } from './runtimes/resolution.js';
// Resolve the same Codex executable used by the agent runtime before handing
// it to the shared platform invocation builder. This is required on Windows:
// npm installs Codex as `codex.cmd`, and Node's spawn() does not apply the
// shell's PATH/PATHEXT shim handling to a bare `codex` command. Keeping the
// fallback preserves the existing ENOENT signal when Codex is not installed.
export function createCodexCliInvocation(args, env, configuredEnv = {}, resolveBin = resolveAgentBin) {
    const command = resolveBin('codex', configuredEnv) ?? 'codex';
    return createCommandInvocation({ command, args, env });
}
const defaultCodexRunner = {
    run(args, opts) {
        return new Promise((resolve, reject) => {
            const configuredEnv = opts?.env ?? {};
            const env = { ...process.env, ...configuredEnv };
            const invocation = createCodexCliInvocation(args, env, configuredEnv);
            const child = spawn(invocation.command, invocation.args, {
                env,
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsVerbatimArguments: invocation.windowsVerbatimArguments,
            });
            let stdout = '';
            let stderr = '';
            const timer = setTimeout(() => {
                child.kill('SIGKILL');
                reject(new Error('codex CLI timed out after 30s'));
            }, 30_000);
            child.stdout?.on('data', (d) => {
                stdout += String(d);
            });
            child.stderr?.on('data', (d) => {
                stderr += String(d);
            });
            child.on('error', (err) => {
                clearTimeout(timer);
                reject(err);
            });
            child.on('close', (code) => {
                clearTimeout(timer);
                resolve({ exitCode: code ?? -1, stdout, stderr });
            });
        });
    },
};
let _runner = null;
// Tests inject a stub runner; production callers use the default. Pass
// null to restore the default (called from afterEach in test suites).
export function setCodexRunner(runner) {
    _runner = runner;
}
function activeRunner() {
    return _runner ?? defaultCodexRunner;
}
export async function probeCodexInstall(name) {
    try {
        const result = await activeRunner().run(['mcp', 'get', name]);
        return { available: true, installed: result.exitCode === 0 };
    }
    catch (err) {
        const code = err?.code;
        if (code === 'ENOENT') {
            return { available: false, installed: false };
        }
        throw err;
    }
}
export async function installCodexMcp(spec) {
    const argv = ['mcp', 'add', spec.name];
    for (const [key, value] of Object.entries(spec.env)) {
        argv.push('--env', `${key}=${value}`);
    }
    argv.push('--', spec.command, ...spec.args);
    const result = await activeRunner().run(argv);
    if (result.exitCode !== 0) {
        throw new Error(`codex mcp add failed: ${failureDetail(result)}`);
    }
}
// Parses `codex mcp get <name> --json` for a stdio server; null for any other
// transport or an unrecognized shape.
export function parseCodexMcpRegistration(stdout) {
    try {
        const parsed = JSON.parse(stdout);
        const transport = parsed.transport;
        if (transport == null || typeof transport.command !== 'string')
            return null;
        const args = Array.isArray(transport.args) && transport.args.every((arg) => typeof arg === 'string')
            ? transport.args
            : [];
        const env = {};
        if (transport.env != null && typeof transport.env === 'object') {
            for (const [key, value] of Object.entries(transport.env)) {
                if (typeof value === 'string')
                    env[key] = value;
            }
        }
        return { command: transport.command, args, env };
    }
    catch {
        return null;
    }
}
// Rewrites an existing registration so it follows the runtime that is running
// now, but only when `isOwned` proves the registration belongs to this
// install: the registration name is global, so every other install's
// registration must stay untouched. Never creates one: installing stays an
// explicit user action.
export async function refreshOwnedCodexMcp(spec, isOwned) {
    let result;
    try {
        result = await activeRunner().run(['mcp', 'get', spec.name, '--json']);
    }
    catch (err) {
        if (err?.code === 'ENOENT')
            return 'unavailable';
        throw err;
    }
    if (result.exitCode !== 0)
        return 'absent';
    const existing = parseCodexMcpRegistration(result.stdout);
    if (existing == null)
        return 'unreadable';
    if (!isOwned(existing))
        return 'foreign';
    await installCodexMcp(spec);
    return 'refreshed';
}
export async function uninstallCodexMcp(name) {
    const result = await activeRunner().run(['mcp', 'remove', name]);
    if (result.exitCode !== 0) {
        throw new Error(`codex mcp remove failed: ${failureDetail(result)}`);
    }
}
function failureDetail(result) {
    return result.stderr.trim() || result.stdout.trim() || `exit ${result.exitCode}`;
}
//# sourceMappingURL=codex-cli.js.map