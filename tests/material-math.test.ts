import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';

// 教学纯函数不进入生产运行时，但其坐标和时钟回归必须随 npm test 执行。
test('素材坐标、源时钟和预览偏移的数学回归', () => {
  execFileSync(process.execPath, [
    '--test',
    join(process.cwd(), '.agents/skills/remotion-production/references/material-math.test.mjs'),
  ], {encoding: 'utf8', timeout: 30_000});
});
