import datetime,hashlib,json,os,pathlib,re,urllib.parse

ROOT=pathlib.Path(__file__).resolve().parent.parent
owners=[('study_mixed','001—040'),('study_explainer','041—080'),('study_spatial','081—120')]
parts=['# 连续动效与美术方法','', '以下内容按三位专业研究者的案例范围汇编，方法解释保留专业研究者输出。案例链接可打开对应原片、逐条拆解和后写复现输入。','', '观察范围为整片源帧概览及所列密集过程，原速与声音未专业核验。跨案例归纳是设计参考，应用到新内容后仍需制作与观看验证。','']
records=[]
for owner,span in owners:
    path=ROOT/'staging'/owner/'design-patterns.md'
    if not path.exists():raise SystemExit('专业归纳尚未齐备：'+owner)
    original=path.read_text(encoding='utf-8-sig')
    def relocate(match):
        value=match.group(1).strip('<>')
        url=urllib.parse.urlsplit(value)
        if url.scheme or not url.path:return match.group(0)
        candidate=ROOT/urllib.parse.unquote(url.path)
        target=candidate.resolve() if candidate.exists() else (path.parent/urllib.parse.unquote(url.path)).resolve()
        try:
            staged=target.relative_to(ROOT/'staging'/owner)
            if len(staged.parts)>1:
                case_target=ROOT/'cases'/(staged.parts[0]+'-original')/pathlib.Path(*staged.parts[1:])
                if case_target.exists():target=case_target
        except ValueError:pass
        if not target.exists():raise ValueError('归纳链接缺失：'+value)
        relative=pathlib.Path(os.path.relpath(target,ROOT)).as_posix()
        suffix=('?'+url.query if url.query else '')+('#'+url.fragment if url.fragment else '')
        return ']('+relative+suffix+')'
    relocated=re.sub(r'\]\(([^)]+)\)',relocate,original)
    parts.extend([f'## 案例{span}',''])
    # 只调整层级，不由主任务重写专业内容。
    content=re.sub(r'(?m)^(#{1,5}) ',r'##\1 ',relocated)
    parts.extend([content,''])
    records.append({'owner':owner,'case_range':span,'source':path.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'operation':'保留文字，调整标题层级；机械改为正式案例相对链接后汇编'})
(ROOT/'连续动效与美术方法.md').write_text('\n'.join(parts),encoding='utf-8')
(ROOT/'method-authorship.json').write_text(json.dumps({'assembled_at':datetime.datetime.now().astimezone().isoformat(),'sources':records},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'authors':len(records),'method_file':'连续动效与美术方法.md'},ensure_ascii=False))
