import { VELA_CLI_FAILURE_ENVELOPE_FIELDS, } from "@open-design/contracts";
import { parseCommentBatchReceipt, validateCommentBatchRequest, } from "./comment-batch-receipt.js";
import { assertMemberPageQuery, CollabCloudError, memberPageRebuildResult, parseMemberPage, } from "../integrations/collab-cloud.js";
import { runVelaCommand, velaCommandStdout, velaWorkspaceCommandOptions, } from "../integrations/vela-command.js";
/** Retain the service's author snapshot rather than hashing local identity IDs. */
function toCloudComment(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return value;
    }
    const wire = value;
    const author = wire.author &&
        typeof wire.author === "object" &&
        !Array.isArray(wire.author)
        ? wire.author
        : null;
    if (!author)
        return wire;
    return {
        ...wire,
        ...(typeof author.authorKey === "string" && author.authorKey.trim()
            ? { authorKey: author.authorKey }
            : {}),
        ...(typeof author.displayName === "string" && author.displayName.trim()
            ? { authorDisplayName: author.displayName }
            : {}),
    };
}
export function createVelaCliCollabClient(options = {}) {
    const run = options.run ?? defaultRunVelaCollab;
    async function runJson(args, workspaceId, commandOptions) {
        const requestedWorkspaceId = workspaceId.trim();
        if (!requestedWorkspaceId) {
            throw new Error("explicit workspace scope is required");
        }
        let stdout;
        try {
            stdout = await run(args, requestedWorkspaceId, commandOptions);
        }
        catch (error) {
            throw collabCloudErrorFromVelaFailure(error) ?? error;
        }
        const trimmed = stdout.trim();
        if (!trimmed)
            return {};
        try {
            return JSON.parse(trimmed);
        }
        catch (cause) {
            throw new Error("Invalid JSON from Vela collaboration command", {
                cause,
            });
        }
    }
    return {
        isConfigured() {
            return true;
        },
        async registerMember(_teamId, _memberId, input) {
            const args = [
                "member",
                "register",
                "--display-name",
                input.displayName,
                "--role",
                input.role,
            ];
            const payload = await runJson(args, _teamId);
            return toDirectoryEntry(payload.member);
        },
        async listMembers(_teamId) {
            const payload = await runJson(["member", "list"], _teamId);
            return Array.isArray(payload.members)
                ? payload.members.map(toDirectoryEntry)
                : [];
        },
        async pushCommentBatch(workspaceId, projectId, request) {
            if (!workspaceId.trim() || !projectId.trim())
                throw new Error("explicit batch scope is required");
            validateCommentBatchRequest(request);
            // Snapshot before awaiting the process: correlation cannot follow caller mutation.
            const captured = {
                comments: request.comments.map((item) => ({ ...item })),
            };
            const input = JSON.stringify(captured);
            let stdout;
            try {
                stdout = await run([
                    "comment",
                    "push-batch",
                    projectId,
                    "--comment-file",
                    "-",
                    "--mode",
                    "align",
                    "--json",
                ], workspaceId.trim(), { input });
            }
            catch (error) {
                stdout = velaCommandStdout(error);
                if (!stdout.trim())
                    throw error;
            }
            return parseCommentBatchReceipt(stdout, captured);
        },
        async pushComment(_teamId, projectId, comment, idempotencyKey, historicalAuthorMemberId) {
            const payload = await runJson([
                "comment",
                "push",
                projectId,
                "--comment-file",
                "-",
                ...(idempotencyKey ? ["--idempotency-key", idempotencyKey] : []),
                ...(historicalAuthorMemberId ? ["--historical-author-member-id", historicalAuthorMemberId] : []),
            ], _teamId, { input: JSON.stringify(comment) });
            const authorKey = payload.author?.authorKey ?? payload.authorKey;
            return {
                seq: typeof payload.seq === "number" ? payload.seq : 0,
                ...(typeof authorKey === "string" && authorKey.trim()
                    ? { authorKey: authorKey.trim() }
                    : {}),
            };
        },
        /**
         * One C3-LITE member page via `vela collab comment pull --mode … --json`.
         * A failed command's `{error, errorCode, status}` stdout envelope becomes a
         * CollabCloudError first, so cursor-invalidating codes map to
         * `rebuild-required` exactly as on the HTTP transport.
         */
        async pullMemberPage(teamId, projectId, query) {
            const limit = assertMemberPageQuery(query);
            const args = [
                "comment",
                "pull",
                projectId,
                "--mode",
                query.mode,
                "--limit",
                String(limit),
                "--author-kinds",
                "member",
                "--json",
            ];
            if (query.pageToken !== undefined)
                args.push("--page-token", query.pageToken);
            if (query.resumeToken !== undefined)
                args.push("--resume-token", query.resumeToken);
            let payload;
            try {
                payload = await runJson(args, teamId);
            }
            catch (error) {
                return memberPageRebuildResult(error);
            }
            const page = parseMemberPage(payload, query.mode, projectId);
            return { kind: "page", page };
        },
        async pullComments(_teamId, projectId, sinceSeq) {
            const payload = await runJson([
                "comment",
                "pull",
                projectId,
                "--since-seq",
                String(sinceSeq),
                "--author-kinds",
                "member,user",
            ], _teamId);
            const comments = Array.isArray(payload.comments)
                ? payload.comments.map(toCloudComment)
                : [];
            return {
                comments,
                latestSeq: typeof payload.latestSeq === "number" ? payload.latestSeq : sinceSeq,
                notModified: comments.length === 0,
                etag: null,
            };
        },
        async heartbeatPresence(projectId, input, workspaceId) {
            const args = [
                "presence",
                "heartbeat",
                projectId,
                "--client-id",
                input.clientId ?? input.member.memberId,
            ];
            const displayName = input.member.name?.trim();
            if (displayName)
                args.push("--display-name", displayName);
            if (input.filePath)
                args.push("--file-path", input.filePath);
            if (input.activity !== undefined && input.activity !== null) {
                args.push("--activity-json", JSON.stringify(input.activity));
            }
            const payload = await runJson(args, workspaceId);
            return Array.isArray(payload.viewers)
                ? payload.viewers.map(toPresenceMember)
                : [];
        },
        async listPresence(projectId, workspaceId) {
            const payload = await runJson(["presence", "list", projectId], workspaceId);
            return Array.isArray(payload.viewers)
                ? payload.viewers.map(toPresenceMember)
                : [];
        },
        async leavePresence(projectId, input, workspaceId) {
            const payload = await runJson([
                "presence",
                "leave",
                projectId,
                "--client-id",
                input.clientId ?? input.memberId,
            ], workspaceId);
            return Array.isArray(payload.viewers)
                ? payload.viewers.map(toPresenceMember)
                : [];
        },
    };
}
/**
 * Preserve a Vela command's machine-readable HTTP failure without ever
 * classifying its human stderr. `runVelaCommand` carries rejected stdout, and
 * structured command envelopes put the Go-defined fields at the root. Legacy
 * nested `error.code` remains accepted. A code alone cannot cancel data;
 * a structured 413 without a code can only pause delivery.
 */
