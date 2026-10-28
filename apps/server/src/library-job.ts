import type { EditingApplication } from "@videocut/application";

/** 显式恢复沿原请求跟进最新尝试，检索本身不重放失败任务。 */
export function latestLibraryAttempt(app:EditingApplication,projectId:string,submitted:ReturnType<EditingApplication["trackJob"]>) {
  let job=submitted;
  const jobs=app.listJobs(projectId);
  for(let i=0;i<100;i++){
    const next=jobs.find(entry=>entry.payload.retryOfJobId===job.id);
    if(!next)break;
    job=next;
  }
  return job;
}
