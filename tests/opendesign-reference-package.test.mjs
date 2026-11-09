import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, copyFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {prepareReferencePackage,verifyReferenceDelivery} from '../scripts/opendesign-reference-package.mjs';
import {loadLibraryIndex} from '../references/motion-cases/skillry/tools/library-store.mjs';

test('沿当前索引收集参考，复用原片、保留补图并如实报告缺失', async () => {
  const root=await mkdtemp(join(tmpdir(),'vfc-reference-'));
  try {
    const library=join(root,'library'), dir=join(library,'cases/example');
    await mkdir(join(dir,'creative'),{recursive:true}); await mkdir(join(dir,'storyboards'),{recursive:true});
    execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=black:s=16x16:r=10:d=1','-c:v','mpeg4',join(dir,'video.mp4')]);
    execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=white:s=16x16','-frames:v','1',join(dir,'storyboards','main.png')]);
    await writeFile(join(dir,'storyboards','extra.png'),await readFile(join(dir,'storyboards','main.png')));
    const card={id:'001-c01',case_number:1,title:'当前卡',summary:'实际过程',use_when:'材料匹配',card:'cases/example/creative/current.md',video:'cases/example/video.mp4',clip:'cases/example/video.mp4',storyboard:'cases/example/storyboards/main.png',start_ms:0,end_ms:1000,frame_times_ms:[0]};
    const meta={...card,video:'../video.mp4',clip:'../video.mp4',storyboard:'../storyboards/main.png'}; delete meta.card;
    await writeFile(join(dir,'creative','current.md'),'---\n'+Object.entries(meta).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n')+'\n---\n\n![补图](../storyboards/extra.png)\n[未交付上下文](../overview.md)\n');
    await writeFile(join(dir,'creative','old-final.md'),'旧稿');
    await writeFile(join(library,'case-catalogue.json'),JSON.stringify({cases:[{case_number:1,duration:1}]}));
    await writeFile(join(library,'creative-index.json'),JSON.stringify({schema_version:1,catalogue_case_count:1,processed_cases:[1],count:1,cards:[card]}));
    const brief=join(root,'brief.md'), timing=join(root,'timing.md'), output=join(root,'out');
    await writeFile(brief,'导演指令'); await writeFile(timing,'时间编排');
    const input={projectId:'isolation',revision:1,brief,timingPlan:timing,creative:[{id:'001-c01',usage:'adopted',purpose:'观察材料关系'}],references:[{id:'art',usage:'study',purpose:'学习排印',files:[{path:join(dir,'storyboards','main.png'),deliveredPath:'references/art/layout.png'}]}],assets:[{id:'missing',path:join(root,'missing.png'),purpose:'本片素材'}]};
    const manifest=await prepareReferencePackage(input,output,library);
    assert.equal(manifest.files.filter(file=>file.deliveredPath.endsWith('video.mp4')).length,1);
    assert.equal(manifest.files.find(file=>file.deliveredPath.endsWith('video.mp4')).uses.length,2);
    assert.ok(manifest.files.some(file=>file.deliveredPath.endsWith('extra.png') && file.localDecode==='verified'));
    assert.equal(manifest.files.find(file=>file.deliveredPath==='references/art/layout.png').uses[0].usage,'study');
    assert.equal(manifest.files.find(file=>file.deliveredPath.endsWith('current.md')).uses[0].usage,'adopted');
    assert.ok(!manifest.files.some(file=>file.deliveredPath.endsWith('old-final.md')));
    assert.ok(manifest.files.every(file=>file.readableByOpenDesign===false));
    assert.ok(manifest.diagnostics.some(item=>item.path.includes('missing')));
    const delivered=await readFile(join(output,'references/skillry',card.card),'utf8');
    assert.match(delivered,/未交付：\.\.\/overview\.md/);
    assert.match(delivered,/\[补图\]\(\.\.\/storyboards\/extra.png\)/);
    assert.ok(manifest.files.find(file=>file.deliveredPath.endsWith('current.md')).sha256);
    const clean=await prepareReferencePackage({...input,assets:[]},join(root,'clean'),library);
    const listing={files:clean.files.map(file=>({path:file.deliveredPath,localPath:join(root,'clean',file.deliveredPath)}))};
    await assert.rejects(verifyReferenceDelivery(clean,listing,2,'od-isolation'),/Revision/);
    const verified=await verifyReferenceDelivery(clean,listing,1,'od-isolation');
    assert.ok(verified.manifest.files.every(file=>file.readableByOpenDesign));
    assert.match(verified.prompt,/观察材料关系/);
    assert.match(verified.prompt,/reference\/art（学习），学习排印/);
    assert.match(verified.prompt,/creative\/001-c01（已采用）/);
    assert.match(verified.prompt,/制作作者完成整场构图、中文排版/);
    assert.match(verified.prompt,/用户要求、事实条件及当前采用的编排以完整简报为准/);
    assert.doesNotMatch(verified.prompt,/必须保持的内容、参考关键过程/);
    await assert.rejects(prepareReferencePackage({...input,creative:[{id:'001-c01',purpose:'缺少用途类型'}]},join(root,'bad-usage'),library),/study 或 adopted/);
    await assert.rejects(prepareReferencePackage({...input,references:[{id:'art',usage:'study',purpose:'学习',files:[{path:brief,deliveredPath:'references/../brief/override.md'}]}]},join(root,'bad-path'),library),/相对交付路径/);
    const cleanRoot=join(root,'clean');
    await writeFile(join(root,'listing.json'),'\uFEFF'+JSON.stringify(listing));
    await writeFile(join(root,'check.json'),'\uFEFF'+JSON.stringify({revision:2,odProjectId:'od-isolation'}));
    await writeFile(join(cleanRoot,'start-run-prompt.md'),'旧请求');
    assert.throws(()=>execFileSync(process.execPath,['scripts/opendesign-reference-package.mjs','verify',join(cleanRoot,'delivery-manifest.json'),join(root,'listing.json'),join(root,'check.json')],{stdio:'ignore'}));
    await assert.rejects(readFile(join(cleanRoot,'start-run-prompt.md')),{code:'ENOENT'});
    const indexPath=join(library,'creative-index.json'), index=await readFile(indexPath,'utf8');
    await writeFile(indexPath,index+'\n');
    await assert.rejects(verifyReferenceDelivery(clean,listing,1,'od-isolation'),/来源快照已变化/);
    await writeFile(indexPath,index);
    await writeFile(brief,'已改变');
    const stale=await verifyReferenceDelivery(clean,listing,1,'od-isolation');
    assert.equal(stale.prompt,undefined);
    assert.ok(stale.manifest.verificationErrors.some(item=>item.reason.includes('来源文件已变化')));
    const invalid=await prepareReferencePackage({...input,creative:[],assets:[{id:'video',path:join(dir,'video.mp4'),purpose:'测试',sourceStartMs:0,sourceEndMs:2000}]},join(root,'invalid'),library);
    assert.ok(invalid.diagnostics.some(item=>item.reason.includes('时间范围')));
    await copyFile(join(dir,'video.mp4'),join(dir,'clip.mp4'));
    const split={...card,clip:'cases/example/clip.mp4',start_ms:200,end_ms:800,frame_times_ms:[200]};
    const splitMeta={...split,video:'../video.mp4',clip:'../clip.mp4',storyboard:'../storyboards/main.png'}; delete splitMeta.card;
    await writeFile(join(dir,'creative','current.md'),'---\n'+Object.entries(splitMeta).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n')+'\n---\n\n参考片段。\n');
    await writeFile(indexPath,JSON.stringify({schema_version:1,catalogue_case_count:1,processed_cases:[1],count:1,cards:[split]}));
    const mapped=await prepareReferencePackage({...input,assets:[]},join(root,'mapped'),library);
    const clip=mapped.files.find(file=>file.deliveredPath.endsWith('/clip.mp4'));
    assert.equal(clip.uses[0].fileKind,'clip');
    assert.equal(clip.uses[0].timeCoordinates,'original');
    assert.equal(clip.uses[0].clipSourceOffsetMs,200);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('动效参考交付原片和切片，制作请求保留原片范围与切片时间对应', async () => {
  const root=await mkdtemp(join(tmpdir(),'vfc-motion-reference-'));
  try {
    const brief=join(root,'brief.md'), timing=join(root,'timing.md'), output=join(root,'out');
    await writeFile(brief,'完整创意编排'); await writeFile(timing,'实际时间安排');
    const index=loadLibraryIndex();
    const manifest=await prepareReferencePackage({projectId:'isolation',revision:1,brief,timingPlan:timing,
      motion:[{id:'002-m17',sourceSha256:index.source_sha256,usage:'adopted',purpose:'完成所选连续变化'}]},output);
    assert.deepEqual(manifest.diagnostics,[]);
    assert.ok(manifest.files.some(file=>file.uses.some(use=>use.fileKind==='video')));
    assert.ok(manifest.files.some(file=>file.uses.some(use=>use.fileKind==='clip'&&use.clipSourceOffsetMs===4700)));
    const listing={files:manifest.files.map(file=>({path:file.deliveredPath,localPath:join(output,file.deliveredPath)}))};
    const result=await verifyReferenceDelivery(manifest,listing,1,'od-isolation');
    assert.match(result.prompt,/资料原片范围 4700—9300ms/);
    assert.match(result.prompt,/切片零点对应原片 4700ms/);
    assert.match(result.prompt,/查看采用的创意和机制视频/);
  } finally { await rm(root,{recursive:true,force:true}); }
});
