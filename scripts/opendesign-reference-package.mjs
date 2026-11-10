import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {copyFile, mkdir, readFile, stat, unlink, writeFile} from 'node:fs/promises';
import {basename, dirname, extname, isAbsolute, join, posix, resolve} from 'node:path';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {loadCreativeIndex,readCreativeCase} from '../references/motion-cases/skillry/tools/creative-library.mjs';
import {loadLibraryIndex,readLibraryMechanism} from '../references/motion-cases/skillry/tools/library-store.mjs';
import {localFile} from '../references/motion-cases/skillry/tools/mechanisms.mjs';
import {resolveLibraryLink} from '../references/motion-cases/skillry/document-format.mjs';

const run = promisify(execFile);
const readJson = async path => JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));
const mime = {'.md':'text/markdown','.json':'application/json','.txt':'text/plain','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.m4v':'video/mp4','.mov':'video/quicktime','.webm':'video/webm','.ogv':'video/ogg','.wav':'audio/wav','.mp3':'audio/mpeg','.m4a':'audio/mp4','.flac':'audio/flac','.aif':'audio/aiff','.aiff':'audio/aiff','.aac':'audio/aac','.ogg':'audio/ogg'};
const hashFile = path => new Promise((ok, fail) => {
  const hash = createHash('sha256');
  createReadStream(path).on('data', chunk => hash.update(chunk)).on('error', fail).on('end', () => ok(hash.digest('hex')));
});
async function clearPrepared(output) {
  for (const name of ['delivery-manifest.json','verified-manifest.json','start-run-prompt.md','brief/scenes.json']) {
    await unlink(join(output,name)).catch(error=>{if(error.code!=='ENOENT')throw error;});
  }
}

async function probe(path) {
  const ext = extname(path).toLowerCase();
  if (['.jpg','.jpeg','.png','.webp'].includes(ext)) {
    await run('ffmpeg', ['-v','error','-xerror','-i',path,'-frames:v','1','-f','null','-'], {maxBuffer:2_000_000});
    return {localDecode:'verified'};
  }
  const videoFile = ['.mp4','.m4v','.mov','.webm','.ogv'].includes(ext);
  const audioFile = ['.wav','.mp3','.m4a','.flac','.aif','.aiff','.aac','.ogg'].includes(ext);
  if (!videoFile && !audioFile) return {};
  const {stdout} = await run('ffprobe', ['-v','error','-show_entries','format=duration:stream=codec_type,r_frame_rate','-of','json',path], {maxBuffer: 2_000_000});
  const data = JSON.parse(stdout), stream = data.streams?.find(item => item.codec_type === (videoFile ? 'video' : 'audio'));
  if (!stream) throw new Error(videoFile ? '没有视频流' : '没有音频流');
  const [n,d] = (stream.r_frame_rate ?? '').split('/').map(Number);
  const durationMs = Math.round(Number(data.format?.duration) * 1000);
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error('媒体时长不可用');
  // 实际解码整段，ffprobe 成功本身不能证明视频完整可读。
  await run('ffmpeg', ['-v','error','-xerror','-i',path,'-map',videoFile ? '0:v:0' : '0:a:0','-f','null','-'], {maxBuffer: 2_000_000});
  return {durationMs, ...(n > 0 && d > 0 ? {fps:n/d} : {}), localDecode:'verified'};
}

const sceneReferences = scene => Array.isArray(scene.references) ? scene.references : scene.reference ? [scene.reference] : [];

