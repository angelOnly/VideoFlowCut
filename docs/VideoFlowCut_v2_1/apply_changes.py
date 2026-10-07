#!/usr/bin/env python3
"""Apply reviewed, exact-anchor skill edits and new files. Dry-run is the default.

No network, package installation, deployment, git operation, or video project write.
Requires Python 3.10+. A conflicting anchor aborts before any repository file is changed.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
from datetime import datetime, timezone

PACKAGE = Path(__file__).resolve().parent

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def safe_target(root: Path, relative: str) -> Path:
    rel = Path(relative)
    if rel.is_absolute() or '..' in rel.parts:
        raise ValueError(f'Unsafe relative path: {relative}')
    path = root / rel
    if not path.resolve().is_relative_to(root.resolve()):
        raise ValueError(f'Target resolves outside repository: {relative}')
    return path

def load_text(data: bytes) -> tuple[str, str, bool]:
    bom = data.startswith(b'\xef\xbb\xbf')
    raw = data.decode('utf-8-sig')
    newline = '\r\n' if '\r\n' in raw else '\n'
    return raw.replace('\r\n', '\n'), newline, bom

def dump_text(text: str, newline: str, bom: bool) -> bytes:
    data = text.replace('\n', newline).encode('utf-8')
    return (b'\xef\xbb\xbf' if bom else b'') + data

def plan(root: Path) -> tuple[dict[str, bytes], dict[str, bytes | None], list[dict]]:
    manifest = json.loads((PACKAGE/'skill-edits/edits.json').read_text(encoding='utf-8'))
    modified: dict[str, bytes] = {}
    originals: dict[str, bytes | None] = {}
    events: list[dict] = []
    for edit in manifest['edits']:
        rel = edit['path']
        path = safe_target(root, rel)
        if not path.is_file():
            raise ValueError(f'Missing target skill: {rel}')
        originals.setdefault(rel, path.read_bytes())
        current = modified.get(rel, originals[rel])
        assert current is not None
        text, newline, bom = load_text(current)
        before = text
        if edit['mode'] == 'insert_after_h1':
            body = (PACKAGE/edit['bodyFile']).read_text(encoding='utf-8').strip()
            marker = edit['marker']
            begin, end = f'<!-- {marker}:begin -->', f'<!-- {marker}:end -->'
            if begin in text or end in text:
                if text.count(begin) != 1 or text.count(end) != 1:
                    raise ValueError(f'Malformed existing marker: {rel}')
                existing = text[text.index(begin):text.index(end)+len(end)]
                if existing.strip() != body:
                    raise ValueError(f'Installed block has local edits; reconcile manually: {rel}')
            else:
                h = re.search(r'^# [^\n]+(?:\n|$)', text, flags=re.M)
                if not h:
                    raise ValueError(f'Unique first H1 was not found: {rel}')
                text = text[:h.end()]+'\n'+body+'\n\n'+text[h.end():].lstrip('\n')
        elif edit['mode'] == 'replace_exact':
            old, new = edit['old'], edit['new']
            if text.count(old) == 1:
                text = text.replace(old, new, 1)
            elif text.count(old) == 0 and text.count(new) == 1:
                pass
            else:
                raise ValueError(f'Exact replacement anchor missing/ambiguous: {rel}: {old[:90]}')
        else:
            raise ValueError('Unsupported edit mode')
        modified[rel] = dump_text(text, newline, bom)
        events.append({'path':rel,'mode':edit['mode'],'changed':text != before})
    for source in sorted((PACKAGE/'repo-overlay').rglob('*')):
        if not source.is_file():
            continue
        rel = source.relative_to(PACKAGE/'repo-overlay').as_posix()
        target = safe_target(root, rel)
        data = source.read_bytes()
        if target.exists():
            old = target.read_bytes()
            if old != data:
                raise ValueError(f'New-file path already contains different content: {rel}')
            originals.setdefault(rel, old)
        else:
            originals.setdefault(rel, None)
        modified[rel] = data
        events.append({'path':rel,'mode':'create_file','changed':originals[rel] != data})
    changed = {p:d for p,d in modified.items() if originals[p] != d}
    return changed, originals, events

def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root',required=True,type=Path)
    parser.add_argument('--apply',action='store_true',help='write approved changes after conflict-free preflight')
    args=parser.parse_args()
    root=args.repo_root.resolve()
    if not (root/'.agents/skills').is_dir() or not (root/'package.json').is_file():
        parser.error('repo-root must contain .agents/skills and package.json')
    try:
        changes, originals, events=plan(root)
    except (ValueError,OSError,UnicodeError,KeyError) as exc:
        print('CONFLICT — no repository changes made:',exc,file=sys.stderr)
        return 2
    result={'mode':'apply' if args.apply else 'dry-run','repoRoot':str(root),'changedFileCount':len(changes),
            'changes':[{'path':p,'beforeSha256':digest(originals[p]) if originals[p] is not None else None,'afterSha256':digest(d)} for p,d in changes.items()]}
    if not args.apply or not changes:
        print(json.dumps(result,ensure_ascii=False,indent=2))
        return 0
    # Repeat comparison immediately before writing. Do not overwrite concurrent edits.
    for rel in changes:
        path=safe_target(root,rel)
        now=path.read_bytes() if path.exists() else None
        if now != originals[rel]:
            print('CONFLICT — concurrent edit, no changes made:',rel,file=sys.stderr)
            return 2
    stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup=root/'.repair-validation'/f'topic-film-v2-{stamp}'
    backup.mkdir(parents=True,exist_ok=False)
    for rel in changes:
        if originals[rel] is not None:
            bp=backup/'before'/rel;bp.parent.mkdir(parents=True,exist_ok=True);bp.write_bytes(originals[rel])
    result['backupDirectory']=str(backup)
    (backup/'change-record.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    written=[]
    try:
        for rel,data in changes.items():
            target=safe_target(root,rel);target.parent.mkdir(parents=True,exist_ok=True)
            mode=(target.stat().st_mode & 0o777) if target.exists() else 0o644
            with tempfile.NamedTemporaryFile(dir=target.parent,delete=False) as f:
                temp=Path(f.name);f.write(data)
            os.chmod(temp,mode);os.replace(temp,target);written.append(rel)
    except BaseException:
        for rel in reversed(written):
            target=root/rel
            if originals[rel] is None: target.unlink(missing_ok=True)
            else: target.write_bytes(originals[rel])
        raise
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 0

if __name__=='__main__':
    raise SystemExit(main())
