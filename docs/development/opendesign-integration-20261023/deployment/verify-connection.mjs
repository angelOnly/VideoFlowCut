// 使用宿主真实配置建立新连接，核对新合同与同版运行身份，不创建视频对象。
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, normalize } from 'node:path';
const repo = 'E:/ai/VideoCut';
const plugin = 'C:/Users/13222/.codex/plugins/cache/videoflowcut/videoflowcut/0.1.100';
const cli = 'C:/Users/13222/AppData/Roaming/npm/node_modules/@openai/codex/node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe';
const before = JSON.parse(await readFile(join(import.meta.dirname, 'registration-before.json'), 'utf8'));
const registration = JSON.parse(execFileSync(cli, ['-c', 'features.context_management=false', 'mcp', 'get', 'videoflowcut', '--json'], {encoding: 'utf8', windowsHide: true}));
await writeFile(join(import.meta.dirname, 'registration-after.json'), JSON.stringify(registration, null, 2));
assert.equal(normalize(registration.transport.args[0]), normalize(join(plugin, 'scripts/mcp-launcher.mjs')));
assert.deepEqual({...registration, transport: {...registration.transport, args: before.transport.args}}, before, '升级入口之外的宿主配置必须保留');
const require = createRequire(join(repo, 'package.json'));
const {Client} = require('@modelcontextprotocol/sdk/client/index.js');
const {StdioClientTransport} = require('@modelcontextprotocol/sdk/client/stdio.js');
const manifest = JSON.parse(await readFile(join(plugin, 'runtime/dist/manifest.json'), 'utf8'));
const transport = new StdioClientTransport({command: registration.transport.command, args: registration.transport.args, cwd: registration.transport.cwd, env: {...process.env, ...registration.transport.env}, stderr: 'pipe'});
const client = new Client({name: 'OpenDesign发行部署核验', version: '1.0.0'});
try {
  await client.connect(transport);
  const {tools} = await client.listTools();
  const submit = tools.find(tool => tool.name === 'submit_motion_work');
  assert.match(submit.description, /HyperFrames|data-vfc-video-slot/);
  assert.ok(submit.inputSchema.properties.work.properties.source);
  await writeFile(join(import.meta.dirname, 'new-contract.json'), JSON.stringify(submit, null, 2));
  const call = async name => {
    const result = await client.callTool({name, arguments: {}});
    await writeFile(join(import.meta.dirname, `${name}.json`), JSON.stringify(result, null, 2));
    assert.notEqual(result.isError, true, JSON.stringify(result));
    return JSON.parse(result.content.find(item => item.type === 'text').text);
  };
  const status = await call('read_runtime_release');
  for (const identity of [status.launcherReleaseId, status.mcpReleaseId, status.runtime.releaseId]) assert.equal(identity, manifest.releaseId);
  assert.equal(status.aligned, true);
  assert.equal(status.runtime.status, 'ready');
  assert.ok(status.runtime.workers.media && status.runtime.workers.render);
  const capability = await call('read_motion_capabilities');
  assert.equal(capability.engineVersion, 'managed-hyperframes-1');
  assert.equal(capability.html.sourceFormat, 'html');
  const report = {pluginVersion: manifest.pluginVersion, ...status, toolCount: tools.length, engineVersion: capability.engineVersion, sourceFormat: capability.html.sourceFormat, hostEnvironmentPreserved: true};
  await writeFile(join(import.meta.dirname, 'registered-connection.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await client.close(); await transport.close(); }
