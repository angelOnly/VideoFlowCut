# 仓库与本地开发参考

本文件保存原开发规则，按当前任务只读取相关章节；仓库根 AGENTS.md 是工作入口。

## Core documentation index

- Product and onboarding: `README.md`, `docs/i18n/README.zh-CN.md`, `QUICKSTART.md`.
- Contribution and environment: `CONTRIBUTING.md`, `docs/i18n/CONTRIBUTING.zh-CN.md`.
- Architecture and protocols: `docs/architecture.md`, `docs/skills-protocol.md`, `docs/agent-adapters.md`, `docs/modes.md`.
- Historical product baseline: `docs/spec.md`, `docs/roadmap.md` (both explicitly archived; do not treat their dated decisions as current behavior).
- References and current plans: `docs/references.md`, `docs/code-review-guidelines.md`, `specs/current/maintainability-roadmap.md`, `specs/current/ci.md` (CI scope confidence methodology — required before changing planner confidence, routing, or omission policy in `.github/config/scopes.json` and `.github/scripts/scopes.py`), `specs/current/chat-panel-next.md` (ChatPanel 重构:基线、任务进度规格、决策记录、踩过的坑 — 改 chat 渲染管线/工具调用展示/执行记录前必读), `specs/current/chat-panel-next-plan.md` (交付计划与纠偏节点).
- Directory-level agent guidance: `.github/AGENTS.md`, `apps/AGENTS.md`, `packages/AGENTS.md`, `tools/AGENTS.md`, `e2e/AGENTS.md`, `apps/web/src/components/chat/AGENTS.md` (chat 组件分层、`--chat-*` 样式接缝、降级形态与测试规约).
- Packaged auto-update architecture and high-confidence local harness: read `tools/pack/AGENTS.md` section "Packaged auto-update architecture and harness" before touching packaged updater code, release-channel identity, installer behavior, or updater UI.
- Packaged build cache contract: `tools/pack/CACHE.md` (determinant rules, materialization-time parameters, confidence grading — required before changing any build-cache node key).
- Prompt composition has two independent implementations behind a rollout switch: `docs/prompt-composition.md` (fork point, variant axes, host runtime contract table, worked examples — required before changing any prompt text, in `apps/daemon/src/prompts/`, `packages/contracts/src/prompts/`, or under `plugins/_official/scenarios/od-next-strategy/`). See "Prompt variants" below.

## Workspace directories

- Workspace packages come from `pnpm-workspace.yaml`: `apps/*`, `packages/*`, `shells/*`, `tools/*`, and `e2e`.
- Top-level content directories: `skills/` (functional skills the agent invokes mid-task — utilities, briefs, packagers; see `skills/AGENTS.md`), `design-templates/` (rendering catalogue: decks, prototypes, image/video/audio templates; see `design-templates/AGENTS.md` and `specs/current/skills-and-design-templates.md`), `design-systems/` (brand `DESIGN.md` files), `craft/` (universal brand-agnostic craft rules a skill can opt into via `od.craft.requires`), `mocks/` (replay-based mock CLIs for `opencode`/`claude`/`codex`/`gemini`/`cursor-agent`/`deepseek`/`qwen`/`grok`, the ACP family `devin`/`hermes`/`kilo`/`kimi`/`kiro`/`vibe`, and the AMR `vela` CLI (login + models + ACP), built from anonymized Langfuse traces — PATH-overlay drop-in for tests and self-validation; see `mocks/README.md`).
- `apps/web` is the Next.js 16 App Router + React 18 web runtime; do not restore `apps/nextjs`.
- `apps/daemon` is the local privileged daemon and `od` bin. It owns `/api/*`, agent spawning, skills, design systems, artifacts, and static serving.
- `apps/desktop` is the Electron shell; it consumes web/daemon status through the sidecar client boundary.
- `apps/packaged` is the thin packaged Electron runtime entry; it starts packaged sidecars and owns the `od://` entry glue only.
- `apps/closure` owns the independently distributable OpenDesign Closure content. It does not own acquisition, generation state, or shell policy.
- `packages/contracts` is the pure TypeScript web/daemon app contract layer.
- `packages/sidecar-proto` owns business DTOs and action names; `packages/sidecar` owns the complete business-agnostic sidecar client boundary and protocol implementation; `packages/platform` owns generic OS process primitives.
- `packages/standalone` owns the shell-neutral exact metadata, verification, materialization, generation, and launcher contract.
- `shells/terminal` owns the official Node carrier and terminal-facing lifecycle commands. Shells consume standalone contracts and must not import Closure app source.
- `tools/dev` is the local development lifecycle control plane.
- `tools/pack` is the local packaged build/start/stop/logs control plane, packaged updater harness, installer identity/registry validation surface, and mac beta release artifact preparation surface.
- `tools/serve` is the local fixture-service control plane; first service is `tools-serve start updater` for deterministic updater metadata and artifacts.
- `tools/release` owns release metadata, storage publishing, release reports, and notification-facing data contracts; packaged artifact construction and smoke testing remain in `tools/pack`.
- `e2e` owns user-level end-to-end smoke tests and Playwright UI automation; read `e2e/AGENTS.md` before editing its tests or commands.

