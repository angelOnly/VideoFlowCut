# 持续集成、发布与评审参考

本文件保存原开发规则，按当前任务只读取相关章节；仓库根 AGENTS.md 是工作入口。

## GitHub automation boundary

Read `.github/AGENTS.md` before editing `.github/workflows/`, `.github/scripts/`, `.github/actions/`, PR follow-on automation, `workflow_run` trusted writes, CI handoff artifacts, or the workflow topology checks that guard those surfaces.

CI-related GitHub automation uses a two-layer architecture:

- Business layer workflows own product or validation decisions. `ci.yml` is the main low-privilege PR, merge-queue, and manual validation workflow. It detects scope, runs checks, and produces typed handoff artifacts.
- Atomic capability workflows own reusable trusted operations. `comment.atom.yml` publishes pure text PR comments, `autofix.atom.yml` applies same-repository patches, and `report.atom.yml` materializes advanced comments that need trusted dependencies, secrets, or report generation before upsert.

Do not add a new business-named follow-on workflow such as `foo.comment.atom.yml` or `bar.autofix.atom.yml` without first trying to express the flow as a `ci.yml` producer plus the existing `comment`, `autofix`, or `report` capability. Keep artifact naming, storage layout, and parser behavior centralized in `.github/scripts/handoff.py`; do not let individual workflows invent parallel handoff conventions.

## CI test-set orchestration guidance

Use the following as a recommended convergence model, not a repository-wide
conformance gate. Existing workflows and coarse test lanes may remain while
their boundaries are understood. Do not block an unrelated change or require it
to repay adjacent orchestration debt solely because it touches an existing
lane. Apply these recommendations incrementally when the local scope and
measured scheduling benefit justify the migration.

Prefer one selection direction: changed paths → source units → test sets →
execution workloads. Because the `plan` job runs before and governs downstream
jobs, new omission policy should live in the planner rather than rely on a
downstream guard to justify it after scheduling has already occurred.

When a CI area is being reorganized, prefer three named responsibilities:

- **Source units** name stable ownership or behavior boundaries in production,
  test, fixture, and control-plane paths. Prefer composing repeated selectors
  under a named unit instead of copying prefixes into unrelated rules.
- **Test sets** name independently useful semantic validation groups. Their
  membership and execution contract should converge on one authoritative
  declaration instead of accumulating more matrix or file-list copies across
  planner configuration, workflow YAML, and framework-local registries.
- **Routes** map source units to the test sets required to validate them. Routes
  should express impact rather than runner mechanics; runner image, setup,
  sharding, and job packing can remain execution concerns derived after
  selection.

Good split candidates have a stable boundary, change work that can actually be
omitted, and carry enough runtime cost or diagnostic value to justify another
scheduling identity. Directory size, file count, or the ability to write a
narrower glob is weak evidence on its own. Prefer a small number of composable
semantic units over per-file mappings, exception lists, or negative-rule
forests. Treat existing duplicated or implicit declarations as migration
surfaces without requiring every nearby change to remove them.

Before promoting a new route from observation to active omission, retain
conservative behavior such as:

- unknown, mixed, unresolved, invalid, or below-threshold input selects the
  conservative full plan;
- editing a test, fixture, or suite manifest selects the test set that consumes
  it; shared harness, contract, setup, or lockfile changes fan out to every
  affected set;
- making a selected test-set identifier that the executor cannot run fail
  visibly instead of being ignored;
- direct planner tests cover representative in-bound, out-of-bound, mixed, and
  fallback inputs without reimplementing the evaluator in another language.

Keep scope routing and reusable-result convergence conceptually orthogonal:
scope answers which test sets are necessary for a change, while convergence
answers whether an identically declared workload already has a validated,
reusable successful result. New designs should not use result availability to
weaken source-to-test coverage or copy route policy into
`.github/config/convergence.json`. Prefer productless reusable workloads; when a
workload owns products, declare the complete typed reuse manifest with it.

For work whose purpose is CI orchestration, start by inventorying the current
chain from changed path to match, effect, workload, job command, and concrete
test cases. Prefer naming or removing implicit joins before making them finer.
Changes under `.github/` must also follow `.github/AGENTS.md` and the current
confidence methodology in `specs/current/ci.md`.

## Release channel model

