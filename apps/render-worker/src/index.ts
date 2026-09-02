import { join } from "node:path";
import { createApplication, type EditingApplication } from "@videocut/application";
import { runOneQueuedJob, type JobProcessor } from "@videocut/job-runtime";
import type { JobKind } from "@videocut/contracts";
import { RevisionRenderer, runExportJob, runPreviewJob, runRenderPreflightJob } from "./exporter.js";

const workspaceRoot = process.env.VIDEOCUT_WORKSPACE ?? join(process.cwd(), "workspace");
let defaultApplication: EditingApplication | undefined;
const getDefaultApplication = () => (defaultApplication ??= createApplication(workspaceRoot));
export const RENDER_JOB_KINDS: JobKind[] = ["preview", "render_preflight", "export"];

export function createRenderJobProcessor(app: EditingApplication, renderer = new RevisionRenderer()): JobProcessor {
  return async (job) => {
    if (job.kind === "preview") return runPreviewJob(app, job, renderer);
    if (job.kind === "render_preflight") return runRenderPreflightJob(app, job);
    if (job.kind === "export") return runExportJob(app, job, renderer);
    throw new Error(`任务类型 ${job.kind} 不属于 Render Worker`);
  };
}

export async function runOneRenderJob(
  app: EditingApplication = getDefaultApplication(),
  processor: JobProcessor = createRenderJobProcessor(app)
): Promise<boolean> {
  return runOneQueuedJob(app, RENDER_JOB_KINDS, processor, 5 * 60_000);
}

export async function runRenderWorkerForever(app: EditingApplication = getDefaultApplication(), signal?: AbortSignal): Promise<void> {
  let stopping = signal?.aborted ?? false;
  const stop = () => { stopping = true; };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  signal?.addEventListener("abort", stop, { once: true });
  try {
    const processor = createRenderJobProcessor(app);
    while (!stopping) {
      const worked = await runOneRenderJob(app, processor);
      if (!worked) await new Promise((resolve) => setTimeout(resolve, 750));
    }
  } finally {
    signal?.removeEventListener("abort", stop);
  }
}

// 发行 Runtime 以 CommonJS bundle 引入本模块；只让源码 Worker 入口自行启动。
const launchedAsStandaloneRenderWorker = /(?:^|\/)apps\/render-worker\/src\/index\.(?:ts|js)$/u.test(process.argv[1]?.replace(/\\/g, "/") ?? "");
if (launchedAsStandaloneRenderWorker) {
  runRenderWorkerForever().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
