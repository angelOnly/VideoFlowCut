export type CommandInvocation = {
    args: string[];
    command: string;
    windowsVerbatimArguments?: boolean;
};
export type CommandInvocationRequest = {
    args?: string[];
    command: string;
    env?: NodeJS.ProcessEnv;
};
/**
 * Resolve a command request into the concrete invocation to spawn. On Windows,
 * `.bat` / `.cmd` targets are rewrapped as a `cmd.exe /d /s /c "..."` shim with
 * `windowsVerbatimArguments` so quoting and percent-expansion behave safely;
 * every other case passes the command and args straight through.
 *
 * @param request - The command, optional args, and env to base the invocation on.
 * @returns The `{ command, args }` (plus `windowsVerbatimArguments` when a shim is used) to spawn.
 */
export declare function createCommandInvocation({ args, command, env }: CommandInvocationRequest): CommandInvocation;
/**
 * Build the invocation for re-entering the repo-pinned package manager. Prefers
 * `npm_execpath` (routing Node-loadable managers through `process.execPath`),
 * and otherwise falls back to `corepack pnpm …` so Corepack-only setups without
 * a global `pnpm` on PATH still work. See #2438.
 *
 * @param args - Arguments to pass to the package manager.
 * @param env - Environment to read `npm_execpath` / `ComSpec` from (defaults to `process.env`).
 * @returns The `{ command, args }` invocation that runs the package manager.
 */
export declare function createPackageManagerInvocation(args: string[], env?: NodeJS.ProcessEnv): CommandInvocation;
//# sourceMappingURL=command.d.ts.map