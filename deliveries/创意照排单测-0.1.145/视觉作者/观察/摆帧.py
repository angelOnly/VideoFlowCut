import io
import json
from pathlib import Path
import subprocess
import sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
W, H = 1920, 1080
font = 'C:/Windows/Fonts/msyhbd.ttc'
config = json.loads((HERE / '摆帧.json').read_text(encoding='utf-8'))
sources = config['sources']
cache = {}

def source(name, t):
    key = name, t
    if key not in cache:
        path = Path(sources[name])
        if path.suffix.lower() in ['.jpeg','.jpg','.png']:
            result = Image.open(path).convert('RGB')
        else:
            command = ['ffmpeg','-v','error','-ss',str(t),'-i',str(path),'-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1']
            output = subprocess.run(command, capture_output=True, check=True, creationflags=subprocess.CREATE_NO_WINDOW)
            result = Image.open(io.BytesIO(output.stdout)).convert('RGB')
        cache[key] = result
    return cache[key]

def scene_layer(scene, item):
    x,y,w,h = item['rect']
    pic = source(item['src'],item['t'])
    if 'crop' in item:
        pic = pic.crop(item['crop'])
    if item.get('contain'):
        contain = ImageOps.contain(pic,(w,h),Image.Resampling.LANCZOS)
        pic = Image.new('RGB',(w,h),item.get('fill','#1c2528'))
        pic.paste(contain,((w-contain.width)//2,(h-contain.height)//2))
    else:
        pic = ImageOps.fit(pic,(w,h),Image.Resampling.LANCZOS,centering=tuple(item.get('center',[.5,.5])))
    if item.get('blur',0):
        pic = pic.filter(ImageFilter.GaussianBlur(item['blur']))
    for prop, cls in [('sat',ImageEnhance.Color),('contrast',ImageEnhance.Contrast),('brightness',ImageEnhance.Brightness)]:
        if prop in item:
            pic = cls(pic).enhance(item[prop])
    if 'wash' in item:
        rgb, amount = item['wash']
        pic = Image.blend(pic,Image.new('RGB',(w,h),rgb),amount)
    border = item.get('border',0)
    corner = item.get('corner',0)
    if border:
        if corner:
            outline = Image.new('RGB', (w,h), item.get('edge','#eee7d7'))
            mask = Image.new('L',(w,h))
            ImageDraw.Draw(mask).rounded_rectangle((border,border,w-border-1,h-border-1), radius=max(1,corner-border),fill=255)
            outline.paste(pic,(0,0),mask)
            pic = outline
        else:
            ImageDraw.Draw(pic).rectangle((0,0,w-1,h-1),outline=item.get('edge','#eee7d7'),width=border)
    mask = Image.new('L',(w,h))
    ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=corner,fill=round(255*item.get('opacity',1)))
    if 'polygon' in item:
        mask = Image.new('L',(w,h))
        ImageDraw.Draw(mask).polygon(item['polygon'], fill=round(255*item.get('opacity',1)))
    angle = item.get('angle',0)
    if angle:
        pic = pic.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
        mask = mask.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
        x -= (pic.width-w)//2
        y -= (pic.height-h)//2
    if 'clip' in item:
        left,top,right,bottom = item['clip']
        bound = (max(left-x,0),max(top-y,0),min(right-x,pic.width),min(bottom-y,pic.height))
        scene.paste(pic.crop(bound),(x+bound[0],y+bound[1]),mask.crop(bound))
    else:
        scene.paste(pic,(x,y),mask)

def text_on(scene,t):
    if t.get('box'):
        ImageDraw.Draw(scene).rounded_rectangle(t['box'],radius=2,fill=t.get('back','#132223'))
    blank = Image.new('RGBA',(W,H))
    ImageDraw.Draw(blank).text(tuple(t['pos']),t['text'],font=ImageFont.truetype(font,t['size']),fill=t.get('fill','#f8f4eb'),stroke_width=t.get('stroke',0),stroke_fill=t.get('strokeFill','#182125'),anchor='lt')
    if 'frame' in t:
        ImageDraw.Draw(blank).rectangle(t['frame']['box'],outline=t['fill'],width=3)
    if t.get('angle'):
        blank = blank.rotate(t['angle'],resample=Image.Resampling.BICUBIC,center=tuple(t['pos']))
    if t.get('opacity',1)<1:
        blank.putalpha(blank.getchannel('A').point(lambda v: round(v*t['opacity'])))
    if 'clip' in t:
        x,y,x1,y1 = t['clip']
        blank = blank.crop((x,y,x1,y1))
        scene.paste(blank,(x,y),blank)
    else:
        scene.paste(blank,(0,0),blank)

export = HERE.parent / '复摆'
export.mkdir(exist_ok=True)
for step in config['steps']:
    ref = source('REF',step['ref'])
    ImageOps.fit(ref,(W,H),Image.Resampling.LANCZOS).save(export / (step['id']+'-原片.jpg'),quality=94)
    for state, out_name in [('clean','去字'),('with','有字')]+([('base','调前有字')] if step.get('before') else []):
        scene = Image.new('RGB',(W,H),step.get('base','#202426'))
        for item in step['stack']:
            if state=='clean' and 'text' in item:
                continue
            if 'text' in item:
                text_on(scene,item)
            else:
                if state=='base':
                    item = {k:v for k,v in item.items() if k not in ['sat','contrast','brightness','wash']}
                scene_layer(scene,item)
        scene.save(export / (step['id']+'-'+out_name+'.jpg'),quality=95)
