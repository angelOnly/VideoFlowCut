import concurrent.futures,datetime,hashlib,html.parser,json,pathlib,re
import requests
ROOT=pathlib.Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8-sig'))
HEADERS={'User-Agent':'Motion-Reference-Study'}
class Links(html.parser.HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        data=dict(attrs)
        if tag=='a' and data.get('href'):self.links.append(data['href'])
def inspect_case(case):
    directory=ROOT/'cases'/(case['slug']+'-original')
    result={'case_id':case['case_id'],'slug':case['slug'],'page':case['page_url'],'index_commit':case['index_commit'],'prompt_partial':case['prompt_partial'],'scope':'固定公开索引、作者输入和Skillry详情页的链接；不是全网穷尽证明','source_status':'本轮未找到原片固定源码','code_links':[]}
    text=case['prompt_text'];result['input_kind']='索引标为节选或不完整' if case['prompt_partial'] else '索引未标节选，仍需专业负责人核对内容性质'
    candidates=re.findall(r'https?://(?:gist\.)?github\.com/[^\s<>"\)]+',text)
    try:
        response=requests.get(case['page_url'],timeout=30);response.raise_for_status()
        (directory/'sources/detail-page.html').write_bytes(response.content)
        result['page_sha256']=hashlib.sha256(response.content).hexdigest()
        links=Links();links.feed(response.text)
        candidates.extend(url for url in links.links if re.match(r'https?://(?:gist\.)?github\.com/',url) and 'yihui-dev/awesome-opus5-5-videos' not in url)
        result['page_status']='公开页面已核查'
    except Exception as error:result['page_status']='未取得';result['error']=str(error)
    result['code_links']=sorted(set(candidates))
    if result['slug']=='anabology-491441':
        result['code_links'].append('https://github.com/JohnHeibel/PDoomVideo')
        result['link_correction_basis']='公开输入将https://、github.com/JohnHeibel/PDo和omVideo断行；与已核查的公开PDoomVideo仓库相符'
        result['source_status']='作者输入引用了另一作品PDoomVideo的源码；不是本片源码'
    if result['slug']=='jake11moran-825416':result['source_status']='找到作者公开的生成Skill；不是原片固定工程'
    if result['slug']=='doubleunplussed-181894':result['source_status']='作者输入链接了另一作品的参考源码；不是本片源码'
    (directory/'sources/source-check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    return result
reports=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for result in pool.map(inspect_case,manifest['cases']):
        reports.append(result)
        if len(reports)%20==0:print('公开资料核查',len(reports),'/',len(manifest['cases']),flush=True)
(ROOT/'source-checks.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
print('公共源码链接',sum(bool(x['code_links']) for x in reports),flush=True)

def repo_snapshot(repo,subset,tag,relation):
    target=ROOT/'related-sources'/tag;target.mkdir(parents=True,exist_ok=True)
    response=requests.get('https://api.github.com/repos/'+repo,headers=HEADERS,timeout=30);response.raise_for_status();info=response.json()
    branch=info['default_branch']
    response=requests.get(f'https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1',headers=HEADERS,timeout=30);response.raise_for_status();tree=response.json();sha=tree['sha']
    (target/'repository-tree.json').write_text(json.dumps(tree,ensure_ascii=False,indent=2),encoding='utf-8')
    selected=[]
    for item in tree['tree']:
        path=item['path']
        if item['type']!='blob' or item.get('size',0)>2*1024*1024:continue
        in_scope=not subset or path.startswith(subset) or path in ['README.md','LICENSE','LICENSE.md','LICENSE.txt']
        is_text=path.lower().endswith(('.md','.js','.mjs','.cjs','.ts','.tsx','.jsx','.html','.css','.json','.py','.txt','.toml','.yaml','.yml')) or path in ['LICENSE','.gitignore']
        if in_scope and is_text:selected.append(path)
    files=[]
    for path in selected:
        url=f'https://raw.githubusercontent.com/{repo}/{sha}/{path}'
        response=requests.get(url,timeout=30);response.raise_for_status()
        local=target/'files'/path;local.parent.mkdir(parents=True,exist_ok=True);local.write_bytes(response.content)
        files.append({'path':path,'url':url,'sha256':hashlib.sha256(response.content).hexdigest()})
    record={'repository':repo,'commit':sha,'url':'https://github.com/'+repo,'relation':relation,'license':info.get('license'),'files':files,'scope':'只保存公开文本源码与说明；未获取大音频、字体和二进制素材，未安装或执行','render_status':'未进行依赖安装和重渲染，对应原片版本未核验','取得时间':datetime.datetime.now().astimezone().isoformat()}
    (target/'source.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
    print('取得相关公开文本资料',repo,len(files),flush=True)
    return record
related=[]
for args in [
('heygen-com/hyperframes-community-skills','skills/session-story/','session-story','jake11moran-825416作者公开的生成Skill，不是原片固定工程'),
('JohnHeibel/PDoomVideo',None,'pdoom-video','doubleunplussed-181894输入中引用的其他作品工程，不是该案例源码'),
('JohnHeibel/ClaudeAnimationBase',None,'claude-animation-base','PDoomVideo作者公开的可复用基础工程，与所选120条无逐条原片对应')]:
    try:related.append(repo_snapshot(*args))
    except Exception as error:related.append({'repository':args[0],'error':str(error)})
(ROOT/'related-source-index.json').write_text(json.dumps(related,ensure_ascii=False,indent=2),encoding='utf-8')
