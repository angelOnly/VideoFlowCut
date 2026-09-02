import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const repositoryRoot = process.cwd();
const skillsRoot = join(repositoryRoot, ".agents", "skills");
const mcpSourcePath = join(repositoryRoot, "apps", "server", "src", "mcp.ts");
const execFileAsync = promisify(execFile);

const expectedSkills = [
  "asset-import",
  "audio-finishing",
  "avatar-performance",
  "captions",
  "cutaway-planning",
  "depth-composition",
  "effect-timing",
  "evidence-visualization",
  "export",
  "known-errors",
  "presenter-motion-director",
  "production-director",
  "project-basics",
  "quality-verification",
  "remotion-production",
  "scene-planning",
  "semantic-continuity",
  "transcription",
  "visual-asset-sourcing",
  "visual-explainer-director",
  "visual-treatment-planning",
  "vlog-director",
  "voice-production",
  "web-editor-operator"
] as const;

const primaryWorkflows = ["presenter-motion-director", "visual-explainer-director", "vlog-director"] as const;

const currentSceneTypes = ["PresenterScene", "ExplainerScene", "VlogMontageScene", "CutawayScene", "EndCardScene"] as const;

const specialistSkills = [
  "asset-import",
  "transcription",
  "semantic-continuity",
  "voice-production",
  "avatar-performance",
  "visual-treatment-planning",
  "scene-planning",
  "effect-timing",
  "depth-composition",
  "cutaway-planning",
  "evidence-visualization",
  "captions",
  "audio-finishing",
  "remotion-production"
] as const;

const architectureTargets = new Set([
  "smooth_audio",
  "run_render_preflight",
  "read_export_artifact",
  "read_actor_capabilities",
  "submit_avatar_job",
  "read_narrative_map"
]);

const compatibilityOnlyTools = new Set(["create_presenter_timeline"]);

const ignoredToolLikeTokens = new Set([
  "start_frame",
  "end_frame",
  "base_revision_id",
  "project_id",
  "asset_id",
  "scene_id",
  "timeline_item_id",
  "effect_cue_id",
  "run_id",
  "job_id",
  "preview_job_id",
  "voice_reference_id",
  "voice_reference_asset_id",
  "speech_asset_id",
  "speech_segment_ids",
  "semantic_unit_ids",
  "style_pack_id",
  "quality_rules",
  "source_url",
  "mcp_command",
  "idempotency_key"
]);

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readSkill(name: string): Promise<string> {
  return readFile(join(skillsRoot, name, "SKILL.md"), "utf8");
}

async function markdownFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await markdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

/** 用户工作区可暂存未跟踪的评审资料；CI 只约束进入 Git 的运行时 Skills 副本。 */
async function hasTrackedNestedExecutableSkills(): Promise<boolean> {
  const { stdout } = await execFileAsync("git", ["ls-files", "--", "docs"], { cwd: repositoryRoot, encoding: "utf8" });
  return String(stdout).split(/\r?\n/u).some((path) => /(?:^|\/)\.agents\/skills\/.+\/SKILL\.md$/u.test(path));
}

function localMarkdownLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\]\(([^)]+\.md)(?:#[^)]+)?\)/gu)]
    .map((match) => match[1]!)
    .filter((reference) => !reference.startsWith("http://") && !reference.startsWith("https://"));
}

