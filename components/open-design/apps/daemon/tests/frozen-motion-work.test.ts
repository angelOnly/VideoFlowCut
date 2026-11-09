import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { freezeProjectWork, frozenMotionBundleHash, prepareAuthoredWorkSubmission, readFrozenWork } from '../src/services/frozen-motion-work.js';

describe('冻结源码与作者清单', () => {
  it('跨服务包身份固定样例', () => expect(frozenMotionBundleHash({ sha256: 'a'.repeat(64), bytes: 123 }, { sha256: 'b'.repeat(64), bytes: 45 })).toBe('e5ecadbc707b9d600a2900e093a90dcb6840c716ac41aa25b5e94d43a2dc661e'));
  it('只读取同版冻结内容，同一交件可重试，之后工作文件变化不影响冻结版', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'od-frozen-work-'));
    try {
      const projects = path.join(root, 'projects'), data = path.join(root, 'data'), project = 'test-project';
      await mkdir(path.join(projects, project, 'output'), { recursive: true });
      const source = '<!doctype html><html><body><div data-composition-id="main" data-width="1920" data-height="1080" data-start="0" data-duration="1">中文</div></body></html>';
      await writeFile(path.join(projects, project, 'output', 'film.html'), source);
      const manifestPath = path.join(projects, project, 'output', 'work.json');
      const manifest = { work: { name: '作品', creativeBrief: '视觉说明', width: 1920, height: 1080, fps: 30, durationInFrames: 30 }, readyRanges: [{ startFrame: 0, endFrame: 30 }], changedRanges: [] as Array<{ startFrame: number; endFrame: number; reason?: string }> };
      await writeFile(manifestPath, JSON.stringify({ ...manifest, unsupported: true }));
      await expect(prepareAuthoredWorkSubmission(projects, project, 'output/film.html', 'output/work.json')).rejects.toThrow('不支持字段 unsupported');
      await writeFile(manifestPath, JSON.stringify({ ...manifest, work: { ...manifest.work, unsupported: true } }));
      await expect(prepareAuthoredWorkSubmission(projects, project, 'output/film.html', 'output/work.json')).rejects.toThrow('work.unsupported');
      await writeFile(manifestPath, JSON.stringify({ ...manifest, work: { ...manifest.work, width: 1001 } }));
      await expect(prepareAuthoredWorkSubmission(projects, project, 'output/film.html', 'output/work.json')).rejects.toThrow('work.width');
      await writeFile(manifestPath, JSON.stringify({ ...manifest, changedRanges: [{ startFrame: 0, endFrame: 10 }] }));
      await expect(prepareAuthoredWorkSubmission(projects, project, 'output/film.html', 'output/work.json')).rejects.toThrow('changedRanges[0].reason');
      await writeFile(manifestPath, JSON.stringify({ ...manifest, work: { ...manifest.work, videoBindings: { subject: { assetId: 'asset', sourceStartMs: 0.5, sourceEndMs: 1000, startFrame: 0, endFrame: 30 } } } }));
      await expect(prepareAuthoredWorkSubmission(projects, project, 'output/film.html', 'output/work.json')).rejects.toThrow('work.videoBindings.subject.sourceStartMs');
      await writeFile(manifestPath, JSON.stringify(manifest));
      await writeFile(path.join(projects, project, 'output', 'film.html'), source.replace('中文', '<img id="video" data-vfc-video-slot="subject">'));
      await expect(prepareAuthoredWorkSubmission(projects, project, 'output/film.html', 'output/work.json')).rejects.toThrow('未绑定槽位 subject');
      await writeFile(path.join(projects, project, 'output', 'film.html'), source);
      const prepared = await prepareAuthoredWorkSubmission(projects, project, 'output/film.html', 'output/work.json');
      expect(prepared.contract_version).toBe('videoflowcut.authored-motion-manifest.v1');
      const input = { projectsRoot: projects, dataRoot: data, project, runId: 'run-1', sourcePath: 'output/film.html', manifestPath: 'output/work.json', sourceSha256: prepared.source_sha256, manifestSha256: prepared.manifest_sha256 };
      const first = await freezeProjectWork(input);
      expect(await freezeProjectWork(input)).toEqual(first);
      await writeFile(path.join(projects, project, 'output', 'film.html'), '下一版');
      expect(await freezeProjectWork(input)).toEqual(first);
      await expect(freezeProjectWork({ ...input, sourceSha256: 'a'.repeat(64) })).rejects.toThrow('MOTION_SUBMISSION_CHANGED');
      expect(Buffer.from((await readFrozenWork(data, project, first.frozen_version)).source_base64, 'base64').toString()).toBe(source);
      await expect(readFrozenWork(data, 'other-project', first.frozen_version)).rejects.toThrow('MOTION_FROZEN_CORRUPT');
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
