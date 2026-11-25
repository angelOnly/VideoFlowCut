import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBufferState } from "remotion";
import type { MotionWork } from "@videocut/contracts";

const seekTimeoutMessage = "目标画面未按时就绪，请查看素材解码与作品诊断。";

/** 父合成只提供根帧；请求序号对应真实完成帧，慢帧不排成无限积压。 */
export function MotionSourceLayer({ work, projectId, revision, mediaBaseUrl, frame, projectFps, playbackControl, visible = true }: {
  work: MotionWork; projectId: string; revision: number; mediaBaseUrl: string; frame: number; projectFps: number; playbackControl?: { playing: boolean }; visible?: boolean;
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
    requestTimer.current = setTimeout(() => setFailure(seekTimeoutMessage), 15_000);
    iframe.current?.contentWindow?.postMessage({ type: "vfc-motion-seek", workId: work.id, sequence: active.current, frame: desired.current }, "*");
  };
  useLayoutEffect(() => {
    if (!visible || failure) {
      // 隐藏的预备作品和已失败作品都不能让整条合成一直等待。
      handle.current?.unblock(); handle.current = undefined;
      if (!failure) send.current();
      return;
    }
    // 暂停定位等待准确帧；连续播放只在未就绪或落后一帧以上时统一缓冲。
    if (!playbackControl?.playing || !ready.current || displayed === undefined || Math.abs(frame - displayed) > Math.ceil(work.fps / projectFps)) handle.current ??= buffer.delayPlayback();
    send.current();
  }, [frame, buffer, playbackControl, projectFps, work.fps, visible, failure]);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = event.data;
      if (event.source !== iframe.current?.contentWindow || message?.workId !== work.id) return;
      if (message.type === "vfc-motion-ready") { ready.current = true; send.current(); }
      if (message.type === "vfc-motion-error") { setFailure(String(message.error)); return; }
      if (message.type !== "vfc-motion-frame" || message.sequence !== active.current) return;
      clearTimeout(requestTimer.current);
      active.current = undefined; setDisplayed(message.frame);
      // 迟到的实际画面可以解除寻帧超时；其他作品错误仍须保留。
      setFailure(current => current === seekTimeoutMessage ? undefined : current);
      if (message.frame !== desired.current) { send.current(); return; }
      handle.current?.unblock(); handle.current = undefined;
    };
    window.addEventListener("message", listener);
    const timeout = window.setTimeout(() => { if (!ready.current) setFailure("作品初始化未完成，请查看固定资源和运行时状态。"); }, 30_000);
    return () => { clearTimeout(timeout); clearTimeout(requestTimer.current); window.removeEventListener("message", listener); handle.current?.unblock(); };
  }, [work.id, work.definitionHash]);
  const url = `${mediaBaseUrl.replace(/\/$/u, "")}/motion-work/${encodeURIComponent(projectId)}/${encodeURIComponent(work.id)}/${revision}/${work.definitionHash}/document`;
  // 预备层不能使用 display:none：隐藏 iframe 的绘制回调会被浏览器暂停，导致预取帧超时。
  return <div data-motion-work={work.id} data-requested-frame={frame} data-displayed-frame={displayed} data-motion-error={failure} style={{ position: "absolute", inset: 0, overflow: "hidden", visibility: visible ? undefined : "hidden" }}>
    <iframe ref={iframe} title={work.name} src={url} sandbox="allow-scripts" style={{ width: work.width, height: work.height, border: 0, background: "transparent", pointerEvents: "none" }} />
    {failure && <div role="alert" style={{ position: "absolute", inset: 0, background: "#200e19", color: "white", padding: 32 }}>{failure}</div>}
  </div>;
}
