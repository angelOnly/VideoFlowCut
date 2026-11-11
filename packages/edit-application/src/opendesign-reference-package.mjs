import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {copyFile, mkdir, readFile, stat, unlink, writeFile} from 'node:fs/promises';
import {basename, dirname, extname, isAbsolute, join, posix, resolve} from 'node:path';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {loadCreativeIndex,readCreativeCase} from '../../../references/motion-cases/skillry/tools/creative-library.mjs';
import {loadLibraryIndex,readLibraryMechanism} from '../../../references/motion-cases/skillry/tools/library-store.mjs';
import {localFile} from '../../../references/motion-cases/skillry/tools/mechanisms.mjs';
import {resolveLibraryLink} from '../../../references/motion-cases/skillry/document-format.mjs';

const run = promisify(execFile);
const mime = {'.md':'text/markdown','.json':'application/json','.txt':'text/plain','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.m4v':'video/mp4','.mov':'video/quicktime','.webm':'video/webm','.ogv':'video/ogg','.wav':'audio/wav','.mp3':'audio/mpeg','.m4a':'audio/mp4','.flac':'audio/flac','.aif':'audio/aiff','.aiff':'audio/aiff','.aac':'audio/aac','.ogg':'audio/ogg'};
const hashFile = path => new Promise((ok, fail) => {
  const hash = createHash('sha256');
  createReadStream(path).on('data', chunk => hash.update(chunk)).on('error', fail).on('end', () => ok(hash.digest('hex')));
});
export async function clearPrepared(output) {
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

// 预排范围使用作品根帧，允许相邻的已发布范围共同覆盖。
function rangeCovered(ranges, startFrame, endFrame) {
  if (!Number.isSafeInteger(startFrame) || !Number.isSafeInteger(endFrame) || startFrame < 0 || endFrame <= startFrame) return false;
  let cursor = startFrame;
  for (const range of [...(ranges ?? [])].sort((a,b)=>a.startFrame-b.startFrame)) {
    if (range.endFrame <= cursor) continue;
    if (range.startFrame > cursor) return false;
    cursor = range.endFrame;
    if (cursor >= endFrame) return true;
  }
  return false;
}

function sourceRangeCovered(ranges, startMs, endMs) {
  let cursor=startMs;
  for (const range of [...ranges].sort((a,b)=>a.startMs-b.startMs)) {
    if (range.endMs <= cursor) continue;
    if (range.startMs > cursor+1) return false;
    cursor=Math.max(cursor,range.endMs);
    if (cursor+1 >= endMs) return true;
  }
  return false;
}

/** 把场面里的角色和范围绑定到本次实际交付文件，不把候选或缺失素材标成可制作。 */
function prepareScenes(input, entries, creativeRecords, motionRecords, project, delivered) {
  const ids = new Set(), assets = new Map((input.assets ?? []).map(asset => [asset.id,asset]));
  if (assets.size !== (input.assets ?? []).length) throw new Error('素材 ID 重复');
  return (input.scenes ?? []).map(scene => {
    if (!scene.sceneId || ids.has(scene.sceneId)) throw new Error('场面需要唯一的 sceneId');
    ids.add(scene.sceneId);
    if (!['ready','pending'].includes(scene.status)) throw new Error(`场面 ${scene.sceneId} 的状态必须为 ready 或 pending`);
    if (scene.status === 'pending') return {...scene,status:'pending'};
    if (input.selectedSceneIds && !input.selectedSceneIds.includes(scene.sceneId)) return {...scene,status:'pending',diagnostics:['本次未检查该场面']};
    const errors = [], fail = message => errors.push(message);
    if (typeof scene.process !== 'string' || !scene.process.trim()) fail('缺少从开始到结束的连续画面过程');
    if (!Array.isArray(scene.visualRoles) || !scene.visualRoles.length) fail('缺少视觉角色映射');
    if (!Array.isArray(scene.preserve) || !Array.isArray(scene.adapt)) fail('需要明确保留和允许深化的内容');
    if (scene.references !== undefined && !Array.isArray(scene.references)) fail('场面参考必须是列表');
    if (scene.references && scene.reference) fail('场面参考只能使用 reference 或 references 其中一种');
    const refs=sceneReferences(scene);
    for (const id of scene.resourceIds ?? []) {
      const files=[...entries.values()].filter(entry=>entry.uses.some(use=>use.kind==='reference' && use.id===id));
      if (!files.length || files.some(file=>!file.localReadable)) fail(`场面资料 ${id} 未就绪`);
    }
    const references=refs.flatMap(ref => {
      const kind=ref.kind ?? 'creative';
      const referenceId=ref.id ?? ref.creativeCaseId;
      const record=kind==='creative' ? creativeRecords.get(referenceId) : kind==='motion' ? motionRecords.get(referenceId) : undefined;
      if (!record || record.usage !== 'adopted') { fail(`场面参考 ${referenceId ?? ''} 必须在对应资料中标为 adopted`); return []; }
      else {
        const video=entries.get(record.videoPath);
        if (!ref.sourceSha256 || ref.sourceSha256 !== record.sourceSha256) fail(`${kind==='creative' ? '创意卡' : '动效机制'}来源指纹不一致`);
        if (ref.video && ref.video !== record.videoPath && ref.video !== record.libraryVideoPath && resolve(ref.video) !== resolve(record.sourcePath)) fail('参考原片与创意卡不一致');
        if (!video?.localReadable) fail('参考原片未就绪');
        if (!Number.isFinite(ref.startMs) || !Number.isFinite(ref.endMs) || ref.startMs < 0 || ref.endMs <= ref.startMs || !video?.durationMs || ref.endMs > video.durationMs) fail('参考原片范围无效或超出视频');
        if (refs.length>1 && !ref.purpose) fail('多个参考需要说明各自的场面用途');
        return [{kind,id:referenceId,...(kind==='creative' ? {creativeCaseId:referenceId} : {}),sourceSha256:record.sourceSha256,video:record.videoPath,startMs:ref.startMs,endMs:ref.endMs,timeCoordinates:'original',...(ref.purpose ? {purpose:ref.purpose} : {})}];
      }
    });
    const visualRoles=(Array.isArray(scene.visualRoles) ? scene.visualRoles : []).map(role => {
      if (!role.role || !role.referenceFunction || !role.usage || !Array.isArray(role.assetIds)) fail('视觉角色需要名称、参考作用、素材列表和具体用法');
      const roleIds=Array.isArray(role.assetIds) ? role.assetIds : [];
      const sourceRanges=Array.isArray(role.sourceRanges) ? role.sourceRanges : [];
      const mapped=roleIds.map(id => {
        const selected=assets.get(id), actual=project?.snapshot?.assets?.find(asset => asset.id===id);
        const deliveredPath=selected && delivered(`references/source-materials/${selected.id}/${basename(selected.path)}`);
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
    let visualPlan;
    if (scene.visualPlan !== undefined) {
      const plan=scene.visualPlan;
      if (!plan || typeof plan !== 'object' || Array.isArray(plan)) fail('视觉计划必须是对象');
      else {
        if (!['draft','previewed','pending'].includes(plan.status)) fail('视觉预排状态必须为 draft、previewed 或 pending');
        const roles=new Set(visualRoles.map(role=>role.role));
        if (!Array.isArray(plan.primaryRoles) || !plan.primaryRoles.length || plan.primaryRoles.some(role=>!roles.has(role))) fail('视觉计划主要角色必须对应场面视觉角色');
        if (plan.referenceMappings !== undefined && !Array.isArray(plan.referenceMappings)) fail('参考映射必须是列表');
        for (const mapping of Array.isArray(plan.referenceMappings) ? plan.referenceMappings : []) {
          const matches=refs.filter(ref=>(ref.id ?? ref.creativeCaseId)===mapping?.referenceId);
          const kinds=new Set(matches.map(ref=>ref.kind ?? 'creative'));
          if (mapping?.referenceKind !== undefined && !['creative','motion'].includes(mapping.referenceKind)) fail('参考映射类型必须为 creative 或 motion');
          else if (mapping?.referenceKind === undefined && kinds.size > 1) fail(`视觉计划参考 ${mapping?.referenceId ?? ''} 跨类型 ID 存在歧义，请指定 referenceKind`);
          else {
            const kind=mapping?.referenceKind ?? [...kinds][0];
            // 原场面的类型、编号和来源指纹必须共同对应已采用且交付的参考。
            const deliveredReference=matches.some(ref=>(ref.kind ?? 'creative')===kind && references.some(item=>
              item.kind===kind && item.id===mapping?.referenceId && item.sourceSha256===ref.sourceSha256 && entries.get(item.video)?.localReadable));
            if (!deliveredReference) fail(`视觉计划参考 ${mapping?.referenceId ?? ''} 必须已采用且实际交付，类型和来源指纹需与场面参考一致`);
          }
          if (!roles.has(mapping?.targetRole) || typeof mapping?.treatment !== 'string' || !mapping.treatment.trim()) fail('参考映射需要已有视觉角色及具体处理方式');
          if (mapping?.preserveRelation !== undefined && typeof mapping.preserveRelation !== 'string') fail('参考映射保留关系必须是文字');
        }
        if (plan.graphicLed === true && (!Array.isArray(plan.graphicReasons) || !plan.graphicReasons.some(reason=>typeof reason==='string' && reason.trim() && !/^(?:更?方便制作|制作方便)[。.!！]?$/u.test(reason.trim())))) fail('图形主导场面需要说明承担的表达内容和原因');
        let preview;
        if (plan.status === 'previewed') {
          const requested=plan.preview, work=project?.snapshot?.motionWorks?.find(item=>item.id===requested?.workId);
          const path=work && delivered(`brief/previews/${work.id}.json`), file=path && entries.get(path);
          if (!work || !rangeCovered(work.readyRanges,requested?.startFrame,requested?.endFrame)) fail('已预排场面需要当前项目中已发布范围内的 MotionWork 引用');
          if (!work?.definitionHash || !file?.localReadable || file.sha256 !== work.definitionHash || file.sourceSha256 !== work.definitionHash) fail('预排作品源码定义缺失或哈希与项目不一致');
          // 只检查预排范围实际用到的绑定，避免把其他场面的资源变成当前范围的前置条件。
          const bound=[...(work?.imageSources ?? []),...(work?.videoSources ?? []).filter(source=>source.startFrame<requested?.endFrame && source.endFrame>requested?.startFrame)];
          for (const source of bound) {
            const roleAssets=visualRoles.flatMap(role=>role.assets).filter(asset=>asset.assetId===source.assetId && asset.sourceHash===source.hash);
            if (!roleAssets.length) fail(`预排素材 ${source.assetId} 未按同一身份纳入场面交付`);
            else if (Number.isFinite(source.startFrame) && Number.isFinite(source.endFrame) && Number.isFinite(work.fps) && work.fps>0) {
              // 将预排中实际重叠的作品根帧换回源毫秒，核对其确实位于交付范围内。
              const start=source.sourceStartMs+(Math.max(requested.startFrame,source.startFrame)-source.startFrame)*1000/work.fps;
              const end=source.sourceStartMs+(Math.min(requested.endFrame,source.endFrame)-source.startFrame)*1000/work.fps;
              if (!Number.isFinite(start) || !Number.isFinite(end) || !sourceRangeCovered(roleAssets.flatMap(asset=>asset.sourceRanges),start,end)) fail(`预排素材 ${source.assetId} 的实际源范围未被场面交付覆盖`);
            }
          }
          if (work && file?.localReadable && file.sha256 === work.definitionHash && rangeCovered(work.readyRanges,requested?.startFrame,requested?.endFrame)) {
            preview={workId:work.id,startFrame:requested.startFrame,endFrame:requested.endFrame,definitionHash:work.definitionHash,definitionPath:path,...(work.author ? {author:work.author} : {})};
          }
        } else if (['draft','pending'].includes(plan.status)) fail('视觉预排尚未完成，请交回原视觉作者继续');
        visualPlan={status:plan.status,primaryRoles:plan.primaryRoles,...(plan.referenceMappings ? {referenceMappings:plan.referenceMappings} : {}),
          ...(plan.graphicLed !== undefined ? {graphicLed:plan.graphicLed} : {}),...(plan.graphicReasons ? {graphicReasons:plan.graphicReasons} : {}),...(preview ? {preview} : {})};
      }
    }
    return {sceneId:scene.sceneId,status:errors.length ? 'incomplete' : 'ready',...(references.length ? {references} : {}),
      ...(scene.resourceIds?.length ? {resourceIds:scene.resourceIds} : {}),visualRoles,process:scene.process,preserve:scene.preserve,adapt:scene.adapt,...(visualPlan ? {visualPlan} : {}),...(errors.length ? {diagnostics:errors} : {})};
  });
}

/** 只准备本地交付包；OD 可读性和运行时读取必须由实际工具单独核验。 */
export async function prepareReferencePackage(input, outputRoot, libraryRoot = resolve('references/motion-cases/skillry')) {
  const output = resolve(outputRoot);
  await clearPrepared(output);
  if (!input.projectId || !Number.isSafeInteger(input.revision) || input.revision < 1 || !input.brief || !input.timingPlan) throw new Error('需要项目、Revision、权威指令和时间编排');
  if (input.deliveryPrefix && !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/u.test(input.deliveryPrefix)) throw new Error('交付目录名称无效');
  const delivered = path => input.deliveryPrefix ? `${input.deliveryPrefix}/${path}` : path;
  if (input.scenes !== undefined && (!Array.isArray(input.scenes) || !input.scenes.length)) throw new Error('scenes 需要至少一个场面');
  if (input.selectedSceneIds && (!Array.isArray(input.selectedSceneIds) || !input.scenes || input.selectedSceneIds.some(id=>!input.scenes.some(scene=>scene.sceneId===id)))) throw new Error('选中场面不存在');
  let project, projectSnapshot;
  const needsProject = input.scenes && ((input.assets ?? []).length || input.scenes.some(scene => scene.status === 'ready' && (scene.visualRoles?.some(role => role.assetIds?.length) || scene.visualPlan?.status === 'previewed')));
  if (needsProject && !input.projectSnapshot) throw new Error('场面使用素材或同源预排时需要当前 read_project 结果文件');
  if (input.projectSnapshot) {
    const snapshotBytes=await readFile(input.projectSnapshot);
    project=JSON.parse(snapshotBytes.toString('utf8').replace(/^\uFEFF/,''));
    if (project.snapshot?.project?.id !== input.projectId || project.revision?.number !== input.revision || !Array.isArray(project.snapshot?.assets)) throw new Error('项目快照的项目身份或 Revision 不一致');
    projectSnapshot={path:resolve(input.projectSnapshot),sha256:createHash('sha256').update(snapshotBytes).digest('hex')};
  }
  const entries = new Map(), diagnostics = [], creativeRecords = new Map(), motionRecords = new Map();
  const sceneList=input.scenes ?? [];
  const selectedScenes=sceneList.filter(scene=>scene.status==='ready' && (!input.selectedSceneIds || input.selectedSceneIds.includes(scene.sceneId)));
  const sceneUses=(scenes,kind)=>new Set(scenes.flatMap(scene=>kind==='source' ? (scene.visualRoles ?? []).flatMap(role=>role.assetIds ?? [])
    : kind==='reference' ? scene.resourceIds ?? []
    : sceneReferences(scene).filter(ref=>(ref.kind ?? 'creative')===kind).map(ref=>ref.id ?? ref.creativeCaseId)).filter(Boolean));
  const mappedUses=new Map(['source','creative','motion','reference'].map(kind=>[kind,sceneUses(sceneList,kind)]));
  const selectedUses=new Map(['source','creative','motion','reference'].map(kind=>[kind,sceneUses(selectedScenes,kind)]));
  const isSelected=(kind,id)=>!mappedUses.get(kind).has(id) || selectedUses.get(kind).has(id);
  const skipUnselected=(kind,id,path)=>{
    if (isSelected(kind,id)) return false;
    diagnostics.push({id,...(path ? {path} : {}),reason:'仅供本次未选中或未就绪的场面，尚未核验',requiredForRun:false});
    return true;
  };
  const add = (sourcePath, deliveredPath, use) => {
    const existing = entries.get(deliveredPath);
    if (existing && resolve(existing.sourcePath) !== resolve(sourcePath)) throw new Error(`交付路径冲突：${deliveredPath}`);
    if (existing) existing.uses.push(use);
    else entries.set(deliveredPath, {sourcePath, deliveredPath, uses:[use]});
  };
  const library = (path, use) => {
    try { add(localFile(libraryRoot,path), delivered(`references/skillry/${path}`), use); }
    catch (error) { diagnostics.push({id:use.id,path,reason:error.message}); }
  };
  const referenceUse = (selected, kind) => {
    if (!selected.id || !selected.purpose || !['study','adopted'].includes(selected.usage)) {
      throw new Error(`${kind}参考需要 ID、用途及 study 或 adopted 的使用状态`);
    }
    return {kind,id:selected.id,usage:selected.usage,purpose:selected.purpose};
  };
  add(input.brief, delivered('brief/visual-director-brief.md'), {kind:'brief',id:'brief',purpose:'创意编排指令'});
  add(input.timingPlan, delivered('brief/timing-plan.md'), {kind:'brief',id:'timing',purpose:'完整时间编排'});
  for (const selected of input.creative ?? []) {
    if (skipUnselected('creative',selected.id)) continue;
    const reference = referenceUse(selected,'creative');
    const {result} = readCreativeCase(libraryRoot, {id:selected.id,source_sha256:selected.sourceSha256,include_storyboard:false});
    const card = result.card, use = {...reference,id:card.id,librarySourceSha256:result.source_sha256,sourceStartMs:card.start_ms,sourceEndMs:card.end_ms,timeCoordinates:'original'};
    if (creativeRecords.has(card.id)) throw new Error(`创意参考 ID 重复：${card.id}`);
    creativeRecords.set(card.id,{usage:selected.usage,sourceSha256:result.source_sha256,libraryVideoPath:result.resources.video.path,videoPath:delivered(`references/skillry/${result.resources.video.path}`),sourcePath:resolve(libraryRoot,result.resources.video.path)});
    library(card.card,{...use,fileKind:'card'});
    for (const [kind,resource] of Object.entries(result.resources)) library(resource.path,{...use,fileKind:kind,...(kind==='clip' ? {clipSourceOffsetMs:result.clip_source_offset_ms} : {})});
    for (const link of result.links) if (link?.path && /\.(?:jpg|jpeg|png|webp|mp4)$/i.test(link.path)) library(link.path,{...use,fileKind:'linkedMedia'});
  }
  for (const selected of input.motion ?? []) {
    if (skipUnselected('motion',selected.id)) continue;
    const reference = referenceUse(selected,'motion');
    const {result} = readLibraryMechanism(libraryRoot, {id:selected.id,source_sha256:selected.sourceSha256,include_storyboard:false});
    const card=result.card, use={...reference,id:card.id,librarySourceSha256:result.source_sha256,sourceStartMs:card.clip?.start_ms,sourceEndMs:card.clip?.end_ms,timeCoordinates:'original'};
    if (motionRecords.has(card.id)) throw new Error(`动效机制 ID 重复：${card.id}`);
    motionRecords.set(card.id,{usage:selected.usage,sourceSha256:result.source_sha256,libraryVideoPath:result.resources.video.path,videoPath:delivered(`references/skillry/${result.resources.video.path}`),sourcePath:resolve(libraryRoot,result.resources.video.path)});
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
    if (skipUnselected('reference',selected.id)) continue;
    const use = referenceUse(selected,'reference');
    if (!Array.isArray(selected.files) || !selected.files.length) throw new Error(`参考 ${selected.id} 缺少文件`);
    for (const file of selected.files) {
      const destination = typeof file.deliveredPath === 'string' ? file.deliveredPath.replaceAll('\\','/') : '';
      if (!file.path || !destination || isAbsolute(file.deliveredPath) || !destination.startsWith('references/') || posix.normalize(destination) !== destination) throw new Error(`参考 ${selected.id} 需要 references 下的相对交付路径`);
      add(file.path,delivered(destination),use);
    }
  }
  for (const asset of input.assets ?? []) {
    if (skipUnselected('source',asset.id,asset.path)) continue;
    if (!asset.id || !asset.path || !asset.purpose) throw new Error('素材需要 ID、路径和用途');
    add(asset.path, delivered(`references/source-materials/${asset.id}/${basename(asset.path)}`), {kind:'source',id:asset.id,purpose:asset.purpose,sourceStartMs:asset.sourceStartMs,sourceEndMs:asset.sourceEndMs});
  }
  for (const scene of selectedScenes) {
    const work=project?.snapshot?.motionWorks?.find(item=>item.id===scene.visualPlan?.preview?.workId);
    if (scene.visualPlan?.status === 'previewed' && work?.definitionPath && project.snapshot.project.rootPath) {
      add(join(project.snapshot.project.rootPath,work.definitionPath),delivered(`brief/previews/${work.id}.json`),
        {kind:'preview',id:work.id,purpose:'同源预排的固定源码、绑定和作品时钟'});
    }
  }
  for (const entry of entries.values()) {
    let target, copied=false;
    try {
      target=resolve(output,entry.deliveredPath);
      if (!target.startsWith(output + (process.platform === 'win32' ? '\\' : '/'))) throw new Error('交付路径越界');
      await mkdir(dirname(target), {recursive:true});
      let body;
      if (entry.deliveredPath.startsWith(delivered('references/skillry/')) && entry.deliveredPath.endsWith('.md')) {
        const libraryPath=entry.deliveredPath.slice(delivered('references/skillry/').length);
        body=await readFile(entry.sourcePath,'utf8');
        // 未交付的正文上下文链接明确标记，不呈现为可打开的本地文件。
        body=body.replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g,(all,bang,label,href)=>{
          const link=resolveLibraryLink(href,libraryPath);
          if (link?.kind==='local' && !entries.has(delivered(`references/skillry/${link.path}`))) return `${label}（未交付：${href}）`;
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
    scenes=prepareScenes(input,entries,creativeRecords,motionRecords,project,delivered);
    scenesPath=delivered('brief/scenes.json');
    const path=join(output,scenesPath);
    await mkdir(dirname(path),{recursive:true});
    await writeFile(path,JSON.stringify({projectId:input.projectId,revision:input.revision,scenes},null,2)+'\n','utf8');
    const hash=await hashFile(path), file=await stat(path);
    // 场面文件由当前准备过程生成；核验阶段仍检查它在交付后没有改变。
    entries.set(scenesPath,{sourcePath:path,deliveredPath:scenesPath,uses:[{kind:'brief',id:'scenes',purpose:'场面、参考和真实素材映射'}],sourceSha256:hash,sha256:hash,mimeType:'application/json',sizeBytes:file.size,localReadable:true,readableByOpenDesign:false,readCheck:'未核验 OD 读取'});
    const mappedAssets=new Set(input.scenes.flatMap(scene=>(scene.visualRoles ?? []).flatMap(role=>role.assetIds ?? [])));
    const selected=scenes.filter(scene=>scene.status==='ready' && (!input.selectedSceneIds || input.selectedSceneIds.includes(scene.sceneId)));
    const readyAssets=new Set(selected.flatMap(scene=>scene.visualRoles.flatMap(role=>role.assets.map(asset=>asset.assetId))));
    const mappedReferences=new Map(['creative','motion','reference'].map(kind=>[kind,mappedUses.get(kind)]));
    const readyReferences=new Map(['creative','motion','reference'].map(kind=>[kind,kind==='reference'
      ? new Set(selected.flatMap(scene=>scene.resourceIds ?? []))
      : new Set(selected.flatMap(scene=>(scene.references ?? []).filter(ref=>ref.kind===kind).map(ref=>ref.id)))]));
    // 只被未就绪场面引用的资料保留诊断，但不阻塞其他独立场面。
    const readyPreviews=new Set(selected.map(scene=>scene.visualPlan?.preview?.workId).filter(Boolean));
    const required=use=>!(use.kind==='source' && mappedAssets.has(use.id) && !readyAssets.has(use.id)) && !(use.kind==='preview' && !readyPreviews.has(use.id)) && !(mappedReferences.get(use.kind)?.has(use.id) && !readyReferences.get(use.kind)?.has(use.id));
    for (const entry of entries.values()) if (entry.uses.every(use=>!required(use))) entry.requiredForRun=false;
    for (const diagnostic of diagnostics) {
      const entry=entries.get(diagnostic.path);
      if (entry?.requiredForRun===false || (diagnostic.id && [...mappedReferences].some(([kind,ids])=>ids.has(diagnostic.id) && !readyReferences.get(kind).has(diagnostic.id)))) diagnostic.requiredForRun=false;
    }
  }
  const manifest={projectId:input.projectId,revision:input.revision,libraryRoot:resolve(libraryRoot),briefPath:delivered('brief/visual-director-brief.md'),timingPlanPath:delivered('brief/timing-plan.md'),...(input.freezeInputs ? {packageRoot:output} : {}),...(projectSnapshot ? {projectSnapshot} : {}),...(scenes ? {scenesPath,scenes} : {}),...(input.selectedSceneIds ? {selectedSceneIds:input.selectedSceneIds} : {}),files:[...entries.values()],diagnostics};
  await mkdir(output,{recursive:true});
  await writeFile(join(output,'delivery-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  return manifest;
}

/** 使用 OD 文件清单返回的实际本机路径核验字节，不把文件列表当成观看证据。 */
export async function verifyReferenceDelivery(manifest, listing, revision, odProjectId, currentProject) {
  if (!currentProject && manifest.revision !== revision) throw new Error('项目 Revision 已变化，请重新核对输入');
  if (currentProject) {
    if (currentProject.snapshot?.project?.id !== manifest.projectId || currentProject.revision?.number !== revision) throw new Error('当前项目或 Revision 不一致');
    const selected=manifest.scenes?.filter(scene=>scene.status==='ready' && (!manifest.selectedSceneIds || manifest.selectedSceneIds.includes(scene.sceneId))) ?? [];
    for (const source of selected.flatMap(scene=>scene.visualRoles.flatMap(role=>role.assets))) {
      const asset=currentProject.snapshot.assets.find(item=>item.id===source.assetId);
      if (!asset || asset.status!=='ready' || asset.sourceHash!==source.sourceHash) throw new Error(`素材 ${source.assetId} 已变化，请重新编排`);
      if (!asset.managedPath || await hashFile(join(currentProject.snapshot.project.rootPath,asset.managedPath))!==source.sourceHash) throw new Error(`素材 ${source.assetId} 的实际文件已变化`);
    }
    for (const preview of selected.map(scene=>scene.visualPlan?.preview).filter(Boolean)) {
      const work=currentProject.snapshot.motionWorks?.find(item=>item.id===preview.workId);
      if (!work || work.definitionHash!==preview.definitionHash || ['project','run_id','frozen_version'].some(key=>work.author?.[key]!==preview.author?.[key])
        || !rangeCovered(work.readyRanges,preview.startFrame,preview.endFrame)) throw new Error(`预排作品 ${preview.workId} 已变化，请重新准备`);
      if (!work.definitionPath || await hashFile(join(currentProject.snapshot.project.rootPath,work.definitionPath)).catch(()=>undefined)!==preview.definitionHash) throw new Error(`预排作品 ${preview.workId} 的固定源码已变化，请重新准备`);
    }
  }
  if (!odProjectId) throw new Error('需要 OD 项目身份');
  if (manifest.projectSnapshot && await hashFile(manifest.projectSnapshot.path) !== manifest.projectSnapshot.sha256) throw new Error('项目快照已变化，请重新准备');
  const uses=manifest.files.filter(file=>file.requiredForRun!==false).flatMap(file=>file.uses);
  for (const [kind,load] of manifest.packageRoot ? [] : [['creative',loadCreativeIndex],['motion',loadLibraryIndex]]) {
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
      if (manifest.packageRoot) {
        if (await hashFile(join(manifest.packageRoot,entry.deliveredPath)) !== entry.sha256) throw new Error('固定交付文件已变化');
      } else if (await hashFile(entry.sourcePath) !== entry.sourceSha256) throw new Error('来源文件已变化');
      if (await hashFile(actual.localPath) !== entry.sha256) throw new Error('OD 文件哈希不一致');
      await probe(actual.localPath);
      Object.assign(result,{readableByOpenDesign:true,readCheck:'OD 项目文件字节一致且本机可读取；不代表 Run 已读取'});
    } catch (error) { result.readCheck=error.message; }
    files.push(result);
  }
  const failed=files.filter(file=>file.requiredForRun!==false && !file.readableByOpenDesign);
  const verified={...manifest,odProjectId,files,verificationErrors:failed.map(file=>({path:file.deliveredPath,reason:file.readCheck}))};
  if (manifest.diagnostics.some(item=>item.requiredForRun!==false) || failed.length) return {manifest:verified};
  const readyScenes=manifest.scenes?.filter(scene=>scene.status==='ready' && (!manifest.selectedSceneIds || manifest.selectedSceneIds.includes(scene.sceneId)));
  if (manifest.selectedSceneIds?.some(id=>!readyScenes?.some(scene=>scene.sceneId===id))) {
    verified.verificationErrors.push({path:manifest.scenesPath,reason:'选中场面尚有未完成资料'});
    return {manifest:verified};
  }
  if (readyScenes && !readyScenes.length) {
    verified.verificationErrors.push({path:manifest.scenesPath,reason:'没有具备完整输入的就绪场面'});
    return {manifest:verified};
  }
  for (const scene of readyScenes ?? []) {
    const author=scene.visualPlan?.preview?.author;
    if (author?.project && author.project!==odProjectId) {
      verified.verificationErrors.push({path:manifest.scenesPath,reason:`场面 ${scene.sceneId} 的预排属于其他 OD 项目，请续接原作品`});
      return {manifest:verified};
    }
  }
  const lines=files.filter(file=>file.requiredForRun!==false).map(file=>`- ${file.deliveredPath}：${file.uses.map(use=>`${use.kind}/${use.id}${use.usage ? `（${use.usage === 'study' ? '学习' : '已采用'}）` : ''}，${use.purpose}${use.fileKind ? `，文件类型 ${use.fileKind}` : ''}${use.sourceStartMs !== undefined && use.sourceEndMs !== undefined ? `，资料原片范围 ${use.sourceStartMs}—${use.sourceEndMs}ms` : ''}${use.clipSourceOffsetMs !== undefined ? `，切片零点对应原片 ${use.clipSourceOffsetMs}ms` : ''}`).join('；')}`);
  const sceneLines=readyScenes ? [`本次只制作 ${manifest.scenesPath} 中状态为 ready 的场面；pending 或 incomplete 场面继续探索，不得冒充完成。`,...readyScenes.map(scene=>`- 资料就绪场面 ${scene.sceneId}：${JSON.stringify(scene)}${scene.visualPlan?.status==='previewed' ? '；预排引用仅供追溯，不代表视觉质量已通过。' : '；未提供同源预排状态，资料就绪不代表主要视觉设计已经预排成立。'}`)] : [];
  const prompt=[`先完整读取本项目中的创意编排指令 ${manifest.briefPath} 和时间资料 ${manifest.timingPlanPath}。${manifest.scenesPath ? `再读取 ${manifest.scenesPath} 中本次就绪场面，逐项核对参考原片、机制原片、真实素材与视觉角色映射。` : ''}以下文件按用途制作：`,...lines,...sceneLines,'参考范围使用原片时间，素材范围使用交付文件的本地时间；已知原片偏移时另列原片时间。查看采用的创意和机制视频，连续观察选定范围及必要前后画面，并记录实际观察方式。','完整视觉稿是权威依据。读取视觉作者当前作品及同源预排，识别已确定的主要主体、素材角色、构图、发展与参考关系，以及预排尚未完成的范围。预排定义文件的 work.source 是固定 HTML 源码，相关素材及字体绑定和根时钟保留在同一文件；继续时使用这些真实输入。未提供预排时向原视觉作者反馈，不得因资料齐全就宣称主要视觉设计已成立。','用户要求、事实条件及当前采用的编排以完整简报为准。制作作者在不改变主要视觉关系的前提下深化局部构图、中文排版、素材取景、镜头路径、曲线和内部时序；不得静默替换主要素材、参考核心或整场发展。','沿同一作品和现有 Run 继续深化；原 Run 已结束时按现有续接机制保持作品及作者身份。技术或素材限制需要改变主要决定时，反馈具体对象、范围、原方案、限制和可行替代，由原视觉作者决定；涉及事实、主线或跨段关系由导演协调。','阶段作品沿现有冻结和采用链路接回 VideoFlowCut。主任务将固定版本的工作台入口、对象和范围交回原视觉负责人，原导演、创意及视觉负责人按职责在工作台观察实际合成。已有控件支持的调整在工作台保存，作品内部画面由原制作作者沿同一作品修订。新版接回后，在工作台复查修改范围与前后连接，并保存实际观察和问题处理结果。资料无法读取或材料无法支持采用过程时，反馈具体文件、动作、范围及调整建议。'].join('\n');
  return {manifest:verified,prompt};
}

