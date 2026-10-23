import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {stopRuntime,ensureRuntime} from '../../../../plugins/videoflowcut/scripts/runtime-launcher.mjs';
const repo='E:/ai/VideoCut', plugin='C:/Users/13222/.codex/plugins/cache/videoflowcut/videoflowcut/0.1.99';
const state=JSON.parse(await readFile(repo+'/workspace/.videoflowcut-runtime/runtime.json','utf8'));
const cli='C:/Users/13222/AppData/Roaming/npm/node_modules/@openai/codex/node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe';
const registration=JSON.parse(execFileSync(cli,['-c','features.context_management=false','mcp','get','videoflowcut','--json'],{encoding:'utf8',windowsHide:true}));
Object.assign(process.env,registration.transport.env);
const options={pluginRoot:plugin,repoRoot:repo,workspaceRoot:repo+'/workspace',port:3100};
// 用户已明确授权历史任务不再阻挡部署，任务记录保持原状。
const stopped=await stopRuntime(options,{force:true,requireIdle:false});
assert.ok(stopped.stopped,JSON.stringify(stopped));
const result=await ensureRuntime(options);
const manifest=JSON.parse(await readFile(plugin+'/runtime/dist/manifest.json','utf8'));
assert.ok(result.ready); assert.equal(result.releaseId,manifest.releaseId);
const report={pluginVersion:'0.1.99',previousReleaseId:state.releaseId,releaseId:result.releaseId,runtimeId:result.runtimeId,ready:result.ready,stopped};
await writeFile(new URL('./cutover.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
