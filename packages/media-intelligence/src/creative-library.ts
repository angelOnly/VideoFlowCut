import { digest } from "./index.js";

export const CREATIVE_TEXT_VERSION = "creative-expression-v1";
export const CREATIVE_INSTRUCTION_VERSION = "creative-query-v1";
export const CREATIVE_QUERY_INSTRUCTION = "根据创作者用自然语言描述的内容关系、想激发的观众兴趣或情绪、希望形成的发现与材料条件，检索可迁移的完整视觉表达方案。优先比较案例怎样产生观看价值、怎样组织材料及推进观众体验，而不是仅匹配同一题材、人物、包装、动效词或局部动作。";

/** 一卡保留三节完整表达，去掉出处、路径和图链，不另造摘要或分类。 */
export function creativeSearchText(card: {title:string;summary:string;use_when:string;body:string}): string {
  const sections = [...card.body.replace(/\r\n?/gu,"\n").matchAll(/^## [^\n]+\n([\s\S]*?)(?=^## |(?![\s\S]))/gmu)].map(match=>match[1]);
  return [card.title,card.summary,card.use_when,...sections].join("\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu,"").replace(/\[([^\]]+)\]\([^)]*\)/gu,"$1")
    .replace(/以上为作品分析，不代表作者自述或已测量的观众反应。|以上为依据画面的分析，非作者自述；预期观看效果未经观众测试。/gu,"")
    .replace(/\b\d{1,2}:\d{2}(?:\.\d+)?/gu,"").trim();
}
// 不带整库快照：单卡变更仅重算该卡；模型、工作流及任务说明仍参与身份。
export const creativeCacheKey = (identity:unknown,config:unknown,mode:string) =>
  `creative:${digest([identity,config,1024,mode,CREATIVE_TEXT_VERSION,CREATIVE_INSTRUCTION_VERSION,CREATIVE_QUERY_INSTRUCTION])}`;
