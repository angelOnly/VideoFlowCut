import { resolve } from "node:path";
import type { EditingApplication } from "@videocut/application";
import type { ComfyUIBridgeClient } from "@videocut/bridge";
import type { JobRecord } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";
import { loadCreativeIndex,assertCreativeSnapshot,creativeCard } from "../../../references/motion-cases/skillry/tools/creative-library.mjs";
import { creativeSearchText,creativeCacheKey,CREATIVE_TEXT_VERSION } from "../../../packages/media-intelligence/src/creative-library.js";
import { runLibrarySemanticSearch } from "./library-semantic.js";

/** 创意仅适配完整卡片，Job 生命周期及向量执行继续共用现有链路。 */
export async function searchCreativeLibrary(app:EditingApplication,job:JobRecord,bridge:ComfyUIBridgeClient,root=resolve(process.cwd(),"references/motion-cases/skillry")) {
  const index=loadCreativeIndex(root);
  assertCreativeSnapshot(index,String(job.payload.source_sha256));
  if (typeof job.payload.instruction !== "string" || typeof job.payload.instructionVersion !== "string" || job.payload.textVersion !== CREATIVE_TEXT_VERSION) {
    throw new DomainError("检索任务缺少有效指令快照，请重新检索", "LIBRARY_INSTRUCTION_SNAPSHOT_MISSING");
  }
  const snapshot = { instruction: job.payload.instruction, instructionVersion: job.payload.instructionVersion, textVersion: CREATIVE_TEXT_VERSION };
  const query=String((job.payload.request as {query:string}).query);
  return runLibrarySemanticSearch(app,job,bridge,{
    namespace:"creative",source:index.source_sha256,instruction:snapshot.instruction,instructionVersion:snapshot.instructionVersion,
    documents:index.cards.map(card=>{const text=creativeSearchText(card);return {id:card.id,text,identity:[card.id,text]};}),queries:[query],cacheKey:(identity,version,mode)=>creativeCacheKey(identity,version,mode,snapshot),
    assertCurrent:()=>assertCreativeSnapshot(loadCreativeIndex(root),index.source_sha256),
    project:pools=>({source_sha256:index.source_sha256,cards:pools[query].map(entry=>({...creativeCard(index.cards.find(card=>card.id===entry.id)!),score:entry.score}))})
  });
}
