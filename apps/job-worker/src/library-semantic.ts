import type { EditingApplication } from "@videocut/application";
import { ComfyUIBridgeClient } from "@videocut/bridge";
import type { JobRecord } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";
import { cosine,digest } from "../../../packages/media-intelligence/src/index.js";
import { embedBatch } from "./media-understanding.js";
import { semanticConfig } from "./model-http.js";

type Candidate = {id:string;score:number};
type Adapter = {
  namespace:string;source:string;instruction:string;instructionVersion:string;
  documents:Array<{id:string;text:string;identity:unknown}>;queries:string[];
  cacheKey:(identity:unknown,version:unknown,mode:string)=>string;
  project:(pools:Record<string,Candidate[]>)=>Record<string,unknown>;
  assertCurrent:()=>void;
};

/** 两个库共用编码、缓存、完整扫描与检查点，只由适配器决定文本和结果合同。 */
export async function runLibrarySemanticSearch(app:EditingApplication,job:JobRecord,bridge:ComfyUIBridgeClient,adapter:Adapter):Promise<Record<string,unknown>> {
  const started=Date.now(),config=semanticConfig(job),store=app.intelligence.store;
  if(bridge.apiBaseUrl!==config.apiBaseUrl)bridge=new ComfyUIBridgeClient(config.apiBaseUrl);
  const schema=await bridge.getWorkflow(config.embeddingWorkflowId);
  if(!schema.fields.some(field=>field.id==="instruction"))throw new DomainError("向量工作流未提供任务指令字段","MOTION_INSTRUCTION_UNSUPPORTED");
  const version={...config,schema:schema.schemaVersion};
  let encoded=0,cacheHits=0;
  const documents=adapter.documents.map(entry=>{
    const key=adapter.cacheKey(entry.identity,version,"document"),vector=store.libraryCache<number[]>(key);
    if(vector)cacheHits++;
    return {...entry,key,vector};
  });
  const missing=documents.filter(entry=>!entry.vector);
  for(let i=0;i<missing.length;i+=8){
    const batch=missing.slice(i,i+8);
    const vectors=await embedBatch(app,job,bridge,batch.map(entry=>entry.text),"document",`${adapter.namespace}-doc:${digest(batch.map(entry=>entry.key))}`,adapter.instruction);
    batch.forEach((entry,j)=>{entry.vector=vectors[j];store.saveLibraryCache(entry.key,entry.vector);});
    encoded+=batch.length;
    app.recordJobCheckpoint(job.id,{[`${adapter.namespace}Index`]:{completed:cacheHits+encoded,total:documents.length,source_sha256:adapter.source}});
  }
  const pools:Record<string,Candidate[]>={};
  for(const query of adapter.queries){
    const key=adapter.cacheKey(query.trim().normalize("NFC"),version,"query");
    let vector=store.libraryCache<number[]>(key);
    if(vector)cacheHits++;
    else{[vector]=await embedBatch(app,job,bridge,[query],"query",key,adapter.instruction);store.saveLibraryCache(key,vector);encoded++;}
    const scores=new Map<string,number>();
    for(const entry of documents)scores.set(entry.id,Math.max(scores.get(entry.id)??-1,cosine(vector,entry.vector!)));
    pools[query]=[...scores].map(([id,score])=>({id,score})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  }
  adapter.assertCurrent();
  return {...adapter.project(pools),diagnostics:{mode:adapter.namespace==="motion"?"hybrid":"semantic",semantic_used:true,model:config.embeddingRevision,workflow:config.embeddingWorkflowId,schema:schema.schemaVersion,instruction_version:adapter.instructionVersion,source_sha256:adapter.source,document_chunks:documents.length,cache_hits:cacheHits,encoded_texts:encoded,elapsed_ms:Date.now()-started}};
}
