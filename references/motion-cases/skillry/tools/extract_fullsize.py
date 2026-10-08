import hashlib,json,pathlib,re,subprocess

ROOT=pathlib.Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
done=[];issues=[]
for source in manifest['cases']:
    case=ROOT/'cases'/(source['slug']+'-original')
    if not source.get('analysis_file'):continue
    out=case/'fullsize'
    if (out/'timestamps.json').exists():continue
    # 机械使用作者已经观察的密集区间，取首、中、尾，不新增创意选择。
    record=json.loads((case/'observation-record.json').read_text(encoding='utf-8'))
    candidates=[p for p in case.rglob('timestamps.json') if p.parent.name!='fullsize']
    dense=next((json.loads(p.read_text(encoding='utf-8')) for p in candidates if json.loads(p.read_text(encoding='utf-8')).get('start') is not None),None)
    if dense is None:issues.append({'slug':source['slug'],'error':'缺少已选密集区间'});continue
    frames=dense['frames'];targets=[frames[0]['source_time_seconds'],frames[len(frames)//2]['source_time_seconds'],frames[-1]['source_time_seconds']]
    out.mkdir(exist_ok=True)
    selector='+'.join(f'between(t,{t-0.00001:.8f},{t+0.00001:.8f})' for t in targets)
    result=subprocess.run(['ffmpeg','-hide_banner','-loglevel','info','-i',str(case/'media/original.mp4'),'-vf',f"select='{selector}',showinfo",'-fps_mode','vfr','-frames:v','3','-q:v','2','-y',str(out/'frame-%02d.jpg')],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180)
    (out/'sampling.log').write_text(result.stderr,encoding='utf-8')
    stamps=[float(x) for x in re.findall(r'\bpts_time:([\d.eE+-]+)',result.stderr)]
    files=sorted(out.glob('frame-*.jpg'))
    if result.returncode or len(files)!=3 or len(stamps)!=3:
        issues.append({'slug':source['slug'],'error':'全尺寸源帧数量不一致','files':len(files),'pts':len(stamps)});continue
    data={'source_sha256':source['sha256'],'source_media':'../media/original.mp4','selection':'已专业查看的密集区间首、中、尾，机械提取','review_status':'新增全尺寸图未再次专业审阅；原密集图组已观察','requested_source_times':targets,'frames':[{'file':p.name,'source_time_seconds':t,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p,t in zip(files,stamps)]}
    (out/'timestamps.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    done.append(source['slug'])
(ROOT/'fullsize-extraction-report.json').write_text(json.dumps({'new_count':len(done),'issues':issues},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'new_count':len(done),'issues':issues},ensure_ascii=False))
