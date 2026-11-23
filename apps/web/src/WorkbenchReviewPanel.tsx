import { useEffect, useRef, useState } from "react";
import type { EditorialQualityReview, EditorialReviewCategory, EditorialReviewFinding, EditorialReviewPass, EditorialReviewSeverity, ReferenceReviewRef, VisualResponsibility } from "@videocut/contracts";
import { api, API_BASE } from "./api";

type Method = "frames" | "continuous_video" | "audio" | "audiovisual";
type ObservationPayload = Parameters<typeof api.recordWorkbenchObservation>[1];
type ObservationResult = Awaited<ReturnType<typeof api.recordWorkbenchObservation>>;
type ReferenceDetails = { originalRelation: string; actualImplementation: string; difference: string; outcome: "" | "confirmed" | "issue" | "inconclusive"; impact: string };
const emptyReferenceDetails = (): ReferenceDetails => ({ originalRelation: "", actualImplementation: "", difference: "", outcome: "", impact: "" });
const responsibilityLabels: Record<VisualResponsibility, string> = { creative_research: "创意", motion_research: "动效机制", visual_design: "美术视觉" };
type ResponsibilityDetails = { selection: string; outcome: "" | "confirmed" | "issue" | "inconclusive"; observation: string; impact: string };
const emptyResponsibilityDetails = (): ResponsibilityDetails => ({ selection: "", outcome: "", observation: "", impact: "" });
const referenceIdentity = (ref: ReferenceReviewRef): ReferenceReviewRef => ({ productionRunId: ref.productionRunId, decisionId: ref.decisionId,
  sceneId: ref.sceneId, referenceKind: ref.referenceKind, referenceId: ref.referenceId, sourceSha256: ref.sourceSha256,
  targetRole: ref.targetRole, startMs: ref.startMs, endMs: ref.endMs });
const referenceKey = (ref: ReferenceReviewRef) => JSON.stringify(referenceIdentity(ref));
const sameReference = (first: ReferenceReviewRef, second: ReferenceReviewRef) => first.sceneId === second.sceneId
  && first.referenceKind === second.referenceKind && first.referenceId === second.referenceId && first.sourceSha256 === second.sourceSha256
  && first.targetRole === second.targetRole && first.startMs === second.startMs && first.endMs === second.endMs;

