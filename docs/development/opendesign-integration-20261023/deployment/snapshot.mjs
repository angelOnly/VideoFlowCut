// 只读记录正式项目和任务；发布过程不改写任何生产快照。
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const stage = process.argv[2];
assert.ok(['initial', 'before', 'after'].includes(stage));
const db = new DatabaseSync('E:/ai/VideoCut/workspace/app.sqlite', {readOnly: true});
let result;
try {
  result = {
    projects: db.prepare('SELECT p.id, p.current_revision_number, r.snapshot_json FROM projects p JOIN revisions r ON r.id = p.current_revision_id ORDER BY p.id').all().map(row => ({projectId: row.id, revision: row.current_revision_number, sha256: createHash('sha256').update(row.snapshot_json).digest('hex')})),
    jobs: db.prepare('SELECT * FROM jobs ORDER BY id').all().map(row => ({id: row.id, projectId: row.project_id, status: row.status, sha256: createHash('sha256').update(JSON.stringify(row)).digest('hex')})),
  };
} finally { db.close(); }
await writeFile(join(import.meta.dirname, `snapshot-${stage}.json`), JSON.stringify(result, null, 2));
if (stage === 'after') assert.deepEqual(result, JSON.parse(await readFile(join(import.meta.dirname, 'snapshot-before.json'), 'utf8')), '正式项目和历史任务必须保持不变');
console.log(JSON.stringify({stage, projectCount: result.projects.length, jobCount: result.jobs.length, pending: result.jobs.filter(job => ['queued', 'running', 'unknown'].includes(job.status)), unchanged: stage === 'after' ? true : undefined}));
