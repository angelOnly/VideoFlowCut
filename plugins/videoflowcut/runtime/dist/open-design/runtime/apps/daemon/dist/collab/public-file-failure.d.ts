import { type ApiFailureDetail, type ApiFailureReason, type ApiFailureStage } from '@open-design/contracts';
/** Carry only classified tokens through privacy boundaries. Never retain the
 * child error, cause, argv, paths, stdout or stderr in the replacement error.
 * Callers may override the reason only when a local phase proves it.
 */
export declare function safeVelaCommandError(message: 'VELA_PINNED_COMMAND_FAILED' | 'PUBLIC_SHARE_PUBLISH_FAILED', error: unknown, reason?: ApiFailureReason): Error;
/**
 * Classify a rejected `vela resource …` command into closed tokens.
 *
 * The rules follow the Vela CLI's own output contract (stable from vela-cli
 * 0.0.33 through 0.1.3): a failed command exits 1 and prints one
 * `Error: <err>` line on stderr, where an API rejection reads
 * `API request failed with status <N>[: <code>]`. Daemon-side terminations
 * (timeout, abort, missing binary) are recognised from `runVelaCommand`'s own
 * errors. Anything else is `unknown` — this never guesses.
 */
export declare function classifyVelaCommandFailure(stage: ApiFailureStage, error: unknown): ApiFailureDetail;
export type PublicShareBootstrapStage = 'bootstrap' | 'bootstrap_content_preflight' | 'bootstrap_directory_preflight' | 'bootstrap_root_push' | 'bootstrap_root_version' | 'bootstrap_catalog_upsert' | 'bootstrap_catalog_readback';
export type PublicShareDiagnosticStage = PublicShareBootstrapStage | 'remote_state' | 'resume_guard' | 'resume_command' | 'resume_record' | 'resume_prepare';
/** Bounded share lifecycle failures only: never include command output, identities or URLs. */
export declare function logPublicShareDiagnostic(entry: {
    operation: 'state_read' | 'resume' | 'bootstrap';
    stage: PublicShareDiagnosticStage;
    status: number;
    errorCode: string;
    requestId: string | undefined;
    startedAt: number;
    staleFallback?: boolean;
    failure?: Pick<ApiFailureDetail, 'reason' | 'upstreamStatus'>;
}): void;
/**
 * One structured, text-free line per failed publish/unpublish, next to the
 * existing free-form warning. It lands in the daemon log, which automatic
 * diagnostics bundles already include, and carries the client's request id so
 * a bundle can be matched to its `artifact_publish_result` event.
 */
export declare function logPublicFileFailure(entry: {
    action: 'publish' | 'unpublish';
    errorCode: string;
    failure: ApiFailureDetail;
    requestId: string | undefined;
    startedAt: number;
}): void;
