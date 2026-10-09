"""读取本轮修改前的固定快照，为双栏阅读提供原文与实际迁移去向。"""
from pathlib import Path
import hashlib
import json
import re
import zipfile


def build_comparison(root, current, markdown):
    archive = root / 'docs/development/skills-organization'
    hashes = json.loads((archive / 'before-skills-sha256.json').read_text(encoding='utf-8'))
    moves = json.loads((archive / 'file-moves.json').read_text(encoding='utf-8'))
    sections = json.loads((archive / 'section-migration.json').read_text(encoding='utf-8'))
    current_by_path = {f['path']: f for f in current}
    originals = []
    with zipfile.ZipFile(archive / 'before-skills-text.zip') as snapshot:
        for path in sorted(snapshot.namelist()):
            raw = snapshot.read(path)
            if hashlib.sha256(raw).hexdigest() != hashes[path]:
                raise ValueError(f'修改前快照与原始清单不符：{path}')
            text = raw.decode('utf-8-sig')
            frontmatter = re.match(r'^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)', text)
            body = text[frontmatter.end():] if frontmatter else text
            title = re.search(r'^# (.+)', body, re.M)
            targets = []
            for candidate in [path, moves.get(path)]:
                if candidate in current_by_path and 'source' in current_by_path[candidate] and candidate not in targets:
                    targets.append(candidate)
            records = [s for s in sections if s['source'] == path]
            for record in records:
                for candidate in [record.get('target'), *record.get('additionalTargets', [])]:
                    if candidate in current_by_path and 'source' in current_by_path[candidate] and candidate not in targets:
                        targets.append(candidate)
            primary = current_by_path.get(targets[0], {}) if targets else {}
            state = '已拆分或归并' if len(targets) > 1 else '已迁移' if targets and targets[0] != path else '已修改' if targets else '已移出活动资料'
            if len(targets) == 1 and primary.get('sha256') == hashes[path]:
                state = '原文未改' if targets[0] == path else '原文迁移'
            notes = list(dict.fromkeys(note for r in records for note in [r['action'] if r['action'] != '完整迁移' else None, r.get('refinementNote')] if note))
            originals.append({'path': path, 'source': text, 'label': primary.get('label') or (title[1] if title else Path(path).name), 'html': markdown(body) if path.endswith('.md') else '', 'metadata': frontmatter[0] if frontmatter else '', 'targets': targets, 'state': state, 'notes': notes})
    return {'originals': originals, 'moves': moves, 'baseline': '本轮优化开始前保存的完整快照', 'archive': 'development/skills-organization/before-skills-text.zip'}
