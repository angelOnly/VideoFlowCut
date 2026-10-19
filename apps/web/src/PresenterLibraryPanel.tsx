import { useEffect, useState } from "react";
import type { PresenterLibrary, PresenterLibraryEntry, PresenterMediaKind, ProjectSnapshot } from "@videocut/contracts";
import { api, API_BASE } from "./api";
import { mediaUrl } from "@videocut/remotion";

const entryUrl = (entry: PresenterLibraryEntry) => `${API_BASE}/api/settings/presenter-library/${encodeURIComponent(entry.id)}/media?v=${entry.contentHash}`;

export function PresenterLibrarySettings() {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<PresenterLibrary>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PresenterMediaKind>("photo");
  const [file, setFile] = useState<File>();
  const [replacement, setReplacement] = useState<string>();
  const [useDefault, setUseDefault] = useState(false);
  const run = async (action: () => Promise<PresenterLibrary>) => {
    setBusy(true); setMessage("");
    try { setLibrary(await action()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "操作失败，请重试"); }
    finally { setBusy(false); }
  };
  return <>
    <button onClick={() => { setOpen(true); void run(api.presenterLibrary); }}>人物与音色</button>
    {open && <div className="creative-defaults-backdrop"><section className="creative-defaults-dialog presenter-library-dialog" role="dialog" aria-modal="true" aria-labelledby="presenter-library-title">
      <h2 id="presenter-library-title">人物与音色</h2>
      <p>保存一次，之后可在聊天或项目中选择。默认组合只用于新项目，已有项目保留当时的照片与音色。</p>
      <fieldset disabled={busy || !library}>
        <div className="presenter-library-grid">{(["photo", "voice"] as const).map(section => <section key={section}>
          <h3>{section === "photo" ? "人物照片" : "音色样本"}</h3>
          {!library?.entries.some(entry => entry.kind === section) && <p>尚未保存{section === "photo" ? "照片" : "音色"}。</p>}
          {library?.entries.filter(entry => entry.kind === section).map(entry => <article className="presenter-entry" key={`${entry.id}:${entry.contentHash}`}>
            {section === "photo" ? <img src={entryUrl(entry)} alt={entry.name} /> : <audio controls preload="metadata" src={entryUrl(entry)} aria-label={`试听样本：${entry.name}`} />}
            <input aria-label={`名称：${entry.name}`} defaultValue={entry.name} onBlur={event => { if (event.target.value.trim() && event.target.value.trim() !== entry.name) void run(() => api.changePresenterEntry({ action: "rename", id: entry.id, name: event.target.value.trim() })); }} />
            <div className="button-row">
              <button disabled={library.defaults[section === "photo" ? "photoId" : "voiceId"] === entry.id} onClick={() => void run(() => api.changePresenterEntry({ action: "set_default", id: entry.id }))}>{library.defaults[section === "photo" ? "photoId" : "voiceId"] === entry.id ? "当前默认" : "设为默认"}</button>
              <button onClick={() => { setReplacement(entry.id); setName(entry.name); setKind(entry.kind); setFile(undefined); setUseDefault(false); }}>更换文件</button>
              <button onClick={() => void run(() => api.changePresenterEntry({ action: "remove", id: entry.id }))}>移除</button>
            </div>
          </article>)}
        </section>)}</div>
        <h3>{replacement ? "更换文件" : "添加照片或音色"}</h3>
        <label>类型<select value={kind} disabled={Boolean(replacement)} onChange={event => { setKind(event.target.value as PresenterMediaKind); setFile(undefined); }}><option value="photo">人物照片</option><option value="voice">音色样本</option></select></label>
        <label>名称<input value={name} onChange={event => setName(event.target.value)} /></label>
        <label>文件<input key={`${kind}:${replacement ?? "new"}`} type="file" accept={kind === "photo" ? "image/png,image/jpeg,image/webp" : "audio/*"} onChange={event => setFile(event.target.files?.[0])} /></label>
        <label><input type="checkbox" checked={useDefault} onChange={event => setUseDefault(event.target.checked)} />保存后设为默认</label>
        <div className="button-row"><button disabled={!file || !name.trim()} onClick={() => file && void run(async () => {
          const result = await api.uploadPresenterMedia(file, { kind, name: name.trim(), replaceId: replacement, setDefault: useDefault });
          setReplacement(undefined); setFile(undefined); setName(""); setUseDefault(false); setMessage("已保存。已有项目保持原选择。"); return result;
        })}>保存</button>{replacement && <button onClick={() => { setReplacement(undefined); setFile(undefined); setName(""); }}>取消更换</button>}</div>
      </fieldset>
      <p role="status">{busy ? "正在处理…" : message}</p>
      {!library && !busy && <button onClick={() => void run(api.presenterLibrary)}>重新读取</button>}
      <button disabled={busy} onClick={() => setOpen(false)}>关闭</button>
    </section></div>}
  </>;
}

export function ProjectPresenterSelection({ snapshot, revision, busy, run }: {
  snapshot: ProjectSnapshot; revision: number; busy: boolean;
  run: (label: string, action: () => Promise<unknown>) => void;
}) {
  const [library, setLibrary] = useState<PresenterLibrary>();
  const [error, setError] = useState("");
  const [photoId, setPhotoId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const load = () => { setError(""); void api.presenterLibrary().then(setLibrary).catch(value => setError(String(value))); };
  useEffect(load, [snapshot.project.id]);
  useEffect(() => { setPhotoId(""); setVoiceId(""); }, [revision]);
  const photo = snapshot.assets.find(asset => asset.id === snapshot.presenter?.photo?.assetId);
  const voice = snapshot.assets.find(asset => asset.id === snapshot.presenter?.voice?.assetId);
  return <section className="story-card presenter-selection">
    <h3>本片人物与音色</h3><p>生成方式：LTX 2.3</p>
    {photo && <img src={mediaUrl(snapshot, API_BASE, photo.managedPath)} alt="本片固定的人物照片" />}
    <p>人物：{snapshot.presenter?.photo?.name ?? "尚未选择"} · 音色：{snapshot.presenter?.voice?.name ?? "尚未选择"}</p>
    {voice && <audio controls preload="metadata" src={mediaUrl(snapshot, API_BASE, voice.managedPath)} aria-label="本片音色样本" />}
    <fieldset disabled={busy || !library}>
      <label>更换人物<select value={photoId} onChange={event => setPhotoId(event.target.value)}><option value="">{photo ? "保持本片照片" : "采用工作台默认照片"}</option>{library?.entries.filter(entry => entry.kind === "photo").map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <label>更换音色<select value={voiceId} onChange={event => setVoiceId(event.target.value)}><option value="">{voice ? "保持本片音色" : "采用工作台默认音色"}</option>{library?.entries.filter(entry => entry.kind === "voice").map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <p>换照片后需重生人物镜头；换音色后还需重新配音并校准字幕、口型和画面时间。此操作保存选择，不自动开始生成。</p>
      <button onClick={() => run("应用本片人物与音色", () => api.applyPresenterSelection(snapshot.project.id, { baseRevision: revision, photoId: photoId || undefined, voiceId: voiceId || undefined }))}>应用到本片</button>
    </fieldset>
    <button disabled={busy} onClick={load}>刷新可选照片与音色</button><p role="status">{error}</p>
  </section>;
}
