import collections,datetime,html,json,os,pathlib,re,shutil,urllib.parse,sys
import markdown
ROOT=pathlib.Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8-sig'))
catalogue={c['slug']:c for c in json.loads((ROOT/'case-catalogue.json').read_text(encoding='utf-8'))['cases']} if (ROOT/'case-catalogue.json').exists() else {}
owners=['study_mixed','study_explainer','study_spatial']
css='''body{margin:0;background:#12151a;color:#e8edf4;font-family:system-ui,"Microsoft YaHei",sans-serif;line-height:1.8}main{max-width:1060px;margin:auto;padding:28px 24px 60px}h1{font-size:28px;line-height:1.4}h2{font-size:21px;margin-top:32px}h3{font-size:17px}p{margin:14px 0}a{color:#9ec5f8}video{width:100%;max-height:560px;background:#080a0c}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#202630;padding:18px;border-radius:8px;line-height:1.6}code{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #39414d;padding:10px;text-align:left;vertical-align:top}img{max-width:100%;height:auto}summary{cursor:pointer;padding:12px 0}nav{display:flex;gap:16px;flex-wrap:wrap}.muted{color:#aeb9c8}.status{background:#202630;padding:14px;border-radius:8px}label{display:block;margin-bottom:6px}select,input,button{font:inherit;background:#252e3a;color:#e8edf4;border:1px solid #485365;border-radius:7px;padding:9px}input{max-width:100%}.filters{display:flex;gap:16px;flex-wrap:wrap;margin:24px 0}.filters>div{flex:1;min-width:220px}@media(max-width:600px){main{padding:20px 14px}h1{font-size:23px}table{font-size:12px}td,th{padding:7px}}'''
def local_links(text,base=ROOT):
    # 使用相对链接，资料库离开本地服务器后仍能从文件浏览。
    return text.replace(ROOT.as_posix(),pathlib.Path(os.path.relpath(ROOT,base)).as_posix())
def page(title,body):
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+'</title><style>'+css+'</style></head><body><main>'+body+'</main></body></html>'
def render_md(text,base=ROOT):
    rendered=markdown.markdown(text,extensions=['tables','fenced_code'])
    return local_links(rendered,base)
def groups(record):
    return record.get('actually_viewed_image_groups',record.get('viewed_image_groups',record.get('viewed_contact_sheets',[])))
