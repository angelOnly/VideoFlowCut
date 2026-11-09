import type { LogSource } from "./sources.js";
/**
 * Collect the most-recent per-run event logs (`<runsDir>/<runId>/events.jsonl`).
 *
 * These are the daemon's capture of each agent CLI's own stdout/stderr/stream
 * for a run — the single richest, agent-agnostic diagnostic signal for "the
 * run failed / produced nothing". Shared so both the daemon HTTP export and the
 * desktop IPC export bundle the same data.
 */
export declare function buildRunEventLogSources(runsDir: string | null | undefined, options?: {
    maxRuns?: number;
    tailBytes?: number;
}): Promise<LogSource[]>;
export interface AgentCliLogOptions {
    /** User home directory; CLI configs/logs live under here. */
    homeDir: string;
    /** OpenDesign data dir (OD_DATA_DIR); fallback location of the AMR OpenCode home. */
    dataDir?: string | null;
    /**
     * Effective AMR OpenCode home (the resolved `OPENCODE_TEST_HOME`). Callers
     * should pass the value a real AMR run would use so this honors a user
     * `agentCliEnv.amr.OPENCODE_TEST_HOME` override; when omitted we fall back to
     * the default `<dataDir>/amr/opencode-home`.
     */
    amrOpenCodeHome?: string | null;
    /**
     * Effective Claude config home (`CLAUDE_CONFIG_DIR`). Honors a user
     * `agentCliEnv.claude.CLAUDE_CONFIG_DIR` override; falls back to `~/.claude`.
     */
    claudeConfigDir?: string | null;
    /**
     * Effective Codex home (`CODEX_HOME`). Honors a user
     * `agentCliEnv.codex.CODEX_HOME` override; falls back to `~/.codex`.
     */
    codexHome?: string | null;
    /** XDG_DATA_HOME, if set, used for OpenCode's data dir resolution. */
    xdgDataHome?: string | null;
    /** Max log files to include per agent (most-recent first). */
    maxFilesPerAgent?: number;
    /** Max bytes to read from each log file's tail. */
    tailBytes?: number;
}
/**
 * Collect the native on-disk logs of the coding-agent CLIs OpenDesign drives:
 * Claude Code, Codex, OpenCode, and AMR (vela's OpenCode runtime). These
 * complement the per-run `events.jsonl` capture with the CLI's own internal
 * diagnostics (provider errors, retries, auth state) that never reach the
 * daemon's stream.
 *
 * Deliberately excluded: secret-bearing files. We only sweep known *log*
 * directories (`*.log` files) — never `~/.amr/config.json`, `~/.codex/auth.json`,
 * or session transcripts — and the collected text still passes through the
 * bundle's redaction pass.
 */
export declare function buildAgentCliLogSources(options: AgentCliLogOptions): Promise<LogSource[]>;
