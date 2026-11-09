import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApplication } from "@videocut/application";
import { ComfyUIBridgeClient, type BridgeWorkflow } from "@videocut/bridge";
import { readRuntimeConfig } from "@videocut/project-overview";
import { DomainError } from "@videocut/domain";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMediaJobProcessor, runOneJob } from "../apps/job-worker/src/index.js";
import { loadLibraryIndex, searchLibraryIndex, libraryVideo } from "../references/motion-cases/skillry/tools/library-store.mjs";
import { runMotionLibrarySearch } from "../apps/job-worker/src/motion-library.js";
import { registerMotionLibraryTools } from "../apps/server/src/motion-library-tools.js";
import { projectMotionJob } from "../apps/server/src/motion-library-output.js";
import { MOTION_QUERY_INSTRUCTION, MOTION_INSTRUCTION_VERSION, MOTION_TEXT_VERSION, motionCacheKey, mechanismChunks } from "../packages/media-intelligence/src/motion-library.js";
import { digest } from "../packages/media-intelligence/src/index.js";

const root=resolve("references/motion-cases/skillry");

test("正式 MCP 协议从当前项目提交语义 Job，经 Worker 编码后以原输入读回混合结果", async () => {
  const directory = await mkdtemp(join(tmpdir(), "motion-protocol-worker-")), app = createApplication(directory);
  const server = new McpServer({ name: "机制接线回归", version: "1" });
  const client = new Client({ name: "机制查询作者", version: "1" });
  const projectId = app.createProject({ name: "隔离机制调用" }).snapshot.project.id;
  const config = readRuntimeConfig(), bridge = new ComfyUIBridgeClient(config.bridge.apiBaseUrl);
  const legacyPayload = { request: { query: "前一个内容还留着，新的关注从里面接进来" }, source_sha256: loadLibraryIndex(root).source_sha256,
    modelConfig: { ...config.semantic, apiBaseUrl: config.bridge.apiBaseUrl }, textVersion: MOTION_TEXT_VERSION,
    instructionVersion: MOTION_INSTRUCTION_VERSION, instruction: MOTION_QUERY_INSTRUCTION };
  const legacy = app.repository.createJob({ projectId, kind: "motion_library_search", payload: legacyPayload, idempotencyKey: `motion-library:${digest(legacyPayload)}` });
  app.updateJob(legacy.id, { status: "succeeded", result: { cards: [] } });
  const workflow: BridgeWorkflow = { id: config.semantic.embeddingWorkflowId, schemaVersion: "test-v1", name: "隔离测试编码",
    fields: ["texts_json", "mode", "instruction"].map((label,index) => ({ id: `input-${index+1}`, label, kind: "text", required: false })), itemSlots: [], outputs: [] };
  const runs = new Map<string, number[][]>();
  bridge.getWorkflow = async () => workflow;
  bridge.createRunWithWorkflow = async (_id, build) => {
    const request = await build(workflow), texts = JSON.parse(String(request.fieldValues["input-1"])) as string[];
    if (request.fieldValues["input-2"] === "query") assert.equal(request.fieldValues["input-3"], MOTION_QUERY_INSTRUCTION);
    const id = `protocol-${runs.size}`;
    runs.set(id, texts.map(text => { const vector = Array<number>(1024).fill(0); vector[text.length % 1024] = 1; return vector; }));
    return { workflow, request, schemaRetryCount: 0, run: { id, status: "queued", outputs: [] } };
  };
  bridge.waitForRun = async id => ({ id, status: "succeeded", outputs: [{ outputSlotId: "result", kind: "text", displayName: "向量", text: JSON.stringify({ embeddings: runs.get(id) }) }] });
  registerMotionLibraryTools(server, root, app, id => id ?? projectId);
  const [local, remote] = InMemoryTransport.createLinkedPair();
  await server.connect(remote); await client.connect(local);
  const query = { project_id: projectId, query: "前一个内容还留着，新的关注从里面接进来", limit: 3 };
  const call = async (args: Record<string,unknown> = query) => {
    const result = await client.callTool({ name: "search_motion_mechanisms", arguments: args });
    assert.notEqual(result.isError, true, JSON.stringify(result.content));
    return JSON.parse((result.content as Array<{ text: string }>)[0].text);
  };
  try {
    assert.ok((await client.listTools()).tools.find(tool => tool.name === "search_motion_mechanisms")!.inputSchema.properties?.project_id);
    const first = await call();
    assert.equal(first.diagnostics.semantic_used, false);
    assert.deepEqual(first.cards, []);
    assert.equal(first.total, 0);
    assert.equal(first.next_offset, null);
    assert.equal(first.exhausted, false);
    assert.ok(first.diagnostics.job_id);
    assert.notEqual(first.diagnostics.job_id, legacy.id, "完整候选池不能误读历史单页任务");
    await runOneJob(app, createMediaJobProcessor(app, bridge));
    const completed = app.trackJob(first.diagnostics.job_id);
    assert.equal(completed.status, "succeeded", completed.error);
    const result = await call();
    assert.equal(result.diagnostics.semantic_used, true);
    assert.equal(result.source_sha256, first.source_sha256);
    assert.equal(result.cards.length, 3);
    const modelRuns = runs.size;
    const tracked = projectMotionJob(completed) as any;
    assert.equal(tracked.readback.tool, "search_motion_mechanisms");
    assert.equal(tracked.result.cards, undefined);
    const readback = await call({ ...tracked.readback.arguments, limit: 3 });
    const page = await call({ ...query, offset: 3, limit: 3, source_sha256: result.source_sha256 });
    assert.equal(page.diagnostics.job_id, first.diagnostics.job_id);
    assert.deepEqual(readback.cards.map((card: any) => card.id), result.cards.map((card: any) => card.id));
    assert.equal(new Set([...result.cards, ...page.cards].map((card: any) => card.id)).size, result.cards.length + page.cards.length);
    const normalized = await call({ ...query, query: `  ${query.query}  `, limit: 4, source_sha256: result.source_sha256 });
    assert.equal(normalized.diagnostics.job_id, first.diagnostics.job_id);
    assert.equal(runs.size, modelRuns);
    const stageQuery = { project_id: projectId, stages: ["前景保持，后层出现", "材料逐渐接管画面"], limit: 3 };
    const pendingStages = await call(stageQuery);
    assert.deepEqual(pendingStages.cards, []);
    assert.equal(pendingStages.groups, undefined);
    assert.equal(pendingStages.connections, undefined);
    assert.equal(pendingStages.exhausted, false);
    await runOneJob(app, createMediaJobProcessor(app, bridge));
    const stageFirst = await call(stageQuery);
    const stageRuns = runs.size;
    const stageNext = await call({ ...stageQuery, offset: 3, source_sha256: stageFirst.source_sha256 });
    assert.equal(stageFirst.diagnostics.job_id, pendingStages.diagnostics.job_id);
    assert.equal(stageNext.diagnostics.job_id, pendingStages.diagnostics.job_id);
    assert.equal(stageFirst.diagnostics.semantic_used, true);
    for (let index = 0; index < stageQuery.stages.length; index++) {
      assert.equal(stageFirst.groups[index].stage, stageQuery.stages[index]);
      const ids = [...stageFirst.groups[index].cards, ...stageNext.groups[index].cards].map((card: any) => card.id);
      assert.equal(new Set(ids).size, ids.length);
    }
    assert.equal(runs.size, stageRuns);
    assert.ok(completed.result?.externalRuns, "完整向量运行记录保留在后台供恢复使用");
    assert.equal(result.externalRuns, undefined, "正式搜索出口不透传模型运行正文");
    assert.ok(result.cards.every((card: Record<string, unknown>) => card.search_text === undefined));
    const evidence = await client.callTool({ name: "read_motion_mechanism", arguments: { id: result.cards[0].id, source_sha256: result.source_sha256, include_storyboard: false } });
    assert.notEqual(evidence.isError, true);
    assert.equal(app.listJobs(projectId).length, 3);
    assert.equal(app.readProject(projectId).revision.number, 1);
  } finally { await client.close(); await server.close(); app.close(); await rm(directory, { recursive: true, force: true }); }
});
test("全文、独立向量召回、粗状态软排序与稳定分页",()=>{
  const index=loadLibraryIndex(root);
  assert.ok(index.mechanisms.every(entry=>entry.search_text&&entry.text_sha256));
  assert.match(index.mechanisms[0].search_text,/中心活动层始终继续/);
  assert.match(index.mechanisms[0].search_text,/必须留出中心活动范围/);
  const id=index.mechanisms[0].id;
  const result=searchLibraryIndex(index,{query:"无词法命中的完整关系",limit:5},{candidates:[{id,score:0.9}]}) as any;
  assert.equal(result.cards[0].id,id);assert.equal(result.cards[0].retrieval_evidence.lexical_rank,undefined);
  // 接续检索排除自身，按当前库取末页，仍验证无公共状态的候选不会被硬过滤。
  const connectionCount=index.count-1,tailOffset=Math.max(0,connectionCount-50);
  const connected=searchLibraryIndex(index,{after:id,limit:50,offset:tailOffset}) as any;
  assert.equal(connected.total,connectionCount);
  assert.equal(connected.cards.length,connectionCount-tailOffset);
  assert.equal(connected.next_offset,null);
  assert.ok(connected.cards.some((entry:any)=>!entry.connection.shared_states.length&&entry.connection.gap));
  const pool={candidates:index.mechanisms.map((entry,i)=>({id:entry.id,score:i/index.count}))};
  const full=searchLibraryIndex(index,{query:"保持",limit:50},pool) as any;
  const a=searchLibraryIndex(index,{query:"保持",limit:12},pool) as any;
  const b=searchLibraryIndex(index,{query:"保持",limit:12,offset:12},pool) as any;
  assert.deepEqual([...a.cards,...b.cards].map((entry:any)=>entry.id),full.cards.slice(0,24).map((entry:any)=>entry.id));
  const chunks=mechanismChunks("第一对象保持。\n"+"后一对象继续，".repeat(400)+"\n观察转向内部。");
  assert.ok(chunks.some(text=>text.includes("后一对象继续，".repeat(400))),"不能把完整行为按字符切开再平均");
  assert.notEqual(motionCacheKey("source","text","model-v1","query"),motionCacheKey("source","text","model-v2","query"));
  assert.notEqual(motionCacheKey("source","text","model","query"),motionCacheKey("source","text","model","document"));
  assert.throws(()=>libraryVideo(root,"../../secret",index.source_sha256));
});