- `beta` is the daily R&D/development validation channel. It is optimized for fast development feedback and is not part of the stable promotion gate.
- `prerelease` is the internal validation channel for stable delivery. Stable releases remain gated by validated prerelease artifacts.
- Prerelease builds macOS x64 (Intel) on every run. `release-prerelease.yml` takes an `enable_mac_x64` input that defaults to `true`, and `notify-release-feishu.yml` (the push-to-`release/**` entry point) forwards `true` on push. The switch stays because Intel is the pipeline's critical path — it runs on the slower `macos-15-intel` fleet, ~33 min against ~21 min for every other platform — so a run that is explicitly not about Intel can buy that time back. Turning it off costs that build its promotion eligibility, so it is not a routine choice.
- **A prerelease built without `enable_mac_x64` cannot be promoted to stable.** Stable ships Intel and stable's gate is validated prerelease artifacts, so an Intel-less prerelease has not validated the Intel artifact stable will ship. This is enforced, not merely documented: `validateStablePrereleaseMetadata` in `tools/release/src/metadata/prepare-stable.ts` requires `platforms.macIntel` (with `enabled: true`, `arch: "x64"`, `signed: true`, and versioned dmg/zip URLs) in the promoted prerelease's metadata, so promoting an Intel-less prerelease fails the stable `metadata` job instead of silently shipping an unvalidated Intel build. `platforms.linux` is deliberately not required there.
- The `notify-release-feishu.yml` forwarding for a default-on boolean must be `${{ github.event_name != 'workflow_dispatch' || inputs.<flag> }}`, never `${{ inputs.<flag> || true }}`. `inputs` is unset on push, so the second form reads correctly there — but on a dispatch where the operator UNCHECKED the box, `false || true` is also true and the switch becomes unturnoffable. (A default-*off* boolean uses `${{ inputs.<flag> || false }}` for the mirror-image reason: a bare `${{ inputs.<flag> }}` forwards `''` to a `type: boolean` callee input.)
- `enable_smoke` and `enable_tests` also default to `true`, because neither costs the build anything any more — see "Prerelease validation runs outside the pipeline" below. `mac_sign_mode` (default `sign-only`) codesigns without the Apple notary round-trip; `notarize` is the pre-stable setting, since stable ships notarized. `win_x64_smoke_mode` still chooses how deep the Windows smoke goes, and applies only when `enable_smoke` is on.
- **Signing is not optional for a prerelease that will be promoted.** `validateStablePrereleaseMetadata` requires `platforms.mac.signed == true` and `platforms.macIntel.signed == true`, so `mac_sign_mode: no` produces a prerelease that cannot become a stable release. Notarization has no metadata field and is therefore not checked — which is exactly why it, and not signing, is what the fast default drops.
- **Automated tests do not gate prerelease delivery.** A prerelease exists so a person can install it and test it by hand; machine CI is a parallel opinion about the same commit rather than a valve on delivery, and a flaky suite must never cost the team a day's package. Do not reintroduce a test job into `build_*` or `publish`'s `needs`/`if`; if a check must genuinely block delivery, that is a channel-policy decision, not a workflow edit.
- **Prerelease validation runs outside the pipeline.** `release-prerelease.yml` holds one repository-wide concurrency group (`open-design-release-prerelease`, `cancel-in-progress: false`), so any job that outlives `publish` keeps that group held and stops the NEXT prerelease from *starting*. Making the test jobs advisory was therefore not enough — they still blocked the next build. The workflow now contains only `metadata → build_* → publish` plus two fire-and-forget dispatcher jobs, and the validation lives in three dispatched workflows with concurrency groups scoped to the origin run:
  - `release-prerelease-tests.yml` — `functional_e2e`, `e2e_vitest`, `daemon_unit_tests`, `verify`, dispatched as soon as the build commit resolves.
  - `release-prerelease-smoke.yml` — the packaged mac/Windows smoke, dispatched after `publish`. It does **not** test a local build directory: `.github/scripts/release/smoke-artifacts.ts` reads the published version metadata, downloads the DMG / setup.exe a user would get, verifies its sha256 sidecar, and writes it to the one path `tools-pack <platform> install` reads. Linux keeps its in-job smoke, because the whole Linux lane is opt-in behind `vars.ENABLE_STABLE_LINUX` and is on nobody's critical path.
  - `release-prerelease-card.yml` — the progressive Feishu card.
  All three are dispatched through `.github/scripts/release/dispatch-validation.sh`, which aims `gh workflow run` at the built branch first and the default branch second, so a release branch cut before these lanes existed still gets validated. A dispatch failure is loud and non-blocking: nothing depends on the dispatcher jobs.
