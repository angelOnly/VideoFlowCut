import { createServer } from "../../server/src/app.js";
import { runWorkerForever } from "../../job-worker/src/index.js";
import { runRenderWorkerForever } from "../../render-worker/src/index.js";
import { applyReleaseRuntimeDefaults } from "@videocut/project-overview";

/**
 * 发布构建是 CommonJS，__dirname 即 runtime/dist；开发时 TypeScript 以 ESM
 * 运行则不存在该变量，继续由 Server 使用仓库内 Web 构建目录。
 */
const runtimeConfig = applyReleaseRuntimeDefaults(typeof __dirname === "string" ? __dirname : undefined);
const { port, host } = runtimeConfig.http;
const runtimeToken = runtimeConfig.runtime.runtimeToken;
const runtimeId = runtimeConfig.runtime.runtimeId;

/**
 * 保持入口没有顶层 await，发行构建可稳定输出 CommonJS，Node 才能通过
 * NODE_PATH 从宿主仓库解析运行依赖；开发态的 ESM 启动仍复用同一逻辑。
 */
async function main(): Promise<void> {
  const { app, application } = await createServer({
    serveWeb: true,
    webRoot: runtimeConfig.runtime.webRoot
  });
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
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
