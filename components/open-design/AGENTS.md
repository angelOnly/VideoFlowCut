# 仓库工作入口

本文件规定跨仓库核心边界。进入 `apps/`、`packages/`、`tools/`、`e2e/`、`skills/`、`design-templates/` 或 `.github/` 时，继续读取对应目录的 AGENTS.md。以下参考按任务读取相关章节，不默认通读。

- 仓库目录、环境、Windows、本地启动、验证和常用命令：[仓库开发参考](docs/agent-repository-reference.md)。
- GitHub 自动化、CI、发布、PR、评审和故障跟进：[发布与评审参考](docs/agent-release-review-reference.md)。涉及打包升级或构建缓存还须读取 `tools/pack/AGENTS.md` 和 `tools/pack/CACHE.md`。
- 提示词、代理运行、物理 Run、Chat 和界面规范：[运行时与界面参考](docs/agent-runtime-ui-reference.md)。修改提示组装前须读 `docs/prompt-composition.md`；修改代理协议须读 `docs/agent-adapters.md`。

## 核心约束

- 使用 Node 24 与 pnpm 10.33.2；本地服务生命周期使用 `pnpm tools-dev`，不恢复根级 `pnpm dev` 或 `pnpm start`。
- 职责按现有模块划分，跨应用共享合同放在 `packages/contracts`；生成物不能手工作为源码修改。
- 保留用户未提交改动，开发验证使用隔离数据和端口，不把运行时工作区或 `.tmp/` 加入 Git。
- 根据变更运行针对性测试；除非用户明确要求，不在本地运行完整 daemon 或 web 测试套件。发布前执行 `pnpm guard` 和 `pnpm typecheck`。
- 不恢复已删除的 `apps/nextjs`、`packages/shared` 或 `apps/landing-page`。
- 修改或描述 daemon 数据路径前，必须读取下方唯一权威合同。

## Daemon data directory contract

This section is the only repository-wide source of truth for daemon-managed
data paths. Every README, guide, deployment note, and operational handoff that
mentions daemon data paths must point here instead of restating the rules.

This boundary is strict. Do not introduce concrete filesystem examples for the
daemon data directory, recommended data directory, shared data directory,
deployment mount, or example data directory. If existing code exposes a legacy
fallback, treat it as implementation detail or a known escape candidate, not as
a documentation pattern to copy. If a change needs a data-path rule that is not
covered here, request a core-maintainer decision in the PR instead of inventing
a new convention.

The daemon has one active data-root truth source:

- On daemon startup, `apps/daemon/src/server.ts` resolves `OD_DATA_DIR` into
  `RUNTIME_DATA_DIR`.
- All daemon-owned data paths must derive from `RUNTIME_DATA_DIR` or from a
  constant derived from it, such as `PROJECTS_DIR` or `ARTIFACTS_DIR`.
- `PROJECTS_DIR` is the managed-project root. Imported-folder projects are the
  explicit exception: they use `metadata.baseDir` for the user-selected
  external workspace.
- `ARTIFACTS_DIR`, SQLite, app config, memory, MCP config/tokens, automation
  state, plugin state, connector credentials, generated files, logs owned by
  sandbox mode, and agent runtime homes are daemon data and must remain under
  the resolved daemon data root unless this file names a specific exception.
- Agent subprocesses receive the resolved daemon data root as `OD_DATA_DIR`.
  They must inherit the daemon's truth source instead of guessing their own
  data path.

Development propagation:

- `tools-dev` consumes sidecar launch/discovery/lifecycle atomics and owns only developer orchestration policy.
- `tools-dev --namespace <name>` does not, by itself, define daemon data
  isolation.
- A development run that needs an isolated daemon data root must pass
  `OD_DATA_DIR` into the daemon process environment. After that, the daemon
  resolves it once and all daemon data paths flow from `RUNTIME_DATA_DIR`.

Packaged propagation:

- `tools-pack` / `apps/packaged` own packaged channel and namespace layout.
- Packaged code resolves the final namespace-scoped daemon data root before
  spawning the daemon.
- The packaged daemon receives that final data root as `OD_DATA_DIR`; daemon
  code must not infer packaged data paths from app names, Electron `userData`,
  ports, channel names, or namespace names.

Sanctioned exceptions:

- `OD_MEDIA_CONFIG_DIR` is a narrow override for `media-config.json` only. It
  is not a second daemon data root.
- `OD_LEGACY_DATA_DIR` is a migration source for legacy data import only. It is
  not an active daemon data root.
- External tool homes such as `CODEX_HOME` are integration inputs, not daemon
  data roots. The daemon must not describe them as OpenDesign runtime data.
- Agent/project-cwd skill staging aliases are not daemon data roots.
- Manifest metadata keys and CSS identifiers are semantic namespaces, not
  filesystem path conventions.

Known escape candidates that must not be reused:

- Module-level defaults that point at a cwd-relative legacy data directory.
- Helper defaults such as `defaultRegistryRoots()` that recompute a data root
  from `process.env.OD_DATA_DIR` or a cwd fallback instead of receiving
  `RUNTIME_DATA_DIR`.
- `openDatabase(projectRoot)` calls that rely on its fallback instead of
  passing the resolved data root.
- Script help text or examples that suggest concrete legacy data directories.

Do not extend these escape patterns. When a fix is obvious, route the path
through `RUNTIME_DATA_DIR` or an explicit data-root argument. When it is not
obvious, block the PR and request core-maintainer guidance.