imported=[];issues=[]
for source in manifest['cases']:
    case=ROOT/'cases'/(source['slug']+'-original')
    source=json.loads((case/'source.json').read_text(encoding='utf-8-sig'))
    # 正式案例为日常构建输入；只有明确采用作者新稿时才从暂存区导入。
    found=next((ROOT/'staging'/owner/source['slug'] for owner in owners if (ROOT/'staging'/owner/source['slug']/'observation-record.json').exists()),None) if '--adopt-staging' in sys.argv else None
    if found:
        try:
            record=json.loads((found/'observation-record.json').read_text(encoding='utf-8-sig'))
            if not all((found/name).exists() for name in ['analysis.md','replication-brief.md']):raise ValueError('三份产物尚未齐备')
            if record['source_sha256']!=source['sha256']:raise ValueError('报告输入哈希与原作不一致')
            if record['case_number']!=source['case_number']:raise ValueError('案例编号不一致')
            if record.get('observed_title'):
                source.setdefault('candidate_title',source['title'])
                source['title']=record['observed_title']
            viewed=groups(record)
            if not viewed or not all((found/x).exists() for x in viewed):raise ValueError('观察记录的画面组不齐')
            timestamps=list(found.rglob('timestamps.json'))
            if not timestamps:raise ValueError('缺少源时间记录')
            for entry in timestamps:
                data=json.loads(entry.read_text(encoding='utf-8-sig'))
                if data['source_sha256']!=source['sha256']:raise ValueError('证据源哈希不一致')
                times=[x['source_time_seconds'] for x in data['frames']]
                if any(a>b for a,b in zip(times,times[1:])):raise ValueError('源时间顺序错误')
            for directory in {x.split('/')[0] for x in viewed}:
                shutil.copytree(found/directory,case/directory,dirs_exist_ok=True)
            for name in ['analysis.md','replication-brief.md']:
                text=(found/name).read_text(encoding='utf-8-sig').replace(found.as_posix()+'/','')
                (case/name).write_text(text,encoding='utf-8')
            record['source_file']='media/original.mp4'
            (case/'observation-record.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
            # 只核查技术关联与完整性；专业观察由对应负责人实际执行。
            analysis=(case/'analysis.md').read_text(encoding='utf-8')
            for target in re.findall(r'\]\(([^)]+)\)',analysis):
                if target.startswith(('http://','https://','#')):continue
                clean=target.split('#')[0].strip('<>')
                local=pathlib.Path(clean) if re.match(r'^[A-Za-z]:[/\\]',clean) else case/clean
                if not local.exists():raise ValueError('报告链接缺失：'+clean)
            source['analysis_status']='整片概览与所列关键过程已专业拆解；原速与声音未核验'
            source['analysis_owner']=record['owner']
            source['observation_record']='observation-record.json'
            source['analysis_file']='analysis.md';source['replication_brief']='replication-brief.md'
            (case/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf-8')
            imported.append(source['slug'])
        except Exception as error:issues.append({'slug':source['slug'],'error':str(error)})
    ready=(case/'analysis.md').exists() and source.get('analysis_file')=='analysis.md'
    num=source['case_number'];title=f"{num:03d} {source['title']}"
    original='media/original.mp4'
    playback='media/browser-compatible.mp4' if source['slug']=='sab8a-475686' else original
    note='本地兼容播放版，研究证据使用原片' if source['slug']=='sab8a-475686' else '本地原作'
    body=f'<nav><a href="../../index.html">参考库总索引</a><a href="{html.escape(source["page_url"])}" target="_blank">网站原作页</a><a href="{original}" download>保存原作</a><a href="source.json">来源与哈希</a></nav><h1>{html.escape(title)}</h1><p class="muted">{html.escape(source["group"])} · @{html.escape(source["author"])} · Original · {html.escape(note)}</p><video controls playsinline preload="metadata" src="{playback}"></video>'
    category=catalogue.get(source['slug'])
    if category:
        body+='<h2>这个案例适合怎样使用</h2><p>'+html.escape(category['scenario'])+'</p><dl>'
        for label,key in [('原片形态','original_form'),('适用视频类型（迁移建议）','video_types'),('段落场景','scenes'),('原片实见素材','materials'),('动效方法','methods'),('美术特点','art'),('材料要求','material_requirements'),('迁移代价','transfer_cost')]:
            value=category[key]
            body+='<dt>'+label+'</dt><dd>'+html.escape('、'.join(value) if isinstance(value,list) else value)+'</dd>'
        body+='</dl><p>推荐观察段：</p>'
        for segment in category['recommended_segments']:
            body+=f'<p><button data-start="{segment["start"]}" data-end="{segment["end"]}">播放 {segment["start"]:.2f}–{segment["end"]:.2f} 秒</button> '+html.escape(segment['reason'])+'</p>'
        body+='<script type="module" src="../../detail-player.mjs"></script>'
    body+='<h2>动效与美术拆解</h2>'
    if ready:body+=render_md((case/'analysis.md').read_text(encoding='utf-8'),case)
    else:body+='<p class="status">原作已取得，专业拆解尚在进行，未用占位文字冒充分析。</p>'
    if (case/'fullsize/timestamps.json').exists():
        fullsize=json.loads((case/'fullsize/timestamps.json').read_text(encoding='utf-8'))
        body+='<details><summary>放大关键过程画面：原尺寸源帧</summary><p class="muted">取自已查看密集区间的首、中、尾；新增全尺寸图片未再次专业审阅。点击画面可单独打开。</p>'
        for frame in fullsize['frames']:
            path='fullsize/'+frame['file']
            body+=f'<p>{frame["source_time_seconds"]:.3f}秒</p><a href="{path}" target="_blank"><img loading="lazy" src="{path}" alt="{frame["source_time_seconds"]:.3f}秒原尺寸源帧"></a>'
        body+='</details>'
    body+='<h2>研究后写的复现设计输入</h2>'
    if ready:body+=render_md((case/'replication-brief.md').read_text(encoding='utf-8'),case)
    else:body+='<p>等待专业负责人完成。</p>'
    check=json.loads((case/'sources/source-check.json').read_text(encoding='utf-8-sig'))
    assessment=''
    if ready:
        record=json.loads((case/'observation-record.json').read_text(encoding='utf-8'))
        assessment=record.get('published_input_assessment',record.get('published_prompt_review',record.get('published_prompt_assessment','')))
    body+='<h2>作者公开输入与源码范围</h2><p>'+html.escape(assessment or source['prompt_status'])+'</p><p>'+html.escape(check['source_status'])+'</p>'
    for url in check['code_links']:body+='<p><a href="'+html.escape(url)+'" target="_blank">'+html.escape(url)+'</a></p>'
    body+='<details><summary>查看作者公开输入原文</summary><pre>'+html.escape(source['prompt_text'])+'</pre></details><p><a href="sources/published-prompt.md">固定版本公开资料</a> · <a href="sources/source-check.json">本轮源码核查</a></p>'
    (case/'index.html').write_text(page(title,body),encoding='utf-8')
    source['study_page']='cases/'+source['slug']+'-original/index.html'
    source['local_media']='cases/'+source['slug']+'-original/media/original.mp4'
    manifest['cases'][num-1]=source
manifest['analysis_count']=len([x for x in manifest['cases'] if x.get('analysis_file')=='analysis.md'])
manifest['adopted_at']=datetime.datetime.now().astimezone().isoformat()
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
# 人类可读索引与网页共用同一份分类，不再维护旧单分类表。
md=['# Skillry 动效参考索引','','完整用途筛选请打开本地网页。原速与声音未专业核验。','','|编号|案例|适用类型|段落场景|','|---|---|---|---|']
for source in manifest['cases']:
    c=catalogue.get(source['slug'],{})
    md.append(f"|{source['case_number']:03d}|[{source['title']}]({source['study_page']})|{'、'.join(c.get('video_types',[]))}|{c.get('scenario','分类待补齐')}|")
(ROOT/'参考库索引.md').write_text('\n'.join(md)+'\n',encoding='utf-8')

guide=(ROOT/'使用说明.md').read_text(encoding='utf-8')
(ROOT/'使用说明.html').write_text(page('参考库使用说明','<nav><a href="index.html">参考库总索引</a></nav>'+render_md(guide)),encoding='utf-8')
report=(ROOT/'获取与源码核查报告.md').read_text(encoding='utf-8-sig')
(ROOT/'获取与源码核查报告.html').write_text(page('获取与源码核查报告','<nav><a href="index.html">参考库总索引</a></nav>'+render_md(report)),encoding='utf-8')
if (ROOT/'连续动效与美术方法.md').exists():
    methods=(ROOT/'连续动效与美术方法.md').read_text(encoding='utf-8')
    (ROOT/'连续动效与美术方法.html').write_text(page('连续动效与美术方法','<nav><a href="index.html">参考库总索引</a></nav>'+render_md(methods)),encoding='utf-8')
(ROOT/('adoption-report.json' if '--adopt-staging' in sys.argv else 'page-build-report.json')).write_text(json.dumps({'imported_count':len(imported),'analysis_count':manifest['analysis_count'],'issues':issues},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'imported':len(imported),'analysis_count':manifest['analysis_count'],'issues':issues},ensure_ascii=False))
