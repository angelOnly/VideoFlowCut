import type { ProjectSnapshot } from "@videocut/contracts";
import { MOTION_SOURCES } from "../../../packages/motion-work/src/catalog";
import { API_BASE } from "./api";

/** 直接使用原站图库，不复制第三方素材墙；项目里只显示真正生成的固定版本作品。 */
export function MotionLibraryPanel({ snapshot, onSelectAsset }: { snapshot: ProjectSnapshot; onSelectAsset: (id: string) => void }) {
  const works = snapshot.assets.filter((asset) => asset.motion);
  return <section className="story-card" data-testid="motion-library">
    <strong>在线动效 · 看懂后用 Remotion 实现</strong>
    <p>源码、AE 或 Jitter 格式均可作为视觉参考。打开原站连续预览，由剪辑任务通过受管流程制作；这里只保存实际使用的作品。</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {MOTION_SOURCES.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" style={{ border: "1px solid #ffffff25", padding: 12, borderRadius: 8, color: "inherit", textDecoration: "none" }}><strong>{source.name} ↗</strong><small style={{ display: "block", marginTop: 6 }}>{source.tags.join(" · ")}</small></a>)}
    </div>
    {works.map((asset) => <article key={asset.id} style={{ marginTop: 16 }}>
      <strong>{asset.name}</strong> <small>{asset.motion!.version.slice(0, 8)} · {asset.motion!.review?.referenceMatch === "passed" ? "参考对照通过，合成待审" : asset.motion!.review?.referenceMatch === "failed" ? "对照未通过，需修改" : "待动态对照"}</small>
      <video aria-label={`${asset.name}审阅预览`} controls preload="metadata" style={{ width: "100%", maxHeight: 230, marginTop: 8 }} src={`${API_BASE}/media/${encodeURIComponent(snapshot.project.id)}/${asset.managedPath.split(/[\\/]/u).map(encodeURIComponent).join("/")}`} />
      <button onClick={() => onSelectAsset(asset.id)}>查看作品素材</button>
      <a href={asset.motion!.referenceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#c2b7ff" }}>查看选中的在线参考 ↗</a>
      <small style={{ display: "block" }}>此处为带背景的审阅代理；正式叠加使用透明帧。修改文案由 Codex 提交新版本，不覆盖旧版。</small>
    </article>)}
  </section>;
}