test("现有模型运输接入任务指令，当前全库缓存复用且不写素材和Revision",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"motion-semantic-")),app=createApplication(directory);
  try{
    const initial=app.createProject({name:"机制缓存隔离测试"}),projectId=initial.snapshot.project.id;
    const index=loadLibraryIndex(root),config=readRuntimeConfig();
    const payload={request:{stages:["外框保持，内部滚动","整体外框向前移动"],limit:5},source_sha256:index.source_sha256,textVersion:MOTION_TEXT_VERSION,instructionVersion:MOTION_INSTRUCTION_VERSION,instruction:MOTION_QUERY_INSTRUCTION,modelConfig:{...config.semantic,apiBaseUrl:config.bridge.apiBaseUrl}};
    // 每条机制按完整行为分块；缓存期望随当前内容变化，不固定历史库条数。
    const documentChunks=index.mechanisms.reduce((count,entry)=>count+mechanismChunks(entry.search_text).length,0);
    const expectedTexts=documentChunks+payload.request.stages.length;
    const bridge=new ComfyUIBridgeClient(config.bridge.apiBaseUrl);
    const workflow:BridgeWorkflow={id:config.semantic.embeddingWorkflowId,schemaVersion:"test-v1",name:"测试编码",fields:["texts_json","mode","instruction"].map((label,index)=>({id:`input-${index+1}`,label,kind:"text",required:false})),itemSlots:[],outputs:[]};
    let calls=0;const runs=new Map<string,number[][]>();
    bridge.getWorkflow=async()=>workflow;
    bridge.createRunWithWorkflow=async(_id,build)=>{
      const request=await build(workflow),texts=JSON.parse(String(request.fieldValues["input-1"])) as string[];
      if(request.fieldValues["input-2"]==="query")assert.equal(request.fieldValues["input-3"],MOTION_QUERY_INSTRUCTION);
      assert.ok(texts.length<=8);calls++;
      const vectors=texts.map(text=>{const vector=Array<number>(1024).fill(0);vector[text.length%1024]=1;return vector;});
      const id=`test-${calls}`;runs.set(id,vectors);
      return {workflow,request,schemaRetryCount:0,run:{id,status:"queued",outputs:[]}};
    };
    bridge.waitForRun=async id=>({id,status:"succeeded",outputs:[{outputSlotId:"result",kind:"text",displayName:"向量",text:JSON.stringify({embeddings:runs.get(id)})}]});
    const job=app.repository.createJob({projectId,kind:"motion_library_search",payload,idempotencyKey:"first"});
    const first=await runMotionLibrarySearch(app,job,bridge) as any;
    assert.equal(first.diagnostics.semantic_used,true);assert.equal(Object.keys(first.pools).length,2);
    assert.equal(first.diagnostics.document_chunks,documentChunks);
    assert.equal(first.diagnostics.encoded_texts,expectedTexts);
    const callsAfter=calls;
    const second=await runMotionLibrarySearch(app,app.repository.createJob({projectId,kind:"motion_library_search",payload,idempotencyKey:"second"}),bridge) as any;
    assert.equal(calls,callsAfter);assert.equal(second.diagnostics.encoded_texts,0);assert.equal(second.diagnostics.cache_hits,expectedTexts);
    assert.deepEqual(JSON.parse(JSON.stringify(app.readProject(projectId))),JSON.parse(JSON.stringify(initial)));
    assert.deepEqual(app.intelligence.store.sources(projectId),[]);
    const stale=app.repository.createJob({projectId,kind:"motion_library_search",payload:{...payload,source_sha256:"0".repeat(64)},idempotencyKey:"stale"});
    await assert.rejects(runMotionLibrarySearch(app,stale,bridge),/原文已变化/);
    assert.equal(calls,callsAfter);
  }finally{app.close();await rm(directory,{recursive:true,force:true});}
});

