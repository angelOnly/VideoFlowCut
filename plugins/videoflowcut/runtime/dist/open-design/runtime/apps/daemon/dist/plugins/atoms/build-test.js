// Phase 7 entry slice / spec §10 / §22.4 — build-test atom runner.
//
// Spec-side atom contract lives in `plugins/_official/atoms/build-test/SKILL.md`.
// This module is the daemon-side shell-out implementation: given a
// project cwd + an optional command override, run typecheck + test
// commands, write `critique/build-test.json`, and return the
// signals the devloop's `until` evaluator reads
// (`build.passing`, `tests.passing`, plus the legacy `critique.score`).
//
// The runner is intentionally framework-agnostic — it prefers the
// declared override, falls back to scripts inside `package.json`,
// and otherwise emits a `tests: 'skipped'` outcome with an explicit
// reason so the agent doesn't claim success on a project it never
// actually tested.
import path from 'node:path';
import { promises as fsp } from 'node:fs';
import { spawn } from 'node:child_process';
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_LOG_BUDGET = 1 * 1024 * 1024;
export async function runBuildTest(opts) {
    const cwd = path.resolve(opts.cwd);
    const inferred = await inferCommands(cwd);
    const buildCmd = opts.buildCommand !== undefined ? opts.buildCommand : inferred.build;
    const testCmd = opts.testCommand !== undefined ? opts.testCommand : inferred.test;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const logBudget = opts.logBudgetBytes ?? DEFAULT_LOG_BUDGET;
    const build = await runCommandOrSkip({
        label: 'build',
        command: buildCmd,
        cwd,
        timeoutMs,
        logBudget,
        spawnFn: opts.spawnFn,
        skipReason: 'no build / typecheck command resolved (set --build-command or add `typecheck` to package.json scripts)',
    });
    const tests = await runCommandOrSkip({
        label: 'tests',
        command: testCmd,
        cwd,
        timeoutMs,
        logBudget,
        spawnFn: opts.spawnFn,
        skipReason: 'no test command resolved (set --test-command or add `test` to package.json scripts)',
    });
    const signals = computeSignals({ build, tests });
    return { build, tests, signals, endedAt: new Date().toISOString() };
}
// Persist the report under the project cwd in the canonical layout the
// SKILL.md fragment locks. Returns the file paths so the caller can
// echo them on the run's SSE stream.
export async function writeBuildTestReport(args) {
    const dir = path.join(args.cwd, 'critique');
    await fsp.mkdir(dir, { recursive: true });
    const jsonPath = path.join(dir, 'build-test.json');
    const logPath = path.join(dir, 'build-test.log');
    const json = {
        build: statusOnly(args.report.build),
        tests: statusOnly(args.report.tests),
        durationMs: args.report.build.durationMs + args.report.tests.durationMs,
        commandsRun: [args.report.build.command, args.report.tests.command].filter(Boolean),
        failures: [args.report.build, args.report.tests]
            .filter((c) => c.status === 'failing')
            .map((c) => ({ command: c.command, exitCode: c.exitCode })),
        endedAt: args.report.endedAt,
        signals: args.report.signals,
    };
    await fsp.writeFile(jsonPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    const logBody = [
        `# build (${args.report.build.status}) — ${args.report.build.command || '<skipped>'}`,
        args.report.build.log,
        '',
        `# tests (${args.report.tests.status}) — ${args.report.tests.command || '<skipped>'}`,
        args.report.tests.log,
    ].join('\n');
    await fsp.writeFile(logPath, logBody, 'utf8');
    return { jsonPath, logPath };
}
async function inferCommands(cwd) {
    try {
        const raw = await fsp.readFile(path.join(cwd, 'package.json'), 'utf8');
        const pkg = JSON.parse(raw);
        const scripts = pkg.scripts ?? {};
        const pmRunner = await detectPackageManager(cwd);
        const buildScript = scripts.typecheck ?? scripts.build ?? null;
        const testScript = scripts.test ?? null;
        return {
            build: buildScript ? `${pmRunner} run ${pickScriptName(scripts, ['typecheck', 'build'])}` : null,
            test: testScript ? `${pmRunner} run test` : null,
        };
    }
    catch {
        return { build: null, test: null };
    }
}
function pickScriptName(scripts, preferred) {
    for (const name of preferred)
        if (scripts[name])
            return name;
    return preferred[0];
}
async function detectPackageManager(cwd) {
    if (await pathExists(path.join(cwd, 'pnpm-lock.yaml')))
        return 'pnpm';
    if (await pathExists(path.join(cwd, 'yarn.lock')))
        return 'yarn';
    return 'npm';
}
async function pathExists(p) {
    try {
        await fsp.access(p);
        return true;
    }
    catch {
        return false;
    }
}
async function runCommandOrSkip(args) {
    if (!args.command) {
        return {
            command: '',
            exitCode: 0,
            durationMs: 0,
            status: 'skipped',
            log: '',
            reason: args.skipReason,
        };
    }
    return runShell({
        command: args.command,
        cwd: args.cwd,
        timeoutMs: args.timeoutMs,
        logBudget: args.logBudget,
        spawnFn: args.spawnFn,
    });
}
function runShell(args) {
    return new Promise((resolve) => {
        const startedAt = Date.now();
        const launcher = args.spawnFn ?? spawn;
        const child = launcher('sh', ['-c', args.command], {
            cwd: args.cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let buffer = '';
        let truncated = false;
        const onChunk = (chunk) => {
            const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
            const remaining = args.logBudget - buffer.length;
            if (remaining <= 0) {
                truncated = true;
                return;
            }
            buffer += text.length > remaining ? text.slice(0, remaining) : text;
            if (text.length > remaining)
                truncated = true;
        };
        child.stdout?.on('data', onChunk);
        child.stderr?.on('data', onChunk);
        const timer = setTimeout(() => {
            try {
                child.kill('SIGTERM');
            }
            catch { /* already dead */ }
        }, args.timeoutMs);
        timer.unref?.();
        child.on('close', (code, signal) => {
            clearTimeout(timer);
            const exitCode = typeof code === 'number' ? code : (signal ? 124 : 1);
            const status = exitCode === 0 ? 'passing' : 'failing';
            resolve({
                command: args.command,
                exitCode,
                durationMs: Date.now() - startedAt,
                status,
                log: truncated ? buffer + '\n…[truncated]' : buffer,
            });
        });
        child.on('error', (err) => {
            clearTimeout(timer);
            resolve({
                command: args.command,
                exitCode: 1,
                durationMs: Date.now() - startedAt,
                status: 'failing',
                log: `[spawn-error] ${err.message ?? String(err)}`,
            });
        });
    });
}
function statusOnly(c) {
    const out = {
        command: c.command,
        status: c.status,
        exitCode: c.exitCode,
        durationMs: c.durationMs,
    };
    if (c.reason)
        out.reason = c.reason;
    return out;
}
function computeSignals({ build, tests }) {
    const buildPassing = build.status === 'passing' || build.status === 'skipped';
    const testsPassing = tests.status === 'passing' || tests.status === 'skipped';
    // Legacy critique.score axis: 5 when both pass, 3 when only build
    // passes, 1 otherwise. spec §22.4 says the scoring is meant for
    // pipelines that already read critique.score; new pipelines should
    // read build.passing / tests.passing directly.
    const score = buildPassing && testsPassing ? 5
        : buildPassing ? 3
            : 1;
    return {
        'build.passing': buildPassing,
        'tests.passing': testsPassing,
        'critique.score': score,
    };
}
//# sourceMappingURL=build-test.js.map