import { mkdir, readdir, stat, readFile, rm, copyFile, rename, writeFile, utimes } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { hashMediaFile } from "../../../packages/edit-application/src/media-intelligence.js";

type Format = "mp4" | "nut" | "png" | "wav";
export interface CacheRecord { hash: string; bytes: number; visualKey?: string }
export interface CacheResult { hit: boolean; reason: "hit" | "missing" | "corrupt" | "capacity" }
const capacity = 8 * 1024 ** 3;

/** 延续项目文件缓存；所有层级共用发布、完整性检查和回收，不涉及正式素材目录。 */
export class RenderFileCache {
  private directory: string;
  constructor(root: string, private limitBytes = capacity) { this.directory = join(root, ".cache", "visual-ranges"); }
  private path(key: string, format: Format) { return join(this.directory, `${key}.${format}`); }
  async restore(key: string, format: Format, target: string): Promise<CacheResult> {
    const path = this.path(key, format);
    try {
      const stored = JSON.parse(await readFile(`${path}.json`, "utf8")) as CacheRecord;
      if (!stored || typeof stored.hash !== "string" || stored.bytes !== (await stat(path)).size || stored.hash !== await hashMediaFile(path)) throw new Error("缓存字节变化");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { hit: false, reason: "missing" };
      // 只有读出的内容损坏才丢弃缓存；磁盘权限等操作失败应原样报告。
      if (!(error instanceof SyntaxError) && error instanceof Error && error.message !== "缓存字节变化") throw error;
      await rm(path, { force: true }); await rm(`${path}.json`, { force: true });
      return { hit: false, reason: "corrupt" };
    }
    await copyFile(path, target);
    await utimes(path, new Date(), new Date());
    return { hit: true, reason: "hit" };
  }
  async restoreVideo(visualKey: string, target: string): Promise<boolean> {
    await mkdir(this.directory, { recursive: true });
    for (const name of await readdir(this.directory)) {
      if (!/^[a-f0-9]{64}\.mp4\.json$/u.test(name)) continue;
      let record: CacheRecord | undefined;
      try { record = JSON.parse(await readFile(join(this.directory, name), "utf8")); } catch { continue; }
      if (record?.visualKey === visualKey && (await this.restore(name.slice(0, 64), "mp4", target)).hit) return true;
    }
    return false;
  }
  async save(key: string, format: Format, source: string, metadata: Pick<CacheRecord, "visualKey"> = {}): Promise<boolean> {
    await mkdir(this.directory, { recursive: true });
    const bytes = (await stat(source)).size;
    if (bytes > this.limitBytes) return false;
    const entries = await Promise.all((await readdir(this.directory)).map(async name => {
      const path = join(this.directory, name), info = await stat(path).catch(() => undefined);
      if (/\.pending(?:\.json)?$/u.test(name) && info && Date.now() - info.mtimeMs > 60 * 60_000) await rm(path, { force: true });
      return /^[a-f0-9]{64}\.(mp4|nut|png|wav)$/u.test(name) && info ? { path, ...info } : undefined;
    }));
    const files = entries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    const path = this.path(key, format);
    // 同一键发布替换旧文件，不应将新旧两份同时计入容量而误淘汰其它段。
    let total = files.reduce((sum, file) => sum + (file.path === path ? 0 : file.size), 0);
    for (const file of files.sort((a, b) => a.mtimeMs - b.mtimeMs)) {
      if (total + bytes <= this.limitBytes) break;
      // 消费者已复制到自己的临时目录，回收缓存不会截断正在使用的分段。
      if (file.path === path) continue;
      await rm(file.path, { force: true }); await rm(`${file.path}.json`, { force: true }); total -= file.size;
    }
    const pending = `${path}.${randomUUID()}.pending`, manifest = `${pending}.json`;
    try {
      await copyFile(source, pending);
      await writeFile(manifest, JSON.stringify({ ...metadata, hash: await hashMediaFile(pending), bytes }));
      await rename(pending, path); await rename(manifest, `${path}.json`);
    } finally { await rm(pending, { force: true }); await rm(manifest, { force: true }); }
    return true;
  }
  async obtain(key: string, format: Format, target: string, generate: () => Promise<void>): Promise<CacheResult> {
    const result = await this.restore(key, format, target);
    if (result.hit) return result;
    await generate();
    return await this.save(key, format, target) ? result : { hit: false, reason: "capacity" };
  }
}