## Inactive or placeholder directories

- `apps/nextjs`, `packages/shared`, and `apps/landing-page` have been removed; do not recreate or reference them.
- Local runtime data, `.tmp/`, Playwright reports, and agent scratch directories must stay out of git. For daemon-managed data paths, read and follow **Daemon data directory contract** below; do not restate or improvise path conventions elsewhere.

## Environment baseline

- Runtime target is Node `~24` and `pnpm@10.33.2`; use Corepack so the pnpm version pinned in `package.json` is selected.
- New project-owned entrypoints, modules, scripts, tests, reporters, and configs should default to TypeScript.
- Residual JavaScript is limited to generated output, vendored dependencies, explicitly documented compatibility build artifacts, and the allowlist in `scripts/guard.ts`.

## Local validation scope

- Run focused tests for changed files and affected integration boundaries.
- Do not run full daemon or web suites locally unless explicitly requested by the user. This also applies to final regression; full suites run in PR CI.
- Run `pnpm guard` and `pnpm typecheck` before publication. If CI fails, investigate the failing lane and rerun the relevant focused tests.

## Windows native

- macOS, Linux, and WSL2 are the primary supported paths. Windows native is best-effort — file an issue if it doesn't work.
- Historical Windows-specific friction is documented in closed issues #10, #96, #100, #203, and #315; check the issue tracker for the current state before filing new reports.
- Install Node 24. Either `winget install OpenJS.NodeJS.LTS` (currently Node 24.x) or download from https://nodejs.org. After install, verify with `node --version` — the WinGet LTS pointer rolls to the next major in October 2026, so re-verify if you re-run the install command later. Do not use Node 22 — see FAQ.
- `corepack enable` fails with EPERM on Windows (cannot write shims to `Program Files`). Use `npm install -g pnpm@10.33.2` instead.
- `better-sqlite3` has no prebuilt binary for win32/Node 24; `pnpm install` will compile it from source via node-gyp (~2 min). Requires Visual Studio Build Tools 2022 or newer. This is expected — not a sign of version incompatibility.
- For `tools-dev` start/stop/status usage, see "Local lifecycle" below.

## Local lifecycle

- Use `pnpm tools-dev` as the only local development lifecycle entry point.
- Do not add or restore root lifecycle aliases: `pnpm dev`, `pnpm dev:all`, `pnpm daemon`, `pnpm preview`, or `pnpm start`.
- Ports are governed by `tools-dev` flags: `--daemon-port` and `--web-port`.
- `tools-dev` exports `OD_PORT` for the web proxy target and `OD_WEB_PORT` for the web listener; do not use `NEXT_PORT`.

## Root command boundary

- Keep root scripts reserved for true repo-level checks and tools control-plane entrypoints: `pnpm guard`, `pnpm typecheck`, `pnpm tools-dev`, `pnpm tools-pack`, and `pnpm tools-serve`.
- Do not add root aggregate `pnpm build` or `pnpm test` aliases. Build/test commands must stay package-scoped (`pnpm --filter <package> ...`) or tool-scoped (`pnpm tools-pack ...`).
- Do not add root e2e aliases; e2e package commands and ownership rules live in `e2e/AGENTS.md`.

## Boundary constraints