/** 把场面里的角色和范围绑定到本次实际交付文件，不把候选或缺失素材标成可制作。 */
function prepareScenes(input, entries, creativeRecords, project) {
  const ids = new Set(), assets = new Map((input.assets ?? []).map(asset => [asset.id,asset]));
  if (assets.size !== (input.assets ?? []).length) throw new Error('素材 ID 重复');
  return (input.scenes ?? []).map(scene => {
    if (!scene.sceneId || ids.has(scene.sceneId)) throw new Error('场面需要唯一的 sceneId');
    ids.add(scene.sceneId);
    if (!['ready','pending'].includes(scene.status)) throw new Error(`场面 ${scene.sceneId} 的状态必须为 ready 或 pending`);
    if (scene.status === 'pending') return {...scene,status:'pending'};
    const errors = [], fail = message => errors.push(message);
    if (typeof scene.process !== 'string' || !scene.process.trim()) fail('缺少从开始到结束的连续画面过程');
    if (!Array.isArray(scene.visualRoles) || !scene.visualRoles.length) fail('缺少视觉角色映射');
    if (!Array.isArray(scene.preserve) || !Array.isArray(scene.adapt)) fail('需要明确保留和允许深化的内容');
    if (scene.references !== undefined && !Array.isArray(scene.references)) fail('场面参考必须是列表');
    if (scene.references && scene.reference) fail('场面参考只能使用 reference 或 references 其中一种');
    const refs=sceneReferences(scene);
    const references=refs.flatMap(ref => {
      const creative=creativeRecords.get(ref.creativeCaseId);
      if (!creative || creative.usage !== 'adopted') { fail('参考创意卡必须在 creative 中标为 adopted'); return []; }
      else {
        const video=entries.get(creative.videoPath);
        if (!ref.sourceSha256 || ref.sourceSha256 !== creative.sourceSha256) fail('创意卡来源指纹不一致');
        if (ref.video && ref.video !== creative.videoPath && ref.video !== creative.libraryVideoPath && resolve(ref.video) !== resolve(creative.sourcePath)) fail('参考原片与创意卡不一致');
        if (!video?.localReadable) fail('参考原片未就绪');
        if (!Number.isFinite(ref.startMs) || !Number.isFinite(ref.endMs) || ref.startMs < 0 || ref.endMs <= ref.startMs || !video?.durationMs || ref.endMs > video.durationMs) fail('参考原片范围无效或超出视频');
        if (refs.length>1 && !ref.purpose) fail('多个参考需要说明各自的场面用途');
        return [{creativeCaseId:ref.creativeCaseId,sourceSha256:creative.sourceSha256,video:creative.videoPath,startMs:ref.startMs,endMs:ref.endMs,timeCoordinates:'original',...(ref.purpose ? {purpose:ref.purpose} : {})}];
      }
    });
    const visualRoles=(Array.isArray(scene.visualRoles) ? scene.visualRoles : []).map(role => {
      if (!role.role || !role.referenceFunction || !role.usage || !Array.isArray(role.assetIds)) fail('视觉角色需要名称、参考作用、素材列表和具体用法');
      const roleIds=Array.isArray(role.assetIds) ? role.assetIds : [];
      const sourceRanges=Array.isArray(role.sourceRanges) ? role.sourceRanges : [];
      const mapped=roleIds.map(id => {
        const selected=assets.get(id), actual=project?.snapshot?.assets?.find(asset => asset.id===id);
        const deliveredPath=selected && `references/source-materials/${selected.id}/${basename(selected.path)}`;
        const file=deliveredPath && entries.get(deliveredPath);
        if (!selected || !actual || actual.status !== 'ready' || !actual.sourceHash || !file?.localReadable || file.sourceSha256 !== actual.sourceHash || file.sha256 !== actual.sourceHash) fail(`素材 ${id} 未取得、未就绪或文件哈希与项目不一致`);
        if (['video','actor_video','audio'].includes(actual?.kind) && !file?.durationMs) fail(`素材 ${id} 缺少可核验的媒体时长`);
        const ranges=sourceRanges.filter(range => (range.assetId ?? (roleIds.length === 1 ? id : undefined)) === id).map(range => {
          if (!Number.isFinite(range.startMs) || !Number.isFinite(range.endMs) || range.startMs < 0 || range.endMs <= range.startMs || !file?.durationMs || range.endMs > file.durationMs) fail(`素材 ${id} 的源时间范围无效或超出文件`);
          const acquired=actual?.provenance?.acquisition?.sourceRange, offset=acquired?.startMs;
          if (Number.isFinite(offset) && Number.isFinite(acquired?.endMs) && offset+range.endMs>acquired.endMs) fail(`素材 ${id} 的范围超出取得的原片范围`);
          return {startMs:range.startMs,endMs:range.endMs,timeCoordinates:'asset',...(Number.isFinite(offset) ? {originalStartMs:offset+range.startMs,originalEndMs:offset+range.endMs} : {})};
        });
        if (file?.durationMs && !ranges.length) fail(`素材 ${id} 缺少可核验的源时间范围`);
        return {assetId:id,deliveredPath,sourceHash:actual?.sourceHash,sourceRanges:ranges};
      });
      if (sourceRanges.some(range => !roleIds.includes(range.assetId ?? (roleIds.length === 1 ? roleIds[0] : undefined)))) fail('源时间范围未对应唯一的素材 ID');
      return {role:role.role,referenceFunction:role.referenceFunction,usage:role.usage,assets:mapped};
    });
    return {sceneId:scene.sceneId,status:errors.length ? 'incomplete' : 'ready',...(references.length ? {references} : {}),visualRoles,process:scene.process,preserve:scene.preserve,adapt:scene.adapt,...(errors.length ? {diagnostics:errors} : {})};
  });
}

