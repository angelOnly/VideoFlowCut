import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("完整成片钩子仅接续绑定的当前回合，并响应完成和中断", async () => {
  const root = await mkdtemp(join(tmpdir(), "vfc-continuation-hook-"));
  let progress = { state: "actionable", actionable: [{ code: "UNIT_WAITING_FOR_DRAFT", sceneId: "scene-a" }] };
  const server = createServer((request, response) => {
    assert.equal(request.url, "/api/projects/project/production-status?runId=run");
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ progress }));
  });
  await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const runHook = event => new Promise((resolveHook, reject) => {
    const child = spawn(process.execPath, [resolve("plugins/videoflowcut/hooks/production-continuation.mjs")], {
      env: { ...process.env, PLUGIN_DATA: root }, windowsHide: true, stdio: ["pipe", "pipe", "pipe"]
    });
    let output = "", error = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { error += chunk; });
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolveHook(JSON.parse(output)) : reject(new Error(error)));
    child.stdin.end(JSON.stringify(event));
  });
  const common = { session_id: "session", turn_id: "turn" };
  try {
    assert.deepEqual(await runHook({ ...common, hook_event_name: "Stop" }), {});
    const bound = await runHook({ ...common, hook_event_name: "PostToolUse", tool_response: { content: [{ type: "text",
      text: JSON.stringify({ projectId: "project", runId: "run", runtimeOrigin: origin }) }] } });
    assert.match(bound.hookSpecificOutput.additionalContext, /已启用/u);
    assert.deepEqual(await runHook({ ...common, turn_id: "another-turn", hook_event_name: "Stop" }), {});
    const active = await runHook({ ...common, hook_event_name: "Stop" });
    assert.equal(active.decision, "block");
    assert.match(active.reason, /UNIT_WAITING_FOR_DRAFT/u);
    const unchanged = await runHook({ ...common, hook_event_name: "Stop", stop_hook_active: true });
    assert.equal(unchanged.decision, "block");
    assert.match(unchanged.reason, /连续未变化/u);
    const stalled = await runHook({ ...common, hook_event_name: "Stop", stop_hook_active: true });
    assert.match(stalled.systemMessage, /尚未完成/u);
    assert.deepEqual(await runHook({ ...common, hook_event_name: "Stop" }), {});
    await runHook({ ...common, hook_event_name: "PostToolUse", tool_response: { content: [{ type: "text",
      text: JSON.stringify({ projectId: "project", runId: "run", runtimeOrigin: origin }) }] } });
    progress = { state: "waiting", waiting: [{ jobId: "original" }] };
    assert.match((await runHook({ ...common, hook_event_name: "Stop" })).reason, /original/u);
    assert.match((await runHook({ ...common, hook_event_name: "Stop", stop_hook_active: true })).reason, /连续未变化/u);
    progress = { state: "waiting", waiting: [{ jobId: "resumed" }] };
    assert.match((await runHook({ ...common, hook_event_name: "Stop", stop_hook_active: true })).reason, /resumed/u);
    progress = { state: "blocked", blocked: [{ jobId: "original", status: "cancelled" }] };
    assert.equal((await runHook({ ...common, hook_event_name: "Stop" })).decision, "block");
    assert.deepEqual(await runHook({ ...common, hook_event_name: "Stop", stop_hook_active: true }), {});
    progress = { state: "completed" };
    assert.deepEqual(await runHook({ ...common, hook_event_name: "Stop" }), {});
    assert.deepEqual(await runHook({ ...common, hook_event_name: "Stop" }), {});
    await runHook({ ...common, hook_event_name: "PostToolUse", tool_response: { content: [{ type: "text",
      text: JSON.stringify({ projectId: "project", runId: "run", runtimeOrigin: origin }) }] } });
    await runHook({ ...common, hook_event_name: "Interrupt" });
    assert.deepEqual(await runHook({ ...common, hook_event_name: "Stop" }), {});
  } finally {
    await new Promise(resolveClose => server.close(resolveClose));
    await rm(root, { recursive: true, force: true });
  }
});
