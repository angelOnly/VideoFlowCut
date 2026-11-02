import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { closeSync, openSync, readFileSync, readSync, realpathSync } from "node:fs";
import { promisify } from "node:util";
import { join } from "node:path";
import { readRuntimeConfig } from "@videocut/project-overview";
import { resolveRenderBrowser } from "../../remotion-runtime/src/browser.js";
import { listMotionFonts, motionFontsRoot } from "../../motion-work/src/fonts.js";

const exec = promisify(execFile);
export interface RenderEnvironmentIdentity { releaseId: string; audio: string; visual?: string }
type CheckedFile = { path: string; realPath: string; hash: string };
let checked: { identity: RenderEnvironmentIdentity; path: string; pathExt: string; cwd: string; files: CheckedFile[] } | undefined;

function hashFile(path: string): string {
  const file = openSync(path, "r"), hash = createHash("sha256"), buffer = Buffer.allocUnsafe(1024 * 1024);
  try { let count: number; while ((count = readSync(file, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, count)); }
  finally { closeSync(file); }
  return hash.digest("hex");
}

/** 复核依赖使用真实内容身份；路径存在或元数据未变不能证明素材未改。 */
export function matchesRenderContentHash(path: string, expected: string): boolean {
  try { return hashFile(path) === expected; } catch { return false; }
}

/** 只解析现有可执行程序，不启动浏览器或下载运行依赖。 */
async function executable(command: "ffmpeg" | "ffprobe") {
  const locator = process.platform === "win32" ? "where.exe" : "which";
  const found = await exec(locator, [command], { windowsHide: true, timeout: 5000 });
  const path = found.stdout.split(/\r?\n/u).find(Boolean)?.trim();
  if (!path) throw new Error(`找不到 ${command}`);
  const realPath = realpathSync(path);
  const version = await exec(realPath, ["-version"], { windowsHide: true, timeout: 5000, maxBuffer: 1024 * 1024 });
  return { file: { path, realPath, hash: hashFile(realPath) }, version: version.stdout };
}

/** 供预览 Worker 和实际复核共同核定环境；失败只标未知，不阻断画面输出。 */
export async function captureRenderEnvironmentIdentity(options: { includeVisual?: boolean } = {}): Promise<RenderEnvironmentIdentity | undefined> {
  checked = undefined;
  try {
    const config = readRuntimeConfig();
    const [ffmpeg, ffprobe] = await Promise.all([executable("ffmpeg"), executable("ffprobe")]);
    const files = [ffmpeg.file, ffprobe.file];
    const audio = createHash("sha256").update(JSON.stringify({ releaseId: config.runtime.releaseId,
      ffmpeg: { hash: ffmpeg.file.hash, version: ffmpeg.version }, ffprobe: { hash: ffprobe.file.hash, version: ffprobe.version } })).digest("hex");
    let visual: string | undefined;
    if (options.includeVisual !== false && config.runtime.browserExecutable) {
      try {
        const path = await resolveRenderBrowser(), realPath = realpathSync(path);
        const browser = { path, realPath, hash: hashFile(realPath) };
        const root = motionFontsRoot(), catalogPath = join(root, "catalog.json"), catalogRealPath = realpathSync(catalogPath);
        const catalog = { path: catalogPath, realPath: catalogRealPath, hash: hashFile(catalogRealPath) };
        const fonts = listMotionFonts(root);
        const catalogData = JSON.parse(readFileSync(catalogRealPath, "utf8")) as { fonts: Array<{ file: string }> };
        const fontFiles = catalogData.fonts.map(font => {
          const fontPath = join(root, font.file), fontRealPath = realpathSync(fontPath);
          return { path: fontPath, realPath: fontRealPath, hash: hashFile(fontRealPath) };
        });
        files.push(browser, catalog, ...fontFiles);
        visual = createHash("sha256").update(JSON.stringify({ audio, browser: browser.hash, catalog: catalog.hash, fonts, files: fontFiles.map(file => file.hash) })).digest("hex");
      } catch { /* 浏览器或字体身份不足时不推断可复用。 */ }
    }
    const identity = { releaseId: config.runtime.releaseId, audio, ...(visual ? { visual } : {}) };
    checked = { identity, path: process.env.PATH ?? "", pathExt: process.env.PATHEXT ?? "", cwd: process.cwd(), files };
    return identity;
  } catch { return undefined; }
}

/** 同步质量计算只使用已核定且当前字节仍一致的环境；无法确认则返回未知。 */
export function currentRenderEnvironmentIdentity(): RenderEnvironmentIdentity | undefined {
  try {
    if (!checked || checked.path !== (process.env.PATH ?? "") || checked.pathExt !== (process.env.PATHEXT ?? "") || checked.cwd !== process.cwd()
      || checked.identity.releaseId !== readRuntimeConfig().runtime.releaseId) return undefined;
    if (checked.files.some(file => realpathSync(file.path) !== file.realPath || hashFile(file.realPath) !== file.hash)) return undefined;
    return checked.identity;
  } catch { return undefined; }
}
