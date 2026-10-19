import { readFile, writeFile, mkdir, realpath, stat } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

export const LTX_AVATAR_WORKFLOW_ID = 'videoflowcut-ltx23-avatar-v1';
export const LTX_DEFAULT_PROMPT = 'A realistic talking-head video of the person in the reference image, speaking naturally in sync with the supplied speech audio. Maintain the same identity, clothing and background. A steady camera and restrained, natural movement. A clean frame without subtitles, captions, text overlays, titles, logos or watermarks.';
export const LTX_NEGATIVE_PROMPT = 'subtitles, captions, text overlays, watermarks, identity changes, deformed facial features, extra fingers, distorted hands, flickering, camera shake, mismatched lip sync';

/** 从用户已保存的真实 LTX 执行图发布口播入口，不修改原编辑工作流。 */
export async function configureLtxAvatar({ workflowPath, outputDirectory }) {
  const source = JSON.parse(await readFile(workflowPath, 'utf8'));
  const snapshot = source.extra?.comfyuiBridge;
  if (snapshot?.status !== 'ready' || !snapshot.apiPrompt) throw new Error('LTX 原工作流没有就绪的 Bridge 执行快照，请先正常保存');
  const graph = structuredClone(snapshot.apiPrompt);
  const conditioning = Object.values(graph).filter(node => node.class_type === 'LTXVConditioning');
  if (conditioning.length !== 1) throw new Error('需要唯一明确的 LTXVConditioning，不能猜测提示词位置');
  const positiveId = conditioning[0].inputs.positive?.[0];
  const negativeId = conditioning[0].inputs.negative?.[0];
  if (!positiveId || !negativeId || positiveId === negativeId || graph[positiveId]?.class_type !== 'CLIPTextEncode' || graph[negativeId]?.class_type !== 'CLIPTextEncode') throw new Error('LTX 正负提示词没有直接连接到明确的文本编码节点');
  graph[positiveId].inputs.text = LTX_DEFAULT_PROMPT;
  graph[negativeId].inputs.text = LTX_NEGATIVE_PROMPT;
  const media = snapshot.inputMappings.filter(input => input.kind === 'image' || input.kind === 'audio');
  if (media.length !== 2 || !media.some(input => input.kind === 'image') || !media.some(input => input.kind === 'audio')) throw new Error('LTX 口播入口必须有明确的一张图片和一段音频');
  const manifest = {
    id: LTX_AVATAR_WORKFLOW_ID, name: 'VideoFlowCut LTX 2.3 人物口播',
    apiPromptFile: `${LTX_AVATAR_WORKFLOW_ID}.json`,
    inputMappings: [
      ...media.map(({ widgetRef, ...input }) => ({ ...input, required: true })),
      { id: 'presenter-positive-prompt', label: '正向提示词', kind: 'text', required: false, defaultValue: LTX_DEFAULT_PROMPT, nodeId: String(positiveId), inputName: 'text' }
    ],
    outputMappings: snapshot.outputMappings
  };
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(join(outputDirectory, manifest.apiPromptFile), JSON.stringify(graph, null, 2) + '\n');
  await writeFile(join(outputDirectory, `${manifest.id}.bridge.json`), JSON.stringify(manifest, null, 2) + '\n');
  return { workflowId: manifest.id, outputDirectory, positiveNodeId: String(positiveId), negativeNodeId: String(negativeId) };
}

/** 一次性将服务端默认音色登记到工作台；不自动覆盖用户已经选择的默认。 */
export async function importConfiguredVoice({ workflowPath, inputRoot, serverUrl }) {
  const source = JSON.parse(await readFile(workflowPath, 'utf8'));
  const graph = source.extra?.comfyuiBridge?.apiPrompt ?? source;
  const references = [...new Set(Object.values(graph).flatMap(node => typeof node?.inputs?.audio === 'string' ? [node.inputs.audio] : []))];
  if (references.length !== 1) throw new Error('默认音色工作流没有唯一可读取的本地音频输入');
  const root = await realpath(inputRoot);
  const sourcePath = await realpath(resolve(root, references[0]));
  const offset = relative(root, sourcePath);
  if (isAbsolute(offset) || offset.startsWith('..') || !(await stat(sourcePath)).isFile()) throw new Error('默认音色文件不在配置的 ComfyUI input 目录');
  const base = serverUrl.replace(/\/$/, '');
  const currentResponse = await fetch(`${base}/api/settings/presenter-library`);
  if (!currentResponse.ok) throw new Error(`读取人物与音色失败：${currentResponse.status}`);
  const library = await currentResponse.json();
  if (library.defaults.voiceId) return { imported: false, reason: '已有默认音色，保持用户选择' };
  const response = await fetch(`${base}/api/settings/presenter-library/import`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'voice', name: '原服务端默认音色', sourcePath, setDefault: true }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? `登记默认音色失败：${response.status}`);
  return { imported: true, voiceId: result.defaults.voiceId };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'workflow' && args.length === 2) console.log(JSON.stringify(await configureLtxAvatar({ workflowPath: args[0], outputDirectory: args[1] })));
  else if (mode === 'voice' && args.length === 3) console.log(JSON.stringify(await importConfiguredVoice({ workflowPath: args[0], inputRoot: args[1], serverUrl: args[2] })));
  else throw new Error('用法：configure-ltx-avatar.mjs workflow <LTX源工作流> <Bridge api_workflows目录>；或 voice <现有默认音色API图> <ComfyUI input目录> <VideoFlowCut服务URL>');
}
