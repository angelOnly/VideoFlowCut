import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolve } from "node:path";
import { z } from "zod";
import { loadLibraryIndex, searchLibraryIndex, readLibraryMechanism } from "../../../references/motion-cases/skillry/tools/library-store.mjs";
import { termsFor } from "../../../references/motion-cases/skillry/taxonomy.mjs";
import type { EditingApplication } from "@videocut/application";
import { readRuntimeConfig } from "@videocut/project-overview";
import { DomainError } from "@videocut/domain";
import { digest, timeRangeSchema } from "../../../packages/media-intelligence/src/index.js";
import { MOTION_TEXT_VERSION, MOTION_INSTRUCTION_VERSION, MOTION_QUERY_INSTRUCTION, MOTION_VIDEO_PROMPT } from "../../../packages/media-intelligence/src/motion-library.js";
import { motionJobRecovery, projectMotionJob, projectMotionMechanismResult, projectMotionSearchResult } from "./motion-library-output.js";
import { latestLibraryAttempt as latestAttempt } from "./library-job.js";

const id = z.string().regex(/^\d{3}-m\d{2}$/u);
const fingerprint = z.string().regex(/^[a-f0-9]{64}$/u);
const choices = (field: string) => z.array(z.enum(termsFor(field) as [string, ...string[]])).max(20).optional();
const failure = (error: unknown, sideEffects: "none" | "unknown" = "none") => ({ isError: true, content: [{ type: "text" as const, text: JSON.stringify({code:error instanceof DomainError?error.code:"MOTION_LIBRARY_UNAVAILABLE",message:error instanceof Error?error.message:"参考资料读取失败",sideEffects}) }] });

