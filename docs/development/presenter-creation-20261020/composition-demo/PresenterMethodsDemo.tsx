import React from 'react';
import {TimelineVideo} from '@videoflowcut/motion';

type Box = {x: number; y: number; width: number; height: number};
type Crop = Box; // 归一化到 0..1 的真实源画面，不是像素坐标。
type SourceSize = {width: number; height: number};

function sourcePlane(source: SourceSize, box: Box, crop: Crop): Box {
  const values = [source.width, source.height, box.x, box.y, box.width,
    box.height, crop.x, crop.y, crop.width, crop.height];
  if (values.some(v => !Number.isFinite(v)) || source.width <= 0 ||
      source.height <= 0 || box.width <= 0 || box.height <= 0 ||
      crop.width <= 0 || crop.height <= 0 || crop.x < 0 || crop.y < 0 ||
      crop.x + crop.width > 1 + 1e-9 || crop.y + crop.height > 1 + 1e-9) {
    throw new Error('人物源尺寸、窗口或取景范围无效');
  }
  const cw = crop.width * source.width;
  const ch = crop.height * source.height;
  const s = Math.max(box.width / cw, box.height / ch);
  return {
    x: (box.width - cw * s) / 2 - crop.x * source.width * s,
    y: (box.height - ch * s) / 2 - crop.y * source.height * s,
    width: source.width * s,
    height: source.height * s,
  };
}

function PresenterWindow({slot, source, crop, box, radius = 0,
  opacity = 1, rotateDeg = 0}: {
  slot: string; source: SourceSize; crop: Crop; box: Box;
  radius?: number | string; opacity?: number; rotateDeg?: number;
}) {
  const p = sourcePlane(source, box, crop);
  return (
    <div style={{position: 'absolute', left: box.x, top: box.y,
      width: box.width, height: box.height, overflow: 'hidden',
      borderRadius: radius, opacity,
      transform: `rotate(${rotateDeg}deg)`, transformOrigin: '50% 50%'}}>
      <div style={{position: 'absolute', left: p.x, top: p.y,
        width: p.width, height: p.height}}>
        <TimelineVideo slot={slot} fit="fill"
          style={{width: '100%', height: '100%'}} />
      </div>
    </div>
  );
}

function blendBox(a: Box, b: Box, progress: number): Box {
  const p = Math.max(0, Math.min(1, progress));
  const mix = (x: number, y: number) => x + (y - x) * p;
  return {x: mix(a.x, b.x), y: mix(a.y, b.y),
    width: mix(a.width, b.width), height: mix(a.height, b.height)};
}

type PresenterSource = {slot: string; source: SourceSize; crop: Crop};

function PaperPresenter({actor, box, inset, paperStyle, transform, marks}: {
  actor: PresenterSource; box: Box; inset: number;
  paperStyle: React.CSSProperties; transform: string; marks?: React.ReactNode;
}) {
  return <div style={{...paperStyle, position: 'absolute', left: box.x,
    top: box.y, width: box.width, height: box.height, transform}}>
    <PresenterWindow {...actor} box={{x: inset, y: inset,
      width: box.width - 2 * inset, height: box.height - 2 * inset}} />
    {marks}
  </div>;
}

function SplitPresenter({actor, actorFrom, actorTo, materialFrom, materialTo,
  progress, renderMaterial}: {
  actor: PresenterSource; actorFrom: Box; actorTo: Box;
  materialFrom: Box; materialTo: Box; progress: number;
  renderMaterial: (box: Box) => React.ReactNode;
}) {
  return <>
    {renderMaterial(blendBox(materialFrom, materialTo, progress))}
    <PresenterWindow {...actor}
      box={blendBox(actorFrom, actorTo, progress)} />
  </>;
}

function EmbeddedPresenter({actor, outer, screen, radius, transform, shell}: {
  actor: PresenterSource; outer: Box; screen: Box; radius: number;
  transform: string; shell: React.ReactNode;
}) {
  return <div style={{position: 'absolute', left: outer.x, top: outer.y,
    width: outer.width, height: outer.height, transform}}>
    <PresenterWindow {...actor} box={screen} radius={radius} />
    {shell}
  </div>;
}
import {useCurrentFrame} from 'remotion';

