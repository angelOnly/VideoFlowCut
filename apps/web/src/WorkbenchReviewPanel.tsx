import { useEffect, useRef, useState } from "react";
import type { EditorialQualityReview, EditorialReviewCategory, EditorialReviewFinding, EditorialReviewPass, EditorialReviewSeverity } from "@videocut/contracts";
import { api } from "./api";

type Method = "frames" | "continuous_video" | "audio" | "audiovisual";

/** 审阅只记录明确声明的观察；播放和定位本身不产生结论。 */
export function WorkbenchReviewPanel({ projectId, productionRunId, onRunChange, revision, startFrame, endFrame, objectId, onLocate, onRecheck, onRepair }: {
  projectId: string; revision: number; startFrame: number; endFrame: number; objectId?: string;
  productionRunId?: string; onRunChange: (runId: string) => void;
  onLocate: (finding: EditorialReviewFinding) => void;
  onRecheck: (finding: EditorialReviewFinding) => Promise<void>;
  onRepair: (finding: EditorialReviewFinding) => void;
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const runId = useRef<string | undefined>(undefined);

  const refresh = async () => setReview(await api.editorialReview(projectId, revision));
  useEffect(() => {
    let active = true;
    void api.editorialReview(projectId, revision).then(value => { if (active) setReview(value); }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : String(error)); });
    return () => { active = false; };
  }, [projectId, revision]);

  const resolved = new Set(review?.resolutions?.map(entry => entry.findingId) ?? []);
  const open = (review?.findings ?? []).filter(entry => !resolved.has(entry.id));
  const save = async (mode: "observation" | "finding" | "resolution") => {
    if (!observer.trim() || !observation.trim() || endFrame <= startFrame) { setMessage("请填写观察者、实际观察与有效帧范围。"); return; }
    if (mode === "finding" && !impact.trim()) { setMessage("记录问题时请说明影响。"); return; }
    if (mode === "resolution" && !findingId) { setMessage("请先选择要复查的问题。"); return; }
    setBusy(true); setMessage("");
    try {
      const result = await api.recordWorkbenchObservation(projectId, {
        runId: productionRunId ?? runId.current, revision, pass, method, observer, observation, startFrame, endFrame,
        ...(mode === "finding" ? { finding: { category, severity, summary: observation, impact, objectId } } : {})
      });
      runId.current = result.runId;
      onRunChange(result.runId);
      if (mode === "resolution") {
        const evidence = result.review.evidenceRecords?.at(-1);
        if (!evidence) throw new Error("观察已保存，但未取得可复查的证据标识。");
        try {
          await api.resolveEditorialFinding(projectId, { runId: result.runId, revision, pass, findingId, evidenceIds: [evidence.id], note: observation, ...(captionOnly ? { scope: "caption_text" } : {}) });
        } catch (error) {
          await refresh();
          throw new Error(`观察已保存，问题尚未关闭：${error instanceof Error ? error.message : String(error)}`);
        }
      }
      await refresh();
      setMessage(mode === "resolution" ? "已保存观察并复查该问题。" : mode === "finding" ? "已记录问题，可交原负责人处理。" : "已保存实际观察。");
      setObservation(""); setImpact("");
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
    <label>问题影响（记录问题时填写）<input aria-label="问题影响" value={impact} onChange={event => setImpact(event.target.value)} /></label>
    <div className="workbench-review-actions"><button disabled={busy} onClick={() => void save("observation")}>保存观察</button><button disabled={busy} onClick={() => void save("finding")}>记录问题</button></div>
    {open.length > 0 && <>
      <label>复查问题 <select aria-label="复查问题" value={findingId} onChange={event => setFindingId(event.target.value)}><option value="">选择问题</option>{open.map(finding => <option key={finding.id} value={finding.id}>R{finding.revision} · {finding.summary}</option>)}</select></label>
      <label><input type="checkbox" checked={captionOnly} onChange={event => setCaptionOnly(event.target.checked)} />仅复查字幕文字单帧</label>
      <button disabled={busy || !findingId} onClick={() => void save("resolution")}>保存观察并关闭已解决问题</button>
    </>}
    {message && <p role="status">{message}</p>}
    {open.map(finding => <article className="workbench-finding" key={finding.id}><strong>R{finding.revision} · {finding.summary}</strong><span>{finding.impact}</span><div><button onClick={() => onLocate(finding)}>定位原问题</button><button onClick={() => void (async () => {
      try {
        await onRecheck(finding);
        setFindingId(finding.id); setPass(finding.pass);
        setMethod(finding.pass === "audio_only" ? "audio" : finding.pass === "mute_visual" ? "continuous_video" : "audiovisual");
        setCaptionOnly(false); setMessage("已定位本版复查范围；请实际检查后填写观察。");
      } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    })()}>在本版复查</button><button onClick={() => onRepair(finding)}>准备返修</button></div></article>)}
  </details>;
}
