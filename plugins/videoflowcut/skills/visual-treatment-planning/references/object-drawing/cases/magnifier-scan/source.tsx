// 改编自 Dashi AI Lab magnifier；扫描指认不声称实现光学放大。
import React from 'react';
import {useCurrentFrame,useVideoConfig,Img} from 'remotion';
const p=(t:number,a:number,d:number)=>Math.max(0,Math.min(1,(t-a)/d));
const smooth=(v:number)=>v*v*(3-2*v);
// 先扫过区域、折回核对，再在异常点收住；不是一条长缓动滑轨。
export function sceneState(t:number) {
 const scan=p(t,.35,1.35),enter=1-Math.pow(1-p(t,0,.35),3);
 const rawX=460+180*Math.sin(scan*Math.PI*2*.55-.5),rawY=235+48*Math.sin(scan*Math.PI*2*1.05+.4);
 const confirm=1-Math.pow(1-p(t,1.70,.26),3);
 return {x:(780+(rawX-780)*enter)*(1-confirm)+640*confirm,y:(405+(rawY-405)*enter)*(1-confirm)+235*confirm,
 rotation:(-15*(1-enter)+5*Math.sin(scan*Math.PI*2))*(1-confirm),found:p(t,1.96,.16)};
}
export function resolveMotionEvents(props:{startFrame?:number},{fps}:{fps:number}) {
 return [{id:'found',meaning:'折回核对后在异常点收住',startFrame:(props.startFrame??0)+Math.ceil(1.96*fps)}];
}
function Magnifier({id}:{id:string}) {
  return <g>
    <defs><linearGradient id={`${id}-brass`}><stop stopColor="#f5dc8e"/><stop offset=".5" stopColor="#c9a24a"/><stop offset="1" stopColor="#796126"/></linearGradient>
      <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#d7e8df" stopOpacity=".10"/><stop offset="1" stopColor="#7acdd4" stopOpacity=".04"/></linearGradient></defs>

    <g transform="rotate(45)"><rect x="70" y="-17" width="24" height="34" fill={`url(#${id}-brass)`}/><rect x="88" y="-14" width="128" height="28" rx="13" fill="#242522"/><path d="M104 -7 H197" stroke="#666a62" strokeWidth="3" strokeLinecap="round"/></g>
    <circle r="76" fill={`url(#${id}-glass)`} stroke="#242522" strokeWidth="13"/>
    <circle r="66" fill="none" stroke={`url(#${id}-brass)`} strokeWidth="4"/>
    <path d="M-42 -25 A50 50 0 0 1 -20 -46" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="3" strokeLinecap="round"/>
  </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number;assets?:Record<string,string>}) {
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),s=sceneState((frame-(props.startFrame??0))/fps);
  return <SceneFrame assets={props.assets}><svg width="960" height="540" viewBox="0 0 960 540" style={{position:"absolute"}}>

    <path d="M185 130 L742 124 L761 376 L177 384Z" fill="#c3b9a5" opacity=".4" transform="translate(7 8)"/>
    <path d="M185 130 L742 124 L761 376 L177 384Z" fill="#f6f3ea"/>
    <path d="M219 156 H365 M219 164 H306" stroke="#53615a" strokeWidth="3" opacity=".7"/>
    {[0,1,2,3,4,5].map(i=><g key={i} transform={`translate(${219+(i%2)*12} ${193+i*27})`}>
    <path d={`M0 0 h${82+i*9} m15 0 h${47+(i%3)*18} m12 0 h${i%2?77:33}`} stroke="#68756a" strokeWidth={i%3===0?2.5:1.6} opacity=".75"/>
    <path d="M-9 -4 L-5 0 L-9 4" fill="none" stroke="#9e927c"/>
    </g>)}
    <path d="M548 175 h93 M548 184 h49 M563 212 h48 M558 258 h105 M558 267 h75 M558 297 h58 M558 306 h92 M558 336 h78" stroke="#9a947f" strokeWidth="1.5"/>
    <path d="M630 235 l10 -9 10 9 -10 9Z" fill="#b45b38"/>
    <path d="M216 367 Q421 364 593 368" fill="none" stroke="#c6bba5" strokeWidth=".7"/>
    <circle cx="640" cy="235" r={16+9*(1-s.found)} fill="none" stroke="#c55331" strokeWidth="3" opacity={s.found}/>
    <path d="M660 235 H700 L727 207" fill="none" stroke="#c55331" strokeWidth="3" opacity={s.found}/>
    <g transform={`translate(${s.x-7} ${s.y+10}) rotate(${s.rotation})`} fill="#33352b" opacity=".16"><circle r="76" fill="none" stroke="#33352b" strokeWidth="16"/><g transform="rotate(45)"><rect x="72" y="-15" width="144" height="30" rx="13"/></g></g>
    <g transform={`translate(${s.x} ${s.y}) rotate(${s.rotation})`}><Magnifier id={props.instanceId??'magnifier'}/></g>
  </svg></SceneFrame>;
}

// 图片与矢量统一设计坐标；缺资源直接报错，不回退纯色。
function SceneFrame({assets,children}:{assets?:Record<string,string>;children:React.ReactNode}) {
 const {width,height}=useVideoConfig(),scale=Math.min(width/960,height/540);
 if(!assets?.paper_base)throw new Error('缺少必需资源槽：paper_base');
 return <div style={{width:'100%',height:'100%',background:'#e9e5d9',position:'relative'}}><div style={{position:'absolute',width:960,height:540,left:(width-960*scale)/2,top:(height-540*scale)/2,transform:`scale(${scale})`,transformOrigin:'0 0'}}><Img src={assets.paper_base} style={{position:'absolute',width:960,height:540,left:0,top:0}}/>{children}</div></div>;
}
