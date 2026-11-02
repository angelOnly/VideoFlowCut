import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBufferState } from "remotion";
import type { MotionWork } from "@videocut/contracts";

/** 父合成只提供根帧；请求序号对应真实完成帧，慢帧不排成无限积压。 */
export function MotionSourceLayer({ work, projectId, revision, mediaBaseUrl, frame, projectFps, playbackControl }: {
  work: MotionWork; projectId: string; revision: number; mediaBaseUrl: string; frame: number; projectFps: number; playbackControl?: { playing: boolean };
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const buffer = useBufferState();
  const desired = useRef(frame), sequence = useRef(0), active = useRef<number | undefined>(undefined);
  const ready = useRef(false), handle = useRef<ReturnType<typeof buffer.delayPlayback> | undefined>(undefined);
  const [displayed, setDisplayed] = useState<number>();
  const [failure, setFailure] = useState<string>();
  const requestTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const send = useRef<() => void>(() => undefined);
  desired.current = frame;
  send.current = () => {
    if (!ready.current || active.current !== undefined || failure) return;
    active.current = ++sequence.current;
    clearTimeout(requestTimer.current);
    requestTimer.current = setTimeout(() => setFailure("目标画面未按时就绪，请查看素材解码与作品诊断。"), 15_000);
    iframe.current?.contentWindow?.postMessage({ type: "vfc-motion-seek", workId: work.id, sequence: active.current, frame: desired.current }, "*");
  };
  useLayoutEffect(() => {
    // 暂停定位等待准确帧；连续播放只在未就绪或落后一帧以上时统一缓冲。
    if (!playbackControl?.playing || !ready.current || displayed === undefined || Math.abs(frame - displayed) > Math.ceil(work.fps / projectFps)) handle.current ??= buffer.delayPlayback();
    send.current();
  }, [frame, buffer, playbackControl, projectFps, work.fps]);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = event.data;
      if (event.source !== iframe.current?.contentWindow || message?.workId !== work.id) return;
      if (message.type === "vfc-motion-ready") { ready.current = true; send.current(); }
      if (message.type === "vfc-motion-error") { setFailure(String(message.error)); return; }
      if (message.type !== "vfc-motion-frame" || message.sequence !== active.current) return;
      clearTimeout(requestTimer.current);
      active.current = undefined; setDisplayed(message.frame);
      if (message.frame !== desired.current) { send.current(); return; }
      handle.current?.unblock(); handle.current = undefined;
    };
    window.addEventListener("message", listener);
    const timeout = window.setTimeout(() => { if (!ready.current) setFailure("作品初始化未完成，请查看固定资源和运行时状态。"); }, 30_000);
    return () => { clearTimeout(timeout); clearTimeout(requestTimer.current); window.removeEventListener("message", listener); handle.current?.unblock(); };
  }, [work.id]);
  const url = `${mediaBaseUrl.replace(/\/$/u, "")}/motion-work/${encodeURIComponent(projectId)}/${encodeURIComponent(work.id)}/${revision}/document`;
  return <div data-motion-work={work.id} data-requested-frame={frame} data-displayed-frame={displayed} data-motion-error={failure} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <iframe ref={iframe} title={work.name} src={url} sandbox="allow-scripts" style={{ width: work.width, height: work.height, border: 0, background: "transparent", pointerEvents: "none" }} />
    {failure && <div role="alert" style={{ position: "absolute", inset: 0, background: "#200e19", color: "white", padding: 32 }}>{failure}</div>}
  </div>;
}
