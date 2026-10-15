import test from "node:test";
import assert from "node:assert/strict";
import { createProjectSnapshot } from "@videocut/domain";
import { editorialResolutionRange } from "../packages/edit-application/src/editorial-range.js";

test("长作品内局部问题仅平移局部和接点，源时钟变化退回对象范围", () => {
  const before = createProjectSnapshot({ projectId: "range", name: "范围验证", rootPath: "unused" });
  before.timeline.durationInFrames = 2000;
  before.timeline.items.push({ id: "item", startFrame: 100, endFrame: 1100, sourceStartFrame: 0, sourceEndFrame: 1000 } as never);
  const after = structuredClone(before);
  after.timeline.items[0]!.startFrame += 100; after.timeline.items[0]!.endFrame += 100;
  const finding = { objectId: "item", frameRange: { startFrame: 300, endFrame: 320 } };
  assert.deepEqual(editorialResolutionRange(finding, before, after), { startFrame: 399, endFrame: 421 });
  after.timeline.items[0]!.sourceStartFrame = 10;
  assert.deepEqual(editorialResolutionRange(finding, before, after), { startFrame: 200, endFrame: 1200 });
  assert.deepEqual(editorialResolutionRange({ ...finding, objectId: "unknown" }, before, after), { startFrame: 0, endFrame: 2000 });
});
