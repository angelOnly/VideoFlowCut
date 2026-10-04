// 只在显式候选端口运行；创建的三个项目用于检查真实 Runtime 的队列和 API 响应。
const url = new URL(process.argv[2] ?? "");
if (url.hostname !== "127.0.0.1" || !url.port || url.port === "3100") throw new Error("必须传入独立候选 Runtime 的本机非生产端口");
const request = async (path, body) => {
  const response = await fetch(new URL(path, url), {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
};
const initial = await request("/api/runtime/status");
if (initial.status !== "ready" || !initial.workers?.media || !initial.workers?.render || !initial.releaseId) throw new Error("候选服务未就绪");
const work = {
  name: "候选并发验证", width: 640, height: 360, fps: 24, durationInFrames: 72,
  source: "import React from 'react';import {useCurrentFrame} from 'remotion';export default function Motion(){const frame=useCurrentFrame();return <div style={{width:640,height:360,backgroundColor:frame%2?'#123456':'#345678',color:'white',fontSize:40}}>{frame}</div>}",
  props: {}, imageBindings: {}, creativeBrief: "候选运行环境用于验证三个项目连续动画生成与 API 响应。",
  rights: { basis: "候选环境中自行创建的测试图形", status: "cleared" }
};
const projects = await Promise.all(Array.from({ length: 3 }, (_, i) => request("/api/projects", { name: `候选动画压力验证 ${i + 1}` })));
const jobs = await Promise.all(projects.map((project, i) => request(`/api/projects/${project.snapshot.project.id}/motion-works`, {
  baseRevision: project.revision.number, idempotencyKey: `candidate-motion-${i + 1}`, work
})));
const started = Date.now();
let maximumHealthLatency = 0;
let final = [];
while (Date.now() - started < 180_000) {
  const healthStart = Date.now();
  const health = await request("/api/runtime/status");
  maximumHealthLatency = Math.max(maximumHealthLatency, Date.now() - healthStart);
  if (health.releaseId !== initial.releaseId || health.status !== "ready") throw new Error("候选 Runtime 发行或健康状态变化");
  final = await Promise.all(jobs.map(job => request(`/api/jobs/${job.id}`)));
  if (final.every(job => ["succeeded", "failed", "cancelled"].includes(job.status))) break;
  await new Promise(resolve => setTimeout(resolve, 500));
}
const result = { releaseId: initial.releaseId, jobs: final.map(job => ({ id: job.id, status: job.status, stage: job.result?.motionStage, error: job.error })), maximumHealthLatency, elapsedMs: Date.now() - started };
console.log(JSON.stringify(result, null, 2));
if (final.length !== 3 || final.some(job => job.status !== "succeeded" || job.result?.motionStage !== "completed") || maximumHealthLatency > 3000) process.exitCode = 1;
