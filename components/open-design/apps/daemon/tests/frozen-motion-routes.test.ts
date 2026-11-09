import express from 'express';
import http from 'node:http';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import { closeDatabase, getMessage, insertConversation, insertProject, openDatabase } from '../src/db.js';
import { createProjectFileVersion } from '../src/project-file-versions.js';
import { registerRunRoutes } from '../src/routes/runs.js';
import { connectorService } from '../src/connectors/service.js';
import { handleMcpToolCall } from '../src/mcp.js';
import { _resetMcpWorkspaceContextCacheForTests } from '../src/mcp-workspace-context.js';
import { ToolTokenRegistry } from '../src/tool-tokens.js';
import { createToolRequestAuth } from '../src/http/tool-request-auth.js';
import * as taskStore from '../src/strategies/task-store.js';

describe('源码冻结正式接口', () => {
  it('核对完成 Run 与作者源码身份，版本后续变更不污染冻结结果', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'od-frozen-route-'));
    const db = openDatabase(root), project = 'test-project', now = Date.now();
    let server: http.Server | undefined;
    try {
      insertProject(db, { id: project, name: '测试', createdAt: now, updatedAt: now });
      insertConversation(db, { id: 'conv-1', projectId: project, createdAt: now, updatedAt: now });
      const projects = path.join(root, 'projects');
      await mkdir(path.join(projects, project, 'output'), { recursive: true });
      const source = `<!doctype html><html><body><div data-composition-id="main" data-width="1920" data-height="1080" data-start="0" data-duration="1">原作者<!--${'中'.repeat(1_900_000)}--></div></body></html>`;
      await writeFile(path.join(projects, project, 'output', 'film.html'), source);
      await writeFile(path.join(projects, project, 'output', 'work.json'), JSON.stringify({ work: { name: '作品', creativeBrief: '设计', width: 1920, height: 1080, fps: 30, durationInFrames: 30 }, readyRanges: [{ startFrame: 0, endFrame: 30 }], changedRanges: [] }));
      const version = await createProjectFileVersion(projects, project, 'output/film.html', source, { source: 'ai' });
      const run = { id: 'run-1', projectId: project, conversationId: 'conv-1', status: 'succeeded', deliverableValid: true, deliverableEntryFile: 'output/film.html', artifactVersionId: version.id, events: [], clients: new Set() };
      const continued = { ...run, id: 'run-2', status: 'running' };
      const registry = new ToolTokenRegistry(), grant = registry.mint({ runId: run.id, projectId: project });
      const app = express(); app.use(express.json());
      app.get('/api/workspace/directory', (_req, res) => res.json({ items: [], activeWorkspaceId: null }));
      app.get('/api/projects', (_req, res) => res.json({ projects: [{ id: project, name: '测试' }] }));
      const steer = vi.fn(async () => ({ ok: true, backpressure: false, threadId: 'thread-1', turnId: 'turn-1' }));
      const runs = { get: (id: string) => id === run.id ? run : id === continued.id ? continued : null, statusBody: (value: unknown) => value, isTerminal: (status: string) => status !== 'running', steer };
      registerRunRoutes(app, {
        db, design: { runs, analytics: { capture() {} }, getAppVersion: () => 'test' },
        auth: createToolRequestAuth(registry),
        http: { createSseResponse: () => ({ send() {}, end() {}, cleanup() {} }), sendApiError: (res: any, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } }) },
        paths: { PROJECTS_DIR: projects, RUNTIME_DATA_DIR: root }, agents: { detectAgents: async () => [], getAgentDef: () => null },
        chat: { startChatRun: async () => undefined }, lifecycle: { isDaemonShuttingDown: () => false },
        plugins: { connectorService, detectSkillPluginCandidateOnRunSuccess() {}, firePipelineForRun() {}, loadPluginRegistryView: async () => ({}), renderPluginBriefTemplate: (text: string) => text },
        telemetry: { reportRunCompletionTelemetryFallback() {}, resolveRunProjectKindForAnalytics: () => null, runArtifactBaselines: { take() {} }, runRetryEventsForAnalytics: () => [] },
        messages: { pinAssistantMessageOnRunCreate: () => ({ ok: true }), reconcileAssistantMessageOnRunEnd() {} },
      } as any);
      server = http.createServer(app); await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve));
      const port = (server.address() as { port: number }).port, base = `http://127.0.0.1:${port}/api/runs/run-1`;
      const host = `http://127.0.0.1:${port}`;
      const input = { project, run_id: run.id, source_path: 'output/film.html', manifest_path: 'output/work.json' };
      run.status = 'running';
      const initialStatus = await handleMcpToolCall(host, 'get_run', { runId: run.id });
      expect(JSON.parse(initialStatus.content[0]!.text).frozenWorks).toEqual([]);
      const stageBody = JSON.stringify({ source_path: input.source_path, manifest_path: input.manifest_path });
      expect((await fetch(`${host}/api/tools/motion-work/stage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: stageBody })).status).toBe(401);
      const cliEntry = process.env.OD_TEST_CLI_ENTRY;
      const cliArguments = cliEntry ? [cliEntry] : ['--import', 'tsx', 'src/cli.ts'];
      const stageCommand = () => promisify(execFile)(process.execPath, [...cliArguments, 'motion-work', 'stage', '--source', input.source_path, '--manifest', input.manifest_path, '--daemon-url', host], { cwd: process.cwd(), env: { ...process.env, OD_TOOL_TOKEN: grant.token }, timeout: 20_000 });
      const command = await stageCommand();
      const stage = JSON.parse(command.stdout);
      const feedback = { run_id: run.id, feedback_id: 'feedback-1', frozen_version: stage.frozen_version,
        range: { startFrame: 3, endFrame: 15 }, text: '保留主体，调整布局', expected_turn_id: 'turn-1' };
      const sent = await handleMcpToolCall(host, 'steer_run', feedback);
      expect(sent.isError).not.toBe(true);
      expect(JSON.parse(sent.content[0]!.text)).toMatchObject({ delivered: true, turnId: 'turn-1', feedback: { state: 'accepted' } });
      expect(steer).toHaveBeenCalledOnce();
      expect(getMessage(db, 'feedback-1')?.runContext).toMatchObject({ motionFeedback: { runId: run.id, frozenVersion: stage.frozen_version, state: 'accepted' } });
      const repeated = await handleMcpToolCall(host, 'steer_run', feedback);
      expect(repeated.isError).not.toBe(true);
      expect(steer).toHaveBeenCalledOnce();
      expect((await handleMcpToolCall(host, 'steer_run', { ...feedback, text: '不同请求' })).isError).toBe(true);
      expect((await handleMcpToolCall(host, 'steer_run', { ...feedback, feedback_id: 'feedback-2', range: { startFrame: 0, endFrame: 31 } })).isError).toBe(true);
      const task = vi.spyOn(taskStore, 'getStrategyTaskExecutionByRunId').mockReturnValue({ activeRunId: continued.id, outcome: 'running' } as any);
      run.status = 'succeeded';
      const acrossRuns = { ...feedback, feedback_id: 'feedback-next', text: '针对上一版调整运动' };
      const forwarded = await handleMcpToolCall(host, 'steer_run', acrossRuns);
      expect(forwarded.isError).not.toBe(true);
      expect(JSON.parse(forwarded.content[0]!.text).feedback).toMatchObject({ observedRunId: run.id, receivingRunId: continued.id, frozenVersion: stage.frozen_version });
      expect(steer).toHaveBeenLastCalledWith(continued, expect.any(String), expect.any(Boolean), 'turn-1', 'feedback-next');
      expect(getMessage(db, 'feedback-next')?.runContext).toMatchObject({ motionFeedback: { observedRunId: run.id, receivingRunId: continued.id, state: 'accepted' } });
      const calls = steer.mock.calls.length;
      expect((await handleMcpToolCall(host, 'steer_run', acrossRuns)).isError).not.toBe(true);
      expect(steer).toHaveBeenCalledTimes(calls);
      task.mockRestore();
      run.status = 'running';
      const nextSource = source.replace('原作者', '后续创作');
      await writeFile(path.join(projects, project, 'output', 'film.html'), nextSource);
      const nextStage = JSON.parse((await stageCommand()).stdout);
      expect(nextStage.frozen_version).not.toBe(stage.frozen_version);
      const discovered = await handleMcpToolCall(host, 'get_run', { runId: run.id });
      expect(discovered.isError).not.toBe(true);
      expect(JSON.parse(discovered.content[0]!.text).frozenWorks.map((entry: { frozen_version: string }) => entry.frozen_version).sort()).toEqual([stage.frozen_version, nextStage.frozen_version].sort());
      const stageRead = await handleMcpToolCall(host, 'read_frozen_work', { project, frozen_version: stage.frozen_version });
      expect(Buffer.from(JSON.parse(stageRead.content[0]!.text).source_base64, 'base64').toString()).toBe(source);
      const nextRead = await handleMcpToolCall(host, 'read_frozen_work', { project, frozen_version: nextStage.frozen_version });
      expect(Buffer.from(JSON.parse(nextRead.content[0]!.text).source_base64, 'base64').toString()).toBe(nextSource);
      await writeFile(path.join(projects, project, 'output', 'film.html'), source);
      run.status = 'succeeded';
      const prepared = await handleMcpToolCall(host, 'prepare_authored_work_submission', input); expect(prepared.isError).not.toBe(true);
      const hashes = JSON.parse(prepared.content[0]!.text);
      const frozen = await handleMcpToolCall(host, 'freeze_project_work', { ...input, source_sha256: hashes.source_sha256, manifest_sha256: hashes.manifest_sha256 }); expect(frozen.isError).not.toBe(true);
      const receipt = JSON.parse(frozen.content[0]!.text);
      await writeFile(path.join(projects, project, 'output', 'film.html'), '下一版');
      const retry = await handleMcpToolCall(host, 'freeze_project_work', { ...input, source_sha256: hashes.source_sha256, manifest_sha256: hashes.manifest_sha256 }); expect(retry.isError).not.toBe(true);
      const read = await handleMcpToolCall(host, 'read_frozen_work', { project, frozen_version: receipt.frozen_version });
      expect(Buffer.from(JSON.parse(read.content[0]!.text).source_base64, 'base64').toString()).toBe(source);
      expect((await handleMcpToolCall(host, 'prepare_authored_work_submission', input)).isError).toBe(true);
      expect((await fetch(`${base}/frozen-work/${encodeURIComponent(receipt.frozen_version)}?project=other`)).status).toBe(409);
    } finally {
      if (server) await new Promise<void>(resolve => server!.close(() => resolve()));
      _resetMcpWorkspaceContextCacheForTests();
      closeDatabase(); await rm(root, { recursive: true, force: true });
    }
  });
});
