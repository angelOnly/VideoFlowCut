import { createServer } from "../../server/src/app.js";
import { runWorkerForever } from "../../job-worker/src/index.js";
import { runRenderWorkerForever } from "../../render-worker/src/index.js";

const port = Number(process.env.PORT ?? 3100);
const host = process.env.HOST ?? "127.0.0.1";
const runtimeToken = process.env.VIDEOFLOWCUT_RUNTIME_TOKEN;
const runtimeId = process.env.VIDEOFLOWCUT_RUNTIME_ID ?? "manual";
const { app, application } = await createServer({ serveWeb: true });
const workersAbort = new AbortController();
let stopping = false;
const workers = { media: false, render: false };

/**
 * 插件运行时将 API、媒体 Worker 与渲染 Worker 放进同一个 Node 进程，
 * 让三者共享同一个 EditingApplication，避免多进程各自打开本地状态。
 */
const shutdown = async (reason: string) => {
  if (stopping) return;
  stopping = true;
  console.error(`VideoFlowCut Runtime 正在停止：${reason}`);
  await app.close().catch(() => undefined);
  workersAbort.abort();
};

if (runtimeToken) {
  app.get("/internal/runtime/status", async (request, reply) => {
    if (request.headers["x-videoflowcut-runtime-token"] !== runtimeToken) {
      return reply.code(403).send({ error: "RUNTIME_TOKEN_INVALID" });
    }
    return { status: stopping ? "stopping" : "ready", runtimeId, workers };
  });

  app.post("/internal/runtime/shutdown", async (request, reply) => {
    if (request.headers["x-videoflowcut-runtime-token"] !== runtimeToken) {
      return reply.code(403).send({ error: "RUNTIME_TOKEN_INVALID" });
    }
    // 先让 HTTP 响应写回，再关闭 listener；否则 Windows 下调用方可能读到连接中断。
    setTimeout(() => { void shutdown("插件启动器请求"); }, 50);
    return { status: "stopping" };
  });
}

process.once("SIGINT", () => { void shutdown("SIGINT"); });
process.once("SIGTERM", () => { void shutdown("SIGTERM"); });

try {
  await app.listen({ port, host });
  console.error(`VideoFlowCut Runtime 已启动：http://${host}:${port}`);
  workers.media = true;
  workers.render = true;
  await Promise.all([
    runWorkerForever(application, workersAbort.signal),
    runRenderWorkerForever(application, workersAbort.signal)
  ]);
} finally {
  await app.close().catch(() => undefined);
  application.close();
}
