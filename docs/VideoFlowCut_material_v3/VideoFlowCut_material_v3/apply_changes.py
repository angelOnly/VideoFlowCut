#!/usr/bin/env python3
"""Candidate documentation/Skills patcher. Read-only by default; never calls Git or MCP."""
from __future__ import annotations
import argparse, hashlib, json, os, tempfile
from pathlib import Path
from datetime import datetime, timezone

PACKAGE = Path(__file__).resolve().parent

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def normalized(data: bytes) -> str:
    return data.decode('utf-8-sig').replace('\r\n','\n')

def safe(root: Path, relative: str) -> Path:
    rel=Path(relative)
    if rel.is_absolute() or '..' in rel.parts:
        raise ValueError(f'Unsafe relative path: {relative}')
    p=root/rel
    for q in [p,*p.parents]:
        if q == root.parent: break
        if q.is_symlink(): raise ValueError(f'Symlink target refused: {q}')
    if not p.resolve().is_relative_to(root.resolve()): raise ValueError(f'Outside root: {relative}')
    return p

def plan(repo: Path):
    manifest=json.loads((PACKAGE/'patches/manifest.json').read_text(encoding='utf8'))
    planned=[]; conflicts=[]
    for entry in manifest['changes']:
        p=safe(repo,entry['path'])
        if not p.is_file(): conflicts.append(f"{entry['id']}: missing {entry['path']}"); continue
        raw=p.read_bytes(); current=normalized(raw)
        old=normalized(safe(PACKAGE,entry['before_file']).read_bytes())
        new=normalized(safe(PACKAGE,entry['after_file']).read_bytes())
        # For insertion anchors the 'old' heading is also part of 'new': check new first.
        if current.count(new)==1:
            planned.append((p,raw,raw,'already_applied',entry['path']));continue
        if current.count(old)!=1:
            conflicts.append(f"{entry['id']}: anchor count {current.count(old)} for {entry['path']}");continue
        updated=current.replace(old,new,1)
        crlf=b'\r\n' in raw; bom=raw.startswith(b'\xef\xbb\xbf')
        if crlf:updated=updated.replace('\n','\r\n')
        after=updated.encode('utf8');after=(b'\xef\xbb\xbf'+after) if bom else after
        planned.append((p,raw,after,'update',entry['path']))
    for entry in manifest['new_files']:
        p=safe(repo,entry['path']); new=safe(PACKAGE,entry['content_file']).read_bytes()
        if p.exists():
            if not p.is_file() or p.read_bytes()!=new:
                conflicts.append(f"new path already differs: {entry['path']}");continue
            planned.append((p,new,new,'already_present',entry['path']))
        else: planned.append((p,None,new,'create',entry['path']))
    if conflicts: raise ValueError('Preflight conflicts; no writes performed:\n'+'\n'.join(conflicts))
    targets=[str(x[0]) for x in planned]
    if len(targets)!=len(set(targets)): raise ValueError('Duplicate target paths in manifest')
    return planned

def atomic_write(path: Path, data: bytes):
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp=tempfile.mkstemp(prefix='.vfc-material-',dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as out: out.write(data)
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)

def run(repo: Path, apply: bool=False):
    repo=repo.resolve()
    if not repo.is_dir():raise ValueError('Repository root does not exist')
    if repo == PACKAGE or PACKAGE.is_relative_to(repo):
        # Package inside a repo is permitted by many workflows, so only identical root is refused.
        if repo == PACKAGE: raise ValueError('Package directory cannot be the repository root')
    planned=plan(repo); report=[]
    for p,before,after,status,rel in planned:
        report.append({'path':rel,'action':status,'before_sha256':digest(before) if before is not None else None,'after_sha256':digest(after)})
    result={'mode':'apply' if apply else 'dry_run','repository':str(repo),'files':report}
    if not apply:return result
    changes=[x for x in planned if x[3] in ('update','create')]
    if not changes: result['message']='Already applied; no files changed';return result
    stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup=repo/'.material-v3-backups'/stamp; backup.mkdir(parents=True,exist_ok=False)
    result['backup']=str(backup)
    for p,before,after,status,rel in changes:
        if before is not None:atomic_write(backup/rel,before)
    atomic_write(backup/'manifest.json',json.dumps(result,ensure_ascii=False,indent=2).encode('utf8'))
    written=[]
    try:
        # Check for changes between preflight and writing each file.
        for p,before,after,status,rel in changes:
            now=p.read_bytes() if p.is_file() else None
            if now!=before:raise RuntimeError(f'Concurrent change: {rel}')
            atomic_write(p,after);written.append((p,before,after,rel))
    except Exception:
        rollback_conflicts=[]
        for p,before,after,rel in reversed(written):
            if not p.is_file() or p.read_bytes()!=after:
                rollback_conflicts.append(rel);continue
            if before is None:p.unlink()
            else:atomic_write(p,before)
        if rollback_conflicts:print('Concurrent edits not overwritten; recover from backup:',rollback_conflicts)
        raise
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root',type=Path,required=True)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--report',type=Path,help='Optional local plan report (dry-run writes only this requested file)')
    args=parser.parse_args()
    try:
        result=run(args.repo_root,args.apply)
        output=json.dumps(result,ensure_ascii=False,indent=2)
        if args.report:
            args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(output+'\n',encoding='utf8')
        print(output)
    except (ValueError,RuntimeError,OSError,UnicodeError) as exc:
        parser.exit(2,str(exc)+'\n')
if __name__=='__main__':main()
