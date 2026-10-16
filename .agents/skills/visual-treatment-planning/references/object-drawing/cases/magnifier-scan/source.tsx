// 改编自 Dashi AI Lab magnifier；扫描指认不声称实现光学放大。
import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
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
      <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".5"/><stop offset="1" stopColor="#7acdd4" stopOpacity=".12"/></linearGradient></defs>
    <circle cx="10" cy="14" r="84" fill="#332b20" opacity=".13"/>
    <g transform="rotate(45)"><rect x="70" y="-17" width="24" height="34" fill={`url(#${id}-brass)`}/><rect x="88" y="-14" width="128" height="28" rx="13" fill="#242522"/><path d="M104 -7 H197" stroke="#666a62" strokeWidth="3" strokeLinecap="round"/></g>
    <circle r="76" fill={`url(#${id}-glass)`} stroke="#242522" strokeWidth="13"/>
    <circle r="66" fill="none" stroke={`url(#${id}-brass)`} strokeWidth="4"/>
    <path d="M-48 -13 A50 50 0 0 1 -12 -49" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="6" strokeLinecap="round"/>
  </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number}) {
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),s=sceneState((frame-(props.startFrame??0))/fps);
  return <svg width="100%" height="100%" viewBox="0 0 960 540">
    <rect width="960" height="540" fill={props.background??'#e9e5d9'}/>
    <path d="M185 130 L742 124 L761 376 L177 384Z" fill="#c3b9a5" opacity=".4" transform="translate(7 8)"/>
    <path d="M185 130 L742 124 L761 376 L177 384Z" fill="#f6f3ea"/>
    {[0,1,2,3,4,5,6].map(i=><g key={i}>
      <path d={`M220 ${171+i*27} H710`} stroke="#b9b6a8" strokeWidth="1"/>
      {[0,1,2,3,4,5,6].map(j=><circle key={j} cx={280+j*60} cy={181+i*27} r={i===2&&j===6?9:4} fill={i===2&&j===6?'#c55331':'#657e7b'}/>)}
    </g>)}
    <circle cx="640" cy="235" r={16+9*(1-s.found)} fill="none" stroke="#c55331" strokeWidth="3" opacity={s.found}/>
    <path d="M660 235 H700 L727 207" fill="none" stroke="#c55331" strokeWidth="3" opacity={s.found}/>
    <g transform={`translate(${s.x} ${s.y}) rotate(${s.rotation})`}><Magnifier id={props.instanceId??'magnifier'}/></g>
  </svg>;
}
