import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PNG } from 'pngjs';
import { createApplication } from '@videocut/application';
import { runProcess } from '@videocut/speech';
import { createServer } from '../apps/server/src/app.js';
import { configureLtxAvatar, importConfiguredVoice } from '../plugins/videoflowcut/scripts/configure-ltx-avatar.mjs';

async function fixtures(root: string) {
  const photo = join(root, 'photo.png');
  const image = new PNG({ width: 64, height: 64 }); image.data.fill(255);
  await writeFile(photo, PNG.sync.write(image));
  image.data[0] = 0;
  const otherPhoto = join(root, 'other.png'); await writeFile(otherPhoto, PNG.sync.write(image));
  const voice = join(root, 'voice.wav'); const otherVoice = join(root, 'other.wav');
  for (const [path, frequency] of [[voice, '440'], [otherVoice, '880']]) {
    await runProcess('ffmpeg', ['-y', '-f', 'lavfi', '-i', `sine=frequency=${frequency}:duration=1`, path!]);
  }
  return { photo, otherPhoto, voice, otherVoice };
}

test('人物库默认跨项目固定，替换、移除及重命名不破坏旧项目；重启仍可读', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vfc-presenter-library-')); let app = createApplication(root);
  try {
    const files = await fixtures(root);
    await app.presenterLibrary.import({ kind: 'photo', name: '人物甲', sourcePath: files.photo, setDefault: true });
    const library = await app.presenterLibrary.import({ kind: 'voice', name: '音色甲', sourcePath: files.voice, setDefault: true });
    const first = app.createProject({ name: '第一期', profile: 'presenter_motion' });
    const projectId = first.snapshot.project.id;
    const original = first.snapshot.presenter!;
    assert.equal(original.photo?.entryId, library.defaults.photoId);
    assert.equal(original.voice?.entryId, library.defaults.voiceId);
    const fixedPath = join(first.snapshot.project.rootPath, first.snapshot.assets.find(asset => asset.id === original.photo!.assetId)!.managedPath);
    const fixedBytes = await readFile(fixedPath);
    await app.presenterLibrary.import({ kind: 'photo', name: '人物乙', sourcePath: files.otherPhoto, replaceId: library.defaults.photoId });
    const second = app.createProject({ name: '第二期', profile: 'presenter_motion' });
    assert.notEqual(second.snapshot.presenter?.photo?.contentHash, original.photo?.contentHash);
    assert.deepEqual(app.readProject(projectId).snapshot.presenter, original);
    app.presenterLibrary.update({ action: 'remove', id: library.defaults.photoId! });
    assert.equal(app.presenterLibrary.read().defaults.photoId, undefined);
    assert.deepEqual(await readFile(fixedPath), fixedBytes);
    app.presenterLibrary.update({ action: 'rename', id: library.defaults.voiceId!, name: '新名字' });
    const renamed = app.presenterLibrary.apply({ projectId, baseRevision: first.revision.number, voiceId: library.defaults.voiceId });
    assert.equal(renamed.snapshot.presenter?.voice?.name, '新名字');
    assert.equal(renamed.snapshot.presenter?.voice?.assetId, original.voice?.assetId);
    assert.equal(renamed.snapshot.speechInputVersion, first.snapshot.speechInputVersion);
    app.close(); app = createApplication(root);
    assert.equal(app.presenterLibrary.read().defaults.voiceId, library.defaults.voiceId);
    assert.deepEqual(await readFile(fixedPath), fixedBytes);
    assert.equal(app.readProject(projectId).snapshot.presenter?.photo?.contentHash, original.photo?.contentHash);
    const before = app.listProjects().length;
    await rm(app.presenterLibrary.file(library.defaults.voiceId!).path);
    assert.throws(() => app.createProject({ name: '缺失默认不能半创建', profile: 'presenter_motion' }), /参考文件不存在/);
    assert.equal(app.listProjects().length, before);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test('照片更换保留声音，音色更换清空旧语音缓存并拒绝在途旧结果', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vfc-presenter-inputs-')); const app = createApplication(root);
  try {
    const files = await fixtures(root);
    const missing = app.createProject({ name: '未配置音色', profile: 'presenter_motion' });
    assert.throws(() => app.submitVoiceSynthesis({ projectId: missing.snapshot.project.id }), /先在本片选择音色/);
    await app.presenterLibrary.import({ kind: 'photo', name: '照片', sourcePath: files.photo, setDefault: true });
    await app.presenterLibrary.import({ kind: 'voice', name: '音色', sourcePath: files.voice, setDefault: true });
    let state = app.createProject({ name: '更换测试', profile: 'presenter_motion' }); const projectId = state.snapshot.project.id;
    state = app.applyAuthoredScript({ projectId, baseRevision: state.revision.number, sourceNote: '隔离测试', units: [{ text: '完整的一句话。', kind: 'statement' }] });
    const oldJob = app.submitVoiceSynthesis({ projectId });
    assert.equal(oldJob.payload.voiceReferenceId, state.snapshot.presenter?.voice?.voiceReferenceId);
    const segmentId = state.snapshot.speechSegments[0]!.id;
    const assetId = state.snapshot.presenter!.voice!.assetId;
    const assembly = {
      projectId, generatedAssets: [], expectedSpeechInputVersion: state.snapshot.speechInputVersion,
      segmentAssets: [{ id: 'segment-result', speechSegmentId: segmentId, voiceReferenceAssetId: assetId, assetId, durationMs: 1000, bridgeRunId: 'fixture-run', schemaVersion: 'fixture', quality: 'passed' as const }],
      speechAsset: { id: 'speech-result', assetId, scriptRevision: state.snapshot.script.revision, segmentAssetIds: ['segment-result'], timing: { precision: 'segment_exact' as const, source: '隔离测试', segments: [{ speechSegmentId: segmentId, startMs: 0, endMs: 1000, startFrame: 0, endFrame: 24 }] }, status: 'ready' as const }
    };
    state = app.applySpeechAssembly(assembly);
    const photoLibrary = await app.presenterLibrary.import({ kind: 'photo', name: '另一照片', sourcePath: files.otherPhoto });
    state = app.presenterLibrary.apply({ projectId, baseRevision: state.revision.number, photoId: photoLibrary.entries.at(-1)!.id });
    assert.equal(state.snapshot.speechAsset?.id, assembly.speechAsset.id);
    assert.equal(state.snapshot.speechInputVersion, assembly.expectedSpeechInputVersion);
    const voiceLibrary = await app.presenterLibrary.import({ kind: 'voice', name: '另一音色', sourcePath: files.otherVoice });
    state = app.presenterLibrary.apply({ projectId, baseRevision: state.revision.number, voiceId: voiceLibrary.entries.at(-1)!.id });
    assert.equal(state.snapshot.speechAsset, undefined);
    assert.deepEqual(state.snapshot.speechSegmentAssets, []);
    assert.equal(state.snapshot.speechInputVersion, assembly.expectedSpeechInputVersion! + 1);
    assert.throws(() => app.applySpeechAssembly(assembly), /音色已改变/);
    assert.throws(() => app.submitVoiceSynthesis({ projectId, voiceReferenceId: String(oldJob.payload.voiceReferenceId) }), /先更换本片音色/);
    const freshJob = app.submitVoiceSynthesis({ projectId });
    assert.notEqual(freshJob.id, oldJob.id);
    assert.equal(freshJob.payload.voiceReferenceId, state.snapshot.presenter?.voice?.voiceReferenceId);
    assert.deepEqual(freshJob.payload.speechSegmentIds, [segmentId]);
  } finally { app.close(); await rm(root, { recursive: true, force: true }); }
});

test('工作台上传、预览和默认音色登记共用正式设置，已有默认不覆盖', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vfc-presenter-http-'));
  const { app, application } = await createServer({ workspaceRoot: root, serveWeb: false });
  try {
    const files = await fixtures(root);
    const boundary = 'presenter-test-boundary';
    const content = await readFile(files.photo);
    const payload = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="portrait.png"\r\nContent-Type: image/png\r\n\r\n`), content, Buffer.from(`\r\n--${boundary}--\r\n`)]);
    const upload = await app.inject({ method: 'POST', url: '/api/settings/presenter-library/upload?kind=photo&name=portrait&setDefault=true', headers: { 'content-type': `multipart/form-data; boundary=${boundary}` }, payload });
    assert.equal(upload.statusCode, 200, upload.body);
    const photoId = upload.json().defaults.photoId;
    const media = await app.inject(`/api/settings/presenter-library/${photoId}/media`);
    assert.deepEqual(media.rawPayload, content);
    const workflowPath = join(root, 'voice-workflow.json');
    await writeFile(workflowPath, JSON.stringify({ '1': { inputs: { audio: 'voice.wav' } } }));
    await app.listen({ host: '127.0.0.1', port: 0 });
    const serverUrl = app.listeningOrigin;
    assert.equal((await importConfiguredVoice({ workflowPath, inputRoot: root, serverUrl })).imported, true);
    assert.equal((await importConfiguredVoice({ workflowPath, inputRoot: root, serverUrl })).imported, false);
    assert.equal(application.presenterLibrary.read().entries.length, 2);
  } finally { await app.close(); application.close(); await rm(root, { recursive: true, force: true }); }
});

test('LTX 发布清理负面限制并公开可选正向提示词，保留原工作流', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vfc-ltx-config-'));
  try {
    const workflowPath = join(root, 'original.app.json'); const outputDirectory = join(root, 'api');
    const source = JSON.stringify({ extra: { comfyuiBridge: { status: 'ready', apiPrompt: {
      '1': { class_type: 'LTXVConditioning', inputs: { positive: ['2', 0], negative: ['3', 0] } },
      '2': { class_type: 'CLIPTextEncode', inputs: { text: 'old positive' } },
      '3': { class_type: 'CLIPTextEncode', inputs: { text: 'smiling, eyes looking at camera, shirt' } },
      '4': { class_type: 'LoadImage', inputs: { image: 'old.png' } }, '5': { class_type: 'LoadAudio', inputs: { audio: 'old.wav' } }
    }, inputMappings: [{ id: 'photo', kind: 'image', nodeId: '4', inputName: 'image' }, { id: 'speech', kind: 'audio', nodeId: '5', inputName: 'audio' }], outputMappings: [] } } });
    await writeFile(workflowPath, source);
    const result = await configureLtxAvatar({ workflowPath, outputDirectory });
    const manifest = JSON.parse(await readFile(join(outputDirectory, `${result.workflowId}.bridge.json`), 'utf8'));
    const graph = JSON.parse(await readFile(join(outputDirectory, manifest.apiPromptFile), 'utf8'));
    assert.equal(await readFile(workflowPath, 'utf8'), source);
    assert.equal(manifest.inputMappings.find((field: {kind: string}) => field.kind === 'text').required, false);
    assert.match(graph['2'].inputs.text, /without subtitles/);
    assert.doesNotMatch(graph['3'].inputs.text, /smiling|looking at camera|shirt/);
    assert.equal(graph['4'].inputs.image, 'old.png');
  } finally { await rm(root, { recursive: true, force: true }); }
});
