// 使用正式安装槽建立新 MCP 连接，不修改项目或制造视频任务。
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const repo = 'E:/ai/VideoCut';
const plugin = 'C:/Users/13222/.codex/plugins/cache/videoflowcut/videoflowcut/0.1.99';
const require = createRequire(join(repo, 'package.json'));
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const state = JSON.parse(await readFile(join(repo, 'workspace/.videoflowcut-runtime/runtime.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(plugin, 'runtime/dist/manifest.json'), 'utf8'));
const registration = JSON.parse(execFileSync('C:/Users/13222/AppData/Roaming/npm/node_modules/@openai/codex/node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe', ['-c', 'features.context_management=false', 'mcp', 'get', 'videoflowcut', '--json'], {encoding:'utf8', windowsHide:true}));
assert.equal(registration.enabled, true);
assert.equal(registration.transport.args[0], join(plugin, 'scripts/mcp-launcher.mjs').replaceAll('\\', '/'));
assert.equal(registration.transport.cwd, repo);
const { assertCodexMcpRegistration } = await import('../../../../scripts/verify-codex-mcp-registration.mjs');
const mcpSpec = JSON.parse(await readFile(join(plugin, '.mcp.json'), 'utf8')).mcpServers.videoflowcut;
// 宿主原有下载器与代理配置必须保留；独立核对已知覆盖项，不修改发行声明。
const hostOverrides = {
  VIDEOCUT_YT_DLP_PATH: 'C:\\Users\\13222\\.codex\\providers\\videoflowcut-youtube-2026.08.19\\Scripts\\yt-dlp.exe',
  HTTP_PROXY: 'http://127.0.0.1:10808',
  HTTPS_PROXY: 'http://127.0.0.1:10808',
  NO_PROXY: 'localhost,.localhost,127.0.0.1,::1'
};
assertCodexMcpRegistration(registration, { installedPluginRoot: plugin, repoRoot: repo, mcpSpec: {...mcpSpec, env: {...mcpSpec.env, ...hostOverrides}} });
const transport = new StdioClientTransport({command:registration.transport.command,args:registration.transport.args,cwd:registration.transport.cwd,stderr:'pipe',env:{...process.env,...registration.transport.env}});
const client = new Client({ name: '最新发行部署核验', version: '1.0.0' });
try {
  await client.connect(transport);
  const {tools} = await client.listTools();
  // 从新连接核对本轮合同，避免只验证版本号却遗漏工具参数。
  const schema = (name) => tools.find(tool => tool.name === name)?.inputSchema;
  assert.ok(schema('manage_effect_cues')?.properties?.visual_composition);
  assert.ok(schema('manage_visual_treatment')?.properties?.adopted_material_asset_ids);
  assert.ok(schema('complete_production_run')?.properties?.completion_scope);
  assert.ok(schema('complete_production_run')?.required?.includes('completion_scope'));
  await writeFile(join(repo, 'docs/development/presenter-creation-20261020/deployment/new-contracts.json'), JSON.stringify(Object.fromEntries(['manage_effect_cues', 'manage_visual_treatment', 'complete_production_run'].map(name => [name, schema(name)])), null, 2));
  for (const name of ['prepare_avatar_sources', 'adopt_avatar_source', 'submit_avatar_job', 'resume_avatar_job']) {
    assert.ok(tools.some(tool => tool.name === name), `正式工具目录缺少 ${name}`);
  }
  const capabilities = await client.callTool({ name: 'read_presenter_library', arguments: {} });
  await writeFile(join(repo, 'docs/development/presenter-creation-20261020/deployment/presenter-library.json'), JSON.stringify(capabilities, null, 2));
  assert.notEqual(capabilities.isError, true, JSON.stringify(capabilities));
  const result = await client.callTool({ name: 'read_runtime_release', arguments: {} });
  assert.notEqual(result.isError, true, JSON.stringify(result));
  const status = JSON.parse(result.content.find(item => item.type === 'text').text);
  assert.equal(status.aligned, true);
  for (const release of [status.mcpReleaseId, status.launcherReleaseId, status.runtime.releaseId]) assert.equal(release, manifest.releaseId);
  assert.equal(status.runtime.status, 'ready');
  assert.ok(status.runtime.workers.media && status.runtime.workers.render);
  await writeFile(join(repo, 'docs/development/presenter-creation-20261020/deployment/registered-connection.json'), JSON.stringify({ pluginVersion: '0.1.99', ...status, toolCount: tools.length }, null, 2));
  console.log(JSON.stringify({ pluginVersion: '0.1.99', ...status, toolCount: tools.length }));
} finally { await client.close(); await transport.close(); }
