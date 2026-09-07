import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const repositoryRoot = process.cwd();
const skillsRoot = join(repositoryRoot, ".agents", "skills");
const pluginRoot = join(repositoryRoot, "plugins", "videoflowcut");
const pluginSkillsRoot = join(pluginRoot, "skills");
const pluginManifestPath = join(pluginRoot, ".codex-plugin", "plugin.json");
const pluginMcpPath = join(pluginRoot, ".mcp.json");
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
  "motion-case-capacity-stream",
  "motion-case-clock-shift",
  "motion-case-library",
  "motion-case-product-multiply",
  "motion-case-ticket-rules",
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

const architectureTargets = new Set(["smooth_audio"]);

/** 已被 Skill 使用的 MCP 必须继续注册，避免再被误降级为“架构目标”。 */
const currentSkillTools = new Set([
  "apply_authored_script",
  "inspect_asset",
  "read_actor_capabilities",
  "submit_avatar_job",
  "read_narrative_map",
  "set_explainer_program_enabled"
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

/** 检查实际引用图，避免专业资料已发布却没有可达入口；不将可达性冒称创作验收。 */
async function reachableMarkdown(entry: string): Promise<Set<string>> {
  const visited = new Set<string>();
  const pending = [resolve(entry)];
  while (pending.length > 0) {
    const path = pending.pop()!;
    if (visited.has(path)) continue;
    visited.add(path);
    for (const reference of localMarkdownLinks(await readFile(path, "utf8"))) {
      const target = resolve(dirname(path), reference);
      const fromRoot = relative(skillsRoot, target);
      assert.ok(fromRoot !== ".." && !fromRoot.startsWith("../") && !fromRoot.startsWith("..\\"), `专业资料越出唯一 Skills 源：${target}`);
      pending.push(target);
    }
  }
  return visited;
}

test("人物剪辑专业资料从导演与相关专项可达，发行内容保持一致", async () => {
  const grammar = resolve(skillsRoot, "presenter-motion-director/references/presenter-editing-grammar.md");
  for (const entry of ["presenter-motion-director", "visual-treatment-planning", "remotion-production"]) {
    const reachable = await reachableMarkdown(join(skillsRoot, entry, "SKILL.md"));
    assert.ok(reachable.has(grammar), `${entry} 无法沿正式引用读取人物剪辑语法`);
  }
  assert.equal(
    await readFile(join(pluginSkillsRoot, relative(skillsRoot, grammar)), "utf8"),
    await readFile(grammar, "utf8"),
    "专业资料的发行副本与唯一源不一致"
  );
});

test("连续动效案例可从生产入口读取，源码和参数随插件一起发行", async () => {
  const reachable = await reachableMarkdown(join(skillsRoot, "remotion-production/SKILL.md"));
  for (const path of ["SKILL.md", "references/four-source-worked-example.md"]) {
    assert.ok(reachable.has(join(skillsRoot, "motion-case-library", path)), `生产入口无法读取案例资料：${path}`);
  }
  const overview = await readSkill("motion-case-library");
  for (const id of ["ticket-rules", "product-multiply", "clock-shift", "capacity-stream"]) {
    const name = `motion-case-${id}`;
    const skillPath = join(skillsRoot, name, "SKILL.md");
    assert.ok(reachable.has(skillPath), `总 Skill 无法读取独立案例：${name}`);
    const skill = await readFile(skillPath, "utf8");
    const videos = [...skill.matchAll(/\]\(([^)]+\.mp4)\)/gu)].map((match) => resolve(dirname(skillPath), match[1]!));
    const videoPath = join(skillsRoot, name, "assets", `${id}.mp4`);
    assert.deepEqual([...new Set(videos)], [videoPath], `案例须引用自身的独立效果：${name}`);
    assert.ok(overview.includes(`../${name}/assets/${id}.mp4`), `总 Skill 缺少独立效果入口：${name}`);
    const assetFiles = (await readdir(join(skillsRoot, name, "assets"))).sort();
    assert.deepEqual(assetFiles, ["fixture.json", "motion.tsx", `${id}.mp4`].sort());
    assert.deepEqual((await readdir(join(pluginSkillsRoot, name, "assets"))).sort(), assetFiles);
    for (const file of assetFiles) {
      assert.deepEqual(await readFile(join(pluginSkillsRoot, name, "assets", file)), await readFile(join(skillsRoot, name, "assets", file)), `案例发行副本不同步：${name}/${file}`);
    }
  }
});

