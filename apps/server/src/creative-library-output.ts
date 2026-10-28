type Data=Record<string,unknown>;
/** 对外仅保留完整卡候选和任务诊断，不透传向量、模型正文或内部检查点。 */
export function projectCreativeSearchResult(result:Data):Data {
  const fields=["source_sha256","catalogue_case_count","processed_cases","library_count","total","offset","next_offset","exhausted","cards","observation"];
  const diagnostics=result.diagnostics as Data|undefined;
  const diagnosticFields=["mode","semantic_used","source_sha256","job_id","status","reason","failure","recovery","model","workflow","schema","instruction_version","document_chunks","cache_hits","encoded_texts","elapsed_ms"];
  return {...Object.fromEntries(fields.filter(key=>result[key]!==undefined).map(key=>[key,result[key]])),
    ...(diagnostics?{diagnostics:Object.fromEntries(diagnosticFields.filter(key=>diagnostics[key]!==undefined).map(key=>[key,diagnostics[key]]))}:{})};
}
