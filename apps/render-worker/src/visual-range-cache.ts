import { mkdir, readdir, stat, readFile, rm, copyFile, rename, writeFile, utimes } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { hashMediaFile } from "../../../packages/edit-application/src/media-intelligence.js";

/** 仅保存可重建的完整视觉段；正式媒体不在回收目录内，缓存命中仍核对字节身份。 */
export async function reuseVisualRange(root: string, key: string, target: string, generate: () => Promise<void>, limitBytes = 2 * 1024 ** 3): Promise<boolean> {
  const directory = join(root, ".cache", "visual-ranges");
  await mkdir(directory, { recursive: true });
  // 复制中断只会遗留 pending；超过一次渲染最长时段后回收，不碰正在写入的文件。
  for (const name of await readdir(directory)) if (/^[a-f0-9]{64}\.mp4\.[a-f0-9-]+\.pending$/u.test(name)) {
    const pending = join(directory, name), info = await stat(pending).catch(() => undefined);
    if (info && Date.now() - info.mtimeMs > 60 * 60_000) await rm(pending, { force: true });
  }
  const path = join(directory, `${key}.mp4`), manifest = `${path}.json`;
  try {
    const stored = JSON.parse(await readFile(manifest, "utf8"));
    if (stored.hash === await hashMediaFile(path)) {
      await copyFile(path, target); await utimes(path, new Date(), new Date()); return true;
    }
  } catch { /* 缓存缺失或损坏只重建本范围，不改变正式素材。 */ }
  await rm(path, { force: true }); await rm(manifest, { force: true });
  await generate();
  const bytes = (await stat(target)).size;
  const listed = await Promise.all((await readdir(directory)).filter(name=>/^[a-f0-9]{64}\.mp4$/u.test(name)).map(async name=>{
    const info = await stat(join(directory,name)).catch(error => { if (error.code === "ENOENT") return undefined; throw error; });
    return info ? { name, size: info.size, mtimeMs: info.mtimeMs } : undefined;
  }));
  const files = listed.filter((file): file is NonNullable<typeof file> => Boolean(file));
  let total = files.reduce((sum,file)=>sum+file.size,0);
  for (const file of files.sort((a,b)=>a.mtimeMs-b.mtimeMs)) {
    if (total + Math.min(bytes,limitBytes) <= limitBytes) break;
    await rm(join(directory,file.name),{force:true});await rm(join(directory,`${file.name}.json`),{force:true});total-=file.size;
  }
  if (bytes <= limitBytes) {
    const pending = `${path}.${randomUUID()}.pending`;
    try {
      await copyFile(target,pending);await rename(pending,path);
      await writeFile(manifest,JSON.stringify({hash:await hashMediaFile(path),bytes}));
    } finally {await rm(pending,{force:true});}
  }
  return false;
}
