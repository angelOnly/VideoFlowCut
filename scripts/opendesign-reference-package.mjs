import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {copyFile, mkdir, readFile, stat, unlink, writeFile} from 'node:fs/promises';
import {basename, dirname, extname, join, resolve} from 'node:path';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {loadCreativeIndex,readCreativeCase} from '../references/motion-cases/skillry/tools/creative-library.mjs';
import {loadLibraryIndex,readLibraryMechanism} from '../references/motion-cases/skillry/tools/library-store.mjs';
import {localFile} from '../references/motion-cases/skillry/tools/mechanisms.mjs';
import {resolveLibraryLink} from '../references/motion-cases/skillry/document-format.mjs';

const run = promisify(execFile);
const readJson = async path => JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));
const mime = {'.md':'text/markdown','.json':'application/json','.txt':'text/plain','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.mov':'video/quicktime','.wav':'audio/wav','.mp3':'audio/mpeg'};
const hashFile = path => new Promise((ok, fail) => {
  const hash = createHash('sha256');
  createReadStream(path).on('data', chunk => hash.update(chunk)).on('error', fail).on('end', () => ok(hash.digest('hex')));
});

async function probe(path) {
  const ext = extname(path).toLowerCase();
  if (['.jpg','.jpeg','.png','.webp'].includes(ext)) {
    await run('ffmpeg', ['-v','error','-xerror','-i',path,'-frames:v','1','-f','null','-'], {maxBuffer:2_000_000});
    return {localDecode:'verified'};
  }
  if (!['.mp4', '.mov'].includes(ext)) return {};
  const {stdout} = await run('ffprobe', ['-v','error','-show_entries','format=duration:stream=codec_type,r_frame_rate','-of','json',path], {maxBuffer: 2_000_000});
  const data = JSON.parse(stdout), video = data.streams?.find(stream => stream.codec_type === 'video');
  if (!video) throw new Error('没有视频流');
  const [n,d] = (video.r_frame_rate ?? '').split('/').map(Number);
  const durationMs = Math.round(Number(data.format?.duration) * 1000);
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error('视频时长不可用');
  // 实际解码整段，ffprobe 成功本身不能证明视频完整可读。
  await run('ffmpeg', ['-v','error','-xerror','-i',path,'-map','0:v:0','-f','null','-'], {maxBuffer: 2_000_000});
  return {durationMs, ...(n > 0 && d > 0 ? {fps:n/d} : {}), localDecode:'verified'};
}