export function collabCloudErrorFromVelaFailure(error) {
    const stdout = error !== null &&
        typeof error === "object" &&
        typeof error.stdout === "string"
        ? error.stdout.trim()
        : "";
    if (!stdout)
        return null;
    let envelope;
    try {
        envelope = JSON.parse(stdout);
    }
    catch {
        return null;
    }
    if (envelope === null ||
        typeof envelope !== "object" ||
        Array.isArray(envelope))
        return null;
    const root = envelope;
    const nested = root[VELA_CLI_FAILURE_ENVELOPE_FIELDS.message];
    const detail = nested !== null && typeof nested === "object" && !Array.isArray(nested)
        ? nested
        : null;
    const status = detail?.[VELA_CLI_FAILURE_ENVELOPE_FIELDS.status] ??
        root[VELA_CLI_FAILURE_ENVELOPE_FIELDS.status];
    // The deployed CLI preserves status but omits errorCode for body-parser 413s.
    // Pausing that revision retains data; terminal cancellation still requires
    // the explicit 410 + SHARE_STOPPED pair below the transport boundary.
    const wireCode = detail?.code ?? root[VELA_CLI_FAILURE_ENVELOPE_FIELDS.code];
    const code = status === 413 && wireCode == null ? "PAYLOAD_TOO_LARGE" : wireCode;
    const message = detail?.message ?? root[VELA_CLI_FAILURE_ENVELOPE_FIELDS.message];
    if (typeof status !== "number" ||
        !Number.isInteger(status) ||
        typeof code !== "string" ||
        !code.trim())
        return null;
    return new CollabCloudError(status, code, typeof message === "string" ? message : undefined);
}
function toDirectoryEntry(input) {
    const memberId = typeof input?.memberId === "string" ? input.memberId : "";
    const displayName = typeof input?.displayName === "string" && input.displayName.trim()
        ? input.displayName
        : memberId;
    const role = isRole(input?.role) ? input.role : "member";
    return { memberId, displayName, role };
}
function toPresenceMember(input) {
    const memberId = typeof input.memberId === "string" ? input.memberId : "";
    const member = {
        memberId,
    };
    const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
    if (displayName && displayName !== memberId) {
        member.name = displayName;
    }
    if (isRole(input.role))
        member.role = input.role;
    if (typeof input.avatarUrl === "string" || input.avatarUrl === null) {
        member.avatarUrl = input.avatarUrl;
    }
    if (typeof input.filePath === "string" || input.filePath === null) {
        member.filePath = input.filePath;
    }
    if (input.activity !== undefined) {
        member.activity = input.activity;
    }
    if (typeof input.heartbeatAt === "string") {
        member.heartbeatAt = input.heartbeatAt;
    }
    return member;
}
function isRole(value) {
    return value === "owner" || value === "admin" || value === "member";
}
/**
 * Wall-clock budget for presence spawns. Presence heartbeat/list/leave are
 * high-frequency lease traffic (the web client beats every 10s and every beat
 * spawns a CLI process); without a budget a wedged CLI piles up unbounded
 * children while the client keeps beating. Presence data is disposable — the
 * next beat re-establishes it — so a hung spawn is terminated rather than
 * awaited. Member commands retain their existing behavior.
 */
