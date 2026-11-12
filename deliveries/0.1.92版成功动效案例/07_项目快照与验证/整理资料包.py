import json, pathlib, shutil, hashlib, re, subprocess, zipfile, csv, io, collections
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(r'E:\ai\VideoCut')
BASE = ROOT / 'delivery/AI_brakes_R144_20M_20261016'
OUT = BASE / '资料包'
PROJ = ROOT / 'workspace/projects/project_1716474f-9b32-41f4-87f6-9b85441fbdbb'
SNAP = json.loads((OUT/'07_项目快照与验证/project-snapshot.json').read_text(encoding='utf-8'))
S = SNAP['snapshot']
ART = json.loads((OUT/'07_项目快照与验证/export-artifact.json').read_text(encoding='utf-8'))
COPIES = []
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(rel, value):
    p=OUT/rel; p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(value if isinstance(value,str) else json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
    return p
def copy(src, rel):
    src=pathlib.Path(src); dst=OUT/rel; dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)
    COPIES.append({'包内路径':rel,'来源路径':str(src),'来源SHA256':sha(src),'保存方式':'原文件复制'})
    return dst
def clean(v):
    if isinstance(v,dict):
        return {k:clean(x) for k,x in v.items() if k not in {'encrypted_content','raw_content','summary_text','internal_chat_message_metadata_passthrough','image_url','data','blob'}}
    if isinstance(v,list): return [clean(x) for x in v if not isinstance(x,dict) or x.get('type') not in {'image','input_image','output_image','reasoning'}]
    if isinstance(v,str):
        if v.startswith('gAAAAA'): return '[该字段为加密记录，无可用明文；未解密或补写]'
        return re.sub(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+','[图像数据省略，实际图片另列]',v)
    return v

def stage():
    for p in sorted((ROOT/'.production/ai-brakes-20261016').iterdir()):
        if p.is_file(): copy(p,'02_导演与声音字幕原始交付/'+p.name)
    for p in sorted((PROJ/'authoring').iterdir()):
        if p.is_file(): copy(p,('06_校样与素材观察/' if p.suffix=='.jpg' else '03_视觉美术动效原始交付/')+p.name)
    for p in sorted((PROJ/'assets/derived/source-material').rglob('*')):
        if p.is_file(): copy(p,'05_实际素材/证据原件/'+str(p.relative_to(PROJ/'assets/derived/source-material')).replace('\\','/'))
    for p in (PROJ/'reports').glob('*.json'): copy(p,'07_项目快照与验证/'+p.name)
    for p in (PROJ/'manifests').rglob('*.json'): copy(p,'07_项目快照与验证/来源清单/'+p.name)
    for n in ['560','600','680','3020','3050','3080','3150','3250','3650']:
        p=PROJ/f'previews/frames/revision-144-frame-{n}.jpg'
        if p.exists(): copy(p,'06_校样与素材观察/最终合成/'+p.name)
    for n in ['production-coordinator','production-director','visual-explainer-director','visual-treatment-planning','motion-case-library','visual-asset-sourcing','remotion-production','evidence-visualization','scene-planning','effect-timing','audio-finishing','sound-asset-sourcing','voice-production','captions','quality-verification','export','project-basics']:
        p=ROOT/'.agents/skills'/n/'SKILL.md'
        if p.exists(): copy(p,'08_本轮方法与指令/'+n+'/SKILL.md')
    refs=['_shared/TOPIC_TO_FILM.md','production-coordinator/references/video-type-routing.md','visual-treatment-planning/references/art-direction.md','motion-case-library/references/search-and-read.md','quality-verification/references/professional-review.md','remotion-production/references/submission-and-recovery.md']
    for rel in refs:
        p=ROOT/'.agents/skills'/rel
        if p.exists(): copy(p,'08_本轮方法与指令/'+rel)
    copy(ROOT/'AGENTS.md','08_本轮方法与指令/项目AGENTS.md')
    # 只提取可见指令、交付和工具证据；不读取或导出 Reasoning。
    sessions=pathlib.Path(r'C:\Users\13222\.codex\sessions\2026\10\16')
    paths=['01a14055-6ed7','01a14056-406b','01a14056-7b15','01a14056-b3b6']
    roles=['主任务','导演','素材作者','视觉作者']
    for token,role in zip(paths,roles):
        f=next(sessions.glob('*'+token+'*.jsonl'))
        messages=[]; ops=[]; search=[]; counts=collections.Counter()
        for line in f.open(encoding='utf-8'):
            row=json.loads(line); p=row.get('payload',{}); t=p.get('type')
            stamp=row.get('timestamp')
            if row.get('type')=='event_msg' and t=='item_completed':
                it=p.get('item',{}); kind=it.get('type')
                if kind in {'Reasoning','ContextCompaction'}: continue
                if kind=='UserMessage':
                    txt=json.dumps(it,ensure_ascii=False)
                    if '把这个视频，以及导演思考指令' in txt: break
                if kind=='AgentMessage':
                    messages.append({'时间':stamp,'记录类型':'可见交付或进度','内容':clean(it)})
                if kind=='McpToolCall':
                    entry={'时间':stamp,'记录':clean(it)}; ops.append(entry); counts[it.get('tool','未知')]+=1
                    if re.search(r'search|browse|source|candidate|request|acquire|inspect|analy|observation|motion_case',it.get('tool',''),re.I): search.append(entry)
                elif kind=='CommandExecution':
                    cmd=it.get('command','')
                    if isinstance(cmd,list): cmd=' '.join(map(str,cmd))
                    # 留存与取材/作品核查有关的可见命令，排除环境、记忆和本次归档。
                    if not any(x in cmd for x in ['.codex\\memories','.codex/memories','整理资料包.py','API_KEY','Authorization','load_workspace_dependencies']) and re.search(r'authoring|motion|materials|ffmpeg|ffprobe|source-material|sources|references',cmd,re.I):
                        ops.append({'时间':stamp,'记录':clean(it)})
            elif row.get('type')=='response_item' and t=='agent_message':
                messages.append({'时间':stamp,'记录类型':'实际接收的协作指令或回传','内容':clean(p.get('content',[]))})
        def jl(rows): return ''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in rows)
        write('04_真实指令与检索记录/'+role+'_可见协作指令与回传.jsonl',jl(messages))
        write('04_真实指令与检索记录/'+role+'_工具操作与结果.jsonl',jl(ops))
        write('04_真实指令与检索记录/'+role+'_检索取材与观察原始记录.jsonl',jl(search))
        write('04_真实指令与检索记录/'+role+'_索引.json',{'来源会话文件':f.name,'可见消息数量':len(messages),'操作数量':len(ops),'检索观察数量':len(search),'MCP工具计数':dict(counts),'边界':'排除Reasoning、系统开发者消息、上下文压缩、加密字段明文和无关会话。'})
    # 精确保存实际使用的来源，避免已绑定却未消费的图片被误标为上屏证据。
    source_assets=[]
    for a in S['assets']:
        source_assets.append({k:a.get(k) for k in ['id','name','kind','role','managedPath','sourceHash','metadata','provenance']})
    write('05_实际素材/全部素材登记与来源.json',source_assets)
    cap=json.loads((OUT/'07_项目快照与验证/captions-final.json').read_text(encoding='utf-8'))
    def tc(fr):
        ms=round(fr*1000/30); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); sec,ms=divmod(ms,1000)
        return f'{h:02}:{m:02}:{sec:02},{ms:03}'
    write('02_导演与声音字幕原始交付/最终字幕_R144.srt','\n\n'.join(f"{i+1}\n{tc(c['startFrame'])} --> {tc(c['endFrame'])}\n{c['text']}" for i,c in enumerate(cap['captions']))+'\n')
    # 三个动作原声音量小，原文件复制；长音轨只另制节选代理。
    for aid in ['asset_09a0ed39-6503-49d1-8c0d-8d7c21ee2ed1','asset_32d72286-0599-4e5f-83f2-ab929c3974ec','asset_29e4d7c1-7271-443d-a4f5-ac94e0b7a187']:
        a=next(x for x in S['assets'] if x['id']==aid); copy(PROJ/a['managedPath'],'05_实际素材/音效原文件/'+a['name'])
    write('07_项目快照与验证/复制来源清单.json',COPIES)
    print(json.dumps({'阶段':'原始资料已收集','复制文件':len(COPIES),'未压缩资料字节':sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())},ensure_ascii=False),flush=True)