export function registerMotionLibraryTools(server: McpServer, root = resolve(process.cwd(), "references/motion-cases/skillry"), app?: EditingApplication, projectIdFrom?: (id?: string) => string) {
  // 启动器将 cwd 固定到源码仓库；只接收编号，调用方不能指定磁盘路径。
  server.registerTool("search_motion_mechanisms", {
    title:"查找运动机制",
    description:"视觉作者依据场面目标检索完整运动和连接。语义查询需要当前项目，待完成时返回空候选和原 Job；track_job 成功后按 readback 读取语义候选，同一查询翻页复用结果。编号、选择串和浏览无需语义任务。采用前读取正文和实际媒体。",
    annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:true},
    inputSchema:{project_id:z.string().optional(),query:z.string().max(1000).optional(),stages:z.array(z.string().min(1).max(1000)).min(1).max(8).optional(),
      categories:choices('categories'),actions:choices('actions'),entry:choices('entry'),exit:choices('exit'),holds:choices('holds'),exclude_actions:choices('actions'),
      similar_to:id.optional(),before:id.optional(),after:id.optional(),ids:z.array(id).min(1).max(40).optional(),
      selection:z.string().max(16000).optional(),offset:z.number().int().min(0).optional(),limit:z.number().int().min(1).max(50).optional(),source_sha256:fingerprint.optional()}
  }, async ({project_id,...request}) => {
    let sideEffects: "none" | "unknown" = "none";
    try {
      const index=loadLibraryIndex(root);
      const lexical=searchLibraryIndex(index,request);
      let result:Record<string,unknown>={...lexical,diagnostics:{mode:"lexical",semantic_used:false,reason:"精确定位或无文本需求"}};
      if(!request.ids&&!request.selection&&(request.query?.trim()||request.stages||request.similar_to||request.before||request.after)) {
        if(!app||!projectIdFrom) throw new DomainError("语义检索未连接项目任务服务；仍可按编号读取或分页浏览", "MOTION_SEMANTIC_UNAVAILABLE");
        const projectId=projectIdFrom(project_id);
        const config=readRuntimeConfig();
        const {offset,limit,source_sha256,...searchRequest}=request;
        const normalized={...searchRequest,
          ...(searchRequest.query!==undefined?{query:searchRequest.query.trim().normalize("NFC")}:{}),
          ...(searchRequest.stages?{stages:searchRequest.stages.map(stage=>stage.trim().normalize("NFC"))}:{})};
        const payload={request:normalized,source_sha256:lexical.source_sha256,resultFormatVersion:"semantic-pools-v1",modelConfig:{...config.semantic,apiBaseUrl:config.bridge.apiBaseUrl},textVersion:MOTION_TEXT_VERSION,instructionVersion:MOTION_INSTRUCTION_VERSION,instruction:MOTION_QUERY_INSTRUCTION};
        sideEffects="unknown";
        const submitted=app.repository.createJob({projectId,kind:"motion_library_search",payload,idempotencyKey:`motion-library:${digest(payload)}`});
        // 显式恢复后沿同一请求返回最新尝试，不自动重放失败或未知提交。
        const job=latestAttempt(app,projectId,submitted);
        if(job.status==="succeeded"&&job.result) {
          if(index.source_sha256!==job.payload.source_sha256) throw new DomainError("机制原文已变化，请重新检索", "MOTION_LIBRARY_STALE");
          const pools=job.result.pools as Record<string,unknown>;
          const source=index.mechanisms.find(entry=>entry.id===(normalized.similar_to??normalized.before??normalized.after));
          const query=String(normalized.query??source?.search_text??"");
          result={...searchLibraryIndex(index,{...normalized,offset,limit,source_sha256},normalized.stages?pools:{candidates:pools[query]}),diagnostics:{...(job.result.diagnostics as Record<string,unknown>),job_id:job.id,status:job.status}};
          if(loadLibraryIndex(root).source_sha256!==index.source_sha256) throw new DomainError("机制原文已变化，请重新检索", "MOTION_LIBRARY_STALE");
        } else {
          // 等待和失败时保留任务身份，避免把词法候选误认为最终语义结果。
          result = {
            ...lexical,
            cards: [],
            groups: undefined,
            connections: undefined,
            total: 0,
            next_offset: null,
            exhausted: false,
            diagnostics: {
              mode: "semantic",
              semantic_used: false,
              source_sha256: lexical.source_sha256,
              job_id: job.id,
              status: job.status,
              reason: job.error ?? "语义检索正在准备；track_job 后按 readback 读取候选",
              failure: job.result?.diagnostic,
              recovery: motionJobRecovery(job)
            }
          };
        }
      }
      return {content:[{type:"text" as const,text:JSON.stringify(projectMotionSearchResult(result))}]};
    }catch(error){return failure(error,sideEffects);}
  });
  server.registerTool("read_motion_mechanism", {
    title:"读取运动指令和分镜",
    description:"读取完整机制正文、来源和各项实际媒体状态，分镜可用时附带实际格式图片。视觉作者查看视频中的选定过程及必要前后连接。part=overview 读取原片总览，source_sha256 用于核对资料版本。",
    annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
    inputSchema:{id,part:z.enum(['mechanism','overview']).optional(),source_sha256:fingerprint.optional(),include_storyboard:z.boolean().optional()}
  }, async (request) => {
    try {
      const loaded=readLibraryMechanism(root,request);
      const content: Array<{type:"text";text:string}|{type:"image";data:string;mimeType:string}>=[{type:"text",text:JSON.stringify(projectMotionMechanismResult(loaded.result))}];
      if(loaded.image)content.push({type:"image",...loaded.image});
      return {content};
    } catch(error) {return failure(error);}
  });
  if(app&&projectIdFrom) server.registerTool("analyze_motion_reference", {
    title:"读取原片运动范围",
    description:"需要补充实际构图、美术与运动过程的观察时，按库编号和原片毫秒范围提交异步理解，最多15秒。track_job 读取真实描述、来源与采样边界；不修改机制原文或项目 Revision，不创建素材审核。失败任务沿 retry_media_job 显式恢复。",
    annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:true},
    inputSchema:{project_id:z.string().optional(),id,source_sha256:fingerprint,range:timeRangeSchema}
  },async({project_id,...request})=>{
    let sideEffects: "none" | "unknown" = "none";
    try{
      if(request.range.endMs-request.range.startMs>15000)throw new Error("原片范围不能超过15秒");
      readLibraryMechanism(root,{id:request.id,source_sha256:request.source_sha256,include_storyboard:false});
      // 提示参与任务身份，避免新观察要求命中旧的成功 Job；Worker 沿提交时的提示执行。
      const config=readRuntimeConfig(),payload={...request,videoPrompt:MOTION_VIDEO_PROMPT,modelConfig:{...config.semantic,apiBaseUrl:config.bridge.apiBaseUrl}};
      const projectId=projectIdFrom(project_id);
      sideEffects="unknown";
      const submitted=app.repository.createJob({projectId,kind:"motion_reference_analysis",payload,idempotencyKey:`motion-reference:${digest(payload)}`});
      const job=latestAttempt(app,projectId,submitted);
      return {content:[{type:"text" as const,text:JSON.stringify(projectMotionJob(job))}]};
    }catch(error){return failure(error,sideEffects);}
  });
}
