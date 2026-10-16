// 本项目新设计：封面和独立页片绕书脊翻转，页块始终保留厚度。
import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
const p=(t:number,a:number,d:number)=>Math.max(0,Math.min(1,(t-a)/d));
const smooth=(q:number)=>q*q*(3-2*q);
export function sceneState(t:number) {
 return {open:smooth(p(t,.4,1.5)),page:smooth(p(t,2.2,1.5))};
}
export function resolveMotionEvents(_:unknown,{fps}:{fps:number}) {
 return [{id:'open',meaning:'封面展开到左侧',startFrame:Math.round(1.9*fps)}, {id:'page',meaning:'独立页片越过书脊落定',startFrame:Math.round(3.7*fps)}];
}
function PageMarks({reverse=false}:{reverse?:boolean}) {
 return <g transform={reverse?'translate(-185 0)':'translate(12 0)'} fill="none" stroke="#9b9079" strokeWidth="2">
  <path d="M22 -117 H137 M22 -100 H137 M22 -83 H137 M22 -66 H112 M22 20 H137 M22 37 H137 M22 54 H124 M22 71 H137 M22 88 H85"/>
  <circle cx="79" cy="-18" r="24" stroke="#b16c42" strokeWidth="4"/>
 </g>;
}
function Book({id,open,page}:{id:string;open:number;page:number}) {
 const c=Math.cos(open*Math.PI),leaf=Math.cos(page*Math.PI),lift=65*Math.sin(page*Math.PI);
 return <g>
  <defs><linearGradient id={`${id}-paper`}><stop stopColor="#d0c5ac"/><stop offset=".12" stopColor="#f6f3ea"/><stop offset="1" stopColor="#eee6d3"/></linearGradient>
    <linearGradient id={`${id}-cover`}><stop stopColor="#1e393b"/><stop offset=".2" stopColor="#477b7b"/><stop offset="1" stopColor="#245455"/></linearGradient></defs>
  <path d="M-10 -159 H214 V168 H-10Z" fill="#153b3c"/>
  <path d="M0 143 H202 V160 H0Z" fill="#c0b49b"/>
  <path d="M3 147 H199 M3 151 H199 M3 155 H199" stroke="#eee7d4"/>
  <path d="M0 -150 Q85 -161 202 -150 V143 Q85 137 0 153Z" fill={`url(#${id}-paper)`}/>
  <PageMarks/>
  {/* 封面坐标原点就是书脊，开合不绕外接盒中心。 */}
  <g transform={`matrix(${c} ${-.22*Math.sin(open*Math.PI)} 0 1 0 0)`}>
   <path d="M0 -160 H213 V159 H0Z" fill={`url(#${id}-cover)`} stroke="#153b3c" strokeWidth="3"/>
   {c>0&&<g fill="none" stroke="#d3b571"><rect x="26" y="-128" width="157" height="252" rx="3" strokeWidth="2"/><path d="M69 -22 L105 -61 L141 -22 L105 17Z" strokeWidth="4"/><path d="M66 54 H145 M84 66 H128" strokeWidth="3"/></g>}
  </g>
  {open>.5&&<g opacity={p(open,.5,.35)}>
   <path d="M-202 150 Q-100 140 0 153 V162 Q-100 150 -202 161Z" fill="#bdb198"/>
   <path d="M0 -150 Q-80 -161 -202 -150 V150 Q-85 137 0 153Z" fill="#eee6d3"/>
   <PageMarks reverse/>
  </g>}
  {open===1&&<g transform={`matrix(${leaf} ${-.28*Math.sin(page*Math.PI)} 0 1 0 0)`}>
   <path d={`M0 -150 Q${90} ${-164-lift*.3} 199 -150 V143 Q90 ${137-lift*.2} 0 153Z`} fill={leaf<0?'#e9e0cb':`url(#${id}-paper)`} stroke="#c8bda5"/>
   <PageMarks/>
  </g>}
  <path d="M0 -150 V153" stroke="#8b7b62" strokeWidth="3"/>
  <path d="M-8 -157 V163" stroke="#7c9a8d" strokeWidth="3" opacity=".7"/>
 </g>;
}
export default function Motion(props:{instanceId?:string;background?:string}) {
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),s=sceneState(frame/fps);
 return <svg width="100%" height="100%" viewBox="0 0 960 540">
  <rect width="960" height="540" fill={props.background??'#e9e5d9'}/>
  <ellipse cx="490" cy="459" rx="247" ry="19" fill="#303a2c" opacity=".14"/>
  <g transform="translate(480 275) rotate(-5)"><Book id={props.instanceId??'book'} open={s.open} page={s.page}/></g>
 </svg>;
}
