import math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

folder = sys.argv[1]
font_path = 'C:/Windows/Fonts/msyh.ttc'
def font(size):
    return ImageFont.truetype(font_path, size)

out = os.path.join(folder, 'grasp-explainer.mp4')
movie = os.path.join(folder, 'BMW_Clip_Wide.mp4')
flags = subprocess.CREATE_NO_WINDOW
args = ['ffmpeg','-hide_banner','-loglevel','error','-y','-i',movie,
        '-f','rawvideo','-pix_fmt','rgb24','-s','560x720','-r','30','-i','-',
        '-filter_complex','[0:v]fps=30,scale=720:720:force_original_aspect_ratio=increase,crop=720:720:140:0,setsar=1,tpad=stop_mode=clone:stop_duration=1[v];[v][1:v]hstack[out]',
        '-map','[out]','-t','12','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',out]
process = subprocess.Popen(args, stdin=subprocess.PIPE, creationflags=flags)

def ease(x):
    x = max(0, min(1, x))
    return x*x*(3-2*x)

white = '#EDF4F4'
muted = '#A3B3BC'
cyan = '#60DED4'
orange = '#F7B66D'
bg = '#12232D'

for frame in range(360):
    t = frame/30
    panel = Image.new('RGB', (560, 720), bg)
    d = ImageDraw.Draw(panel)
    d.rectangle((0,0,2,720), fill=cyan)
    d.text((51,59), '抓取原理示意', fill=cyan, font=font(28))
    d.line([(51,107),(509,107)],fill='#405460',width=2)
    stage = 0 if t < 4 else 1 if t < 8 else 2
    title = ['工件移位', '重新定位', '调整后重抓'][stage]
    detail = ['碰到工件后，原抓取点已经偏离。','检测变化，确认工件的新位置。','夹爪调整位置，夹紧后再抬起。'][stage]
    d.text((49,142),title,fill=white,font=font(53))
    d.rounded_rectangle((57,252,503,506), radius=19, fill='#1A313D', outline='#405460', width=2)
    for x in range(80,490,23):
        for y in range(275,490,23):
            d.ellipse((x,y,x+2,y+2),fill='#36505A')
    old_x, old_y = 199,409
    shifted = ease((t-0.8)/1.5)
    new_x = old_x + 128*shifted
    new_y = old_y - 18*shifted
    if t >= 8:
        new_y -= 50*ease((t-10.25)/1.15)
    d.rounded_rectangle((old_x-39,old_y-20,old_x+39,old_y+20),radius=7,outline='#718392',width=2)
    if shifted > .05 and stage==0:
        d.line([(old_x+45,old_y+30),(new_x,new_y+30)],fill=orange,width=3)
        d.polygon([(new_x,new_y+30),(new_x-9,new_y+24),(new_x-9,new_y+36)],fill=orange)
    d.rounded_rectangle((new_x-39,new_y-20,new_x+39,new_y+20),radius=7,fill='#E2A063' if stage==0 else cyan)
    for dx in (-23,23):
        d.ellipse((new_x+dx-5,new_y-5,new_x+dx+5,new_y+5),fill=bg)
    if stage==1:
        k = ease((t-4.25)/.75)
        radius = 54-7*k
        d.ellipse((new_x-radius,new_y-radius,new_x+radius,new_y+radius),outline=cyan,width=2)
        d.line([(new_x,new_y-67),(new_x,new_y-46)],fill=cyan,width=2)
        d.line([(new_x,new_y+46),(new_x,new_y+67)],fill=cyan,width=2)
        d.line([(new_x-67,new_y),(new_x-46,new_y)],fill=cyan,width=2)
        d.line([(new_x+46,new_y),(new_x+67,new_y)],fill=cyan,width=2)
    if stage==2:
        side = 66-23*ease((t-9.3)/.7)
        tip_y = new_y-38+48*ease((t-8.25)/1.1)
        jaw_x = old_x+(new_x-old_x)*ease((t-8)/1)
        d.line([(jaw_x,tip_y-70),(jaw_x,tip_y-37)],fill=white,width=7)
        d.line([(jaw_x-side,tip_y),(jaw_x-side,tip_y-37),(jaw_x+side,tip_y-37),(jaw_x+side,tip_y)],fill=white,width=7,joint='curve')
    d.text((51,539),detail,fill=muted,font=font(23))
    labels = ['移位','定位','重抓']
    for i,text in enumerate(labels):
        left=51+i*152
        d.rounded_rectangle((left,618,left+126,666),radius=7,outline=cyan if i==stage else '#526571',fill='#21434A' if i==stage else bg,width=2)
        d.text((left+38,627),text,fill=white if i==stage else muted,font=font(21))
    process.stdin.write(panel.tobytes())
process.stdin.close()
if process.wait():
    raise RuntimeError('FFmpeg failed')
print(out)
