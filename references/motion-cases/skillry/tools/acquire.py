import concurrent.futures,datetime,hashlib,json,pathlib,re,shutil,subprocess,time
import requests
ROOT=pathlib.Path(__file__).resolve().parent.parent
SOURCES=ROOT/'sources'
preview=json.loads((SOURCES/'selected-preview-manifest.json').read_text(encoding='utf-8-sig'))
tree=json.loads((SOURCES/'repository-tree.json').read_text(encoding='utf-8-sig'))
commit=tree['sha']
base=f'https://raw.githubusercontent.com/yihui-dev/awesome-opus5-5-videos/{commit}/'
def get_text(path):
    response=requests.get(base+path,timeout=40);response.raise_for_status();return response.content
raw_index=get_text('data/videos.json');(SOURCES/'videos.json').write_bytes(raw_index)
index={x['slug']:x for x in json.loads(raw_index)}
for name in ['README.md','LICENSE']:
    (SOURCES/('repository-'+name)).write_bytes(get_text(name))
items=[]
for number,case in enumerate(preview['cases'],1):
    entry=index[case['slug']]
    directory=ROOT/'cases'/(case['slug']+'-original')
    (directory/'media').mkdir(parents=True,exist_ok=True)
    (directory/'evidence').mkdir(exist_ok=True)
    (directory/'sources').mkdir(exist_ok=True)
    source={'case_number':number,'case_id':case['id'],'slug':case['slug'],'title':case['title'],'group':case['group'],'author':entry['author'],'page_url':entry['skillry_url'],'original_post':entry['post_url'],'version':'Original','media_url':case.get('originalMedia',case['media']),'index_commit':commit,'index_sha256':hashlib.sha256(raw_index).hexdigest(),'prompt_partial':entry['prompt_partial'],'prompt_text':entry['prompt'],'prompt_status':'公开索引的作者输入或说明；仍需核对是否为完整生成指令','code_status':'待核查公开源码','acquisition_status':'待获取原作文件','analysis_status':'待连续过程拆解'}
    (directory/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf-8')
    (directory/'sources/author-input.txt').write_text(entry['prompt'],encoding='utf-8')
    items.append(source)
(ROOT/'manifest.json').write_text(json.dumps({'created_at':datetime.datetime.now().astimezone().isoformat(),'index_commit':commit,'case_count':len(items),'cases':items},ensure_ascii=False,indent=2),encoding='utf-8')
def acquire(source):
    directory=ROOT/'cases'/(source['slug']+'-original');media=directory/'media/original.mp4';partial=directory/'media/original.mp4.part'
    report={**source}
    try:
        prompt_path='prompts/'+source['slug']+'.md'
        prompt=get_text(prompt_path);(directory/'sources/published-prompt.md').write_bytes(prompt)
        report['published_prompt_url']=base+prompt_path
        # 原文件按字节保存；只有完整写入后才进入解码验证。
        if not media.exists():
            response=requests.get(source['media_url'],stream=True,timeout=(15,60));response.raise_for_status()
            report['response_type']=response.headers.get('Content-Type','')
            report['etag']=response.headers.get('ETag')
            expected=response.headers.get('Content-Length')
            with partial.open('wb') as target:
                for chunk in response.iter_content(1024*1024):
                    if chunk:target.write(chunk)
            if expected and partial.stat().st_size!=int(expected):raise RuntimeError('下载字节数与响应长度不一致')
            partial.replace(media)
        probe=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=index,codec_name,profile,pix_fmt,codec_type,width,height,avg_frame_rate','-of','json',str(media)],capture_output=True,text=True,timeout=40)
        if probe.returncode:raise RuntimeError(probe.stderr)
        metadata=json.loads(probe.stdout)
        if not any(x.get('codec_type')=='video' for x in metadata['streams']):raise RuntimeError('文件没有可解码视频流')
        decode=subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(media),'-map','0:v:0','-map','0:a?','-f','null','-'],capture_output=True,text=True,timeout=240)
        if decode.returncode:raise RuntimeError(decode.stderr)
        with media.open('rb') as stream:
            digest=hashlib.file_digest(stream,'sha256').hexdigest()
        report.update(acquisition_status='原作已下载且全程音视频解码通过',local_media=str(media),bytes=media.stat().st_size,sha256=digest,media_metadata=metadata,downloaded_at=datetime.datetime.now().astimezone().isoformat(),decode_status='全程通过')
        duration=float(metadata['format']['duration'])
        for name,stamp in [('start',min(.25,duration/4)),('middle',duration/2),('end',max(0,duration-.3))]:
            output=directory/'evidence'/f'check-{name}.jpg'
            result=subprocess.run(['ffmpeg','-v','error','-ss',str(stamp),'-i',str(media),'-frames:v','1','-vf','scale=640:-2','-update','1','-y',str(output)],capture_output=True,text=True,timeout=30)
            if result.returncode:raise RuntimeError(result.stderr)
        report['technical_evidence']=['evidence/check-start.jpg','evidence/check-middle.jpg','evidence/check-end.jpg']
    except Exception as error:
        report['acquisition_status']='获取或验证失败';report['error']=str(error)
    (directory/'source.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    return report
reports=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    futures=[pool.submit(acquire,item) for item in items]
    for future in concurrent.futures.as_completed(futures):
        report=future.result();reports.append(report)
        print(f"{len(reports)}/{len(items)} {report['slug']} {report['acquisition_status']}",flush=True)
        (ROOT/'acquisition-progress.json').write_text(json.dumps({'completed':len(reports),'total':len(items),'cases':reports},ensure_ascii=False,indent=2),encoding='utf-8')
order={x['slug']:x['case_number'] for x in items};reports.sort(key=lambda x:order[x['slug']])
(ROOT/'manifest.json').write_text(json.dumps({'created_at':datetime.datetime.now().astimezone().isoformat(),'index_commit':commit,'case_count':len(reports),'downloaded_count':sum(x.get('decode_status')=='全程通过' for x in reports),'cases':reports},ensure_ascii=False,indent=2),encoding='utf-8')
print('下载验证完成',sum(x.get('decode_status')=='全程通过' for x in reports),'/',len(reports),flush=True)
