// 改编自 Dashi AI Lab domino / domState / drawStrip 的厚度、翻面和落定方法。
import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
const p=(t:number,a:number,d:number)=>Math.max(0,Math.min(1,(t-a)/d));
const LAND=1.02;
export function sceneState(t:number) {
  const q=p(t,.6,.42), settle=p(t,LAND,.14);
  return {q,face:Math.cos(Math.PI*q),y:235+180*q*q-50*Math.sin(Math.PI*Math.min(1,q*1.6))*(1-q),squash:1-.07*Math.sin(Math.PI*settle),spread:1+.035*Math.sin(Math.PI*settle)};
}
export function resolveMotionEvents(props:{startFrame?:number},{fps}:{fps:number}) {
 return [{id:'edge',meaning:'纸片翻至侧面，身份标记保留',startFrame:(props.startFrame??0)+Math.ceil(.81*fps)}, {id:'land',meaning:'骨牌落定并短暂压缩回弹',startFrame:(props.startFrame??0)+Math.ceil(LAND*fps)}];
}
function Domino({id,widthScale,squash}:{id:string;widthScale:number;squash:number}) {
  return <g transform={`scale(${widthScale} ${squash})`}>
    <defs><linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#efaa67"/><stop offset="1" stopColor="#bc542f"/></linearGradient></defs>
    <path d="M-62 -218 L-77 -227 L-77 -9 L-62 0Z" fill="#794535"/>
    <path d="M-62 -218 L-77 -227 L47 -227 L62 -218Z" fill="#f6c48c"/>
    <rect x="-62" y="-218" width="124" height="218" rx="2" fill={`url(#${id}-face)`}/>
    <path d="M-40 -106 H40" stroke="#513f34" strokeWidth="3"/>
    <circle cx="0" cy="-164" r="21" fill="none" stroke="#f4ecd9" strokeWidth="5"/>
    {[-1,0,1].map(j=><circle key={j} cx={j*25} cy={-55+j*23} r="9.5" fill="#f4ecd9"/>)}
    <path d="M-60 -216 H59" stroke="#fff" opacity=".5"/>
  </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number}) {
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),s=sceneState((frame-(props.startFrame??0))/fps);
 return <svg width="100%" height="100%" viewBox="0 0 960 540">
   <rect width="960" height="540" fill={props.background??'#e9e5d9'}/>
   <ellipse cx="480" cy="419" rx={70+45*(1-s.q)} ry="12" fill="#342c22" opacity={.07+.15*s.q}/>
   <g transform={`translate(480 ${s.y})`}>
     {s.face>0?<g transform={`scale(${s.face} 1)`}><path d="M-62 -218 L62 -216 L64 -4 L-61 0Z" fill="#f6f3ea" stroke="#c6bca6"/><circle cx="0" cy="-164" r="21" fill="none" stroke="#c8683e" strokeWidth="5"/><path d="M-39 -105 H39 M-39 -85 H30 M-39 -65 H16" stroke="#a99d87" strokeWidth="3"/></g>:<Domino id={props.instanceId??'domino'} widthScale={-s.face*s.spread} squash={s.squash}/>}
     {/* 翻面最薄处仍保留物件边缘，不能在中途消失。 */}
     <path d="M0 -218 V0" stroke="#a18562" strokeWidth={2*(1-Math.abs(s.face))}/>
   </g>
 </svg>;
}
