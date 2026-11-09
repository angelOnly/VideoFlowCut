import { digest } from "./index.js";

export const CREATIVE_TEXT_VERSION = "creative-expression-v1";
export const CREATIVE_INSTRUCTION_VERSION = "creative-query-v2";
export const CREATIVE_QUERY_INSTRUCTION = "根据内容关系和实际材料检索可采用的完整视觉场面。比较素材怎样排列与切换，主体、文字和背景怎样共同构图，画面如何连续变化并承接内容。结合题材语境与材料条件判断适用性，保留跨题材的可用表达。";

/** 一卡保留三节完整表达，去掉出处、路径和图链，不另造摘要或分类。 */
export function creativeSearchText(card: {title:string;summary:string;use_when:string;body:string}): string {
  const sections = [...card.body.replace(/\r\n?/gu,"\n").matchAll(/^## [^\n]+\n([\s\S]*?)(?=^## |(?![\s\S]))/gmu)].map(match=>match[1]);
  return [card.title,card.summary,card.use_when,...sections].join("\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu,"").replace(/\[([^\]]+)\]\([^)]*\)/gu,"$1")
    .replace(/以上为作品分析，不代表作者自述或已测量的观众反应。|以上为依据画面的分析，非作者自述；预期观看效果未经观众测试。/gu,"")
    .replace(/\b\d{1,2}:\d{2}(?:\.\d+)?/gu,"").trim();
}
// 不带整库快照：单卡变更仅重算该卡；模型、工作流及任务说明仍参与身份。
export const creativeCacheKey = (identity:unknown,config:unknown,mode:string, snapshot = {textVersion:CREATIVE_TEXT_VERSION,instructionVersion:CREATIVE_INSTRUCTION_VERSION,instruction:CREATIVE_QUERY_INSTRUCTION}) =>
  `creative:${digest([identity,config,1024,mode,snapshot.textVersion,snapshot.instructionVersion,snapshot.instruction])}`;
