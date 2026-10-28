import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp,mkdir,writeFile,readFile,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join,resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createApplication } from "@videocut/application";
import { ComfyUIBridgeClient,type BridgeWorkflow } from "@videocut/bridge";
import { readRuntimeConfig } from "@videocut/project-overview";
import { DomainError } from "@videocut/domain";
import { loadCreativeIndex,selectCreativeCards,readCreativeCase } from "../references/motion-cases/skillry/tools/creative-library.mjs";
import { creativeSearchText,CREATIVE_QUERY_INSTRUCTION } from "../packages/media-intelligence/src/creative-library.js";
import { registerCreativeLibraryTools } from "../apps/server/src/creative-library-tools.js";
import { searchCreativeLibrary } from "../apps/job-worker/src/creative-library.js";
import { createMediaJobProcessor,runOneJob } from "../apps/job-worker/src/index.js";
import { projectMotionJob } from "../apps/server/src/motion-library-output.js";

const root=resolve("references/motion-cases/skillry");
test("当前87张完整卡、82独立切片和5原片复用按实际路径读回，不修改原片时间",()=>{
  const index=loadCreativeIndex(root);
  assert.equal(index.count,87);assert.equal(index.processed_cases.length,20);assert.equal(index.catalogue_case_count,120);
  assert.equal(index.cards.filter(card=>card.clip!==card.video).length,82);
  for(const card of index.cards){
    const loaded=readCreativeCase(root,{id:card.id,source_sha256:index.source_sha256,include_storyboard:false});
    const resources=loaded.result.resources as Record<string,{available:boolean}>;
    assert.ok(Object.values(resources).every(media=>media.available),card.id);
    assert.equal(loaded.result.body,card.raw);
    assert.deepEqual(loaded.result.frame_times_ms,card.frame_times_ms);
    const offset=card.clip===card.video?0:card.start_ms;
    assert.deepEqual(loaded.result.clip_frame_times_ms,card.frame_times_ms.map(time=>time-offset));
    const text=creativeSearchText(card);
    assert.ok(!text.includes('](../')&&!text.includes('原片范围：'));
    assert.ok(text.length<8192,"当前每卡字符数已小于工作流8192 token限制，真实token另作实测");
  }
  assert.throws(()=>selectCreativeCards(index,{ids:['../../secret']}),/未知/);
  assert.throws(()=>selectCreativeCards(index,{source_sha256:'0'.repeat(64)}),/已变化/);
  assert.throws(()=>selectCreativeCards(index,{ids:['001-c01'],query:'比较'}),/混用/);
  assert.equal(readCreativeCase(root,{id:'002-c01'}).image?.mimeType,'image/jpeg');
});

