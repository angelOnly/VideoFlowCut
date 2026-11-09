import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EditingApplication } from "@videocut/application";
import { readRuntimeConfig } from "@videocut/project-overview";
import { DomainError } from "@videocut/domain";
import { resolve } from "node:path";
import { z } from "zod";
import { loadCreativeIndex,selectCreativeCards,readCreativeCase,assertCreativeSnapshot } from "../../../references/motion-cases/skillry/tools/creative-library.mjs";
import { digest } from "../../../packages/media-intelligence/src/index.js";
import { CREATIVE_TEXT_VERSION,CREATIVE_INSTRUCTION_VERSION,CREATIVE_QUERY_INSTRUCTION } from "../../../packages/media-intelligence/src/creative-library.js";
import { latestLibraryAttempt } from "./library-job.js";
import { motionJobRecovery } from "./motion-library-output.js";
import { projectCreativeSearchResult } from "./creative-library-output.js";

const id=z.string().regex(/^\d{3}-c\d{2}$/u),fingerprint=z.string().regex(/^[a-f0-9]{64}$/u);
const response=(value:unknown)=>({content:[{type:"text" as const,text:JSON.stringify(value)}]});
const failure=(error:unknown,sideEffects:"none"|"unknown"="none")=>({isError:true,...response({
  code:error instanceof Error&&"code" in error?error.code:"CREATIVE_LIBRARY_UNAVAILABLE",message:error instanceof Error?error.message:"创意资料读取失败",sideEffects})});

export function registerCreativeLibraryTools(server:McpServer,root=resolve(process.cwd(),"references/motion-cases/skillry"),app?:EditingApplication,projectIdFrom?:(id?:string)=>string) {
  server.registerTool("search_creative_cases",{
    title:"检索完整创意案例",description:"创意作者用自然语言检索并观看候选。首次语义查询返回 Job，track_job 成功后按 readback 读取当前页并按分页信息继续。同查询分页复用排名。ids 精确定位，无 query/ids 时分页浏览。采用前读取完整卡和真实媒体，结合本片素材决定。",
    annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:true},
    inputSchema:{project_id:z.string().optional(),query:z.string().max(1000).optional(),ids:z.array(id).min(1).max(50).optional(),offset:z.number().int().min(0).optional(),limit:z.number().int().min(1).max(50).optional(),source_sha256:fingerprint.optional()}
  },async({project_id,...request})=>{
    let sideEffects:"none"|"unknown"="none";
    try{
      const index=loadCreativeIndex(root),browse=selectCreativeCards(index,request);
      if(!request.query?.trim())return response({...browse,diagnostics:{mode:request.ids?"exact":"browse",semantic_used:false}});
      if(!app||!projectIdFrom)throw new DomainError("语义检索未连接项目任务服务；仍可按编号读取或分页浏览","CREATIVE_SEMANTIC_UNAVAILABLE");
      const projectId=projectIdFrom(project_id),config=readRuntimeConfig();
      // 翻页、一次显式快照断言均不改变查询身份，完整排名由一个 Job 保存。
      const payload={request:{query:request.query.trim().normalize("NFC")},source_sha256:index.source_sha256,modelConfig:{...config.semantic,apiBaseUrl:config.bridge.apiBaseUrl},textVersion:CREATIVE_TEXT_VERSION,instructionVersion:CREATIVE_INSTRUCTION_VERSION,instruction:CREATIVE_QUERY_INSTRUCTION};
      sideEffects="unknown";
      const job=latestLibraryAttempt(app,projectId,app.repository.createJob({projectId,kind:"creative_library_search",payload,idempotencyKey:`creative-library:${digest(payload)}`}));
      let result:Record<string,unknown>;
      if(job.status==="succeeded"&&job.result){
        assertCreativeSnapshot(index,String(job.result.source_sha256));
        assertCreativeSnapshot(loadCreativeIndex(root),index.source_sha256);
        result={...selectCreativeCards(index,request,job.result.cards as Array<{id:string;score:number}>),diagnostics:{...job.result.diagnostics as object,job_id:job.id,status:job.status}};
      }else result={...browse,cards:[],total:0,next_offset:null,exhausted:false,diagnostics:{mode:"semantic",semantic_used:false,source_sha256:index.source_sha256,job_id:job.id,status:job.status,reason:job.error??"语义检索正在准备；track_job 后以相同查询读回",failure:job.result?.diagnostic,recovery:motionJobRecovery(job)}};
      return response(projectCreativeSearchResult(result));
    }catch(error){return failure(error,sideEffects);}
  });
  server.registerTool("read_creative_case",{
    title:"读取完整创意卡与媒体",description:"按真实 ID 读取完整 Markdown、原片、完整创意切片、实际分镜与源时间；传 source_sha256 拒绝过期引用。按真实格式返回分镜图片，媒体缺失逐项说明。本工具不播放或听审，不创建 Job、素材或 Revision。",
    annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
    inputSchema:{id,source_sha256:fingerprint.optional(),include_storyboard:z.boolean().optional()}
  },async request=>{
    try{
      const loaded=readCreativeCase(root,request);
      const content:Array<{type:"text";text:string}|{type:"image";data:string;mimeType:string}>=[{type:"text",text:JSON.stringify(loaded.result)}];
      if(loaded.image)content.push({type:"image",...loaded.image});
      return {content};
    }catch(error){return failure(error);}
  });
}