function registeredToolNames(mcpSource: string): Set<string> {
  return new Set([...mcpSource.matchAll(/server\.registerTool\("([^"]+)"/gu)].map((match) => match[1]!));
}

function toolSourceBlock(mcpSource: string, name: string): string {
  const start = mcpSource.indexOf(`server.registerTool("${name}"`);
  assert.notEqual(start, -1, `MCP 未注册工具：${name}`);
  const next = mcpSource.indexOf("server.registerTool(", start + 1);
  return mcpSource.slice(start, next === -1 ? undefined : next);
}

function toolTokens(markdown: string): string[] {
  const toolPrefixes = /^(?:list|create|target|read|manage|browse|import|submit|apply|assemble|compile|align|render|inspect|record|complete|start|track|update|move|preview|rollback|validate|get|search|acquire|replace|edit|smooth|run)_[a-z0-9_]+$/u;
  return [...markdown.matchAll(/`([a-z][a-z0-9_]*)`/gu)]
    .map((match) => match[1]!)
    .filter((token) => toolPrefixes.test(token) && !ignoredToolLikeTokens.has(token));
}

function sceneTypesInTool(toolSource: string): string[] {
  return [...new Set([...toolSource.matchAll(/"([A-Z][A-Za-z]*Scene)"/gu)].map((match) => match[1]!))].sort();
}

test("Skills V5 结构唯一、完整且可被 Codex 发现", async () => {
  const configuredNames = [...(await readFile(join(repositoryRoot, ".codex", "config.toml"), "utf8")).matchAll(/path = "\.\.\/\.agents\/skills\/([^"\r\n]+)"/gu)].map((match) => match[1]!);
  const onDiskNames = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(onDiskNames, [...expectedSkills].sort());
  assert.deepEqual([...new Set(configuredNames)].sort(), [...expectedSkills].sort());
  assert.equal(configuredNames.length, expectedSkills.length, "每个运行时 Skill 只能登记一次");
  assert.equal(await exists(join(skillsRoot, "_shared", "CURRENT_CAPABILITIES.md")), false, "运行时不得依赖 CURRENT_CAPABILITIES 快照");
  assert.equal(await exists(join(skillsRoot, "_shared", "MCP_EXECUTION_CONTRACT.md")), true);
  assert.equal(await hasTrackedNestedExecutableSkills(), false, "docs 中不得保留第二棵可执行 .agents/skills");

  const allSkillFiles = await markdownFiles(skillsRoot);
  for (const name of expectedSkills) {
    const skillPath = join(skillsRoot, name, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(skill);
    assert.ok(frontMatter, `${name} 缺少 YAML Front Matter`);
    assert.match(frontMatter![1], new RegExp(`^name:\\s*${name}$`, "mu"), `${name} 的 name 必须与目录一致`);
    assert.match(frontMatter![1], /^description:\s*\S+/mu, `${name} 缺少 description`);
    assert.match(skill, /##\s+(退出条件|验证与退出|停止条件|最终检查|完成标准|交接合同|交接)/u, `${name} 缺少可验证的退出或交接条件`);
  }

  for (const markdownPath of allSkillFiles) {
    const markdown = await readFile(markdownPath, "utf8");
    assert.doesNotMatch(markdown, /CURRENT_CAPABILITIES/u, `${markdownPath} 不得读取手工能力快照`);
    for (const reference of localMarkdownLinks(markdown)) {
      const resolved = resolve(dirname(markdownPath), reference);
      assert.equal(await exists(resolved), true, `${markdownPath} 引用了不存在的资料：${reference}`);
    }
  }
});

test("总导演只路由一个主工作流，专项 Skill 具备交接合同", async () => {
  const productionDirector = await readSkill("production-director");
  assert.match(productionDirector, /只选择一个主要视频工作流/u);
  for (const workflow of primaryWorkflows) {
    assert.match(productionDirector, new RegExp("`" + workflow + "`"), `总导演未声明 ${workflow} 路由`);
    const workflowContent = await readSkill(workflow);
    assert.match(workflowContent, /交接合同|交接/u, `${workflow} 缺少回收专项结果的交接说明`);
    assert.match(workflowContent, /quality-verification/u, `${workflow} 未进入统一质量收口`);
  }

  const presenter = await readSkill("presenter-motion-director");
  for (const specialist of ["semantic-continuity", "voice-production", "avatar-performance", "visual-treatment-planning", "visual-asset-sourcing", "remotion-production", "cutaway-planning", "captions", "audio-finishing"]) {
    assert.match(presenter, new RegExp("`" + specialist + "`"), `Presenter 主工作流未声明何时使用 ${specialist}`);
  }

  for (const specialist of specialistSkills) {
    const skill = await readSkill(specialist);
    assert.match(skill, /##\s+交接合同/u, `${specialist} 缺少专项交接合同`);
    assert.match(skill, /输入|进入事实/u, `${specialist} 的交接合同未写明输入事实`);
    assert.match(skill, /输出/u, `${specialist} 的交接合同未写明阶段结果`);
    assert.match(skill, /失效|stale|影响|重建|复核/u, `${specialist} 的交接合同未写明失效传播`);
    assert.match(skill, /验证/u, `${specialist} 的交接合同未写明验证证据`);
  }
});

test("Skill 中的 MCP 名称、输入字段和工具状态与代码一致", async () => {
  const mcpSource = await readFile(mcpSourcePath, "utf8");
  const currentTools = registeredToolNames(mcpSource);
  const contract = await readFile(join(skillsRoot, "_shared", "MCP_EXECUTION_CONTRACT.md"), "utf8");

  const unknownTools = new Set<string>();
  for (const name of expectedSkills) {
    const skill = await readSkill(name);
    for (const token of toolTokens(skill)) {
      if (!currentTools.has(token) && !architectureTargets.has(token) && !compatibilityOnlyTools.has(token)) unknownTools.add(token);
    }
  }
  assert.deepEqual([...unknownTools], [], `Skill 引用了未分类 MCP 工具：${[...unknownTools].join(", ")}`);

  for (const target of architectureTargets) {
    assert.equal(currentTools.has(target), false, `${target} 已进入 MCP 时必须先更新分类`);
    assert.match(contract, new RegExp("`" + target + "`"), `调用合同遗漏架构目标 ${target}`);
  }
  assert.equal(currentTools.has("create_presenter_timeline"), true);
  assert.match(contract, /兼容入口，不作为正式主链/u);

  const requiredInputs: Record<string, string[]> = {
    import_media: ["base_revision_id", "file_path"],
    manage_asset_requirements: ["base_revision_id", "action"],
    search_media_candidates: ["base_revision_id", "asset_request_id", "provider", "query"],
    inspect_media_candidate: ["asset_candidate_id"],
    acquire_media_asset: ["base_revision_id", "asset_candidate_id"],
    read_asset_provenance: ["asset_id"],
    apply_manual_transcript: ["base_revision_id", "asset_id", "text"],
    apply_semantic_units: ["base_revision_id", "units"],
    apply_script: ["base_revision_id", "semantic_unit_ids"],
    manage_story: ["base_revision_id", "beats"],
    manage_voice_references: ["base_revision_id", "asset_id"],
    edit_captions: ["base_revision_id", "caption_id", "action"],
    manage_audio: ["base_revision_id", "action"],
    assemble_presenter_track: ["base_revision_id", "asset_ids"],
    compile_presenter_scenes: ["base_revision_id", "scenes"],
    manage_actor_performance: ["base_revision_id", "timeline_item_id", "source", "mask_mode"],
    create_scene: ["base_revision_id", "type", "title", "purpose", "start_frame", "end_frame"],
    manage_visual_treatment: ["base_revision_id", "action"],
    manage_cutaways: ["base_revision_id", "action"],
    replace_scene_asset: ["base_revision_id", "cutaway_id", "asset_id", "source_start_frame", "source_end_frame"],
    manage_effect_cues: ["base_revision_id", "scene_id", "type", "layer", "start_frame", "end_frame", "semantic_anchor", "motion", "quality_rules"],
    render_preview_range: ["revision", "from_frame", "to_frame"],
    inspect_composed_frames: ["preview_job_id"],
    record_editorial_quality_review: ["run_id", "revision", "passes", "preview_evidence", "findings"],
    submit_export: ["revision", "purpose"]
  };

  for (const [tool, fields] of Object.entries(requiredInputs)) {
    const block = toolSourceBlock(mcpSource, tool);
    assert.match(contract, new RegExp("`" + tool), `调用合同遗漏当前工具 ${tool}`);
    for (const field of fields) {
      assert.match(block, new RegExp(`\\b${field}:`), `${tool} 的 MCP Schema 缺少字段 ${field}`);
      assert.match(contract, new RegExp(`\\b${field}\\b`), `调用合同未说明 ${tool}.${field}`);
    }
  }
});

test("当前 Scene Registry 与 Skill 的可创建类型说明一致", async () => {
  const mcpSource = await readFile(mcpSourcePath, "utf8");
  const expected = [...currentSceneTypes].sort();

  // 读取入口和写入入口必须列出同一组 Scene，避免 Skill 基于过期类型生成请求。
  assert.deepEqual(sceneTypesInTool(toolSourceBlock(mcpSource, "browse_scene_types")), expected);
  assert.deepEqual(sceneTypesInTool(toolSourceBlock(mcpSource, "create_scene")), expected);

  const presenter = await readSkill("presenter-motion-director");
  const scenePlanning = await readSkill("scene-planning");
  assert.doesNotMatch(presenter, /UI\/DocumentScene/u, "Presenter 不得把 UI/DocumentScene 当成现有类型");
  assert.match(presenter, /`ExplainerScene` 或 `CutawayScene`/u);
  assert.match(scenePlanning, /`DocumentScene` 与 `UIShowcaseScene`[^\n]*不是当前 MCP 可创建类型/u);
  assert.doesNotMatch(scenePlanning, /^- (?:DocumentScene|UIShowcaseScene)：/mu, "Scene 类型列表不得出现尚未实现的可创建类型");
});

test("活动脚本与测试不再引用已删除的旧共享合同", async () => {
  const activeFiles = [
    join(repositoryRoot, "scripts", "presenter-stage1-live.e2e.ts"),
    join(repositoryRoot, "scripts", "presenter-creative-agent.eval.ts"),
    join(repositoryRoot, "tests", "core.test.ts")
  ];
  const legacySharedPattern = /_shared\/(editorial-principles|mcp-and-project-contract|decision-record|timing-precision|quality-vocabulary|skill-execution-report|source-map)\.md/u;
  for (const filePath of activeFiles) {
    assert.doesNotMatch(await readFile(filePath, "utf8"), legacySharedPattern, `${filePath} 仍引用已删除的旧共享合同`);
  }
});