test("MCP返回待完成语义Job，失败或未知不自动重放，完成后读回",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"motion-tools-")),app=createApplication(directory);
  try{
    const state=app.createProject({name:"机制协议测试"}),projectId=state.snapshot.project.id;
    const tools=new Map<string,any>();
    registerMotionLibraryTools({registerTool:(name:string,config:unknown,handler:unknown)=>tools.set(name,{config,handler})} as unknown as McpServer,root,app,id=>id??projectId);
    const tool=tools.get("search_motion_mechanisms"),request={query:"背景持续，文字接管"};
    assert.equal(tool.config.annotations.openWorldHint,true);
    const call=async()=>JSON.parse((await tool.handler(request)).content[0].text);
    const first=await call();assert.equal(first.diagnostics.semantic_used,false);assert.deepEqual(first.cards,[]);
    const jobId=first.diagnostics.job_id;
    for(const status of ["failed","unknown"] as const){app.updateJob(jobId,{status,error:"测试服务不可用"});const next=await call();assert.equal(next.diagnostics.job_id,jobId);assert.equal(next.diagnostics.status,status);assert.deepEqual(next.cards,[]);}
    assert.equal(app.listJobs(projectId).length,1);
    app.updateJob(jobId,{status:"succeeded",result:{pools:{[request.query]:[{id:"001-m01",score:0.9}]},diagnostics:{semantic_used:true}}});
    assert.equal((await call()).diagnostics.semantic_used,true);
    assert.equal(app.readProject(projectId).revision.number,state.revision.number);
  }finally{app.close();await rm(directory,{recursive:true,force:true});}
});

