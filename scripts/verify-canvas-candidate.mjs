// 只在显式独立工作区和端口验证，不连接生产队列。
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const repo = resolve(process.cwd());
const workspace = resolve(process.argv[2]);
const port = Number(process.argv[3]);
assert.ok(workspace !== join(repo, 'workspace') && port !== 3100 && Number.isInteger(port));
const output = join(repo, 'docs/development/canvas-size-20261026');
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(join(repo, 'plugins/videoflowcut/runtime/dist/manifest.json'), 'utf8'));
const client = new Client({ name: '画布隔离发行核验', version: '1' });
const transport = new StdioClientTransport({ command: process.execPath, args: [join(repo, 'plugins/videoflowcut/scripts/mcp-launcher.mjs')], cwd: repo,
  env: { ...process.env, VIDEOCUT_WORKSPACE: workspace, VIDEOFLOWCUT_PORT: String(port), COMFYUI_BRIDGE_URL: 'http://127.0.0.1:8197/comfyui-bridge/v1' }, stderr: 'pipe' });
try {
  await client.connect(transport);
  await client.listTools();
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    assert.notEqual(result.isError, true, JSON.stringify(result));
    return JSON.parse(result.content.find(entry => entry.type === 'text').text);
  };
  const release = await call('read_runtime_release', {});
  assert.equal(release.mcpReleaseId, manifest.releaseId);
  assert.equal(release.runtime.releaseId, manifest.releaseId);
  assert.equal(release.aligned, true);
  assert.ok((await client.listTools()).tools.find(tool => tool.name === 'set_project_canvas_size'));
  const created = await call('create_project', { name: '发行画布隔离验证', profile: 'visual_explainer', fps: 30, brief: { aspectRatio: '9:16' } });
  assert.deepEqual([created.snapshot.timeline.width, created.snapshot.timeline.height], [1080, 1920]);
  const projectId = created.snapshot.project.id;
  const square = await call('set_project_canvas_size', { project_id: projectId, base_revision_id: 1, width: 1080, height: 1080 });
  assert.equal(square.snapshot.project.brief.aspectRatio, '1:1');
  const portrait = await call('set_project_canvas_size', { project_id: projectId, base_revision_id: 2, width: 1080, height: 1920 });
  assert.equal(portrait.revision.number, 3);
  const response = await fetch(`http://127.0.0.1:${port}/api/projects/${projectId}`);
  assert.ok(response.ok);
  const readback = await response.json();
  assert.deepEqual([readback.snapshot.timeline.width, readback.snapshot.timeline.height], [1080, 1920]);
  const result = { releaseId: manifest.releaseId, workspace, port, projectId, revision: 3, size: [1080, 1920], release, verifiedAt: new Date().toISOString() };
  await writeFile(join(output, 'candidate-validation.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await client.close(); await transport.close(); }
