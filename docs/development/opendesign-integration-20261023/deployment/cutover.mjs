// 仅在正式渲染队列结束后切换；历史未知任务须有用户明确授权，且始终保留原记录。
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const repo = 'E:/ai/VideoCut';
const plugin = 'C:/Users/13222/.codex/plugins/cache/videoflowcut/videoflowcut/0.1.100';
const workspaceRoot = join(repo, 'workspace');
const registration = JSON.parse(await readFile(join(import.meta.dirname, 'registration-before.json'), 'utf8'));
const state = JSON.parse(await readFile(join(workspaceRoot, '.videoflowcut-runtime/runtime.json'), 'utf8'));
Object.assign(process.env, registration.transport.env);
if (state.bridgeUrl) process.env.COMFYUI_BRIDGE_URL = state.bridgeUrl;
else delete process.env.COMFYUI_BRIDGE_URL;
const pending = [];
const get = async path => { const response = await fetch(`${state.apiUrl}${path}`); assert.ok(response.ok); return response.json(); };
for (const project of await get('/api/projects')) {
  for (const job of await get(`/api/projects/${encodeURIComponent(project.id)}/jobs`)) {
    if (['queued', 'running', 'unknown'].includes(job.status)) pending.push({id: job.id, projectId: project.id, status: job.status, kind: job.kind});
  }
}
await writeFile(join(import.meta.dirname, 'cutover-queue.json'), JSON.stringify(pending, null, 2));
assert.ok(!pending.some(job => ['queued', 'running'].includes(job.status)), '仍有正在执行或排队的任务，保持原运行服务');
const approvedHistorical = process.argv.includes('--allow-historical-unknown');
assert.ok(!pending.length || (approvedHistorical && pending.every(job => job.id === 'job_44c272be-deab-4a22-8fb2-67852676b013' && job.status === 'unknown')), '历史未知任务需要明确授权后才能切换');
const {ensureRuntime, stopRuntime} = await import(pathToFileURL(join(plugin, 'scripts/runtime-launcher.mjs')).href);
const options = {pluginRoot: plugin, repoRoot: repo, workspaceRoot, port: 3100};
if (pending.length) {
  const stopped = await stopRuntime(options, {requireIdle: false});
  await writeFile(join(import.meta.dirname, 'stop.json'), JSON.stringify(stopped, null, 2));
  assert.ok(stopped.stopped && stopped.graceful, '旧运行服务必须正常停止');
}
const result = await ensureRuntime(options);
const manifest = JSON.parse(await readFile(join(plugin, 'runtime/dist/manifest.json'), 'utf8'));
assert.ok(result.ready);
assert.equal(result.releaseId, manifest.releaseId);
const report = {pluginVersion: manifest.pluginVersion, previousReleaseId: state.releaseId, ...result, historicalUnknownPreserved: pending};
await writeFile(join(import.meta.dirname, 'cutover.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
