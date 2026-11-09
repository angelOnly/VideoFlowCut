/**
 * Labels surfaced in chat status / diagnostics. Never expose resolved
 * executable paths — packaged installs leak app bundle roots and custom
 * home directories (issue #2874).
 */
export declare function userFacingAgentLabel(agentId: string | null | undefined, resolvedBin: string | null | undefined): string;
