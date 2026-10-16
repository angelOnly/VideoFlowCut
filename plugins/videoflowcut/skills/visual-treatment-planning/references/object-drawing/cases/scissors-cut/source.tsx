// 保留 Dashi AI Lab 剪刀比例、0.42 秒到位与短促切割；重建两刃夹纸和切口几何。
import React from 'react';
import {useCurrentFrame,useVideoConfig,random} from 'remotion';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const p=(t:number,a:number,d:number)=>clamp((t-a)/d);
const out=(q:number)=>1-Math.pow(1-q,3);
const back=(q:number)=>1+2.2*Math.pow(q-1,3)+1.2*Math.pow(q-1,2);
export const CUTS=[.92,1.06,1.20];
export const GEOMETRY={bladeLength:224,edgeOffset:12,paperNear:145,paperFar:204};
export function cutGeometry(angle:number) {
 const r=angle*Math.PI/180;
 const edgeY=12/(Math.sin(r)+12/224*Math.cos(r));
 return {edgeY,progress:clamp((edgeY-145)/59)};
}
const pulse=(t:number,c:number)=>clamp(1-Math.abs(t-c)/.065);
const impulse=(t:number,c:number,a:number)=>t<c?0:a*Math.sin((t-c)*22)*Math.exp(-(t-c)*8);
export function sceneState(t:number) {
 const arrival=back(p(t,.08,.42));
 let x=770+(330-770)*arrival;
 CUTS.slice(0,-1).forEach((c,i)=>{x+=100*out(p(t,c+.07,.07));});
 const close=Math.max(...CUTS.map(c=>pulse(t,c)));
 const angle=22*(1-close);
 const finished=CUTS.map(c=>t>=c);
 const exit=p(t,1.55,.4);
 return {x:x-170*exit*exit,y:160-210*(1-arrival)-420*exit*exit,rotation:-22*(1-out(p(t,.08,.42)))-18*exit*exit,
 angle,finished,cutProgress:CUTS.map((c,i)=>finished[i]?1:cutGeometry(22*(1-pulse(t,c))).progress),
 swing:impulse(t,.42,17)+CUTS.reduce((v,c)=>v+impulse(t,c,8),0),exit};
}
export function resolveMotionEvents(props:{startFrame?:number},{fps}:{fps:number}) {
 const start=props.startFrame??0;
 return CUTS.map((c,i)=>({id:`cut-${i}`,meaning:`第${i+1}处刃口越过纸张远缘，切口完成`,startFrame:start+Math.ceil(c*fps)}));
}
function Scissors({id,angle,swing,side}: {id:string;angle:number;swing:number;side:number}) {
  return <g>
    <defs><linearGradient id={`${id}-metal`}><stop stopColor="#f2f4f2"/><stop offset=".45" stopColor="#c3c8c8"/><stop offset="1" stopColor="#656e70"/></linearGradient></defs>
    {[side].map(sign=><g key={sign} transform={`rotate(${sign*angle})`}>
      {sign===-1&&<g transform={`translate(-36 -92) rotate(${swing})`}>
        <path d="M0 0 L-38 55" fill="none" stroke="#343936" strokeWidth="2"/>
        <path d="M-38 48 L-110 53 L-113 99 L-33 95 Z" fill="#f4f0e5" stroke="#b9ad98"/>
        <circle cx="-41" cy="58" r="3" fill="#343936"/>
        <path d="M-99 70 L-55 67 M-99 81 L-69 79" stroke="#a99d87" strokeWidth="2"/>
      </g>}
      <path d={`M${-18*sign} -18 L${12*sign} 0 L0 224 L${-7*sign} 221 Q${-22*sign} 66 ${-18*sign} -18Z`} fill={`url(#${id}-metal)`} stroke="#586365" strokeWidth="1.5"/>
      <path d={`M${12*sign} 0 L0 224`} stroke="#f7faf5" strokeWidth="2"/>
      <path d={`M${-18*sign} -18 Q${-22*sign} 66 ${-7*sign} 221`} fill="none" stroke="#394649" strokeWidth="2.5"/>
      <path d="M-8 -14 L8 -14 Q10 -40 45 -55 L22 -66 Q0 -46 -8 -14Z" transform={`scale(${sign} 1)`} fill={`url(#${id}-metal)`} stroke="#565d5e" strokeWidth="1.6"/>
      <ellipse cx={36*sign} cy="-92" rx="29" ry="38" transform={`rotate(${-sign*20} ${36*sign} -92)`} fill="none" stroke="#f75e18" strokeWidth="17"/>
      <ellipse cx={36*sign} cy="-92" rx="35" ry="44" transform={`rotate(${-sign*20} ${36*sign} -92)`} fill="none" stroke="#873c22" strokeWidth="2"/>
    </g>)}

  </g>;
}
function Paper({t,state}:{t:number;state:ReturnType<typeof sceneState>}) {
 return <g>{[0,1,2,3].map(i=>{
 const released=(i===0||state.finished[i-1])&&(i===3||state.finished[i]);
 const release=CUTS[Math.min(i,2)]+.10;
 const q=released?p(t,release,.42):0;
 const x=280+i*100+(i-1.5)*20*out(q),y=334+120*q*q-25*Math.sin(Math.PI*q);
 const flip=Math.cos(Math.PI*q),width=Math.max(.025,Math.abs(flip));
 return <g key={i} transform={`translate(${x} ${y}) rotate(${(i-1.5)*7*q}) scale(${width} 1)`}>
  <path d="M-50 -29 L50 -29 L50 30 L-50 30Z" fill={flip>=0?'#f8f5ec':['#e1a32c','#9b3420','#427e89','#768650'][i]} stroke="none"/>
  {Array.from({length:18},(_,k)=><path key={k} d={`M${-47+random(i*101+k)*90} ${-26+random(i*271+k)*50} l4 -1`} stroke={flip>=0?'#96866d':'#fff'} opacity=".12"/>)}
  <path d={i%2?'M-15 -12 L15 -12 L15 12 L-15 12Z':'M0 -15 L18 0 L0 15 L-18 0Z'} fill="none" stroke={flip>=0?'#293b36':'#f7ebcd'} strokeWidth="3"/>
 </g>;
 })}
 {/* 尚未释放时仅显出真正剪开的局部缝，不让整片提前断开。 */}
 {state.cutProgress.map((q,i)=><path key={i} d={`M${330+i*100} 305 V${305+59*q}`} stroke="#e9e5d9" strokeWidth="2"/>)}
 </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number}) {
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=(f-(props.startFrame??0))/fps,s=sceneState(t),id=props.instanceId??'scissors';
 const transform=`translate(${s.x} ${s.y}) rotate(${s.rotation})`;
 return <svg width="100%" height="100%" viewBox="0 0 960 540">
  <defs><pattern id={`${id}-paper`} width="83" height="67" patternUnits="userSpaceOnUse">{Array.from({length:22},(_,i)=><path key={i} d={`M${random(i)*83} ${random(i+91)*67} l2 .4`} stroke="#766a53" opacity=".12" strokeWidth=".7"/>)}</pattern></defs>
  <rect width="960" height="540" fill={props.background??'#e9e5d9'}/><rect width="960" height="540" fill={`url(#${id}-paper)`}/>
  <path d="M182 461 Q480 482 743 459" fill="none" stroke="#928774" strokeWidth="3" opacity=".24"/>
  <g transform={transform}><Scissors id={`${id}-rear`} side={-1} angle={s.angle} swing={s.swing}/></g>
  <Paper t={t} state={s}/>
  <g transform={transform}><Scissors id={`${id}-front`} side={1} angle={s.angle} swing={s.swing}/><circle r="11" fill="#414c4b"/><circle r="7" fill="#c5cfcb"/><path d="M-4 2 L4 -2" stroke="#54605e" strokeWidth="2"/></g>
 </svg>;
}
