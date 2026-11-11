/** 从正式创意卡生成索引，并沿读取器的合同检查生成结果。 */
import {existsSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {splitDocument, resolveLibraryLink} from '../document-format.mjs';
import {loadCreativeIndex} from './creative-library.mjs';
import {localFile} from './mechanisms.mjs';

const defaultRoot = resolve(process.cwd(), 'references/motion-cases/skillry');
const description = '由创意卡元数据派生；原片拆解不等于新题材迁移已验证。';

export function buildCreativeIndex(root = defaultRoot) {
  const catalogue = JSON.parse(readFileSync(localFile(root, 'case-catalogue.json'), 'utf8'));
  const cards = [];
  const processedCases = [];

  for (const source of catalogue.cases) {
    const directory = `${source.directory}/creative`;
    if (!existsSync(resolve(root, directory))) continue;
    const names = readdirSync(localFile(root, directory)).filter(name => /^c\d{2}\.md$/.test(name)).sort();
    if (!names.length) continue;
    processedCases.push(source.case_number);

    for (const name of names) {
      const cardPath = `${directory}/${name}`;
      const {metadata, body} = splitDocument(readFileSync(localFile(root, cardPath), 'utf8'));
      if (!metadata || metadata.case_number !== source.case_number || metadata.id !== `${String(source.case_number).padStart(3, '0')}-${name.slice(0, -3)}`) {
        throw new Error(`${cardPath} 的编号或父案例不一致`);
      }
      const media = {};
      for (const field of ['video', 'clip', 'storyboard']) {
        const link = typeof metadata[field] === 'string' && resolveLibraryLink(metadata[field], cardPath);
        if (!link || link.kind !== 'local' || !statSync(localFile(root, link.path)).isFile()) {
          throw new Error(`${metadata.id} 的 ${field} 资料不可用`);
        }
        media[field] = link.path;
      }
      if (media.video !== source.media) throw new Error(`${metadata.id} 原片与父案例不一致`);
      for (const match of body.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
        const link = resolveLibraryLink(match[1], cardPath);
        if (!link || (link.kind === 'local' && !statSync(localFile(root, link.path)).isFile())) {
          throw new Error(`${metadata.id} 的正文链接不可用：${match[1]}`);
        }
      }
      cards.push({
        id: metadata.id,
        case_number: metadata.case_number,
        title: metadata.title,
        summary: metadata.summary,
        use_when: metadata.use_when,
        card: cardPath,
        video: media.video,
        start_ms: metadata.start_ms,
        end_ms: metadata.end_ms,
        clip: media.clip,
        storyboard: media.storyboard,
        frame_times_ms: metadata.frame_times_ms
      });
    }
  }

  cards.sort((a, b) => a.case_number - b.case_number || a.start_ms - b.start_ms || a.id.localeCompare(b.id));
  processedCases.sort((a, b) => a - b);
  const index = {
    schema_version: 1,
    description,
    catalogue_case_count: catalogue.cases.length,
    processed_cases: processedCases,
    count: cards.length,
    cards
  };
  // 构建时使用与正式检索相同的完整校验，失败时不写入索引。
  loadCreativeIndex(root, Buffer.from(JSON.stringify(index, null, 2) + '\n'));
  return index;
}

export function main(args) {
  if (args.length !== 1 || !['--build', '--check'].includes(args[0])) {
    throw new Error('仅支持 --build 或 --check');
  }
  const path = resolve(defaultRoot, 'creative-index.json');
  const value = JSON.stringify(buildCreativeIndex(), null, 2) + '\n';
  if (args[0] === '--build') {
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, value, {encoding: 'utf8', flag: 'wx'});
      renameSync(temporary, path);
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    process.stdout.write('创意索引已更新\n');
  } else if (!existsSync(path) || readFileSync(path, 'utf8') !== value) {
    throw new Error('创意索引过期，请重新生成');
  } else {
    process.stdout.write('创意索引与文档一致\n');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
