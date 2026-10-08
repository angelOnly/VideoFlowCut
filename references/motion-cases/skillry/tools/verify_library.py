import hashlib,json,pathlib,urllib.parse
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parent.parent
PREVIEW=ROOT
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):self.links.extend(v for k,v in attrs if k in ('href','src') and v)

# 保存的作者网页是原始取证材料，验证范围只含交付的本地研究页面。
pages=list(ROOT.glob('*.html'))+list((ROOT/'cases').glob('*/index.html'))+list((ROOT/'code-view').rglob('*.html'))
issues=[];checked=0
for page in pages:
    parser=Links();parser.feed(page.read_text(encoding='utf-8-sig'))
    for link in parser.links:
        url=urllib.parse.urlsplit(link)
        if url.scheme or not url.path:continue
        path=urllib.parse.unquote(url.path)
        if path.startswith('/library/'):target=ROOT/path[len('/library/'):]
        elif path.startswith('/'):target=PREVIEW/path[1:]
        else:target=page.parent/path
        checked+=1
        if not target.exists():issues.append({'page':page.relative_to(ROOT).as_posix(),'target':link})
report={'scope':'交付研究HTML页面，不含网站取证快照','checked_pages':len(pages),'checked_links':checked,'issues':issues}
(ROOT/'link-check-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
bad=[];total=0;analysis=0;briefs=0;records=0;fullsize=0
for case in manifest['cases']:
    directory=ROOT/'cases'/(case['slug']+'-original');media=directory/'media/original.mp4'
    total+=media.stat().st_size
    if hashlib.sha256(media.read_bytes()).hexdigest()!=case['sha256'] or media.stat().st_size!=case['bytes']:bad.append(case['slug'])
    analysis+=int((directory/'analysis.md').exists());briefs+=int((directory/'replication-brief.md').exists());records+=int((directory/'observation-record.json').exists());fullsize+=int((directory/'fullsize/timestamps.json').exists())
integrity={'checked_originals':len(manifest['cases']),'bytes':total,'hash_mismatches':bad,'analyses':analysis,'replication_briefs':briefs,'observation_records':records,'fullsize_sets':fullsize}
(ROOT/'integrity-report.json').write_text(json.dumps(integrity,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'links':report,'integrity':integrity},ensure_ascii=False))
if issues or bad or min(analysis,briefs,records,fullsize)!=len(manifest['cases']):raise SystemExit(1)