def run(args, log):
    r=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-y']+args,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    (BASE/log).write_bytes(r.stdout)
    if r.returncode: raise RuntimeError(log)

def media():
    movie=OUT/'01_成片/AI的油门与刹车_R144_压缩观看版.mp4'; movie.parent.mkdir(parents=True,exist_ok=True)
    original=PROJ/ART['relativePath']; passlog=str(BASE/'成片两遍编码')
    common=['-i',str(original),'-map','0:v:0','-vf','scale=1280:720','-c:v','libx264','-preset','medium','-b:v','500k','-pix_fmt','yuv420p']
    run(common+['-pass','1','-passlogfile',passlog,'-an','-f','null','NUL'],'成片第一遍.log')
    run(common+['-pass','2','-passlogfile',passlog,'-map','0:a:0','-c:a','aac','-b:a','80k','-movflags','+faststart',str(movie)],'成片第二遍.log')
    jobs=[]
    for slot,b in json.loads((PROJ/'authoring/motion-work.json').read_text(encoding='utf-8'))['videoBindings'].items():
        a=next(x for x in S['assets'] if x['id']==b['assetId']); out=OUT/f'05_实际素材/采用视频节选代理/{slot}_{b["sourceStartMs"]}-{b["sourceEndMs"]}ms_720p静音.mp4'; out.parent.mkdir(parents=True,exist_ok=True)
        jobs.append((['-ss',str(b['sourceStartMs']/1000),'-i',str(PROJ/a['managedPath']),'-t',str((b['sourceEndMs']-b['sourceStartMs'])/1000),'-vf','scale=1280:720','-r','30','-c:v','libx264','-preset','medium','-crf','26','-an','-movflags','+faststart',str(out)],f'素材_{slot}.log'))
    for aid,name,seconds in [('asset_6aba342d-c842-4e99-966c-0d992d17d14d','完整旁白_压缩代理.m4a',123.06),('asset_f4a12863-97e8-4d8e-bd54-7c12091b55d6','BGM采用源范围0-119.033秒_未加包络.m4a',3571/30)]:
        a=next(x for x in S['assets'] if x['id']==aid); out=OUT/'05_实际素材/声音节选代理'/name; out.parent.mkdir(parents=True,exist_ok=True)
        jobs.append((['-i',str(PROJ/a['managedPath']),'-t',str(seconds),'-vn','-c:a','aac','-b:a','80k',str(out)],name+'.log'))
    with ThreadPoolExecutor(max_workers=2) as ex:
        list(ex.map(lambda x:run(*x),jobs))
    print(json.dumps({'阶段':'成片及采用素材代理已生成','成片字节':movie.stat().st_size},ensure_ascii=False),flush=True)

if __name__=='__main__':
    import sys
    if sys.argv[1]=='stage': stage()
    elif sys.argv[1]=='media': media()