/** 审阅只记录明确声明的观察；播放和定位本身不产生结论。 */
export function WorkbenchReviewPanel({ projectId, productionRunId, onRunChange, revision, startFrame, endFrame, objectId, adoptionRefs, onLocate, onRecheck, onRepair, onPlayRange }: {
  projectId: string; revision: number; startFrame: number; endFrame: number; objectId?: string;
  productionRunId?: string; onRunChange: (runId: string) => void;
  adoptionRefs: import("@videocut/contracts").CreativeAdoptionRef[];
  onLocate: (finding: EditorialReviewFinding) => void;
  onRecheck: (finding: EditorialReviewFinding) => Promise<void>;
  onRepair: (finding: EditorialReviewFinding) => void;
  onPlayRange: (range: { startFrame: number; endFrame: number }) => void;
}) {
  const [review, setReview] = useState<EditorialQualityReview | null>(null);
  const [observer, setObserver] = useState("");
  const [observation, setObservation] = useState("");
  const [impact, setImpact] = useState("");
  const [method, setMethod] = useState<Method>("frames");
  const [pass, setPass] = useState<EditorialReviewPass>("mute_visual");
  const [category, setCategory] = useState<EditorialReviewCategory>("motion");
  const [severity, setSeverity] = useState<EditorialReviewSeverity>("warning");
  const [findingId, setFindingId] = useState("");
  const [captionOnly, setCaptionOnly] = useState(false);
  const [comparedReferences, setComparedReferences] = useState(false);
  const [comparisons, setComparisons] = useState<Awaited<ReturnType<typeof api.referenceComparisons>>>([]);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [referenceDetails, setReferenceDetails] = useState<Record<string, ReferenceDetails>>({});
  const [responsibilityOptions, setResponsibilityOptions] = useState<NonNullable<Awaited<ReturnType<typeof api.productionStatus>>["responsibilityOptions"]>>([]);
  const [responsibilityDetails, setResponsibilityDetails] = useState<Partial<Record<VisualResponsibility, ResponsibilityDetails>>>({});
  const [responsibilityIssues, setResponsibilityIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const runId = useRef<string | undefined>(undefined);
  const pending = useRef<{ signature: string; payload: ObservationPayload; result?: ObservationResult; resolutionOperationId: string } | undefined>(undefined);

  const refresh = async (currentRunId = productionRunId) => {
    setReview(await api.editorialReview(projectId, revision));
    if (currentRunId) {
      const status = await api.productionStatus(projectId, currentRunId);
      setResponsibilityOptions(status.responsibilityOptions ?? []);
      setResponsibilityIssues(status.completion?.coordinationIssues.filter(issue => issue.code === "RESPONSIBILITY_REVIEW_PENDING"
        && (issue.scope.kind !== "frames" || issue.scope.startFrame < endFrame && issue.scope.endFrame > startFrame)).map(issue => issue.message) ?? []);
    }
  };
  useEffect(() => {
    let active = true;
    void api.editorialReview(projectId, revision).then(value => { if (active) setReview(value); }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : String(error)); });
    return () => { active = false; };
  }, [projectId, revision]);
  useEffect(() => { setComparedReferences(false); setSelectedReferences([]); setComparisons([]); setReferenceDetails({}); }, [projectId, revision]);
  useEffect(() => {
    if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || startFrame < 0 || endFrame <= startFrame) {
      setComparisons([]);
      return;
    }
    const controller = new AbortController();
    void api.referenceComparisons(projectId, revision, startFrame, endFrame, controller.signal)
      .then(entries => { if (!controller.signal.aborted) setComparisons(entries); })
      .catch(error => { if (!controller.signal.aborted) { setComparisons([]); setMessage(error.message); } });
    return () => controller.abort();
  }, [projectId, revision, startFrame, endFrame]);
  useEffect(() => {
    if (!productionRunId) { setResponsibilityOptions([]); setResponsibilityIssues([]); return; }
    let active = true;
    void api.productionStatus(projectId, productionRunId).then(status => {
      if (!active) return;
      setResponsibilityOptions(status.responsibilityOptions ?? []);
      setResponsibilityIssues(status.completion?.coordinationIssues.filter(issue => issue.code === "RESPONSIBILITY_REVIEW_PENDING"
        && (issue.scope.kind !== "frames" || issue.scope.startFrame < endFrame && issue.scope.endFrame > startFrame)).map(issue => issue.message) ?? []);
    }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : String(error)); });
    return () => { active = false; };
  }, [projectId, productionRunId, revision, startFrame, endFrame]);
  useEffect(() => { runId.current = undefined; pending.current = undefined; }, [projectId]);

  const resolved = new Set(review?.resolutions?.map(entry => entry.findingId) ?? []);
  const open = (review?.findings ?? []).filter(entry => !resolved.has(entry.id));
  const referenceBasis = new Map<string, typeof comparisons>();
  for (const entry of comparisons) {
    const key = referenceKey(entry.identity);
    const matching = referenceBasis.get(key) ?? [];
    matching.push(entry);
    referenceBasis.set(key, matching);
  }
  const visibleReferences = [...referenceBasis.values()].map(entries => entries[0]!.identity);
  const basisText = (key: string) => referenceBasis.get(key)?.[0]?.observations
    .filter(item => item.observedRelation?.trim()).map(item => `${item.startMs ?? "?"}–${item.endMs ?? "?"} 毫秒  ${item.observedRelation}`).join("\n");
  const prepareReferenceRecheck = (finding: EditorialReviewFinding) => {
    if (!finding.referenceReview) return;
    const ref = visibleReferences.find(item => sameReference(item, finding.referenceReview!)) ?? finding.referenceReview;
    const key = referenceKey(ref);
    setSelectedReferences([key]);
    setReferenceDetails({ [key]: { ...emptyReferenceDetails(), originalRelation: finding.referenceReview.originalRelation ?? "" } });
  };
  const save = async (mode: "observation" | "finding" | "resolution") => {
    if (!observer.trim() || !observation.trim() || endFrame <= startFrame) { setMessage("请填写观察者、实际观察与有效帧范围。"); return; }
    if (mode === "finding" && !impact.trim()) { setMessage("记录问题时请说明影响。"); return; }
    if (mode === "resolution" && !findingId) { setMessage("请先选择要复查的问题。"); return; }
    const selected = visibleReferences.filter(ref => selectedReferences.includes(referenceKey(ref)));
    if (selected.some(ref => {
      const key = referenceKey(ref), details = referenceDetails[key];
      return !(basisText(key) || details?.originalRelation.trim()) || !details?.actualImplementation.trim()
        || !details.difference.trim() || !details.outcome || details.outcome === "issue" && !details.impact.trim();
    })) {
      setMessage("请逐条填写原片关系、本片实现、差异和结论。需要修复时说明影响。"); return;
    }
    if (Object.values(responsibilityDetails).some(details => details?.selection && (!details.outcome || !details.observation.trim()
      || details.outcome === "issue" && !details.impact.trim()))) {
      setMessage("请填写所选职责的实际观察和结论，发现问题时说明影响。"); return;
    }
    if (Object.entries(responsibilityDetails).some(([responsibility, details]) => details?.selection && !responsibilityOptions.some(option =>
      option.responsibility === responsibility && option.decisions.some(decision => JSON.stringify([option.assignmentId, decision.id]) === details.selection)))) {
      setMessage("职责判断已变化，请重新选择本次复核依据。"); return;
    }
    setBusy(true); setMessage("");
    try {
      const fields = {
        revision, pass, method, observer, observation, startFrame, endFrame,
        ...(comparedReferences && !visibleReferences.length ? { adoptionRefs } : {}),
        ...(selected.length ? { referenceReviews: selected
          .map(ref => { const details = referenceDetails[referenceKey(ref)];
            const finding = open.find(item => item.id === findingId && item.referenceReview && sameReference(item.referenceReview, ref));
            return { ...referenceIdentity(ref), ...details, originalRelation: basisText(referenceKey(ref)) || details.originalRelation, outcome: details.outcome as NonNullable<ReferenceReviewRef["outcome"]>,
              impact: details.impact.trim() || undefined, ...(finding ? { findingId: finding.id } : {}) }; }) } : {}),
        responsibilityReviews: (Object.keys(responsibilityLabels) as VisualResponsibility[]).flatMap(responsibility => {
          const details = responsibilityDetails[responsibility];
          if (!details?.selection || !details.outcome) return [];
          const selected = responsibilityOptions.flatMap(option => option.decisions.map(decision => ({ option, decision })))
            .find(item => JSON.stringify([item.option.assignmentId, item.decision.id]) === details.selection && item.option.responsibility === responsibility);
          if (!selected) return [];
          const finding = open.find(item => item.id === findingId && item.responsibilityReview?.responsibility === responsibility);
          return [{ responsibility, assignmentId: selected.option.assignmentId, decisionIds: [selected.decision.id], outcome: details.outcome,
            observation: details.observation, impact: details.impact.trim() || undefined, ...(finding ? { findingId: finding.id } : {}) }];
        }),
        ...(mode === "finding" ? { finding: { category, severity, summary: observation, impact, objectId } } : {})
      };
      const signature = JSON.stringify({ projectId, mode, fields, ...(mode === "resolution" ? { findingId, captionOnly } : {}) });
      const currentRunId = productionRunId ?? runId.current;
      let submission = pending.current;
      if (!submission || submission.signature !== signature || (currentRunId !== submission.payload.runId && currentRunId !== submission.result?.runId)) {
        submission = { signature, payload: { ...fields, runId: currentRunId, operationId: crypto.randomUUID() }, resolutionOperationId: crypto.randomUUID() };
        pending.current = submission;
      }
      // 结果未知时重用同一提交；复查失败只重试尚未确认的关闭操作。
      const result = submission.result ?? await api.recordWorkbenchObservation(projectId, submission.payload);
      submission.result = result;
      runId.current = result.runId;
      onRunChange(result.runId);
      if (mode === "resolution") {
        if (!result.evidenceId) throw new Error("观察已保存，但未取得可复查的证据标识。");
        try {
          await api.resolveEditorialFinding(projectId, { runId: result.runId, operationId: submission.resolutionOperationId, revision, pass, findingId, evidenceIds: [result.evidenceId], note: observation, ...(captionOnly ? { scope: "caption_text" } : {}) });
        } catch (error) {
          await refresh(result.runId);
          throw new Error(`观察已保存，问题尚未关闭：${error instanceof Error ? error.message : String(error)}`);
        }
      }
      await refresh(result.runId);
      pending.current = undefined;
      setMessage(mode === "resolution" ? "已保存观察并复查该问题。" : result.findingIds.length ? "已保存参考审阅并登记必修问题。" : mode === "finding" ? "已记录问题，可交原负责人处理。" : "已保存实际观察。");
      setObservation(""); setImpact(""); setSelectedReferences([]); setReferenceDetails({}); setResponsibilityDetails({});
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };

  return <details className="workbench-review" data-testid="workbench-review">
    <summary>审阅与返修 · R{revision} · F{startFrame}–{endFrame}（结束帧不含）</summary>
    <p>只记录实际看见或听见的内容；播放与抽帧不会自动表示审阅通过。</p>
    <div className="workbench-review-fields">
      <label>观察者 <input aria-label="观察者" value={observer} onChange={event => setObserver(event.target.value)} /></label>
      <label>观察方式 <select aria-label="观察方式" value={method} onChange={event => setMethod(event.target.value as Method)}>
        <option value="frames">静帧</option><option value="continuous_video">连续画面</option><option value="audio">声音</option><option value="audiovisual">连续声画</option>
      </select></label>
      <label>审阅类型 <select aria-label="审阅类型" value={pass} onChange={event => setPass(event.target.value as EditorialReviewPass)}>
        <option value="mute_visual">画面</option><option value="audio_only">声音</option><option value="audiovisual">声画</option><option value="first_viewer">首次观看</option><option value="mode_specific">专项</option>
      </select></label>
      <label>问题类别 <select aria-label="问题类别" value={category} onChange={event => setCategory(event.target.value as EditorialReviewCategory)}>
        <option value="motion">运动</option><option value="typography">文字排版</option><option value="semantic">内容</option><option value="pacing">节奏</option><option value="attention">注意力</option><option value="audio">声音</option><option value="mode_specific">专项</option>
      </select></label>
      <label>严重程度 <select aria-label="严重程度" value={severity} onChange={event => setSeverity(event.target.value as EditorialReviewSeverity)}>
        <option value="warning">提醒</option><option value="major">需要修复</option><option value="blocking">阻断</option><option value="minor">轻微</option><option value="suggestion">建议</option><option value="inconclusive">待确认</option>
      </select></label>
    </div>
    <label>实际观察<textarea aria-label="实际观察" value={observation} onChange={event => setObservation(event.target.value)} /></label>
    {responsibilityIssues.map(issue => <p key={issue}>{issue}</p>)}
    {productionRunId && (Object.keys(responsibilityLabels) as VisualResponsibility[]).map(responsibility => {
      const options = responsibilityOptions.filter(option => option.responsibility === responsibility);
      const details = responsibilityDetails[responsibility] ?? emptyResponsibilityDetails();
      const update = (field: keyof ResponsibilityDetails, value: string) => setResponsibilityDetails(current => ({
        ...current, [responsibility]: { ...details, [field]: value }
      }));
      return <div key={responsibility}>
        <label>{responsibilityLabels[responsibility]}复核依据<select aria-label={`${responsibilityLabels[responsibility]}复核依据`} value={details.selection} onChange={event => update("selection", event.target.value)}>
          <option value="">选择本次判断</option>
          {options.flatMap(option => option.decisions.map(decision => <option key={`${option.assignmentId}:${decision.id}`}
            value={JSON.stringify([option.assignmentId, decision.id])}>{option.agentId} · {decision.decision}</option>))}
        </select></label>
        {details.selection && <>
          <label>实际观察<textarea aria-label={`${responsibilityLabels[responsibility]}实际观察`} value={details.observation} onChange={event => update("observation", event.target.value)} /></label>
          <label>结论<select aria-label={`${responsibilityLabels[responsibility]}复核结论`} value={details.outcome} onChange={event => update("outcome", event.target.value)}>
            <option value="">选择结论</option><option value="confirmed">已确认</option><option value="issue">需要修复</option><option value="inconclusive">无法确认</option>
          </select></label>
          {details.outcome === "issue" && <label>问题影响<input aria-label={`${responsibilityLabels[responsibility]}问题影响`} value={details.impact} onChange={event => update("impact", event.target.value)} /></label>}
        </>}
      </div>;
    })}
    {visibleReferences.map(ref => {
      const key = referenceKey(ref);
      const entries = referenceBasis.get(key)!;
      const basis = entries[0]!;
      const originalRelation = basisText(key);
      const selected = selectedReferences.includes(key);
      const details = referenceDetails[key] ?? emptyReferenceDetails();
      const update = (field: keyof ReferenceDetails, value: string) => setReferenceDetails(current => ({
        ...current, [key]: { ...details, [field]: value }
      }));
      return <div key={key}>
        <details>
          <summary>{ref.referenceId} · {ref.targetRole} · {basis.purpose || "参考对照"}</summary>
          <p><strong>选片时的原片表现</strong></p>
          {basis.selection && <p>{basis.selection.decision} · {basis.selection.rationale}</p>}
          <ul>{basis.observations.map((item, index) => <li key={index}>
            {item.startMs ?? "?"}–{item.endMs ?? "?"} 毫秒 · {item.observedRelation}
            {item.decisionId !== basis.selection?.decisionId && <p>{item.decision} · {item.rationale}</p>}
          </li>)}</ul>
          {basis.mediaUrl && <a href={`${API_BASE}${basis.mediaUrl}#t=${ref.startMs / 1000},${ref.endMs / 1000}`} target="_blank" rel="noreferrer">打开这段参考</a>}
          <p><strong>导演采用后本片必须做到的表现</strong></p>
          <p>{basis.preserveRelation} · {basis.treatment}</p>
          {basis.assets.length > 0 && <ul>{basis.assets.map(asset => <li key={asset.assetId}>
            {asset.name ?? asset.assetId}{asset.sourceRanges.length > 0 && ` · 源片 ${asset.sourceRanges.map(range => `${range.startMs}–${range.endMs} 毫秒`).join("、")}`}
          </li>)}</ul>}
          <ol>{basis.sequence.map((step, index) => <li key={index}>
            {[step.purpose, step.action, step.retainedElements?.join("、"), step.transition].filter(Boolean).join(" · ")}
          </li>)}</ol>
          {basis.locked.length > 0 && <p>{basis.locked.join(" · ")}</p>}
          {entries.map(({ targetRange }) => <button type="button" key={`${targetRange.startFrame}:${targetRange.endFrame}`}
            onClick={() => onPlayRange(targetRange)}>播放本片对应范围 F{targetRange.startFrame}–{targetRange.endFrame}</button>)}
        </details>
        <label><input type="checkbox" checked={selected} onChange={event => setSelectedReferences(current =>
          event.target.checked ? [...current, key] : current.filter(item => item !== key))} />
          已对照 {ref.referenceId} · {ref.targetRole} · 原片 {ref.startMs}–{ref.endMs} 毫秒
        </label>
        {selected && <>
          {!originalRelation && <label>原片关系<textarea aria-label={`原片关系 ${ref.referenceId}`} value={details.originalRelation} onChange={event => update("originalRelation", event.target.value)} /></label>}
          <label>本片实现<textarea aria-label={`本片实现 ${ref.referenceId}`} value={details.actualImplementation} onChange={event => update("actualImplementation", event.target.value)} /></label>
          <label>缺失或偏差<textarea aria-label={`缺失或偏差 ${ref.referenceId}`} value={details.difference} onChange={event => update("difference", event.target.value)} /></label>
          <label>审阅结论<select aria-label={`审阅结论 ${ref.referenceId}`} value={details.outcome} onChange={event => update("outcome", event.target.value)}>
            <option value="">选择结论</option><option value="confirmed">已实现</option><option value="issue">需要修复</option><option value="inconclusive">无法确认</option>
          </select></label>
          {details.outcome === "issue" && <label>问题影响<input aria-label={`问题影响 ${ref.referenceId}`} value={details.impact} onChange={event => update("impact", event.target.value)} /></label>}
        </>}
      </div>;
    })}
    {!visibleReferences.length && adoptionRefs.length === 1 && <label><input type="checkbox" checked={comparedReferences} onChange={event => setComparedReferences(event.target.checked)} />已对照本范围当前采用的参考</label>}
    <label>问题影响（记录问题时填写）<input aria-label="问题影响" value={impact} onChange={event => setImpact(event.target.value)} /></label>
    <div className="workbench-review-actions"><button disabled={busy} onClick={() => void save("observation")}>{selectedReferences.length ? "保存参考审阅" : "保存观察"}</button>{!selectedReferences.length && <button disabled={busy} onClick={() => void save("finding")}>记录问题</button>}</div>
    {open.length > 0 && <>
      <label>复查问题 <select aria-label="复查问题" value={findingId} onChange={event => { setFindingId(event.target.value); const finding = open.find(item => item.id === event.target.value); if (finding) prepareReferenceRecheck(finding); }}><option value="">选择问题</option>{open.map(finding => <option key={finding.id} value={finding.id}>R{finding.revision} · {finding.summary}</option>)}</select></label>
      <label><input type="checkbox" checked={captionOnly} onChange={event => setCaptionOnly(event.target.checked)} />仅复查字幕文字单帧</label>
      <button disabled={busy || !findingId} onClick={() => void save("resolution")}>保存观察并关闭已解决问题</button>
    </>}
    {message && <p role="status">{message}</p>}
    {open.map(finding => <article className="workbench-finding" key={finding.id}><strong>R{finding.revision} · {finding.summary}</strong><span>{finding.impact}</span><div><button onClick={() => onLocate(finding)}>定位原问题</button><button onClick={() => void (async () => {
      try {
        await onRecheck(finding);
        setFindingId(finding.id); setPass(finding.pass);
        prepareReferenceRecheck(finding);
        setMethod(finding.pass === "audio_only" ? "audio" : finding.pass === "mute_visual" ? "continuous_video" : "audiovisual");
        setCaptionOnly(false); setMessage("已定位本版复查范围；请实际检查后填写观察。");
      } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    })()}>在本版复查</button><button onClick={() => onRepair(finding)}>准备返修</button></div></article>)}
  </details>;
}