const PRESENCE_COMMAND_TIMEOUT_MS = 10_000;
// Comment transport deadlines are retryable failures, never share lifecycle signals.
const COMMENT_COMMAND_TIMEOUT_MS = 30_000;
/** Only a validated CLI envelope may supply status/code; omitted Go status stays null. */
function commentCommandError(error) {
    const classified = collabCloudErrorFromVelaFailure(error);
    if (classified)
        return classified;
    const original = error instanceof Error
        ? error
        : new Error("Vela comment command failed", { cause: error });
    let payload;
    try {
        payload = JSON.parse(velaCommandStdout(error));
    }
    catch {
        return original;
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload))
        return original;
    const wire = payload;
    const message = wire[VELA_CLI_FAILURE_ENVELOPE_FIELDS.message];
    const code = wire[VELA_CLI_FAILURE_ENVELOPE_FIELDS.code];
    const statusValue = wire[VELA_CLI_FAILURE_ENVELOPE_FIELDS.status];
    const status = typeof statusValue === "number" &&
        Number.isInteger(statusValue) &&
        statusValue >= 400 &&
        statusValue <= 599
        ? statusValue
        : null;
    if (typeof message !== "string" ||
        !message.trim() ||
        typeof code !== "string" ||
        !/^[A-Za-z0-9_-]+$/.test(code))
        return original;
    return Object.assign(new Error(message, { cause: original }), {
        status,
        code,
    });
}
const defaultRunVelaCollab = (args, workspaceId, options) => runVelaCommand(["collab", ...args], {
    ...velaWorkspaceCommandOptions(workspaceId),
    ...options,
    ...(args[0] === "presence"
        ? { timeoutMs: PRESENCE_COMMAND_TIMEOUT_MS }
        : args[0] === "comment" &&
            (args[1] === "push" || args[1] === "pull" || args[1] === "push-batch")
            ? { timeoutMs: COMMENT_COMMAND_TIMEOUT_MS }
            : {}),
}).catch((error) => {
    throw args[0] === "comment" && args[1] === "push"
        ? commentCommandError(error)
        : error;
});
export function shouldUseVelaCliCollabTransport(env = process.env) {
    if (env.OD_WORKSPACE_CONTEXT_SOURCE?.trim() === "vela")
        return true;
    const explicitTransport = env.OD_COLLAB_TRANSPORT?.trim();
    if (explicitTransport)
        return explicitTransport === "vela-cli";
    if (env.OD_COLLAB_CLOUD_URL?.trim())
        return false;
    return (env.OD_TEAM_PROJECTS_TRANSPORT?.trim() === "vela-cli" ||
        env.OD_RESOURCE_TRANSPORT?.trim() === "vela-cli");
}
export function createVelaCliCollabClientFromEnv(env = process.env, options = {}) {
    return shouldUseVelaCliCollabTransport(env)
        ? createVelaCliCollabClient(options)
        : null;
}
//# sourceMappingURL=vela-cli-collab-client.js.map