// 六种方法沿同一作品时钟读取同一源；显隐与容器变化不重置视频。
const actor = {slot:'actor',source:{width:240,height:240},crop:{x:0,y:0,width:1,height:1}};
const full = {x:20,y:20,width:240,height:240};
const small = {x:345,y:140,width:104,height:104};
const clamp = (v:number) => Math.max(0,Math.min(1,v));
function Material({box,frame}:{box:Box;frame:number}) {
  const bars = [0.4,0.65,0.9];
  return <div style={{position:'absolute',left:box.x,top:box.y,width:box.width,
    height:box.height,background:'#163444',overflow:'hidden',border:'2px solid #4fd4c5'}}>
    {bars.map((v,i)=><div key={i} style={{position:'absolute',left:'10%',top:25+i*42,
      width:(20+v*55*clamp((frame%45)/25))+'%',height:22,background:['#8bf0d0','#49b9df','#f7cc76'][i]}} />)}
  </div>;
}
export default function PresenterMethodsDemo() {
  const frame=useCurrentFrame(), phase=Math.floor(frame/45), t=frame%45;
  const p=clamp((t-8)/25);
  const labels=['动态头像','视频纸片','人物分屏','设备容器','材料接管','人物主画面'];
  let content;
  if(phase===0) content=<>
    <Material box={{x:20,y:35,width:290,height:205}} frame={frame}/>
    <PresenterWindow {...actor} crop={{x:.15,y:.05,width:.7,height:.7}}
      box={blendBox({x:115,y:25,width:220,height:220},small,p)} radius="50%"/>
  </>;
  else if(phase===1) content=<>
    <Material box={{x:240,y:45,width:205,height:190}} frame={frame}/>
    <PaperPresenter actor={actor} box={{x:40+40*p,y:40,width:160,height:190}}
      inset={8} paperStyle={{background:'#fff1cd',boxShadow:'5px 6px 0 #040c14'}}
      transform={'rotate('+(-12+20*p)+'deg)'}
      marks={<div style={{position:'absolute',left:105,top:155,width:65,height:24,background:'#ef8867'}}/>}/>
  </>;
  else if(phase===2) content=<SplitPresenter actor={actor}
    actorFrom={{x:20,y:30,width:220,height:220}} actorTo={{x:20,y:70,width:130,height:170}}
    materialFrom={{x:250,y:30,width:210,height:220}} materialTo={{x:160,y:30,width:300,height:220}}
    progress={p} renderMaterial={box=><Material box={box} frame={frame}/>}/>;
  else if(phase===3) content=<>
    <Material box={{x:270,y:45,width:180,height:190}} frame={frame}/>
    <EmbeddedPresenter actor={actor} outer={{x:80+60*p,y:30,width:150,height:220}}
      screen={{x:10,y:24,width:130,height:174}} radius={10}
      transform={'rotate('+(-8+16*p)+'deg) scale('+(0.85+0.15*p)+')'}
      shell={<div style={{position:'absolute',inset:0,border:'9px solid #d9e4eb',
        borderRadius:22,boxShadow:'4px 5px 0 #040c14'}}/>}/>
  </>;
  else if(phase===4) content=<>
    <Material box={blendBox({x:20,y:25,width:290,height:220},{x:20,y:25,width:440,height:220},clamp(t/10))} frame={frame}/>
    {t<10?<PresenterWindow {...actor} box={{...small,x:345+t*16}}/>:null}
  </>;
  else content=<>
    <Material box={{x:290,y:40,width:170,height:200}} frame={frame}/>
    <PresenterWindow {...actor} box={blendBox(full,small,clamp((t-20)/24))}/>
  </>;
  return <div style={{width:480,height:270,background:'#091621',position:'relative'}}>
    {content}
    <div style={{position:'absolute',left:8,top:2,color:'#f2f5f7',fontSize:12}}>
      {labels[phase]} · F{frame} · 源F{frame+15}
    </div>
    <div style={{position:'absolute',bottom:0,left:0,width:frame/269*480,height:3,background:'#f6ce70'}}/>
  </div>;
}