/** 只准备本地交付包；OD 可读性和运行时读取必须由实际工具单独核验。 */
export async function prepareReferencePackage(input, outputRoot, libraryRoot = resolve('references/motion-cases/skillry')) {
  const output = resolve(outputRoot);
  await clearPrepared(output);
  if (!input.projectId || !Number.isSafeInteger(input.revision) || input.revision < 1 || !input.brief || !input.timingPlan) throw new Error('需要项目、Revision、权威指令和时间编排');
  if (input.scenes !== undefined && (!Array.isArray(input.scenes) || !input.scenes.length)) throw new Error('scenes 需要至少一个场面');
  let project, projectSnapshot;
  if (input.scenes && ((input.assets ?? []).length || input.scenes.some(scene => scene.status === 'ready' && scene.visualRoles?.some(role => role.assetIds?.length)))) {
    if (!input.projectSnapshot) throw new Error('场面使用素材时需要当前 read_project 结果文件');
    const snapshotBytes=await readFile(input.projectSnapshot);
    project=JSON.parse(snapshotBytes.toString('utf8').replace(/^\uFEFF/,''));
    if (project.snapshot?.project?.id !== input.projectId || project.revision?.number !== input.revision || !Array.isArray(project.snapshot?.assets)) throw new Error('项目快照的项目身份或 Revision 不一致');
    projectSnapshot={path:resolve(input.projectSnapshot),sha256:createHash('sha256').update(snapshotBytes).digest('hex')};
  }
  const entries = new Map(), diagnostics = [], creativeRecords = new Map();
  const add = (sourcePath, deliveredPath, use) => {
    const existing = entries.get(deliveredPath);
    if (existing && resolve(existing.sourcePath) !== resolve(sourcePath)) throw new Error(`交付路径冲突：${deliveredPath}`);
    if (existing) existing.uses.push(use);
    else entries.set(deliveredPath, {sourcePath, deliveredPath, uses:[use]});
  };
  const library = (path, use) => {
    try { add(localFile(libraryRoot,path), `references/skillry/${path}`, use); }
    catch (error) { diagnostics.push({id:use.id,path,reason:error.message}); }
  };
  const referenceUse = (selected, kind) => {
    if (!selected.id || !selected.purpose || !['study','adopted'].includes(selected.usage)) {
      throw new Error(`${kind}参考需要 ID、用途及 study 或 adopted 的使用状态`);
    }
    return {kind,id:selected.id,usage:selected.usage,purpose:selected.purpose};
  };
  add(input.brief, 'brief/visual-director-brief.md', {kind:'brief',id:'brief',purpose:'创意编排指令'});
  add(input.timingPlan, 'brief/timing-plan.md', {kind:'brief',id:'timing',purpose:'完整时间编排'});
  for (const selected of input.creative ?? []) {
    const reference = referenceUse(selected,'creative');
    const {result} = readCreativeCase(libraryRoot, {id:selected.id,source_sha256:selected.sourceSha256,include_storyboard:false});
    const card = result.card, use = {...reference,id:card.id,librarySourceSha256:result.source_sha256,sourceStartMs:card.start_ms,sourceEndMs:card.end_ms,timeCoordinates:'original'};
    if (creativeRecords.has(card.id)) throw new Error(`创意参考 ID 重复：${card.id}`);
    creativeRecords.set(card.id,{usage:selected.usage,sourceSha256:result.source_sha256,libraryVideoPath:result.resources.video.path,videoPath:`references/skillry/${result.resources.video.path}`,sourcePath:resolve(libraryRoot,result.resources.video.path)});
    library(card.card,{...use,fileKind:'card'});
    for (const [kind,resource] of Object.entries(result.resources)) library(resource.path,{...use,fileKind:kind,...(kind==='clip' ? {clipSourceOffsetMs:result.clip_source_offset_ms} : {})});
    for (const link of result.links) if (link?.path && /\.(?:jpg|jpeg|png|webp|mp4)$/i.test(link.path)) library(link.path,{...use,fileKind:'linkedMedia'});
  }
  for (const selected of input.motion ?? []) {
    const reference = referenceUse(selected,'motion');
    const {result} = readLibraryMechanism(libraryRoot, {id:selected.id,source_sha256:selected.sourceSha256,include_storyboard:false});
    const card=result.card, use={...reference,id:card.id,librarySourceSha256:result.source_sha256,sourceStartMs:card.clip?.start_ms,sourceEndMs:card.clip?.end_ms,timeCoordinates:'original'};
    library(card.document,{...use,fileKind:'card'}); library(card.storyboard,{...use,fileKind:'storyboard'});
    library(result.resources.video.path,{...use,fileKind:'video'});
    if (card.clip?.path) {
      if (result.resources.clip.available) library(card.clip.path,{...use,fileKind:'clip',clipSourceOffsetMs:card.clip.start_ms});
      else diagnostics.push({id:card.id,path:card.clip.path,reason:result.resources.clip.reason});
    }
    for (const match of result.body.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const link=resolveLibraryLink(match[1],card.document);
      if (link?.kind==='local' && /\.(?:jpg|jpeg|png|webp|mp4)$/i.test(link.path)) library(link.path,use);
    }
  }
  for (const selected of input.references ?? []) {
    const use = referenceUse(selected,'reference');
    if (!Array.isArray(selected.files) || !selected.files.length) throw new Error(`参考 ${selected.id} 缺少文件`);
    for (const file of selected.files) {
      const destination = typeof file.deliveredPath === 'string' ? file.deliveredPath.replaceAll('\\','/') : '';
      if (!file.path || !destination || isAbsolute(file.deliveredPath) || !destination.startsWith('references/') || posix.normalize(destination) !== destination) throw new Error(`参考 ${selected.id} 需要 references 下的相对交付路径`);
      add(file.path,destination,use);
    }
  }
  for (const asset of input.assets ?? []) {
    if (!asset.id || !asset.path || !asset.purpose) throw new Error('素材需要 ID、路径和用途');
    add(asset.path, `references/source-materials/${asset.id}/${basename(asset.path)}`, {kind:'source',id:asset.id,purpose:asset.purpose,sourceStartMs:asset.sourceStartMs,sourceEndMs:asset.sourceEndMs});
  }
  for (const entry of entries.values()) {
    let target, copied=false;
    try {
      target=resolve(output,entry.deliveredPath);
      if (!target.startsWith(output + (process.platform === 'win32' ? '\\' : '/'))) throw new Error('交付路径越界');
      await mkdir(dirname(target), {recursive:true});
      let body;
      if (entry.deliveredPath.startsWith('references/skillry/') && entry.deliveredPath.endsWith('.md')) {
        const libraryPath=entry.deliveredPath.slice('references/skillry/'.length);
        body=await readFile(entry.sourcePath,'utf8');
        // 未交付的正文上下文链接明确标记，不呈现为可打开的本地文件。
        body=body.replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g,(all,bang,label,href)=>{
          const link=resolveLibraryLink(href,libraryPath);
          if (link?.kind==='local' && !entries.has(`references/skillry/${link.path}`)) return `${label}（未交付：${href}）`;
          return all;
        });
      }
      if (body === undefined) await copyFile(entry.sourcePath,target); else await writeFile(target,body,'utf8');
      copied=true;
      const file=await stat(target);
      const media=await probe(target);
      for (const use of entry.uses.filter(item=>item.kind==='source')) {
        const start=use.sourceStartMs ?? 0, end=use.sourceEndMs;
        if (!Number.isFinite(start) || start<0 || (media.durationMs!==undefined && start>=media.durationMs) || (end!==undefined && (!Number.isFinite(end) || end<=start || (media.durationMs!==undefined && end>media.durationMs)))) throw new Error('素材源时间范围无效或超出视频');
      }
      const sourceSha256=await hashFile(entry.sourcePath), sha256=await hashFile(target);
      if (project) for (const use of entry.uses.filter(item=>item.kind==='source')) {
        const asset=project.snapshot.assets.find(item=>item.id===use.id);
        if (!asset || asset.status!=='ready' || !asset.sourceHash || asset.sourceHash!==sourceSha256 || asset.sourceHash!==sha256) throw new Error(`素材 ${use.id} 未取得、未就绪或文件哈希与项目不一致`);
      }
      Object.assign(entry,{sourceSha256,sha256,mimeType:mime[extname(target).toLowerCase()] ?? 'application/octet-stream',sizeBytes:file.size,...media,localReadable:true,readableByOpenDesign:false,readCheck:'未核验 OD 读取'});
    } catch (error) {
      if (copied) await unlink(target).catch(unlinkError=>{if(unlinkError.code!=='ENOENT')throw unlinkError;});
      Object.assign(entry,{localReadable:false,readableByOpenDesign:false,readCheck:'未核验 OD 读取',error:error.message});
      diagnostics.push({path:entry.deliveredPath,reason:error.message});
    }
  }
  let scenes, scenesPath;
  if (input.scenes) {
    scenes=prepareScenes(input,entries,creativeRecords,project);
    scenesPath='brief/scenes.json';
    const path=join(output,scenesPath);
    await mkdir(dirname(path),{recursive:true});
    await writeFile(path,JSON.stringify({projectId:input.projectId,revision:input.revision,scenes},null,2)+'\n','utf8');
    const hash=await hashFile(path), file=await stat(path);
    // 场面文件由当前准备过程生成；核验阶段仍检查它在交付后没有改变。
    entries.set(scenesPath,{sourcePath:path,deliveredPath:scenesPath,uses:[{kind:'brief',id:'scenes',purpose:'场面、参考和真实素材映射'}],sourceSha256:hash,sha256:hash,mimeType:'application/json',sizeBytes:file.size,localReadable:true,readableByOpenDesign:false,readCheck:'未核验 OD 读取'});
    const mappedAssets=new Set(input.scenes.flatMap(scene=>(scene.visualRoles ?? []).flatMap(role=>role.assetIds ?? [])));
    const readyAssets=new Set(scenes.filter(scene=>scene.status==='ready').flatMap(scene=>scene.visualRoles.flatMap(role=>role.assets.map(asset=>asset.assetId))));
    const mappedCreative=new Set(input.scenes.flatMap(scene=>sceneReferences(scene).map(ref=>ref.creativeCaseId)).filter(Boolean));
    const readyCreative=new Set(scenes.filter(scene=>scene.status==='ready').flatMap(scene=>(scene.references ?? []).map(ref=>ref.creativeCaseId)).filter(Boolean));
    // 只被未就绪场面引用的资料保留诊断，但不阻塞其他独立场面。
    const required=use=>!(use.kind==='source' && mappedAssets.has(use.id) && !readyAssets.has(use.id)) && !(use.kind==='creative' && mappedCreative.has(use.id) && !readyCreative.has(use.id));
    for (const entry of entries.values()) if (entry.uses.every(use=>!required(use))) entry.requiredForRun=false;
    for (const diagnostic of diagnostics) {
      const entry=entries.get(diagnostic.path);
      if (entry?.requiredForRun===false || (diagnostic.id && mappedCreative.has(diagnostic.id) && !readyCreative.has(diagnostic.id))) diagnostic.requiredForRun=false;
    }
  }
  const manifest={projectId:input.projectId,revision:input.revision,libraryRoot:resolve(libraryRoot),briefPath:'brief/visual-director-brief.md',timingPlanPath:'brief/timing-plan.md',...(projectSnapshot ? {projectSnapshot} : {}),...(scenes ? {scenesPath,scenes} : {}),files:[...entries.values()],diagnostics};
  await mkdir(output,{recursive:true});
  await writeFile(join(output,'delivery-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  return manifest;
}

/** 使用 OD 文件清单返回的实际本机路径核验字节，不把文件列表当成观看证据。 */
export async function verifyReferenceDelivery(manifest, listing, revision, odProjectId) {
  if (manifest.revision !== revision) throw new Error('项目 Revision 已变化，请重新核对输入');
  if (!odProjectId) throw new Error('需要 OD 项目身份');
  if (manifest.projectSnapshot && await hashFile(manifest.projectSnapshot.path) !== manifest.projectSnapshot.sha256) throw new Error('项目快照已变化，请重新准备');
  const uses=manifest.files.flatMap(file=>file.uses);
  for (const [kind,load] of [['creative',loadCreativeIndex],['motion',loadLibraryIndex]]) {
    const selected=uses.filter(use=>use.kind===kind);
    if (selected.length) {
      const current=load(manifest.libraryRoot).source_sha256;
      if (selected.some(use=>use.librarySourceSha256!==current)) throw new Error(`${kind==='creative'?'创意':'动效'}库来源快照已变化，请重新准备`);
    }
  }
  const byPath = new Map(listing.files.map(file => [file.path,file]));
  const files=[];
  for (const entry of manifest.files) {
    if (entry.requiredForRun===false) {
      files.push({...entry,readableByOpenDesign:false,readCheck:'仅供未就绪场面，本次未核验或提交'});
      continue;
    }
    const actual=byPath.get(entry.deliveredPath);
    const result={...entry,readableByOpenDesign:false,readCheck:'未核验 OD 读取'};
    try {
      if (!entry.localReadable || !actual?.localPath) throw new Error('OD 文件清单没有可核验的本机路径');
      if (await hashFile(entry.sourcePath) !== entry.sourceSha256) throw new Error('来源文件已变化');
      if (await hashFile(actual.localPath) !== entry.sha256) throw new Error('OD 文件哈希不一致');
      await probe(actual.localPath);
      Object.assign(result,{readableByOpenDesign:true,readCheck:'OD 项目文件字节一致且本机可读取；不代表 Run 已读取'});
    } catch (error) { result.readCheck=error.message; }
    files.push(result);
  }
  const failed=files.filter(file=>file.requiredForRun!==false && !file.readableByOpenDesign);
  const verified={...manifest,odProjectId,files,verificationErrors:failed.map(file=>({path:file.deliveredPath,reason:file.readCheck}))};
  if (manifest.diagnostics.some(item=>item.requiredForRun!==false) || failed.length) return {manifest:verified};
  const readyScenes=manifest.scenes?.filter(scene=>scene.status==='ready');
  if (readyScenes && !readyScenes.length) {
    verified.verificationErrors.push({path:manifest.scenesPath,reason:'没有具备完整输入的就绪场面'});
    return {manifest:verified};
  }
  const lines=files.filter(file=>file.requiredForRun!==false).map(file=>`- ${file.deliveredPath}：${file.uses.map(use=>`${use.kind}/${use.id}${use.usage ? `（${use.usage === 'study' ? '学习' : '已采用'}）` : ''}，${use.purpose}${use.fileKind ? `，文件类型 ${use.fileKind}` : ''}${use.sourceStartMs !== undefined && use.sourceEndMs !== undefined ? `，资料原片范围 ${use.sourceStartMs}—${use.sourceEndMs}ms` : ''}${use.clipSourceOffsetMs !== undefined ? `，切片零点对应原片 ${use.clipSourceOffsetMs}ms` : ''}`).join('；')}`);
  const sceneLines=readyScenes ? [`本次只制作 ${manifest.scenesPath} 中状态为 ready 的场面；pending 或 incomplete 场面继续探索，不得冒充完成。`,...readyScenes.map(scene=>`- 就绪场面 ${scene.sceneId}：${JSON.stringify(scene)}`)] : [];
  const prompt=[`先完整读取本项目中的创意编排指令 ${manifest.briefPath} 和时间资料 ${manifest.timingPlanPath}，再读取以下文件并按用途制作：`,...lines,...sceneLines,'参考范围使用原片时间，素材范围使用交付文件的本地时间；已知原片偏移时另列原片时间。查看采用的创意和机制视频，连续观察选定范围及必要前后画面，并记录实际观察方式。按本片编排完成选中场面的素材组合、文字作用、背景与完整运动过程。','用户要求、事实条件及当前采用的编排以完整简报为准。制作作者完成整场构图、中文排版、素材取景、尺度、层次、镜头、动作与内部节奏。','作品交回后由原导演、视觉与创意负责人检查和组织返修。资料无法读取或材料无法支持采用过程时，反馈具体文件、动作、范围及调整建议。事实、段落含义或已采用关键过程需要改变时，与原负责人协调更新当前稿。'].join('\n');
  return {manifest:verified,prompt};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [mode,...args] = process.argv.slice(2);
    if (mode === 'prepare' && args.length === 2) {
      const [inputFile,output]=args;
      // 输入文件无法读取或解析时，也不能保留上一轮的制作请求。
      await clearPrepared(resolve(output));
      const result=await prepareReferencePackage(await readJson(inputFile),output);
      console.log(JSON.stringify({output:resolve(output),files:result.files.length,diagnostics:result.diagnostics,scenes:result.scenes?.map(({sceneId,status,diagnostics})=>({sceneId,status,diagnostics}))},null,2));
      if (result.diagnostics.some(item=>item.requiredForRun!==false) || (result.scenes && !result.scenes.some(scene=>scene.status==='ready'))) process.exitCode=1;
    } else if (mode === 'verify' && args.length === 3) {
      const [manifestFile,listingFile,checkFile]=args;
      // 核验失败或输入已变化时，不能留下上一次的可发送请求。
      for (const name of ['start-run-prompt.md','verified-manifest.json']) {
        await unlink(join(dirname(manifestFile),name)).catch(error=>{if(error.code!=='ENOENT')throw error;});
      }
      const manifest=await readJson(manifestFile);
      const listing=await readJson(listingFile);
      const check=await readJson(checkFile);
      const result=await verifyReferenceDelivery(manifest,listing,check.revision,check.odProjectId);
      await writeFile(join(dirname(manifestFile),'verified-manifest.json'),JSON.stringify(result.manifest,null,2)+'\n','utf8');
      if (result.prompt) await writeFile(join(dirname(manifestFile),'start-run-prompt.md'),result.prompt+'\n','utf8');
      console.log(JSON.stringify({verificationErrors:result.manifest.verificationErrors,diagnostics:result.manifest.diagnostics},null,2));
      if (!result.prompt) process.exitCode=1;
    } else throw new Error('用法：node scripts/opendesign-reference-package.mjs prepare 输入.json 输出目录；或 verify 交付清单.json OD文件清单.json 核验输入.json');
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
