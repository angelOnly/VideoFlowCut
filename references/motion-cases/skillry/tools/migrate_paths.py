"""一次性迁移旧研究目录的本地引用；原媒体和网站取证不改写。"""
import json, os, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OLD = 'E:/ai/skillry-motion-study/opus-5-5-2026-10-08'

def convert(value, base):
    normalized = value.replace('\\', '/')
    if normalized.startswith(OLD + '/'):
        return pathlib.Path(os.path.relpath(ROOT / normalized[len(OLD)+1:], base)).as_posix()
    if OLD in value:
        return value.replace(OLD,pathlib.Path(os.path.relpath(ROOT,base)).as_posix())
    return value

def visit(value, base):
    if isinstance(value, dict): return {k: visit(v, base) for k, v in value.items()}
    if isinstance(value, list): return [visit(v, base) for v in value]
    if isinstance(value, str): return convert(value, base)
    return value

if __name__ == '__main__':
    count = 0
    for path in ROOT.rglob('*'):
        if path.suffix not in ('.md', '.json', '.html'): continue
        if any(x in path.parts for x in ('related-sources', 'sources', 'code-view')): continue
        content = path.read_text(encoding='utf-8-sig')
        if OLD not in content and OLD.replace('/', '\\\\') not in content: continue
        if path.suffix == '.json':
            content = json.dumps(visit(json.loads(content), path.parent), ensure_ascii=False, indent=2)
        else:
            # 文档内的绝对链接相对该文档解析，搬到其他电脑仍可使用。
            prefix = pathlib.Path(os.path.relpath(ROOT, path.parent)).as_posix()
            content = content.replace(OLD, prefix)
        path.write_text(content, encoding='utf-8')
        count += 1
    print(f'已转换 {count} 个文件的本地路径')
