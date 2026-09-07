import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const { withRuntimeOperationLock, isLaunchLockOwnerCurrent } = await import(pathToFileURL(resolve("plugins/videoflowcut/scripts/runtime-launcher.mjs")).href);

test("MCP 操作与部署共用工作区互斥锁，前一个操作完成才能进入", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "videoflowcut-operation-lock-"));
  const options = { repoRoot: process.cwd(), workspaceRoot, port: 3199 };
  const order: string[] = [];
  let finish!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((resolveStarted) => { entered = resolveStarted; });
  try {
    const first = withRuntimeOperationLock(options, async () => {
      order.push("调用开始");
      entered();
      await new Promise<void>((done) => { finish = done; });
      order.push("调用完成");
    });
    await started;
    const second = withRuntimeOperationLock(options, async () => { order.push("部署进入"); });
    await new Promise((done) => setTimeout(done, 30));
    assert.deepEqual(order, ["调用开始"]);
    finish();
    await Promise.all([first, second]);
    assert.deepEqual(order, ["调用开始", "调用完成", "部署进入"]);
    await assert.rejects(withRuntimeOperationLock(options, async () => { throw new Error("验证失败"); }), /验证失败/);
    assert.equal(await withRuntimeOperationLock(options, async () => "已释放"), "已释放");
  } finally {
    finish?.();
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("遗留启动锁的 PID 被新进程复用后可恢复，不误杀同号进程或抢占活跃锁", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "videoflowcut-reused-pid-"));
  try {
    assert.equal(isLaunchLockOwnerCurrent({ pid: process.pid, createdAt: new Date().toISOString() }), true);
    const old = new Date(Date.now() - (process.uptime() + 3600) * 1000);
    assert.equal(isLaunchLockOwnerCurrent({ pid: process.pid, createdAt: old.toISOString() }), false);
    const directory = join(workspaceRoot, ".videoflowcut-runtime");
    await mkdir(directory);
    const lock = join(directory, "launch.lock");
    await writeFile(lock, JSON.stringify({ pid: process.pid, createdAt: old.toISOString() }));
    await utimes(lock, old, old);
    assert.equal(await withRuntimeOperationLock({ repoRoot: process.cwd(), workspaceRoot, port: 3199 }, async () => "已恢复"), "已恢复");
    assert.doesNotThrow(() => process.kill(process.pid, 0));
  } finally { await rm(workspaceRoot, { recursive: true, force: true }); }
});