/** 只准备本地交付包；OD 可读性和运行时读取必须由实际工具单独核验。 */
export async function prepareReferencePackage(input, outputRoot, libraryRoot = resolve('references/motion-cases/skillry')) {
  if (!input.projectId || !Number.isSafeInteger(input.revision) || input.revision < 1 || !input.brief || !input.timingPlan) throw new Error('需要项目、Revision、权威指令和时间编排');
  const output = resolve(outputRoot), entries = new Map(), diagnostics = [];
  for (const name of ['delivery-manifest.json','verified-manifest.json','start-run-prompt.md']) {
    await unlink(join(output,name)).catch(error=>{if(error.code!=='ENOENT')throw error;});
  }
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
  add(input.brief, 'brief/visual-director-brief.md', {kind:'brief',id:'brief',purpose:'权威视觉导演指令'});
  add(input.timingPlan, 'brief/timing-plan.md', {kind:'brief',id:'timing',purpose:'完整时间编排'});
  for (const selected of input.creative ?? []) {
    if (!selected.purpose) throw new Error(`创意参考 ${selected.id} 缺少用途`);
    const {result} = readCreativeCase(libraryRoot, {id:selected.id,source_sha256:selected.sourceSha256,include_storyboard:false});
    const card = result.card, use = {kind:'creative',id:card.id,librarySourceSha256:result.source_sha256,purpose:selected.purpose,sourceStartMs:card.start_ms,sourceEndMs:card.end_ms};
    library(card.card,use);
    for (const resource of Object.values(result.resources)) library(resource.path,use);
    for (const link of result.links) if (link?.path && /\.(?:jpg|jpeg|png|webp|mp4)$/i.test(link.path)) library(link.path,use);
  }
  for (const selected of input.motion ?? []) {
    if (!selected.purpose) throw new Error(`动效参考 ${selected.id} 缺少用途`);
    const {result} = readLibraryMechanism(libraryRoot, {id:selected.id,source_sha256:selected.sourceSha256,include_storyboard:false});
    const card=result.card, use={kind:'motion',id:card.id,librarySourceSha256:result.source_sha256,purpose:selected.purpose,sourceStartMs:card.clip?.start_ms,sourceEndMs:card.clip?.end_ms};
    library(card.document,use); library(card.storyboard,use);
    if (card.clip?.path) library(card.clip.path,use);
    else diagnostics.push({id:card.id,reason:'机制没有可用切片路径'});
    for (const match of result.body.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const link=resolveLibraryLink(match[1],card.document);
      if (link?.kind==='local' && /\.(?:jpg|jpeg|png|webp|mp4)$/i.test(link.path)) library(link.path,use);
    }
  }
  for (const asset of input.assets ?? []) {
    if (!asset.id || !asset.path || !asset.purpose) throw new Error('素材需要 ID、路径和用途');
    add(asset.path, `references/source-materials/${asset.id}/${basename(asset.path)}`, {kind:'source',id:asset.id,purpose:asset.purpose,sourceStartMs:asset.sourceStartMs,sourceEndMs:asset.sourceEndMs});
  }
  for (const entry of entries.values()) {
    try {
      const target=resolve(output,entry.deliveredPath);
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
      const file=await stat(target);
      const media=await probe(target);
      for (const use of entry.uses.filter(item=>item.kind==='source')) {
        const start=use.sourceStartMs ?? 0, end=use.sourceEndMs;
        if (!Number.isFinite(start) || start<0 || (media.durationMs!==undefined && start>=media.durationMs) || (end!==undefined && (!Number.isFinite(end) || end<=start || (media.durationMs!==undefined && end>media.durationMs)))) throw new Error('素材源时间范围无效或超出视频');
      }
      Object.assign(entry,{sourceSha256:await hashFile(entry.sourcePath),sha256:await hashFile(target),mimeType:mime[extname(target).toLowerCase()] ?? 'application/octet-stream',sizeBytes:file.size,...media,localReadable:true,readableByOpenDesign:false,readCheck:'未核验 OD 读取'});
    } catch (error) {
      Object.assign(entry,{localReadable:false,readableByOpenDesign:false,readCheck:'未核验 OD 读取',error:error.message});
      diagnostics.push({path:entry.deliveredPath,reason:error.message});
    }
  }
  const manifest={projectId:input.projectId,revision:input.revision,libraryRoot:resolve(libraryRoot),briefPath:'brief/visual-director-brief.md',timingPlanPath:'brief/timing-plan.md',files:[...entries.values()],diagnostics};
  await mkdir(output,{recursive:true});
  await writeFile(join(output,'delivery-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  return manifest;
}

/** 使用 OD 文件清单返回的实际本机路径核验字节，不把文件列表当成观看证据。 */
export async function verifyReferenceDelivery(manifest, listing, revision, odProjectId, boundaries) {
  if (manifest.revision !== revision) throw new Error('项目 Revision 已变化，请重新核对输入');
  if (!odProjectId || !boundaries?.mustKeep || !boundaries?.freedom) throw new Error('需要 OD 项目身份及导演边界');
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
  const failed=files.filter(file=>!file.readableByOpenDesign);
  const verified={...manifest,odProjectId,files,verificationErrors:failed.map(file=>({path:file.deliveredPath,reason:file.readCheck}))};
  if (manifest.diagnostics.length || failed.length) return {manifest:verified};
  const lines=files.map(file=>`- ${file.deliveredPath}：${file.uses.map(use=>`${use.kind}/${use.id}，${use.purpose}`).join('；')}`);
  const prompt=[`先完整读取本项目中的权威导演指令 ${manifest.briefPath} 和时间编排 ${manifest.timingPlanPath}，再读取以下文件并按用途制作：`,...lines,'对参考视频实际连续观看完整范围，记录实际观察方式；只探测、解码或查看静帧时必须如实标明，不能声称已连续观看。',`必须保持：${boundaries.mustKeep}`,`可自由深化：${boundaries.freedom}`,'无法读取资料或无法实现核心事件时，返回具体缺口；拟改变核心事件、素材角色或信息顺序时，反馈原因和替代方案，不得静默删减。'].join('\n');
  return {manifest:verified,prompt};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [mode,...args] = process.argv.slice(2);
    if (mode === 'prepare' && args.length === 2) {
      const [inputFile,output]=args;
      const result=await prepareReferencePackage(await readJson(inputFile),output);
      console.log(JSON.stringify({output:resolve(output),files:result.files.length,diagnostics:result.diagnostics},null,2));
      if (result.diagnostics.length) process.exitCode=1;
    } else if (mode === 'verify' && args.length === 3) {
      const [manifestFile,listingFile,checkFile]=args;
      // 核验失败或输入已变化时，不能留下上一次的可发送请求。
      for (const name of ['start-run-prompt.md','verified-manifest.json']) {
        await unlink(join(dirname(manifestFile),name)).catch(error=>{if(error.code!=='ENOENT')throw error;});
      }
      const manifest=await readJson(manifestFile);
      const listing=await readJson(listingFile);
      const check=await readJson(checkFile);
      const result=await verifyReferenceDelivery(manifest,listing,check.revision,check.odProjectId,check.boundaries);
      await writeFile(join(dirname(manifestFile),'verified-manifest.json'),JSON.stringify(result.manifest,null,2)+'\n','utf8');
      if (result.prompt) await writeFile(join(dirname(manifestFile),'start-run-prompt.md'),result.prompt+'\n','utf8');
      console.log(JSON.stringify({verificationErrors:result.manifest.verificationErrors,diagnostics:result.manifest.diagnostics},null,2));
      if (!result.prompt) process.exitCode=1;
    } else throw new Error('用法：node scripts/opendesign-reference-package.mjs prepare 输入.json 输出目录；或 verify 交付清单.json OD文件清单.json 核验输入.json');
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
