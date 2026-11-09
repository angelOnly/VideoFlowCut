import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
// macOS: AppleScript via osascript. Bringing Terminal.app to the
// foreground and creating a new shell that immediately runs the
// command is the canonical macOS pattern (same one VS Code uses for
// "Open in External Terminal").
async function launchOnDarwin(command) {
    // `do script "<cmd>"` opens a new Terminal window and runs <cmd>
    // in it; activate brings Terminal.app to the foreground so the
    // user actually sees the new window. Strict double-quote escaping
    // protects us if `command` ever grows special characters (today
    // it's just `agy`, so this is belt-and-suspenders).
    const safe = command.replace(/"/g, '\\"');
    const script = `tell application "Terminal" to do script "${safe}"\ntell application "Terminal" to activate`;
    try {
        await execFileAsync('osascript', ['-e', script], { timeout: 5_000 });
        return { ok: true, platform: 'darwin', via: 'osascript' };
    }
    catch (err) {
        return {
            ok: false,
            platform: 'darwin',
            reason: `osascript failed: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
// Linux: try the Debian/Ubuntu meta-emulator first, then the common
// concrete terminals. Each attempt spawns detached so the terminal
// window's lifetime is independent from the daemon's process group.
// We resolve as soon as the child process starts (not when it exits),
// because terminals like xterm and x-terminal-emulator stay alive for
// the duration of the interactive session — waiting for exit would time
// out and kill the window mid-OAuth-flow.
async function launchOnLinux(command) {
    // Order matters: x-terminal-emulator is the Debian alternative that
    // resolves to whichever terminal the distro chose. Otherwise try the
    // common ones. Each requires a slightly different invocation syntax
    // (`-e` vs `--` vs `-x`), captured in this table.
    const attempts = [
        { bin: 'x-terminal-emulator', args: ['-e', command] },
        { bin: 'gnome-terminal', args: ['--', 'sh', '-c', `${command}; exec $SHELL`] },
        { bin: 'konsole', args: ['-e', command] },
        { bin: 'xfce4-terminal', args: ['-e', command] },
        { bin: 'xterm', args: ['-e', command] },
    ];
    const errors = [];
    for (const { bin, args } of attempts) {
        try {
            await new Promise((resolve, reject) => {
                const child = spawn(bin, args, { detached: true, stdio: 'ignore' });
                child.unref();
                child.once('spawn', resolve);
                child.once('error', reject);
            });
            return { ok: true, platform: 'linux', via: bin };
        }
        catch (err) {
            errors.push(`${bin}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    return {
        ok: false,
        platform: 'linux',
        reason: `no system terminal worked (${errors.join('; ')})`,
    };
}
// Windows: `cmd /c start "<title>" cmd /k "<command>"` — the outer
// `start` opens a new console window (the first quoted "OpenDesign"
// is the window title, required by `start`'s positional-arg parser
// when the next token is also quoted), and the inner `cmd /k` keeps
// the window open after the command finishes so the user can see
// OAuth output and finish the flow before the window closes.
async function launchOnWindows(command) {
    try {
        await execFileAsync('cmd.exe', ['/c', 'start', 'OpenDesign', 'cmd.exe', '/k', command], { timeout: 5_000 });
        return { ok: true, platform: 'win32', via: 'cmd /c start' };
    }
    catch (err) {
        return {
            ok: false,
            platform: 'win32',
            reason: `cmd /c start failed: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
export async function launchAgentInSystemTerminal(command, platform = process.platform) {
    switch (platform) {
        case 'darwin':
            return launchOnDarwin(command);
        case 'linux':
            return launchOnLinux(command);
        case 'win32':
            return launchOnWindows(command);
        default:
            return {
                ok: false,
                platform,
                reason: `system-terminal launch is not supported on ${platform}`,
            };
    }
}
//# sourceMappingURL=terminal-launch.js.map