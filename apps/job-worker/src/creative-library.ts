import { resolve } from "node:path";
import type { EditingApplication } from "@videocut/application";
import type { ComfyUIBridgeClient } from "@videocut/bridge";
import type { JobRecord } from "@videocut/contracts";
import { loadCreativeIndex,assertCreativeSnapshot,creativeCard } from "../../../references/motion-cases/skillry/tools/creative-library.mjs";
import { creativeSearchText,creativeCacheKey,CREATIVE_QUERY_INSTRUCTION,CREATIVE_INSTRUCTION_VERSION } from "../../../packages/media-intelligence/src/creative-library.js";
import { runLibrarySemanticSearch } from "./library-semantic.js";

/** 创意仅适配完整卡片，Job 生命周期及向量执行继续共用现有链路。 */
export async function searchCreativeLibrary(app:EditingApplication,job:JobRecord,bridge:ComfyUIBridgeClient,root=resolve(process.cwd(),"references/motion-cases/skillry")) {
  const index=loadCreativeIndex(root);
  assertCreativeSnapshot(index,String(job.payload.source_sha256));
  const query=String((job.payload.request as {query:string}).query);
  return runLibrarySemanticSearch(app,job,bridge,{
    namespace:"creative",source:index.source_sha256,instruction:CREATIVE_QUERY_INSTRUCTION,instructionVersion:CREATIVE_INSTRUCTION_VERSION,
    documents:index.cards.map(card=>{const text=creativeSearchText(card);return {id:card.id,text,identity:[card.id,text]};}),queries:[query],cacheKey:creativeCacheKey,
    assertCurrent:()=>assertCreativeSnapshot(loadCreativeIndex(root),index.source_sha256),
    project:pools=>({source_sha256:index.source_sha256,cards:pools[query].map(entry=>({...creativeCard(index.cards.find(card=>card.id===entry.id)!),score:entry.score}))})
  });
}
