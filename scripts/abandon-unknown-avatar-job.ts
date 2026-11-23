import { isAbsolute } from "node:path";
import { createApplication } from "@videocut/application";

// 旧 Runtime 被未知任务挡住升级时，通过同一应用方法完成维护。
const [workspace, jobId, reason, ...extra] = process.argv.slice(2);
if (!workspace || !isAbsolute(workspace) || !jobId || !reason?.trim() || extra.length) {
  console.error("用法：npm run job:abandon-avatar -- <工作区绝对路径> <Job ID> <放弃原因>");
  process.exitCode = 1;
} else {
  const application = createApplication(workspace);
  try {
    const job = application.abandonUnknownAvatarJob(jobId, reason);
    console.log(JSON.stringify({ id: job.id, status: job.status, abandonment: job.result?.abandonment }));
  } finally {
    application.close();
  }
}
