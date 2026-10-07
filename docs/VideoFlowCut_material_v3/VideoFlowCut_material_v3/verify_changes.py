#!/usr/bin/env python3
"""Read-only verification of this candidate's new links, files and branch states.
This does not validate videos, tracking, aesthetic quality, or the entire repository.
"""
from __future__ import annotations
import argparse, json, re
from pathlib import Path
from urllib.parse import unquote
from apply_changes import PACKAGE, plan, normalized, safe

def targets(text: str) -> set[str]:
    return {m.group(1).split(' "',1)[0].strip('<>') for m in re.finditer(r'\]\(([^)\n]+)\)',text)}

def verify(repo: Path):
    repo=repo.resolve(); pending=plan(repo)
    virtual={str(p.resolve()):after for p,before,after,status,rel in pending}
    manifest=json.loads((PACKAGE/'patches/manifest.json').read_text(encoding='utf8'))
    checks=[]; issues=[]
    for entry in manifest['changes']:
        prior=normalized((PACKAGE/entry['before_file']).read_bytes())
        after=normalized((PACKAGE/entry['after_file']).read_bytes())
        for ref in sorted(targets(after)-targets(prior)):
            if re.match(r'^(https?://|mailto:|#)',ref):continue
            filepart=unquote(ref.split('#',1)[0])
            if not filepart:continue
            resolved=(repo/entry['path']).parent.joinpath(filepart).resolve()
            ok=str(resolved) in virtual or resolved.is_file()
            checks.append({'kind':'new_link','from':entry['path'],'target':ref,'passed':ok})
            if not ok:issues.append(checks[-1])
    for entry in manifest['new_files']:
        raw=(PACKAGE/entry['content_file']).read_bytes()
        path=entry['path']
        if path.endswith('.md'):
            for ref in sorted(targets(normalized(raw))):
                if re.match(r'^(https?://|mailto:|#)',ref):continue
                filepart=unquote(ref.split('#',1)[0])
                if not filepart:continue
                resolved=(repo/path).parent.joinpath(filepart).resolve()
                ok=str(resolved) in virtual or resolved.is_file()
                checks.append({'kind':'new_file_link','from':path,'target':ref,'passed':ok})
                if not ok:issues.append(checks[-1])
        if path.endswith('material-branch-record.json'):
            record=json.loads(raw)
            ok=(record['instructionStatus']=='written_not_rendered'
                and record['generatedMedia'] is None
                and record['isOriginalInputForObservedMedia'] is False)
            checks.append({'kind':'unrendered_status','from':path,'passed':ok})
            if not ok:issues.append(checks[-1])
            instruction=(repo/path).parent/record['instruction']
            ok=str(instruction.resolve()) in virtual or instruction.is_file()
            checks.append({'kind':'instruction_link','from':path,'passed':ok})
            if not ok:issues.append(checks[-1])
    summary={
      'mode':'read_only_candidate_connections',
      'repository':str(repo),
      'checked_changes':len(manifest['changes']),
      'checked_new_files':len(manifest['new_files']),
      'candidate_checks':len(checks),
      'passed':not issues,
      'scope':'Only added/changed links and candidate branch states; existing historical-media links excluded.',
      'checks':checks,'issues':issues}
    return summary

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo-root',type=Path,required=True)
    p.add_argument('--report',type=Path)
    args=p.parse_args()
    try:
        result=verify(args.repo_root)
        text=json.dumps(result,ensure_ascii=False,indent=2)
        if args.report:
            args.report.parent.mkdir(parents=True,exist_ok=True)
            args.report.write_text(text+'\n',encoding='utf8')
        print(text)
        if not result['passed']:raise SystemExit(1)
    except (OSError,ValueError,KeyError) as exc:p.exit(2,str(exc)+'\n')
if __name__=='__main__':main()
