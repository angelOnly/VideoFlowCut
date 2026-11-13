import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, copyFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {prepareReferencePackage,verifyReferenceDelivery} from '../scripts/opendesign-reference-package.mjs';
import {scopeReferenceManifest} from '../packages/edit-application/src/opendesign-reference-package.mjs';
import {loadLibraryIndex} from '../references/motion-cases/skillry/tools/library-store.mjs';

test('沿当前索引收集参考，复用原片、保留补图并如实报告缺失', async () => {
  const root=await mkdtemp(join(tmpdir(),'vfc-reference-'));
  try {
    const library=join(root,'library'), dir=join(library,'cases/example');
    await mkdir(join(dir,'creative'),{recursive:true}); await mkdir(join(dir,'storyboards'),{recursive:true});
    execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=black:s=16x16:r=10:d=1','-c:v','mpeg4',join(dir,'video.mp4')],{windowsHide:true});
    execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=white:s=16x16','-frames:v','1',join(dir,'storyboards','main.png')],{windowsHide:true});
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
    assert.match(verified.prompt,/制作作者在不改变主要视觉关系的前提下深化/);
    assert.match(verified.prompt,/用户要求、事实条件及当前采用的编排以完整简报为准/);
    assert.doesNotMatch(verified.prompt,/必须保持的内容、参考关键过程/);
    // 场面使用的 ID、文件和本地源时间以真实项目读回为准；未就绪范围不阻塞其他场面。
    const video=join(dir,'video.mp4'), projectSnapshot=join(root,'project.json');
    const videoHash=createHash('sha256').update(await readFile(video)).digest('hex');
    const project={revision:{number:1},snapshot:{project:{id:'isolation'},assets:[{id:'asset-1',status:'ready',sourceHash:videoHash,provenance:{acquisition:{sourceRange:{startMs:10000,endMs:11000}}}}]}};
    await writeFile(projectSnapshot,JSON.stringify(project));
    const sourceSha256=clean.files.find(file=>file.deliveredPath.endsWith('current.md')).uses[0].librarySourceSha256;
    const scene={sceneId:'scene-1',status:'ready',reference:{creativeCaseId:'001-c01',sourceSha256,startMs:100,endMs:900},
      visualRoles:[{role:'主要主体',referenceFunction:'主体进入并重排',assetIds:['asset-1'],sourceRanges:[{startMs:100,endMs:700}],usage:'使用主体画面进入并接力'}],
      process:'主体进入，文字共同移动并形成新构图，最后接入下一场。',preserve:['素材共同重排'],adapt:['中文排版']};
    const missingScene={...scene,sceneId:'scene-missing',visualRoles:[{...scene.visualRoles[0],assetIds:['candidate-not-asset']}]};
    const sceneInput={...input,projectSnapshot,assets:[{id:'asset-1',path:video,purpose:'主体画面'},{id:'candidate-not-asset',path:join(root,'still-missing.mp4'),purpose:'尚未取得的候选'}],scenes:[scene,missingScene,{sceneId:'scene-later',status:'pending'}]};
    const sceneOutput=join(root,'scenes');
    const packaged=await prepareReferencePackage(sceneInput,sceneOutput,library);
    assert.deepEqual(packaged.scenes.map(item=>item.status),['incomplete','incomplete','pending']);
    assert.match(packaged.scenes[0].diagnostics.join(' '),/缺少已预排的视觉计划/);
    assert.match(packaged.scenes[1].diagnostics.join(' '),/未取得/);
    assert.equal(packaged.scenes[0].references[0].video,'references/skillry/cases/example/video.mp4');
    assert.deepEqual(packaged.scenes[0].visualRoles[0].assets[0].sourceRanges[0],{startMs:100,endMs:700,timeCoordinates:'asset',originalStartMs:10100,originalEndMs:10700});
    assert.equal(packaged.scenes[0].visualRoles[0].assets[0].sourceHash,videoHash);
    assert.equal(packaged.diagnostics.find(item=>item.path.includes('still-missing')).requiredForRun,false);
    const sceneFile=JSON.parse(await readFile(join(sceneOutput,'brief/scenes.json'),'utf8'));
    assert.equal(sceneFile.scenes[0].process,scene.process);
    const sceneListing={files:packaged.files.filter(file=>file.requiredForRun!==false).map(file=>({path:file.deliveredPath,localPath:join(sceneOutput,file.deliveredPath)}))};
    const sceneVerified=await verifyReferenceDelivery(packaged,sceneListing,1,'od-isolation');
    assert.equal(sceneVerified.prompt,undefined);

    // 预排只能指向当前快照中的真实固定作品，交付的源码定义必须与项目哈希一致。
    const previewRoot=join(root,'project-root'), definition=JSON.stringify({work:{source:'真实同源源码',videoBindings:{subject:'asset-1'}}});
    const definitionHash=createHash('sha256').update(definition).digest('hex'), workId=`motion_work_${definitionHash}`;
    const definitionPath=`inputs/motion-work/${definitionHash}.json`;
    await mkdir(join(previewRoot,'inputs','motion-work'),{recursive:true});
    await writeFile(join(previewRoot,definitionPath),definition);
    await mkdir(join(previewRoot,'assets'),{recursive:true});
    await copyFile(video,join(previewRoot,'assets','video.mp4'));
    const previewProject={...project,snapshot:{...project.snapshot,project:{id:'isolation',rootPath:previewRoot},assets:[{...project.snapshot.assets[0],managedPath:'assets/video.mp4'}],motionWorks:[{
      id:workId,definitionPath,definitionHash,fps:30,readyRanges:[{startFrame:0,endFrame:10},{startFrame:10,endFrame:20}],
      videoSources:[{assetId:'asset-1',hash:videoHash,startFrame:0,endFrame:18,sourceStartMs:100,sourceEndMs:700}],
      author:{project:'od-isolation',run_id:'run-preview',frozen_version:'frozen-preview'}
    }]}};
    const previewSnapshot=join(root,'preview-project.json'); await writeFile(previewSnapshot,JSON.stringify(previewProject));
    const plan={status:'previewed',primaryRoles:['主要主体'],referenceMappings:[{referenceId:'001-c01',targetRole:'主要主体',treatment:'扩大主体接管',preserveRelation:'文字随主体共同重排'}],
      preview:{workId,startFrame:0,endFrame:18}};
    const planInput={...sceneInput,projectSnapshot:previewSnapshot,assets:sceneInput.assets.slice(0,1),scenes:[{...scene,visualPlan:plan}]};
    const preparedPlan=await prepareReferencePackage(planInput,join(root,'preview'),library);
    assert.equal(preparedPlan.scenes[0].status,'ready');
    assert.deepEqual(preparedPlan.scenes[0].visualPlan.referenceMappings,plan.referenceMappings);
    assert.equal(preparedPlan.scenes[0].visualPlan.preview.definitionHash,definitionHash);
    assert.equal(preparedPlan.scenes[0].visualPlan.preview.author.run_id,'run-preview');
    const extraPath=join(previewRoot,'assets','extra.png'); await copyFile(join(dir,'storyboards','main.png'),extraPath);
    const extraHash=createHash('sha256').update(await readFile(extraPath)).digest('hex');
    const scopedProject={...previewProject,snapshot:{...previewProject.snapshot,assets:[...previewProject.snapshot.assets,
      {id:'asset-2',status:'ready',kind:'image',sourceHash:extraHash,managedPath:'assets/extra.png'}]}};
    const scopedSnapshot=join(root,'scoped-project.json'); await writeFile(scopedSnapshot,JSON.stringify(scopedProject));
    const scopedInput={...planInput,projectSnapshot:scopedSnapshot,assets:[...planInput.assets,{id:'asset-2',path:extraPath,purpose:'仅供另一场面'}]};
    const twoScenes=[{...scene,visualPlan:{...plan,preview:{workId,startFrame:0,endFrame:9}}},
      {...scene,sceneId:'scene-2',visualRoles:[...scene.visualRoles,{role:'第二主体',referenceFunction:'场面补充',assetIds:['asset-2'],usage:'仅用于第二场'}],
        visualPlan:{...plan,preview:{workId,startFrame:9,endFrame:18}}}];
    const sameWork=await prepareReferencePackage({...scopedInput,selectedSceneIds:['scene-1','scene-2'],scenes:twoScenes},join(root,'same-work'),library);
    assert.deepEqual(sameWork.scenes.map(item=>item.status),['ready','ready']);
    const otherFile=sameWork.files.find(file=>file.uses.some(use=>use.kind==='source' && use.id==='asset-2'));
    const incompleteListing={files:sameWork.files.filter(file=>file!==otherFile).map(file=>({path:file.deliveredPath,localPath:join(root,'same-work',file.deliveredPath)}))};
    assert.equal((await verifyReferenceDelivery(sameWork,incompleteListing,1,'od-isolation',scopedProject)).prompt,undefined);
    const onlyFirst=scopeReferenceManifest(sameWork,['scene-1']);
    assert.equal(onlyFirst.files.find(file=>file.deliveredPath===otherFile.deliveredPath).requiredForRun,false);
    assert.match((await verifyReferenceDelivery(onlyFirst,incompleteListing,1,'od-isolation',scopedProject)).prompt,/就绪场面 scene-1/);
    assert.equal(sameWork.files.find(file=>file.deliveredPath===otherFile.deliveredPath).requiredForRun,undefined,'收窄范围不能修改原清单');
    const otherDefinition=JSON.stringify({work:{source:'另一份独立源码'}}), otherHash=createHash('sha256').update(otherDefinition).digest('hex');
    const otherPath=`inputs/motion-work/${otherHash}.json`, otherId=`motion_work_${otherHash}`;
    await writeFile(join(previewRoot,otherPath),otherDefinition);
    const otherProject={...scopedProject,snapshot:{...scopedProject.snapshot,motionWorks:[...scopedProject.snapshot.motionWorks,
      {...scopedProject.snapshot.motionWorks[0],id:otherId,definitionHash:otherHash,definitionPath:otherPath}]}};
    const otherSnapshot=join(root,'two-works-project.json'); await writeFile(otherSnapshot,JSON.stringify(otherProject));
    const separateScenes=[twoScenes[0],{...twoScenes[1],visualPlan:{...twoScenes[1].visualPlan,preview:{workId:otherId,startFrame:9,endFrame:18}}}];
    const separate=await prepareReferencePackage({...scopedInput,projectSnapshot:otherSnapshot,selectedSceneIds:['scene-1','scene-2'],scenes:separateScenes},join(root,'different-works'),library);
    assert.deepEqual(separate.scenes.map(item=>item.status),['incomplete','incomplete']);
    assert.match(separate.scenes[0].diagnostics.join(' '),/同一个完整 MotionWork/);
    const selectedOnly=await prepareReferencePackage({...scopedInput,projectSnapshot:otherSnapshot,selectedSceneIds:['scene-1'],scenes:separateScenes},join(root,'one-work-selected'),library);
    assert.deepEqual(selectedOnly.scenes.map(item=>item.status),['ready','pending']);
    const previewFile=preparedPlan.files.find(file=>file.uses.some(use=>use.kind==='preview'));
    assert.equal(previewFile.sha256,definitionHash);
    assert.equal(await readFile(join(root,'preview',previewFile.deliveredPath),'utf8'),definition);
    const previewListing={files:preparedPlan.files.map(file=>({path:file.deliveredPath,localPath:join(root,'preview',file.deliveredPath)}))};
    const previewVerified=await verifyReferenceDelivery(preparedPlan,previewListing,1,'od-isolation',previewProject);
    assert.match(previewVerified.prompt,/run-preview/);
    assert.match(previewVerified.prompt,/预排引用仅供追溯，不代表视觉质量已通过/);
    assert.match(previewVerified.prompt,/先完整读取[\s\S]*时间资料[\s\S]*再读取 brief\/scenes\.json[\s\S]*逐项核对参考原片、机制原片、真实素材与视觉角色映射/);
    const mapping={referenceId:'001-c01',referenceKind:'creative',targetRole:'主要主体',treatment:'扩大主体接管',preserveRelation:'文字随主体共同重排'};
    const typedOutput=join(root,'typed-reference');
    const typed=await prepareReferencePackage({...planInput,scenes:[{...scene,visualPlan:{...plan,referenceMappings:[mapping]}}]},typedOutput,library);
    assert.equal(typed.scenes[0].status,'ready');
    const typedScene=JSON.parse(await readFile(join(typedOutput,'brief/scenes.json'),'utf8')).scenes[0];
    assert.deepEqual(typedScene.visualPlan.referenceMappings,[mapping]);
    for (const field of ['references','visualRoles','process','preserve','adapt','visualPlan']) assert.ok(field in typedScene,field);
    const graphicPlan=await prepareReferencePackage({...planInput,scenes:[{...scene,visualPlan:{...plan,graphicLed:true,graphicReasons:['用图形解释不可见的概率累计关系']}}]},join(root,'graphic-valid'),library);
    assert.equal(graphicPlan.scenes[0].status,'ready');
    const studyPlan=await prepareReferencePackage({...planInput,creative:[{id:'001-c01',usage:'study',purpose:'候选参考'}]},join(root,'study-reference'),library);
    assert.match(studyPlan.scenes[0].diagnostics.join(' '),/必须.*adopted/);
    assert.equal((await verifyReferenceDelivery(preparedPlan,previewListing,1,'other-project',previewProject)).prompt,undefined);
    await assert.rejects(verifyReferenceDelivery(preparedPlan,previewListing,1,'od-isolation',
      {...previewProject,snapshot:{...previewProject.snapshot,motionWorks:[]}}),/预排作品.*已变化/);
    for (const [name,change,expected] of [
      ['bad-role',{primaryRoles:['不存在']},/主要角色/],
      ['bad-reference',{referenceMappings:[{referenceId:'未采用',targetRole:'主要主体',treatment:'接管'}]},/必须已采用且实际交付/],
      ['wrong-reference-kind',{referenceMappings:[{...mapping,referenceKind:'motion'}]},/类型和来源指纹需与场面参考一致/],
      ['invalid-reference-kind',{referenceMappings:[{...mapping,referenceKind:'其他'}]},/参考映射类型/],
      ['missing-target-role',{referenceMappings:[{...mapping,targetRole:'不存在'}]},/已有视觉角色/],
      ['empty-treatment',{referenceMappings:[{...mapping,treatment:'  '}]},/具体处理方式/],
      ['invalid-preserve-relation',{referenceMappings:[{...mapping,preserveRelation:123}]},/保持的关系/],
      ['missing-reference-mapping',{referenceMappings:[]},/缺少完整的视觉角色映射/],
      ['bad-range',{preview:{workId,startFrame:0,endFrame:21}},/已发布范围/],
      ['no-preview',{preview:undefined},/MotionWork 引用/],
      ['graphic',{graphicLed:true,graphicReasons:['更方便制作']},/承担的表达内容和原因/],
      ['pending',{status:'pending'},/视觉预排尚未完成/]
    ]) {
      const invalidPlan=await prepareReferencePackage({...planInput,scenes:[{...scene,visualPlan:{...plan,...change}}]},join(root,name),library);
      assert.equal(invalidPlan.scenes[0].status,'incomplete',name);
      assert.match(invalidPlan.scenes[0].diagnostics.join(' '),expected,name);
    }
    const wrongSource=await prepareReferencePackage({...planInput,scenes:[{...scene,
      reference:{...scene.reference,sourceSha256:'0'.repeat(64)},visualPlan:{...plan,referenceMappings:[mapping]}}]},join(root,'mapping-wrong-source'),library);
    assert.equal(wrongSource.scenes[0].status,'incomplete');
    assert.match(wrongSource.scenes[0].diagnostics.join(' '),/来源指纹不一致/);
    assert.match(wrongSource.scenes[0].diagnostics.join(' '),/类型和来源指纹需与场面参考一致/);
    // 当前创意与机制编号格式不重叠，构造场面输入验证未来跨类型同 ID 时不能猜测。
    const conflictingScene={...scene,reference:undefined,references:[{kind:'creative',id:'001-c01',sourceSha256,startMs:100,endMs:900,purpose:'完整画面'},
      {kind:'motion',id:'001-c01',sourceSha256,startMs:100,endMs:900,purpose:'局部运动'}]};
    const ambiguous=await prepareReferencePackage({...planInput,scenes:[{...conflictingScene,visualPlan:plan}]},join(root,'ambiguous'),library);
    assert.equal(ambiguous.scenes[0].status,'incomplete');
    assert.match(ambiguous.scenes[0].diagnostics.join(' '),/跨类型 ID 存在歧义，请指定 referenceKind/);
    const explicit=await prepareReferencePackage({...planInput,scenes:[{...conflictingScene,visualPlan:{...plan,referenceMappings:[mapping]}}]},join(root,'explicit-kind'),library);
    assert.doesNotMatch(explicit.scenes[0].diagnostics.join(' '),/歧义|视觉计划参考/);
    const missingRange=await prepareReferencePackage({...planInput,scenes:[{...scene,visualRoles:[{...scene.visualRoles[0],sourceRanges:[]}],visualPlan:plan}]},join(root,'missing-range'),library);
    assert.match(missingRange.scenes[0].diagnostics.join(' '),/缺少可核验的源时间范围/);
    const missingBinding=await prepareReferencePackage({...planInput,scenes:[{...scene,visualRoles:[{...scene.visualRoles[0],assetIds:[],sourceRanges:[]}],visualPlan:plan}]},join(root,'missing-preview-binding'),library);
    assert.match(missingBinding.scenes[0].diagnostics.join(' '),/预排素材 asset-1 未按同一身份纳入场面交付/);
    const wrongRange=await prepareReferencePackage({...planInput,scenes:[{...scene,visualRoles:[{...scene.visualRoles[0],sourceRanges:[{startMs:0,endMs:150}]}],visualPlan:plan}]},join(root,'wrong-preview-range'),library);
    assert.match(wrongRange.scenes[0].diagnostics.join(' '),/实际源范围未被场面交付覆盖/);
    await writeFile(join(root,'preview',previewFile.deliveredPath),'已改动');
    assert.equal((await verifyReferenceDelivery(preparedPlan,previewListing,1,'od-isolation',previewProject)).prompt,undefined);
    const multi={...scene,reference:undefined,references:[{...scene.reference,purpose:'建立主体'},{...scene.reference,startMs:200,endMs:800,purpose:'接续构图'}]};
    const multiple=await prepareReferencePackage({...planInput,scenes:[{...multi,visualPlan:plan}]},join(root,'multi'),library);
    assert.equal(multiple.scenes[0].status,'ready');
    assert.deepEqual(multiple.scenes[0].references.map(ref=>ref.purpose),['建立主体','接续构图']);
    await writeFile(projectSnapshot,JSON.stringify({...project,revision:{number:2}}));
    await assert.rejects(verifyReferenceDelivery(packaged,sceneListing,1,'od-isolation'),/项目快照已变化/);
    await writeFile(projectSnapshot,JSON.stringify(project));
    const incorrect=await prepareReferencePackage({...sceneInput,scenes:[{...scene,reference:{...scene.reference,endMs:2000,video:'错误原片.mp4',sourceSha256:'0'.repeat(64)},visualRoles:[{...scene.visualRoles[0],sourceRanges:[{startMs:0,endMs:2000}]}]}]},join(root,'bad-scene'),library);
    assert.equal(incorrect.scenes[0].status,'incomplete');
    assert.match(incorrect.scenes[0].diagnostics.join(' '),/参考原片范围/);
    assert.match(incorrect.scenes[0].diagnostics.join(' '),/参考原片与创意卡不一致/);
    assert.match(incorrect.scenes[0].diagnostics.join(' '),/创意卡来源指纹不一致/);
    assert.match(incorrect.scenes[0].diagnostics.join(' '),/源时间范围/);
    const incorrectListing={files:incorrect.files.map(file=>({path:file.deliveredPath,localPath:join(root,'bad-scene',file.deliveredPath)}))};
    assert.equal((await verifyReferenceDelivery(incorrect,incorrectListing,1,'od-isolation')).prompt,undefined);
    const mismatched=await prepareReferencePackage({...sceneInput,assets:[{id:'asset-1',path:join(dir,'storyboards','main.png'),purpose:'错误文件'}],scenes:[scene]},join(root,'wrong-asset'),library);
    assert.equal(mismatched.scenes[0].status,'incomplete');
    assert.match(mismatched.scenes[0].diagnostics.join(' '),/文件哈希与项目不一致/);
    await writeFile(join(root,'stale-project.json'),JSON.stringify({...project,revision:{number:2}}));
    await writeFile(join(sceneOutput,'start-run-prompt.md'),'旧请求');
    await assert.rejects(prepareReferencePackage({...sceneInput,projectSnapshot:join(root,'stale-project.json')},sceneOutput,library),/项目身份或 Revision 不一致/);
    await assert.rejects(readFile(join(sceneOutput,'start-run-prompt.md')),{code:'ENOENT'});
    await writeFile(join(sceneOutput,'start-run-prompt.md'),'旧请求');
    await writeFile(join(root,'malformed.json'),'{');
    assert.throws(()=>execFileSync(process.execPath,['scripts/opendesign-reference-package.mjs','prepare',join(root,'malformed.json'),sceneOutput],{windowsHide:true,stdio:'ignore'}));
    await assert.rejects(readFile(join(sceneOutput,'start-run-prompt.md')),{code:'ENOENT'});
    await assert.rejects(prepareReferencePackage({...input,creative:[{id:'001-c01',purpose:'缺少用途类型'}]},join(root,'bad-usage'),library),/study 或 adopted/);
    await assert.rejects(prepareReferencePackage({...input,references:[{id:'art',usage:'study',purpose:'学习',files:[{path:brief,deliveredPath:'references/../brief/override.md'}]}]},join(root,'bad-path'),library),/相对交付路径/);
    const cleanRoot=join(root,'clean');
    await writeFile(join(root,'listing.json'),'\uFEFF'+JSON.stringify(listing));
    await writeFile(join(root,'check.json'),'\uFEFF'+JSON.stringify({revision:2,odProjectId:'od-isolation'}));
    await writeFile(join(cleanRoot,'start-run-prompt.md'),'旧请求');
    assert.throws(()=>execFileSync(process.execPath,['scripts/opendesign-reference-package.mjs','verify',join(cleanRoot,'delivery-manifest.json'),join(root,'listing.json'),join(root,'check.json')],{windowsHide:true,stdio:'ignore'}));
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
    const definition=JSON.stringify({work:{source:'连续画面的同源预排'}}), definitionHash=createHash('sha256').update(definition).digest('hex');
    const definitionPath='inputs/motion-work/preview.json', workId=`motion_work_${definitionHash}`;
    await mkdir(join(root,'inputs','motion-work'),{recursive:true}); await writeFile(join(root,definitionPath),definition);
    const snapshot=join(root,'project.json');
    const project={revision:{number:1},snapshot:{project:{id:'isolation',rootPath:root},assets:[],motionWorks:[{id:workId,definitionPath,definitionHash,fps:30,readyRanges:[{startFrame:0,endFrame:30}]}]}};
    await writeFile(snapshot,JSON.stringify(project));
    const preview={status:'previewed',primaryRoles:['主体'],graphicLed:true,graphicReasons:['原创图形承担不可见过程'],
      preview:{workId,startFrame:0,endFrame:30}};
    const index=loadLibraryIndex();
    const manifest=await prepareReferencePackage({projectId:'isolation',revision:1,projectSnapshot:snapshot,brief,timingPlan:timing,
      motion:[{id:'002-m17',sourceSha256:index.source_sha256,usage:'adopted',purpose:'完成所选连续变化'}],
      scenes:[{sceneId:'motion',status:'ready',references:[{kind:'motion',id:'002-m17',sourceSha256:index.source_sha256,
        startMs:4700,endMs:9300,purpose:'主体接管'}],visualRoles:[{role:'主体',referenceFunction:'共同变化',assetIds:[],usage:'原创画面'}],
        visualPlan:{...preview,referenceMappings:[{referenceId:'002-m17',referenceKind:'motion',targetRole:'主体',treatment:'主体接管',preserveRelation:'主体共同变化'}]},
        process:'主体建立后完成接管',preserve:['运动关系'],adapt:['文字']} ]},output);
    assert.deepEqual(manifest.diagnostics,[]);
    assert.equal(manifest.scenes[0].references[0].kind,'motion');
    assert.equal(manifest.scenes[0].references[0].id,'002-m17');
    assert.ok(manifest.files.some(file=>file.uses.some(use=>use.fileKind==='video')));
    assert.ok(manifest.files.some(file=>file.uses.some(use=>use.fileKind==='clip'&&use.clipSourceOffsetMs===4700)));
    const listing={files:manifest.files.map(file=>({path:file.deliveredPath,localPath:join(output,file.deliveredPath)}))};
    const result=await verifyReferenceDelivery(manifest,listing,1,'od-isolation');
    assert.match(result.prompt,/资料原片范围 4700—9300ms/);
    assert.match(result.prompt,/切片零点对应原片 4700ms/);
    assert.match(result.prompt,/查看采用的创意和机制视频/);

    // 另一个场面仍缺素材和机制交付时，已选范围使用自己的依赖集合。
    const pendingOutput=join(root,'partial');
    const partial=await prepareReferencePackage({projectId:'isolation',revision:1,projectSnapshot:snapshot,brief,timingPlan:timing,
      selectedSceneIds:['a'],assets:[{id:'missing',path:join(root,'missing.mp4'),purpose:'待获取'}],
      motion:[{id:'002-m17',sourceSha256:index.source_sha256,usage:'adopted',purpose:'待完成场面的运动'}],scenes:[
        {sceneId:'a',status:'ready',visualRoles:[{role:'主体',referenceFunction:'共同构图',assetIds:[],usage:'原创图形'}],visualPlan:preview,process:'建立、变化并接续',preserve:['画面关系'],adapt:['排版']},
        {sceneId:'b',status:'pending',references:[{kind:'motion',id:'002-m17',sourceSha256:index.source_sha256,startMs:4700,endMs:9300,purpose:'待用机制'}],
          visualRoles:[{role:'主体',referenceFunction:'动作',assetIds:['missing'],usage:'待取得'}]}]},pendingOutput);
    assert.equal(partial.scenes[0].status,'ready');
    assert.equal(partial.scenes[1].status,'pending');
    assert.ok(partial.diagnostics.some(item=>item.path?.includes('missing') && item.requiredForRun===false));
    assert.ok(partial.diagnostics.some(item=>item.id==='002-m17' && item.requiredForRun===false));
    assert.ok(partial.files.filter(file=>file.uses.some(use=>use.kind==='motion')).every(file=>file.requiredForRun===false));
    const partialListing={files:partial.files.filter(file=>file.requiredForRun!==false).map(file=>({path:file.deliveredPath,localPath:join(pendingOutput,file.deliveredPath)}))};
    const current={...project,revision:{number:2}};
    const partialResult=await verifyReferenceDelivery(partial,partialListing,2,'isolated-od',current);
    assert.match(partialResult.prompt,/就绪场面 a/);
    assert.doesNotMatch(partialResult.prompt,/就绪场面 b/);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('常见网络视频与声音资料实际解码后才能进入制作请求', async () => {
  const root=await mkdtemp(join(tmpdir(),'vfc-reference-media-'));
  try {
    const brief=join(root,'brief.md'),timing=join(root,'timing.md'),video=join(root,'source.webm'),audio=join(root,'voice.flac'),output=join(root,'out');
    await writeFile(brief,'完整编排'); await writeFile(timing,'声音时间');
    execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=black:s=16x16:r=10:d=1','-c:v','libvpx',video],{windowsHide:true});
    execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:duration=1','-c:a','flac',audio],{windowsHide:true});
    const input={projectId:'isolated',revision:1,brief,timingPlan:timing,references:[{id:'media',usage:'adopted',purpose:'参考视频与配音',files:[
      {path:video,deliveredPath:'references/media/source.webm'},{path:audio,deliveredPath:'references/media/voice.flac'}]}]};
    const result=await prepareReferencePackage(input,output);
    assert.deepEqual(result.diagnostics,[]);
    assert.equal(result.files.find(file=>file.deliveredPath.endsWith('.webm')).localDecode,'verified');
    assert.equal(result.files.find(file=>file.deliveredPath.endsWith('.flac')).durationMs,1000);
    const listing={files:result.files.map(file=>({path:file.deliveredPath,localPath:join(output,file.deliveredPath)}))};
    assert.match((await verifyReferenceDelivery(result,listing,1,'isolated-od')).prompt,/voice\.flac/);
    await writeFile(audio,'损坏音频');
    const broken=await prepareReferencePackage(input,join(root,'broken'));
    assert.ok(broken.diagnostics.some(item=>item.path.endsWith('.flac')));
  } finally { await rm(root,{recursive:true,force:true}); }
});
