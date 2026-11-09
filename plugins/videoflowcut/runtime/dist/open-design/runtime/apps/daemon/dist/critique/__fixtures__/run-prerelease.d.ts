/**
 * Prerelease conformance entrypoint (Phase 16).
 *
 * The GitHub Actions workflow at `.github/workflows/critique-conformance.yml`
 * invokes this script once a day. It runs the conformance harness
 * against every synthetic adapter, classifies the outcome, and writes
 * one `ConformanceDay` row per adapter into the daemon's history dir.
 * The `/api/critique/conformance` route reads the rolling 14-day
 * window and the ratchet returns its promote / hold / demote
 * recommendation.
 *
 * Why synthetic-only for v1: the full production-adapter sweep needs
 * every agent CLI installable in the CI image. Wiring that is its own
 * focused follow-up. The synthetic adapters prove the cron plumbing
 * (install + build + harness invocation + history write) without the
 * dependency on third-party binaries. A real adapter is a one-line
 * addition to `ADAPTERS` below once the harness wraps its stdout.
 *
 * Exit code: 0 only when every adapter ran (regardless of outcome).
 * A thrown error or a missing fixture exits non-zero so the workflow
 * fails the job instead of uploading an empty history snapshot
 * (Codex + lefarcen P1 on PR #1499 caught the prior `|| echo` mask).
 */
export {};
