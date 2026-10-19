import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";

const root = resolve(".agents/skills");
const brief = "motion-brief-writing/references/execution-brief-template.md";
const visual = "visual-treatment-planning/SKILL.md";
const motion = "motion-brief-writing/SKILL.md";
const method = "visual-treatment-planning/references/object-drawing/REFERENCE.md";
const learning = "visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/LEARNING.md";
const handoff = "_shared/SCENE_DESIGN_HANDOFF.md";
const routing = "production-coordinator/references/task-routing.md";
const review = "quality-verification/references/professional-review.md";
const files = [brief, visual, motion, method, learning, handoff, routing, review];
const read = (file) => readFile(resolve(root, file), "utf8");
const links = (body) => [...body.replace(/```[\s\S]*?```/g, "").matchAll(/\]\(([^)]+)\)/g)]
  .map((match) => match[1]).filter((link) => !/^[a-z]+:/i.test(link));
// 这里只核对文档导航；标题或关键词存在不能证明作者已完成设计。
const headingId = (title) => title.toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, "").replace(/\s/g, "-");
const anchors = (body) => new Set([
  ...[...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => headingId(match[1].trim())),
  ...[...body.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]),
]);

test("八个入口的本地文件与章节链接可达", async () => {
  for (const file of files) {
    for (const link of links(await read(file))) {
      const [path, fragment] = link.split("#");
      const target = path ? resolve(root, dirname(file), decodeURIComponent(path)) : resolve(root, file);
      const contents = await readFile(target);
      if (fragment && target.endsWith(".md")) {
        assert.ok(anchors(contents.toString("utf8")).has(decodeURIComponent(fragment)), `${file} → ${link}`);
      }
    }
  }
});

test("视觉、动效、案例、交接与审阅共用唯一执行稿且不复制正文", async () => {
  const template = await read(brief);
  for (const file of files.filter((file) => file !== brief)) {
    const body = await read(file);
    const targets = links(body).map((link) => resolve(root, dirname(file), link.split("#")[0]));
    assert.ok(targets.includes(resolve(root, brief)), `${file} 未连接执行稿`);
    assert.ok(!body.includes(template.trim()), `${file} 重复维护完整执行稿`);
    const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim());
    assert.equal(new Set(headings).size, headings.length, `${file} 存在重复章节`);
  }
});

test("详细设计仍连通既有片型、美术、字幕、时机与受管制作方法", async () => {
  const required = {
    [visual]: ["../presenter-motion-director/references/presenter-material-choreography.md", "references/art-direction.md#默认设计与整场发展", "references/art-direction.md#字幕外观归美术统筹准确时间归字幕作者", "references/editorial-visual-tone.md"],
    [motion]: ["../remotion-production/SKILL.md", "../visual-treatment-planning/SKILL.md", "../_shared/PROJECT_REVISION_AND_HANDOFF.md"],
    [method]: ["../../../asset-import/references/object-resources.md", "object-effect-targets.md"],
    [handoff]: ["../captions/SKILL.md", "PROJECT_REVISION_AND_HANDOFF.md"],
    [routing]: ["../../_shared/TOPIC_TO_FILM.md", "../../quality-verification/references/professional-review.md#根因而不是症状"],
    [review]: ["../../visual-treatment-planning/references/art-direction.md#默认设计与整场发展", "material-integration-review.md"],
  };
  for (const [file, expected] of Object.entries(required)) {
    const actual = links(await read(file));
    for (const link of expected) assert.ok(actual.includes(link), `${file} 丢失既有入口 ${link}`);
  }
});
