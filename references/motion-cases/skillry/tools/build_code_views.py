import hashlib,html,json,pathlib,urllib.parse

ROOT=pathlib.Path(__file__).resolve().parent.parent
index=json.loads((ROOT/'related-source-index.json').read_text(encoding='utf-8'))
folders={'heygen-com/hyperframes-community-skills':'session-story','JohnHeibel/PDoomVideo':'pdoom-video','JohnHeibel/ClaudeAnimationBase':'claude-animation-base'}
css='body{max-width:1100px;margin:30px auto;padding:0 24px;background:#12151a;color:#e8edf4;font:16px/1.8 system-ui,"Microsoft YaHei"}a{color:#9ec5f8}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#202630;padding:20px;border-radius:8px;font:14px/1.7 monospace}code{overflow-wrap:anywhere}li{margin:8px 0}'
def page(title,body):return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+'</title><style>'+css+'</style><body>'+body+'</body></html>'
body='<nav><a href="index.html">参考库总索引</a> · <a href="获取与源码核查报告.html">来源范围说明</a></nav><h1>公开相关源码与制作资料</h1><p>以下为固定Commit的公开文本快照，共73个文件。这里只以文字显示代码，没有安装、执行或重渲染；三组资料均不是本批120条原片的固定源码包。</p>'
checked=0
for entry in index:
    folder=folders[entry['repository']]
    if folder=='pdoom-video':entry['relation']='doubleunplussed-181894及anabology-491441公开输入引用的其他作品工程，不是两条案例的原片源码'
    license_name=(entry.get('license') or {}).get('spdx_id','仓库未标许可证')
    body+='<h2>'+html.escape(entry['repository'])+'</h2><p>'+html.escape(entry['relation'])+'</p><p>Commit：<code>'+html.escape(entry['commit'])+'</code> · '+html.escape(license_name)+'</p><p><a href="'+html.escape(entry['url'])+'" target="_blank">公开仓库</a></p><ul>'
    for file in entry['files']:
        raw=ROOT/'related-sources'/folder/'files'/file['path']
        data=raw.read_bytes()
        if hashlib.sha256(data).hexdigest()!=file['sha256']:raise SystemExit('公开快照哈希不一致：'+str(raw))
        relative=pathlib.Path('code-view')/folder/(file['path']+'.html')
        out=ROOT/relative;out.parent.mkdir(parents=True,exist_ok=True)
        depth=len(relative.parts)-1
        back='../'*depth+'公开相关源码.html'
        content='<nav><a href="'+back+'">公开相关源码目录</a></nav><h1>'+html.escape(file['path'])+'</h1><p>'+html.escape(entry['relation'])+'</p><p>固定Commit：'+html.escape(entry['commit'])+'；仅显示文本，未执行。</p><p><a href="'+html.escape(file['url'])+'" target="_blank">公开原文件</a></p><pre>'+html.escape(data.decode('utf-8-sig'))+'</pre>'
        out.write_text(page(file['path'],content),encoding='utf-8')
        body+='<li><a href="'+urllib.parse.quote(relative.as_posix(),safe='/')+'">'+html.escape(file['path'])+'</a></li>'
        checked+=1
    body+='</ul>'
(ROOT/'公开相关源码.html').write_text(page('公开相关源码与制作资料',body),encoding='utf-8')
(ROOT/'related-source-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'code-view-report.json').write_text(json.dumps({'checked_source_files':checked,'hash_mismatches':[],'status':'只显示转义文本，未执行源码'},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'code_views':checked},ensure_ascii=False))
