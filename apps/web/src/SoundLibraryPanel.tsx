import type { ProjectSnapshot } from "@videocut/contracts";
import { SOUND_SOURCES } from "../../../packages/asset-acquisition/src/sound-catalog";
import { API_BASE } from "./api";

/** 来源、待选候选和实际使用分开，浏览不产生工程写入。 */
export function SoundLibraryPanel({ snapshot }: { snapshot: ProjectSnapshot }) {
  const candidates = snapshot.assetCandidates.filter((entry) => entry.kind === "audio");
  const used = new Set(snapshot.audioCues.filter((cue) => cue.status === "ready").map((cue) => cue.assetId));
  const assets = snapshot.assets.filter((asset) => asset.kind === "audio" && (asset.role === "sfx" || used.has(asset.id)));
  return <section className="story-card" data-testid="sound-library">
    <strong>音效候选库</strong>
    <p>在线挑选，按需导入。网站与文件名只帮助找候选；试听合适、许可满足后才用于成片。</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {SOUND_SOURCES.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" style={{ border: "1px solid #ffffff25", padding: 10, borderRadius: 8, color: "inherit", textDecoration: "none" }}>
        <strong>{source.name} ↗</strong><small style={{ display: "block" }}>{source.tags.join(" · ")}</small><small style={{ display: "block", marginTop: 6 }}>{source.access}</small>
      </a>)}
    </div>
    <h3>项目候选 · {candidates.length}</h3>
    <p>让剪辑任务通过 MCP 搜索并登记候选；这里可试听比较，浏览本身不等于采用。</p>
    {candidates.map((candidate) => <article key={candidate.id} style={{ marginBottom: 14 }}>
      <strong>{candidate.name}</strong><small style={{ display: "block" }}>{candidate.status} · {candidate.license ?? "许可待核实"}</small>
      {candidate.previewUrl && <audio aria-label={`试听候选：${candidate.name}`} controls preload="none" src={candidate.previewUrl} style={{ width: "100%" }} />}
      <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer">原站来源 ↗</a>
      {candidate.licenseUrl && <> · <a href={candidate.licenseUrl} target="_blank" rel="noopener noreferrer">许可 ↗</a></>}
      {candidate.acquisitionError && <p role="alert">{candidate.acquisitionError}</p>}
      {!candidate.hardFilterPassed && <p>{candidate.filterReasons.join(" ")}</p>}
    </article>)}
    <h3>已导入 / 已使用</h3>
    {assets.map((asset) => <article key={asset.id} style={{ marginBottom: 14 }}>
      <strong>{asset.name}</strong><small style={{ display: "block" }}>{used.has(asset.id) ? "正在成片中使用，听感仍须复核" : "本地候选，未使用"}</small>
      {asset.status === "ready" && <audio aria-label={`本地音效：${asset.name}`} controls preload="none" style={{ width: "100%" }} src={`${API_BASE}/media/${encodeURIComponent(snapshot.project.id)}/${asset.managedPath.split(/[\\/]/u).map(encodeURIComponent).join("/")}`} />}
    </article>)}
  </section>;
}