- **One writer owns the release card.** A Feishu `PATCH` replaces the entire card, so build jobs updating "their own" row would each erase the other two's. `release-prerelease-card.yml` therefore owns the message alone and learns everything by polling the jobs API of the three runs; `tools/release/src/notifications/prerelease-card.ts` renders the card as a total function of that state (unit-tested in `tools/release/tests/prerelease-card.test.ts`) and `feishu-app.ts` is the application-bot transport. The card is posted on the watcher's first poll, before any package exists, and every later state edits that same message: the channel learns a release is under way rather than waiting out the build window in silence. The rule that used to withhold it (a "构建中…" card left standing forever when a build dies) is now carried by rendering instead — a dead lane renders its own terminal state, `allPlatformsFailed` turns the card red once every expected platform has reported without shipping, and the watcher's timeout stamps the card rather than abandoning it. Per-platform durations and the whole-round clock come from the `started_at` / `completed_at` the watcher already polls; live numbers are quantized to the minute so the card does not PATCH itself on every poll.
- **`version_metadata_url` is the authoritative "did a package ship?" signal, not the workflow conclusion.** The conclusion goes red for anything anywhere in the release run, including work that happens after publication, so keying a notification off it paints the card red while its own download buttons work. The progressive card takes that answer from the published metadata it verifies rather than from a job conclusion, and `tools/release/src/notifications/feishu.ts` keeps the same rule (`VERSION_METADATA_URL` outranks `BUILD_STATE`, falling back to it only for callers that do not pass a URL) for the daily beta stream.
- **The prerelease Feishu notification has exactly one source: `release-prerelease-card.yml`.** The transitional one-shot webhook card that lived in `notify-release-feishu.yml`'s `notify` job was retired once the progressive card had carried four real releases; that workflow now only builds. Do not add a second prerelease notifier — the card is a PATCH-in-place message with a single writer, and a second poster produces the duplicate the transition existed to end. `tools/release/src/notifications/feishu.ts` and the `FEISHU_RELEASE_WEBHOOK` / `FEISHU_RELEASE_SIGN_SECRET` secrets stay: `notify-daily-feishu.yml` still renders the beta download card through them, and `cut-release`, `cut-patch-release`, `backport-automerge`, `bake-plugin-previews-automerge`, `main-prerelease-win-smoke`, and `dsh-upstream-drift` all post through the same webhook.
- `preview` is an independent early-access channel with stable-like release rigor. It should use preview versions such as `X.Y.Z-preview.N`, publish to the `preview` R2 channel, publish updater feeds under `preview/latest`, and follow stable's platform policy including the existing optional Linux enablement.
- `stable` is the formal delivery channel. Do not make stable promotion depend on preview; stable continues to depend on prerelease only.
- Public packaged app identity must stay channel-distinct: stable uses `Open Design`, beta uses `Open Design Beta`, prerelease uses `Open Design Prerelease`, and preview uses `Open Design Preview`. Do not ship beta, prerelease, or preview mac DMGs whose drag-install app bundle is `Open Design.app`.
- Windows beta updater validation must use the real beta namespace `release-beta-win`; otherwise a local beta-like namespace can create a separate uninstall registry key while looking like the same `Open Design Beta` app. See `tools/pack/AGENTS.md` for the architecture map and high-confidence acceptance harness.

## Pull request expectations

- Open Design team PR titles begin with a verified, scope-matching Plane item:
  `[OPEND-3693] fix(web): restore home scrolling`. Spaces around the identifier
  are accepted; consecutive identifiers link all items, with code lines assigned
  only to the first. Preserve the prefix when editing a title.
- This policy adds no required PR-body link or delivery-owner fields; continue
  filling the existing repository template. External contributors are exempt
  from the Plane gate. Internal accounts, including ODCrew, must pass
  `quality/plane` once the integration and required check are deployed.
- Emergency bypass requires `lefarcen` or `mrcfps` to Approve the current commit
  with `quality-bypass: <specific reason>` in the review. A normal approval does
  not bypass the gate. New commits or revoked approval require a new decision.
- Quality reports use the primary requirement's engineering role, not the bug
  assignee or repair PR author. Product and test code are counted separately;
  post-QA repairs do not enlarge the original delivery denominator.