- Tests under `apps/`, `packages/`, and `tools/` live in a package/app/tool-level `tests/` directory sibling to `src/`; keep `src/` source-only and do not add new `*.test.ts` or `*.test.tsx` files under `src/`. Playwright UI automation belongs to `e2e/ui/`, not app packages.
- App packages must not import another app's private `src/` or `tests/` implementation as a shared helper. In particular, `apps/web/**` must not import `apps/daemon/src/**`; web/daemon integration belongs behind HTTP APIs, `packages/contracts`, and app-local provider boundaries.
- Cross-app, cross-runtime, or repository-resource consistency checks belong in `e2e/tests/` when they need to observe more than one app/package boundary; promote reusable logic to a pure package instead of borrowing another app's private source.
- Keep shared API DTOs, SSE event unions, error shapes, task shapes, and example payloads in `packages/contracts`; update contracts before wiring divergent web/daemon request or response shapes.
- Keep `packages/contracts` pure TypeScript and free of Next.js, Express, Node filesystem/process APIs, browser APIs, SQLite, daemon internals, and sidecar control-plane dependencies.
- Keep project-owned entrypoints, modules, scripts, tests, reporters, and configs TypeScript-first; generated `dist/*.js` is runtime output, and source edits belong in `.ts` files.
- New `.js`, `.mjs`, or `.cjs` files need an explicit generated/vendor/compatibility reason and must pass `pnpm guard`.
- App business logic must not know about sidecar/control-plane concepts. Keep sidecar awareness in `apps/<app>/sidecar` or the desktop sidecar entry wrapper.
- Shared web/daemon app contracts belong in `packages/contracts`; that package must not depend on Next.js, Express, Node filesystem/process APIs, browser APIs, SQLite, daemon internals, or the sidecar control-plane protocol.
- Sidecar process stamps must have exactly five fields: `channel`, `namespace`, `source`, `mode`, and `app`. IPC is private implementation detail and is never a stamp field.
- Sidecar identity is argv-only. Do not create identity/state files derived from a stamp.
- Orchestration layers (`tools-dev`, `tools-pack`, packaged launchers) must call `@open-design/sidecar` client/atomic primitives; do not expose argv assembly, IPC paths, or process scans.
- Packaged runtime paths must be namespace-scoped and independent from daemon/web ports; ports are transient transport details only.
- Default runtime files live under `<project-root>/.tmp/<source>/<namespace>/...`; private IPC endpoints are derived by `@open-design/sidecar` from the five-field stamp and the current OS principal. POSIX endpoints use a principal-scoped, hashed directory under the OS temporary directory; callers must treat the concrete path as opaque.

## Capability exposure (UI/CLI dual-track)

Every user-facing capability must be reachable through both the web UI **and** the `od` CLI (`apps/daemon/src/cli.ts`). Shipping a feature with only one of the two surfaces is a regression.

- The CLI is the embeddability contract. External agents (hermes-agent, openclaw, custom Slack/Discord bots, packaged runtimes invoked from another shell) drive OpenDesign through `od` subcommands — they do not render the web UI. If a capability is UI-only, it cannot be composed into those external agents.
- Both surfaces must call the same `/api/*` endpoints; do not let the CLI talk to one shape and the UI to another. The daemon HTTP layer is the single source of truth, with `packages/contracts` carrying the shared DTOs.
- The CLI form must support `--json` for machine-readable output and accept long-form prompts via `--prompt-file <path|->`, so jobs that pipe through `xargs`, `jq`, and `<heredoc` stay clean.
- Adding a new capability is a three-step closure: HTTP endpoint in `apps/daemon/src/*-routes.ts` (with a contract type in `packages/contracts/src/api/`), UI surface in `apps/web/src/`, and `od <capability>` subcommand in `apps/daemon/src/cli.ts` registered through `SUBCOMMAND_MAP`. Land all three in the same PR; do not stage them across PRs.
- The PR template's Surface area checklist must reflect *both* surfaces. If you ticked UI, tick CLI too — and vice-versa — or explain in the PR body why the missing surface is genuinely not applicable (e.g. an internal-only daemon health probe). "I'll do the CLI later" is not a valid reason.
- Existing reference points: `od automation …` mirrors the Automations tab against `/api/routines`; `od plugin …`, `od ui …`, `od project …`, `od media …`, `od mcp …`, `od research …` follow the same shape. Copy that pattern for new capabilities.

## Git commit policy

- Git commits must not include `Co-authored-by` trailers or any other co-author metadata.

## Validation strategy

- Before adding, repairing, or optimizing tests, follow
  [`docs/testing/test-efficiency.zh-CN.md`](testing/test-efficiency.zh-CN.md)
  for completion signals, virtual-clock usage, isolation, and performance
  validation.
