import { readdir, access } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

/** 原作者口播仅限本地试用；公开完整场面不得携带音轨或把受限音频藏回压缩包。 */
export async function checkReferencePublication(skillsRoot) {
  const root = join(skillsRoot, 'visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token');
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) { await walk(file); continue; }
      const ext = extname(file).toLowerCase();
      if (['.wav', '.mp3', '.m4a', '.aac', '.ogg', '.flac', '.zip', '.7z', '.tar', '.gz'].includes(ext)) {
        throw new Error(`完整参考案例含禁止公开的音频或压缩包：${file}；本地试用副本应放在 .local-archives/`);
      }
      if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) {
        const data = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', file], { encoding: 'utf8' }));
        if (data.streams.some(s => s.codec_type === 'audio')) throw new Error(`完整参考视频含音轨，禁止发行：${file}`);
      }
    }
  }
  try { await access(root); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  await walk(root);
}