async function fixture(directory:string){
  const cards=[1,2].map(number=>({id:`001-c0${number}`,case_number:1,title:number===1?'材料甲':'材料乙',summary:'完整表达',use_when:'存在可比对象',
    card:`cases/example/creative/c0${number}.md`,video:'cases/example/video.mp4',clip:`cases/example/creative/c0${number}.mp4`,storyboard:`cases/example/storyboards/c0${number}.png`,start_ms:1000,end_ms:20000,frame_times_ms:[1000,4000,19000]}));
  await mkdir(join(directory,'cases/example/creative'),{recursive:true});await mkdir(join(directory,'cases/example/storyboards'),{recursive:true});
  await writeFile(join(directory,'case-catalogue.json'),JSON.stringify({cases:[{case_number:1,duration:21}]}));
  await writeFile(join(directory,'creative-index.json'),JSON.stringify({schema_version:1,catalogue_case_count:1,processed_cases:[1],count:2,cards}));
  for(const card of cards){
    const metadata={...card,video:'../video.mp4',clip:`c0${card.id.at(-1)}.mp4`,storyboard:`../storyboards/c0${card.id.at(-1)}.png`} as Record<string,unknown>;
    delete metadata.card;
    await writeFile(join(directory,card.card),'---\n'+Object.entries(metadata).map(([key,value])=>`${key}: ${JSON.stringify(value)}`).join('\n')+'\n---\n\n## 原画面具体怎样设计\n主体保持参照。\n\n## 为什么这样设计，好在哪里\n观众逐步发现关系。\n\n## 可直接使用的创意指令\n最后展开完整结果。\n');
  }
  await writeFile(join(directory,cards[0].storyboard),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jwzQAAAAASUVORK5CYII=','base64'));
  return cards;
}

test("卡内相对链接、真实PNG和缺媒体分别报告；损坏索引与越界路径明确拒绝",async()=>{
  const directory=await mkdtemp(join(tmpdir(),'creative-data-'));
  try{
    await fixture(directory);
    const loaded=readCreativeCase(directory,{id:'001-c01'});
    assert.equal(loaded.image?.mimeType,'image/png');
    const resources=loaded.result.resources as Record<string,{available:boolean;reason?:string}>;
    assert.equal(resources.clip.available,false);assert.ok(resources.clip.reason);assert.equal(resources.storyboard.available,true);
    const path=join(directory,'creative-index.json'),raw=JSON.parse(await readFile(path,'utf8'));
    await writeFile(path,JSON.stringify({...raw,count:3}));assert.throws(()=>loadCreativeIndex(directory),/数量/);
    await writeFile(path,JSON.stringify({...raw,schema_version:2}));assert.throws(()=>loadCreativeIndex(directory),/版本/);
    raw.cards[0].card='../outside.md';await writeFile(path,JSON.stringify(raw));assert.throws(()=>loadCreativeIndex(directory),/路径/);
  }finally{await rm(directory,{recursive:true,force:true});}
});

function mockBridge(){
  const config=readRuntimeConfig(),bridge=new ComfyUIBridgeClient(config.bridge.apiBaseUrl),calls:string[][]=[];
  const workflow:BridgeWorkflow={id:config.semantic.embeddingWorkflowId,schemaVersion:'test-v1',name:'隔离编码',available:true,fields:['texts_json','mode','instruction'].map(id=>({id,label:id,kind:'text',required:false})),itemSlots:[],outputs:[]};
  const runs=new Map<string,number[][]>();
  bridge.getWorkflow=async()=>workflow;
  bridge.createRunWithSchemaRetry=async(_id,build)=>{
    const request=await build(workflow),texts=JSON.parse(String(request.fieldValues.texts_json)) as string[];
    if(request.fieldValues.mode==='query')assert.equal(request.fieldValues.instruction,CREATIVE_QUERY_INSTRUCTION);
    calls.push(texts);
    const vectors=texts.map(text=>{const v=Array<number>(1024).fill(0);v[request.fieldValues.mode==='query'||text.startsWith('材料乙')?0:1]=1;return v;});
    const id=`isolated-${calls.length}`;runs.set(id,vectors);
    return {workflow,request,schemaRetryCount:0,run:{id,status:'queued' as const,outputs:[]}};
  };
  bridge.waitForRun=async id=>({id,status:'succeeded',outputs:[{outputSlotId:'result',kind:'text',displayName:'向量',text:JSON.stringify({embeddings:runs.get(id)})}]});
  return {bridge,calls};
}

test("真实MCP语义Job与Worker分派，翻页复用，跟进显式恢复，向量记录留后台且Revision不变",async()=>{
  const directory=await mkdtemp(join(tmpdir(),'creative-protocol-')),app=createApplication(directory);
  const server=new McpServer({name:'创意接线测试',version:'1'}),client=new Client({name:'创意作者',version:'1'});
  const initial=app.createProject({name:'隔离创意测试'}),projectId=initial.snapshot.project.id;
  const {bridge,calls}=mockBridge();
  registerCreativeLibraryTools(server,root,app,id=>id??projectId);
  const [local,remote]=InMemoryTransport.createLinkedPair();await server.connect(remote);await client.connect(local);
  const call=async(args:Record<string,unknown>)=>{
    const result=await client.callTool({name:'search_creative_cases',arguments:args});
    assert.notEqual(result.isError,true,JSON.stringify(result.content));return JSON.parse((result.content as Array<{text:string}>)[0].text);
  };
  try{
    const first=await call({query:'完全不同用词的模糊观看体验',limit:3});
    assert.equal(first.cards.length,0);assert.equal(first.diagnostics.status,'queued');
    await runOneJob(app,createMediaJobProcessor(app,bridge));
    assert.equal(app.trackJob(first.diagnostics.job_id).status,'succeeded');
    const completed=await call({query:'完全不同用词的模糊观看体验',limit:3}),count=calls.length;
    assert.equal(completed.diagnostics.semantic_used,true);assert.equal(completed.total,87);assert.equal(completed.cards.length,3);
    const page=await call({query:'完全不同用词的模糊观看体验',limit:2,offset:3,source_sha256:completed.source_sha256});
    assert.equal(page.diagnostics.job_id,first.diagnostics.job_id);assert.equal(calls.length,count);assert.equal(app.listJobs(projectId).length,1);
    const tracked=projectMotionJob(app.trackJob(first.diagnostics.job_id)) as Record<string,any>;
    assert.equal(tracked.payload,undefined);assert.equal(tracked.result.externalRuns,undefined);assert.equal(completed.externalRuns,undefined);
    const failed=await call({query:'第二个查询'}),jobId=failed.diagnostics.job_id;
    app.updateJob(jobId,{status:'unknown',error:'结果未知'});assert.equal((await call({query:'第二个查询'})).diagnostics.recovery.action,'reconcile');
    app.updateJob(jobId,{status:'failed',error:'已确定失败'});assert.equal((await call({query:'第二个查询'})).diagnostics.job_id,jobId);
    const retry=app.intelligence.retry(projectId,jobId);assert.equal((await call({query:'第二个查询'})).diagnostics.job_id,retry.id);
    assert.deepEqual(JSON.parse(JSON.stringify(app.readProject(projectId))),JSON.parse(JSON.stringify(initial)));
    assert.deepEqual(app.intelligence.store.sources(projectId),[]);
    const read=await client.callTool({name:'read_creative_case',arguments:{id:completed.cards[0].id,source_sha256:completed.source_sha256}});
    assert.notEqual(read.isError,true);
  }finally{await client.close();await server.close();app.close();await rm(directory,{recursive:true,force:true});}
});

test("单卡更新只重算该卡，模型变更重建向量，运行期间资料变化拒绝混合快照",async()=>{
  const directory=await mkdtemp(join(tmpdir(),'creative-cache-')),library=join(directory,'library');await mkdir(library);
  const cards=await fixture(library),app=createApplication(join(directory,'workspace')),{bridge,calls}=mockBridge();
  const projectId=app.createProject({name:'隔离缓存'}).snapshot.project.id,config=readRuntimeConfig();
  const job=(key:string,modelRevision='test')=>app.repository.createJob({projectId,kind:'creative_library_search',idempotencyKey:key,payload:{request:{query:'无词法交集'},source_sha256:loadCreativeIndex(library).source_sha256,modelConfig:{...config.semantic,embeddingRevision:modelRevision,apiBaseUrl:config.bridge.apiBaseUrl}}});
  try{
    const first=await searchCreativeLibrary(app,job('first'),bridge,library) as Record<string,any>;
    assert.equal(first.cards[0].id,'001-c02');assert.equal(first.diagnostics.document_chunks,2);
    await searchCreativeLibrary(app,job('cached'),bridge,library);assert.equal(calls.length,2);
    const path=join(library,cards[0].card);await writeFile(path,(await readFile(path,'utf8'))+'新增材料改变观看方式。\n');
    const changed=await searchCreativeLibrary(app,job('changed'),bridge,library) as Record<string,any>;
    assert.equal(changed.diagnostics.encoded_texts,1);assert.equal(changed.diagnostics.cache_hits,2);
    const model=await searchCreativeLibrary(app,job('model','other-model'),bridge,library) as Record<string,any>;
    assert.equal(model.diagnostics.encoded_texts,3);
    const stale=job('stale');await writeFile(path,(await readFile(path,'utf8'))+'又有新资料。\n');
    await assert.rejects(searchCreativeLibrary(app,stale,bridge,library),/已变化/);
    const original=bridge.waitForRun.bind(bridge);
    bridge.waitForRun=async id=>{await writeFile(path,(await readFile(path,'utf8'))+'制作期间变化。\n');return original(id);};
    await assert.rejects(searchCreativeLibrary(app,job('midflight','third-model'),bridge,library),/已变化/);
    const callbacks=new Map<string,(request:any)=>Promise<any>>();
    registerCreativeLibraryTools({registerTool:(name:string,_config:unknown,handler:any)=>callbacks.set(name,handler)} as unknown as McpServer,library,app,()=>{throw new DomainError('没有当前项目','PROJECT_NOT_TARGETED');});
    assert.equal((await callbacks.get('search_creative_cases')!({})).isError,undefined);
    const missing=await callbacks.get('search_creative_cases')!({query:'观看关系'});assert.equal(missing.isError,true);assert.match(missing.content[0].text,/PROJECT_NOT_TARGETED/);
  }finally{app.close();await rm(directory,{recursive:true,force:true});}
});