test("Skills V5 源唯一、插件发行副本完整且可被 Codex 发现", async () => {
  const onDiskNames = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .map((entry) => entry.name)
    .sort();
  const releasedNames = (await readdir(pluginSkillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .map((entry) => entry.name)
    .sort();
  const manifest = JSON.parse(await readFile(pluginManifestPath, "utf8"));
  const mcp = JSON.parse(await readFile(pluginMcpPath, "utf8"));

  assert.deepEqual(onDiskNames, [...expectedSkills].sort());
  assert.deepEqual(releasedNames, [...expectedSkills].sort());
  assert.equal(manifest.name, "videoflowcut");
  assert.equal(manifest.skills, "./skills/", "插件必须显式发布 Skills 目录");
  assert.equal(manifest.mcpServers, "./.mcp.json", "插件必须通过自身 MCP 配置暴露工具");
  assert.equal(mcp.mcpServers?.videoflowcut?.args?.[0], "./scripts/mcp-launcher.mjs", "插件 MCP 必须经统一运行器启动");
  assert.equal(await exists(join(skillsRoot, "_shared", "CURRENT_CAPABILITIES.md")), false, "运行时不得依赖 CURRENT_CAPABILITIES 快照");
  assert.equal(await exists(join(skillsRoot, "_shared", "MCP_EXECUTION_CONTRACT.md")), true);
  assert.equal(await exists(join(skillsRoot, "_shared", "SOURCE_REVIEW_METHOD.md")), true);
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
    assert.equal(
      await readFile(join(pluginSkillsRoot, name, "SKILL.md"), "utf8"),
      skill,
      `插件发行副本与根 Skills 源漂移：${name}`
    );
  }

  for (const markdownPath of allSkillFiles) {
    const markdown = await readFile(markdownPath, "utf8");
    assert.doesNotMatch(markdown, /CURRENT_CAPABILITIES/u, `${markdownPath} 不得读取手工能力快照`);
    for (const reference of localMarkdownLinks(markdown)) {
      const resolved = resolve(dirname(markdownPath), reference);
      assert.equal(await exists(resolved), true, `${markdownPath} 引用了不存在的资料：${reference}`);
    }
    const releasedPath = join(pluginSkillsRoot, relative(skillsRoot, markdownPath));
    assert.equal(await exists(releasedPath), true, `插件发行副本缺少共享资料：${relative(skillsRoot, markdownPath)}`);
    assert.equal(await readFile(releasedPath, "utf8"), markdown, `插件发行副本与根 Skills 源漂移：${relative(skillsRoot, markdownPath)}`);
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
  const mcpSource = await readFile(mcpSourcePath, "utf8") + await readFile(join(repositoryRoot, "apps/server/src/motion-tools.ts"), "utf8");
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
  for (const tool of currentSkillTools) {
    assert.equal(currentTools.has(tool), true, `${tool} 已被 Skill 使用，MCP 不得缺失或被误写为架构目标`);
    assert.match(contract, new RegExp("`" + tool + "(?:`|\\()"), `调用合同遗漏当前工具 ${tool}`);
  }
  assert.equal(currentTools.has("create_presenter_timeline"), true);
  assert.match(contract, /兼容入口，不作为正式主链/u);

  const requiredInputs: Record<string, string[]> = {
    submit_motion_work: ["base_revision_id", "idempotency_key", "work"],
    inspect_motion_reference: ["source_url", "preview_index"],
    read_motion_work: ["job_id"],
    review_motion_work: ["asset_id", "reference_match", "note"],
    import_media: ["base_revision_id", "file_path"],
    inspect_asset: ["asset_id", "mode"],
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
    edit_captions: ["base_revision_id", "caption_id", "caption_ids", "action"],
      manage_audio: ["base_revision_id", "action", "event_frame", "onset_offset_frames", "source_start_frame", "source_end_frame", "effect_event"],
      browse_sound_sources: [],
    browse_local_sound_effects: ["query", "max_results"],
    inspect_local_sound_effect: ["root_id", "relative_path"],
    import_local_sound_effect: ["base_revision_id", "root_id", "relative_path", "rights_status"],
    assemble_presenter_track: ["base_revision_id", "asset_ids"],
    compile_presenter_scenes: ["base_revision_id", "scenes"],
    manage_actor_performance: ["base_revision_id", "timeline_item_id", "source", "mask_mode"],
    create_scene: ["base_revision_id", "type", "title", "purpose", "start_frame", "end_frame"],
    manage_visual_treatment: ["base_revision_id", "action"],
    manage_cutaways: ["base_revision_id", "action"],
    replace_scene_asset: ["base_revision_id", "cutaway_id", "asset_id", "source_start_frame", "source_end_frame"],
    manage_effect_cues: ["base_revision_id", "action", "cue_id", "scene_id", "type", "layer", "start_frame", "end_frame", "semantic_anchor", "motion", "quality_rules"],
    render_preview_range: ["revision", "from_frame", "to_frame"],
    inspect_composed_frames: ["preview_job_id"],
    record_editorial_quality_review: ["run_id", "revision", "passes", "preview_evidence", "findings"],
    run_render_preflight: ["revision"],
    submit_export: ["revision", "purpose"],
    track_export: ["job_id"],
    read_export_artifact: ["artifact_id"],
    record_export_artifact_review: ["artifact_id", "passes", "evidence", "findings"],
    approve_export_artifact: ["artifact_id"]
  };

  for (const [tool, fields] of Object.entries(requiredInputs)) {
    const block = toolSourceBlock(mcpSource, tool);
    assert.match(contract, new RegExp("`" + tool), `调用合同遗漏当前工具 ${tool}`);
    for (const field of fields) {
      assert.match(block, new RegExp(`\\b${field}:`), `${tool} 的 MCP Schema 缺少字段 ${field}`);
      assert.match(contract, new RegExp(`\\b${field}\\b`), `调用合同未说明 ${tool}.${field}`);
    }
  }

  // 交付闭环已进入当前 MCP：预检、读取 Artifact、成片复核和批准必须是独立步骤，
  // 不能再把 Export Job succeeded 当成用户批准。
  for (const tool of ["run_render_preflight", "track_export", "read_export_artifact", "record_export_artifact_review", "approve_export_artifact"]) {
    assert.equal(currentTools.has(tool), true, `MCP 缺少交付闭环工具：${tool}`);
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
