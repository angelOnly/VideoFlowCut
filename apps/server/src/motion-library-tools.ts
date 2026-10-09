import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolve } from "node:path";
import { z } from "zod";
import { searchLibrary, readLibraryMechanism } from "../../../references/motion-cases/skillry/tools/library-store.mjs";
import { termsFor } from "../../../references/motion-cases/skillry/taxonomy.mjs";

const id = z.string().regex(/^\d{3}-m\d{2}$/u);
const fingerprint = z.string().regex(/^[a-f0-9]{64}$/u);
const choices = (field: string) => z.array(z.enum(termsFor(field) as [string, ...string[]])).max(20).optional();
const failure = (error: unknown) => ({ isError: true, content: [{ type: "text" as const, text: JSON.stringify({code:"MOTION_LIBRARY_UNAVAILABLE",message:error instanceof Error?error.message:"参考资料读取失败",sideEffects:"none"}) }] });

export function registerMotionLibraryTools(server: McpServer, root = resolve(process.cwd(), "references/motion-cases/skillry")) {
  // 启动器将 cwd 固定到源码仓库；只接收编号，调用方不能指定磁盘路径。
  server.registerTool("search_motion_mechanisms", {
    title:"查找运动机制",
    description:"只读项目参考库。按自然语言运动描述、当前状态/保持条件、相似机制或前后接续召回候选；stages 分阶段查找。selection 读回网页候选链接中的顺序与采用项。互斥方式：stages/similar_to/before/after/ids/selection。返回词表、匹配依据、来源指纹、比较页和原文入口；本地文本排序不证明连贯或观感。",
    annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
    inputSchema:{query:z.string().max(1000).optional(),stages:z.array(z.string().min(1).max(1000)).min(1).max(8).optional(),
      categories:choices('categories'),actions:choices('actions'),entry:choices('entry'),exit:choices('exit'),holds:choices('holds'),exclude_actions:choices('actions'),
      similar_to:id.optional(),before:id.optional(),after:id.optional(),ids:z.array(id).min(1).max(40).optional(),
      selection:z.string().max(16000).optional(),offset:z.number().int().min(0).optional(),limit:z.number().int().min(1).max(50).optional(),source_sha256:fingerprint.optional()}
  }, async (request) => {try{return {content:[{type:"text" as const,text:JSON.stringify(searchLibrary(root,request))}]};}catch(error){return failure(error);}});
  server.registerTool("read_motion_mechanism", {
    title:"读取运动指令和分镜",
    description:"只读指定运动机制的完整 Markdown 和 JPEG 分镜。必要时 part=overview 读取原片总览与64宫格。传查询返回的 source_sha256 可拒绝过期采用；不会播放、生成或修改视频。",
    annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
    inputSchema:{id,part:z.enum(['mechanism','overview']).optional(),source_sha256:fingerprint.optional(),include_storyboard:z.boolean().optional()}
  }, async (request) => {
    try {
      const loaded=readLibraryMechanism(root,request);
      const content: Array<{type:"text";text:string}|{type:"image";data:string;mimeType:string}>=[{type:"text",text:JSON.stringify(loaded.result)}];
      if(loaded.image)content.push({type:"image",data:loaded.image,mimeType:"image/jpeg"});
      return {content};
    } catch(error) {return failure(error);}
  });
}
