import argparse,json,pathlib,re,subprocess
from PIL import Image,ImageDraw,ImageFont
parser=argparse.ArgumentParser()
parser.add_argument('--case',required=True);parser.add_argument('--out',required=True)
parser.add_argument('--start',type=float);parser.add_argument('--end',type=float);parser.add_argument('--step',type=float,default=1)
args=parser.parse_args();case=pathlib.Path(args.case);out=pathlib.Path(args.out);out.mkdir(parents=True,exist_ok=True)
source=json.loads((case/'source.json').read_text(encoding='utf-8-sig'))
media=case/'media/original.mp4'
if source.get('decode_status')!='全程通过':raise SystemExit('原作尚未通过下载解码，不采样')
if args.start is not None:
    fps=next(x['avg_frame_rate'] for x in source['media_metadata']['streams'] if x.get('codec_type')=='video')
    numerator,denominator=map(float,fps.split('/'));stride=max(1,int(numerator/denominator/12))
    selector=f'between(t,{args.start},{args.end})*not(mod(n,{stride}))'
else:selector=f'isnan(prev_selected_t)+gte(t-prev_selected_t,{args.step})'
cmd=['ffmpeg','-hide_banner','-loglevel','info','-i',str(media),'-vf',f"select='{selector}',showinfo,scale=300:190:force_original_aspect_ratio=decrease,pad=300:190:(ow-iw)/2:(oh-ih)/2",'-fps_mode','vfr','-q:v','3','-y',str(out/'frame-%05d.jpg')]
result=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180)
(out/'sampling.log').write_text(result.stderr,encoding='utf-8')
if result.returncode:raise SystemExit(result.stderr[-2500:])
stamps=[float(x) for x in re.findall(r'\bpts_time:([\d.eE+-]+)',result.stderr)]
frames=sorted(out.glob('frame-*.jpg'))
if len(stamps)!=len(frames):raise SystemExit(f'源时间与图片数量不一致：{len(stamps)} / {len(frames)}')
records=[{'file':x.name,'source_time_seconds':stamp} for x,stamp in zip(frames,stamps)]
metadata={'source_sha256':source['sha256'],'source_media':str(media),'scope':'实际源帧，无插帧，时间来自源PTS','start':args.start,'end':args.end,'step':args.step,'frames':records}
(out/'timestamps.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
for offset in range(0,len(frames),20):
    batch=frames[offset:offset+20];rows=(len(batch)+3)//4
    sheet=Image.new('RGB',(1200,rows*220),'#121417');draw=ImageDraw.Draw(sheet)
    for j,path in enumerate(batch):
        x=j%4*300;y=j//4*220;sheet.paste(Image.open(path),(x,y));draw.text((x+7,y+194),f"{stamps[offset+j]:.3f}s",font=font,fill='white')
    sheet.save(out/f'sheet-{offset//20+1:03d}.jpg',quality=92)
print(json.dumps({'frames':len(frames),'sheets':(len(frames)+19)//20,'out':str(out),'first':stamps[0] if stamps else None,'last':stamps[-1] if stamps else None},ensure_ascii=False))
