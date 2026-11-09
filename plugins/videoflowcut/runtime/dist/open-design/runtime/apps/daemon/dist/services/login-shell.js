import { execFile } from 'node:child_process';
export function execFileBuffered(command, args, opts = {}) {
    return new Promise((resolve) => {
        execFile(command, [...args], { timeout: 120_000, maxBuffer: 1024 * 1024, ...opts }, (error, stdout, stderr) => {
            resolve({
                ok: !error,
                code: error && 'code' in error ? error.code : undefined,
                stdout: String(stdout ?? '').trim(),
                stderr: String(stderr ?? '').trim(),
                error,
            });
        });
    });
}
function quotePosixShellArg(value) {
    const text = String(value ?? '');
    return `'${text.replace(/'/g, `'\\''`)}'`;
}
function buildGhShellCommand(args) {
    return ['gh', ...args].map(quotePosixShellArg).join(' ');
}
function buildCommandShellCommand(command, args) {
    return [command, ...args].map(quotePosixShellArg).join(' ');
}
function buildLoginShellCommand(innerCommand) {
    // Use a non-login shell and re-export PATH so test fakes and agent wrappers
    // remain visible; login shells often reset PATH from profile scripts.
    return `export PATH=${quotePosixShellArg(process.env.PATH)}; ${innerCommand}`;
}
export function execGhBuffered(args, opts = {}) {
    if (process.platform === 'win32')
        return execFileBuffered('gh', args, opts);
    const shell = process.env.SHELL && process.env.SHELL.trim() ? process.env.SHELL.trim() : '/bin/zsh';
    return execFileBuffered(shell, ['-c', buildLoginShellCommand(buildGhShellCommand(args))], {
        env: process.env,
        ...opts,
    });
}
export function execCommandViaLoginShell(command, args, opts = {}) {
    if (process.platform === 'win32')
        return execFileBuffered(command, args, opts);
    const shell = process.env.SHELL && process.env.SHELL.trim() ? process.env.SHELL.trim() : '/bin/zsh';
    return execFileBuffered(shell, ['-c', buildLoginShellCommand(buildCommandShellCommand(command, args))], {
        env: process.env,
        ...opts,
    });
}
//# sourceMappingURL=login-shell.js.map