- Opening a PR uses `.github/pull_request_template.md`; fill every section, not just the title.
- "Why" must answer both the author's use case (what made you write this PR) and the pain being addressed (user problem, technical debt, prod issue, or unblocker), not just a one-line restatement of the title.
- "What users will see" describes the change from a user's perspective — what they click, what new thing appears, what default behavior changed — not from a code perspective.
- The Surface area checklist must reflect actual surfaces touched; check every box that applies, including extension points (`skills/`, `design-systems/`, `design-templates/`, `craft/`), CLI flags, env vars, i18n keys, and new root `package.json` dependencies.
- If any UI surface is checked, attach screenshots showing the entry point — where users discover the change — not just the feature in isolation; before/after is best for behavior changes.
- For bug-fix PRs, link the red-spec test that reproduces the bug and confirm it went red on `main` and green on the branch, per the `Bug follow-up workflow` section above.
- `CONTRIBUTING.md` covers PR scope, title format, dependency policy, and the issue-first rule for non-trivial features; `docs/code-review-guidelines.md` is the reviewer-facing complement.

## Code review guide

- Use `docs/code-review-guidelines.md` as the repository-wide review standard. That document is the operational guide; this `AGENTS.md` is the source of truth when the two disagree.
- Walk reviews top-down through `docs/code-review-guidelines.md`: Product relevance test → forbidden surfaces → ownership/scope → matching lane → checklist → comments → approval bar.
- Pick the matching review lane: default code/tests, contract and protocol changes, design-system additions, skill additions, or craft additions.
- Before reviewing changes under `apps/`, `packages/`, `tools/`, or `e2e/`, read that directory's `AGENTS.md` and apply its local boundaries.
- Blocking review feedback should focus on correctness, security/secrets, data integrity, repository boundary violations, contract/migration breakage, missing required validation, or high-risk maintainability issues.
- Only maintainers may close a PR instead of requesting changes, and only when the change is not salvageable on the existing branch (wrong target product, foreign test harness, DOM/API assumptions absent from this repo, or scripts that conflict with lifecycle rules).

## PR-duty tooling

This repository no longer ships a maintainer PR-duty control plane. The former
`pnpm tools-pr` workflow has moved to the standalone `PerishCode/duty` project
so personal review-lane automation does not become product workspace
maintenance surface. Do not recreate `tools/pr`, `@open-design/tools-pr`, or a
root `pnpm tools-pr` script without a new explicit maintainer decision.

## Bug follow-up workflow

The following is a working playbook for routine bug follow-ups, distilled from recent practice. Treat it as a default action shape, not a contract — production reality always has edges these bullets can't anticipate, so use judgment when the situation doesn't fit cleanly.

- **Lead with a red spec.** Default to encoding the bug as a falsifiable test that goes red before any source change, so the fix is anchored in observable behavior rather than source-code intuition. If a red spec can't be written cheaply, that's usually a signal to clarify scope rather than push forward on a guess.
- **Try the cheapest layer first.** Reach for the lightest test layer that can still see the symptom (e2e Vitest at the daemon HTTP boundary → app-local Vitest → Playwright UI → platform-native harnesses), and drop down only when the cheaper layer can't.
- **Hold the spec's scope.** Defects discovered outside the bug's described boundary belong in a follow-up — their own red spec, their own PR — not in this fix. List them in the PR body's "Adjacent issues" section with the rationale and move on.
- **Let the fix read as an invariant.** Prefer a named helper whose docblock describes what must hold over a bolt-on `if` guard with apologetic history-comments. The call site should read as intent.
- **Diff against the baseline.** When neighboring suites have pre-existing failures, stash or check out upstream before claiming "no new failures."
- **Link the issue from the PR body.** Use `Fixes #N` / `Closes #N` / `Resolves #N` so the issue auto-closes on merge and the release-time reverse lookup (`gh issue view N --json closedByPullRequestsReferences` → `git tag --contains <merge sha>`) actually has a chain to follow. The repo's PR template prompts for this; deleting the prompt is fine when the PR genuinely closes nothing.
- **Stage human verification for visible bugs.** When the symptom needs an eye to confirm — UI, platform-native behavior, animations, race conditions a unit test can't see — green specs alone aren't acceptance. Stand up a buggy-vs-fix comparison the reviewer can drive themselves (typical shape: two namespaced runtimes, one on `main`, one on the fix branch), and seed any required data only through production HTTP APIs; source-level test backdoors invalidate the verification because they prove a fake flow rather than the real one.

For a worked example of one full loop (red e2e spec → fix → green), see `e2e/tests/dialog/stop-reconciles-message.test.ts` (issue #135).