- After package, workspace, or command-entry changes, run `pnpm install` so workspace links and generated dist entries stay fresh.
- For agent-stream / parser changes (`apps/daemon/src/runtimes/claude-stream.ts`, `json-event-stream.ts`, `qoder-stream.ts`, etc.), replay a recorded session through the mock CLIs in `mocks/` to verify event shapes round-trip without burning provider budget. PATH-overlay activation: `export PATH="$PWD/mocks/bin:$PATH" OD_MOCKS_TRACE=<8-char-id> OD_MOCKS_NO_DELAY=1`. See `mocks/README.md` for the trace catalog and selection knobs.
- Docker image smoke/publish lives only in `.github/workflows/docker-image.yml` and is outside the core `ci.yml` / `Validate workspace` / merge queue gate.
- Before marking regular work ready, run at least `pnpm guard` and `pnpm typecheck`, plus the package-scoped tests/builds that match the files changed. Do not use or add root `pnpm test`/`pnpm build` aliases.
- For local web runtime loops, prefer `pnpm tools-dev run web --daemon-port <port> --web-port <port>`.
- For e2e tests that need a tools-dev daemon/web runtime, use the shared tools-dev harness under `e2e/lib/tools-dev/` and the framework suite adapters (`e2e/lib/playwright/suite.ts`, `e2e/lib/vitest/suite.ts`). Do not hand-spawn `tools-dev` from test cases or duplicate lifecycle helpers under framework-specific folders.
- Playwright UI tests must import `test`/`expect` from `@/playwright/suite`, not directly from `@playwright/test`; type-only imports from `@playwright/test` remain fine. The suite owns one isolated tools-dev daemon/web/data root per Playwright worker. Do not add a shared-runtime fallback; set Playwright workers to `1` when constrained.
- Playwright suite code must not own workspace prebuild policy. CI and callers keep the existing prebuild steps; `tools-dev` daemon freshness checks are only a fallback guard.
- On a GUI-capable machine, validate desktop by running `pnpm tools-dev`, then `pnpm tools-dev inspect desktop status`.
- Stamp/namespace changes must validate two concurrent namespaces and run desktop `inspect eval` plus `inspect screenshot` for each namespace.
- Path/log changes must run `pnpm tools-dev logs --namespace <name> --json` and confirm log paths are under `.tmp/tools-dev/<namespace>/...`.

# Common commands

```bash
pnpm install
pnpm tools-dev
pnpm tools-serve start updater
pnpm tools-dev start web
pnpm tools-dev run web --daemon-port 17456 --web-port 17573
pnpm tools-dev status --json
pnpm tools-dev logs --json
pnpm tools-dev inspect desktop status --json
pnpm tools-dev inspect desktop screenshot --path /tmp/open-design.png
pnpm tools-dev stop
pnpm tools-dev check
```

```bash
pnpm guard
pnpm typecheck
```

```bash
pnpm --filter @open-design/web typecheck
pnpm --filter @open-design/web test
pnpm --filter @open-design/web build
pnpm --filter @open-design/daemon test
pnpm --filter @open-design/daemon build
pnpm --filter @open-design/desktop build
pnpm --filter @open-design/tools-dev build
pnpm --filter @open-design/tools-pack build
pnpm --filter @open-design/tools-serve build
```

```bash
pnpm tools-pack mac build --to all
pnpm tools-pack mac install
pnpm tools-pack mac cleanup
pnpm tools-pack win build --to nsis
pnpm tools-pack win install
pnpm tools-pack win cleanup
pnpm tools-pack linux build --to appimage
pnpm tools-pack linux install
pnpm tools-pack linux build --containerized
```

## Why is there no root `pnpm dev` / `pnpm start`?

To avoid starting daemon, web, and desktop through inconsistent env, port, namespace, or log paths. All local lifecycle flows must go through `pnpm tools-dev`.

## Why should `apps/nextjs` not be restored?

The current web runtime is `apps/web`. The historical `apps/nextjs` layout has been removed from the active repo shape; restoring it would reintroduce duplicate app boundaries and stale scripts.

## How does desktop discover the web URL?

Desktop queries runtime status through its sidecar client. The web URL comes from client status, not from desktop guessing ports, IPC paths, or reading web internals.

## How are sidecar-proto, sidecar, and platform split?

`@open-design/sidecar-proto` owns OpenDesign business action names and DTO/status shapes. `@open-design/sidecar` is the unique truth source for five-field argv stamps, private IPC, OS resources, process discovery, launch, invocation, and terminal lifecycle. `@open-design/platform` provides generic OS process primitives beneath sidecar and must not leak those implementation details into apps or orchestrators.

## When is `pnpm install` required?

Run `pnpm install` after changing package manifests, workspace layout, command entrypoints, bin/link-related content, or after adding/removing workspace packages.

## Can I use Node 22 instead of Node 24?

No. `package.json#engines` specifies `node: "~24"`, which is the only supported runtime. The current lockfile pins `better-sqlite3@11.10.0`; on Windows it has no prebuilt binary for Node 24 and is built from source via node-gyp (see the Windows native section). Older Node versions are not tested and may hit lockfile or dependency incompatibilities.
