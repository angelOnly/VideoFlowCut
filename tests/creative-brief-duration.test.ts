import assert from "node:assert/strict";
import test from "node:test";
import { createProjectSnapshot } from "@videocut/domain";

test("未指定目标时长时不创造 60 秒目标，明确指定的时长仍保留", () => {
  const unspecified = createProjectSnapshot({ projectId: "no-duration", name: "未指定时长", rootPath: "isolated" });
  assert.equal(unspecified.project.brief.targetDurationSeconds, undefined);
  const explicit = createProjectSnapshot({ projectId: "long-duration", name: "指定长片", rootPath: "isolated", brief: { targetDurationSeconds: 317.39 } });
  assert.equal(explicit.project.brief.targetDurationSeconds, 317.39);
});