test("语义查询需要目标项目，精确读取与浏览不需要，提交结果未知不声明无副作用",async(t)=>{
  const directory=await mkdtemp(join(tmpdir(),"motion-fallback-")),app=createApplication(directory);
  try{
    const callbacks=new Map<string,any>();
    const server={registerTool:(name:string,_config:unknown,handler:unknown)=>callbacks.set(name,handler)} as unknown as McpServer;
    registerMotionLibraryTools(server,root,app,()=>{throw new DomainError("未定位项目","PROJECT_NOT_TARGETED");});
    const missing=await callbacks.get("search_motion_mechanisms")({query:"保持背景"});
    assert.equal(missing.isError,true);
    assert.equal(JSON.parse(missing.content[0].text).code,"PROJECT_NOT_TARGETED");
    const browse=await callbacks.get("search_motion_mechanisms")({limit:1});
    assert.equal(browse.isError,undefined);
    assert.equal(JSON.parse(browse.content[0].text).cards.length,1);
    const exact=await callbacks.get("search_motion_mechanisms")({ids:["001-m01"]});
    assert.equal(exact.isError,undefined);
    assert.equal(JSON.parse(exact.content[0].text).cards[0].id,"001-m01");
    assert.equal((await callbacks.get("search_motion_mechanisms")({project_id:"错误项目",query:"保持背景"})).isError,true);
    const projectId=app.createProject({name:"结果未知隔离测试"}).snapshot.project.id;
    registerMotionLibraryTools(server,root,app,()=>projectId);
    t.mock.method(app.repository,"createJob",()=>{throw new Error("数据库返回中断");});
    const failed=await callbacks.get("search_motion_mechanisms")({query:"保持背景"});
    assert.equal(failed.isError,true);
    assert.equal(JSON.parse(failed.content[0].text).sideEffects,"unknown");
  }finally{app.close();await rm(directory,{recursive:true,force:true});}
});
