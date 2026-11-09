const DELIVERABLE_SYNTAX_USAGE = `Usage:
  od tools deliverable-syntax check [--json]

Environment:
  OD_NODE_BIN     Node-compatible runtime for agent wrapper invocations
  OD_BIN          OpenDesign CLI script for agent wrapper invocations
  OD_DAEMON_URL   Daemon base URL injected into agent runs
  OD_TOOL_TOKEN   Bearer token injected into agent runs

Agent runtime invocation:
  "$OD_NODE_BIN" "$OD_BIN" tools deliverable-syntax check --json
`;
function writeJson(value, stream = process.stdout) {
    stream.write(`${JSON.stringify(value)}\n`);
}
function fail(message) {
    const output = {
        ok: false,
        error: { message },
    };
    writeJson(output, process.stderr);
    return { exitCode: 1 };
}
function parseOptions(args) {
    const [command, ...rest] = args;
    const options = {
        command: command === '-h' || command === '--help' ? undefined : command,
        help: command === '-h' || command === '--help',
    };
    for (const arg of rest) {
        if (arg === '--json')
            continue;
        if (arg === '-h' || arg === '--help') {
            options.help = true;
            continue;
        }
        return { error: `unknown option: ${arg}` };
    }
    return options;
}
function daemonUrl() {
    const rawUrl = process.env.OD_DAEMON_URL;
    if (!rawUrl)
        return { error: 'OD_DAEMON_URL is required' };
    try {
        const url = new URL(rawUrl);
        url.pathname = url.pathname.replace(/\/+$/u, '');
        url.search = '';
        url.hash = '';
        return url;
    }
    catch {
        return { error: 'OD_DAEMON_URL must be a valid URL' };
    }
}
function toolToken() {
    const token = process.env.OD_TOOL_TOKEN;
    if (!token)
        return { error: 'OD_TOOL_TOKEN is required' };
    return token;
}
function endpoint(baseUrl, pathname) {
    const url = new URL(baseUrl.toString());
    url.pathname = `${url.pathname}${pathname}`.replace(/\/+/gu, '/');
    return url.toString();
}
async function requestJson(baseUrl, token) {
    const response = await fetch(endpoint(baseUrl, '/api/tools/deliverable-syntax/check'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    const text = await response.text();
    let body = text;
    if (text.length > 0) {
        try {
            body = JSON.parse(text);
        }
        catch {
            body = { message: text };
        }
    }
    return { status: response.status, body };
}
function normalizeCliError(body) {
    const rawError = body && typeof body === 'object' && 'error' in body ? body.error : body;
    if (typeof rawError === 'string')
        return { message: rawError };
    if (!rawError || typeof rawError !== 'object')
        return { message: String(rawError ?? 'request failed') };
    const error = rawError;
    return {
        ...(typeof error.code === 'string' ? { code: error.code } : {}),
        message: typeof error.message === 'string' ? error.message : String(error.error ?? 'request failed'),
        ...(error.details === undefined ? {} : { details: error.details }),
    };
}
export async function runDeliverableSyntaxToolCli(args) {
    const options = parseOptions(args);
    if ('error' in options)
        return fail(options.error);
    if (options.help || !options.command) {
        process.stdout.write(DELIVERABLE_SYNTAX_USAGE);
        return { exitCode: options.command ? 0 : 1 };
    }
    if (options.command !== 'check')
        return fail(`unknown deliverable-syntax command: ${options.command}`);
    const baseUrl = daemonUrl();
    if ('error' in baseUrl)
        return fail(baseUrl.error);
    const token = toolToken();
    if (typeof token !== 'string')
        return fail(token.error);
    try {
        const response = await requestJson(baseUrl, token);
        if (response.status < 200 || response.status >= 300) {
            const output = {
                ok: false,
                status: response.status,
                error: normalizeCliError(response.body),
            };
            writeJson(output, process.stderr);
            return { exitCode: 1 };
        }
        const body = response.body && typeof response.body === 'object' && !Array.isArray(response.body)
            ? response.body
            : { result: response.body };
        const output = { ok: true, ...body };
        writeJson(output);
        return { exitCode: 0 };
    }
    catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
    }
}
//# sourceMappingURL=tools-deliverable-syntax-cli.js.map