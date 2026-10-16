// 改编自 Dashi AI Lab scissors / drawStrip；原许可见 ../../LICENSE。
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

const progress = (t: number, start: number, duration: number) => Math.max(0, Math.min(1, (t-start)/duration));
const smooth = (p: number) => p*p*(3-2*p);
const TIMING = {arrive: 1.2, close: 1.65, cut: 2.2, landed: 3.6};
// 刀刃、切口、纸片与事件共用时序，不靠播放历史累积状态。
export function sceneState(t: number) {
  const approach=smooth(progress(t,0,TIMING.arrive));
  const closing=smooth(progress(t,TIMING.close,TIMING.cut-TIMING.close));
  const drop=progress(t,TIMING.cut,TIMING.landed-TIMING.cut);
  return {x: 720-240*approach, y: 60+110*approach, angle: 24*(1-closing)+14*smooth(progress(t,2.7,.6)), drop,
    swing: Math.sin(t*8)*7*Math.exp(-t*.9), exit: smooth(progress(t,3.5,1))};
}
export function resolveMotionEvents(_: unknown, {fps}: {fps:number}) {
  return [{id:'cut',meaning:'刀刃合拢，纸条从同一切口分离',startFrame:Math.round(TIMING.cut*fps)},
    {id:'land',meaning:'两片纸落定',startFrame:Math.round(TIMING.landed*fps)}];
}
function Scissors({id,angle,swing}: {id:string;angle:number;swing:number}) {
  return <g>
    <defs><linearGradient id={`${id}-metal`}><stop stopColor="#f2f4f2"/><stop offset=".45" stopColor="#c3c8c8"/><stop offset="1" stopColor="#656e70"/></linearGradient></defs>
    {[-1,1].map(sign=><g key={sign} transform={`rotate(${sign*angle})`}>
      {sign===-1&&<g transform={`translate(-36 -92) rotate(${swing})`}>
        <path d="M0 0 L-38 55" fill="none" stroke="#343936" strokeWidth="2"/>
        <path d="M-38 48 L-110 53 L-113 99 L-33 95 Z" fill="#f4f0e5" stroke="#b9ad98"/>
        <circle cx="-41" cy="58" r="3" fill="#343936"/>
        <path d="M-99 70 L-55 67 M-99 81 L-69 79" stroke="#a99d87" strokeWidth="2"/>
      </g>}
      <path d={`M${-18*sign} -18 L${20*sign} -18 Q${22*sign} 60 ${4*sign} 224 L${-2*sign} 224 Q${-12*sign} 90 ${-18*sign} -18 Z`} fill={`url(#${id}-metal)`} stroke="#565d5e" strokeWidth="1.6"/>
      <path d="M-8 -14 L8 -14 Q10 -40 45 -55 L22 -66 Q0 -46 -8 -14Z" transform={`scale(${sign} 1)`} fill={`url(#${id}-metal)`} stroke="#565d5e" strokeWidth="1.6"/>
      <ellipse cx={36*sign} cy="-92" rx="29" ry="38" transform={`rotate(${-sign*20} ${36*sign} -92)`} fill="none" stroke="#f75e18" strokeWidth="17"/>
      <ellipse cx={36*sign} cy="-92" rx="35" ry="44" transform={`rotate(${-sign*20} ${36*sign} -92)`} fill="none" stroke="#873c22" strokeWidth="2"/>
    </g>)}
    <circle r="10" fill="#4a4f4f"/><circle cx="-2" cy="-2" r="3.5" fill="#e0e5e5"/>
  </g>;
}
function Paper({side,drop}: {side:number;drop:number}) {
  const x=480+side*34*smooth(drop), y=330+120*drop*drop;
  return <g transform={`translate(${x} ${y}) rotate(${side*12*Math.sin(Math.PI*drop)})`}>
    <path d={side<0?'M-225 -28 L0 -28 L0 28 L-225 31 L-229 12Z':'M0 -28 L225 -26 L230 24 L0 28Z'} fill={side<0?'#f2ab11':'#43a9ad'} stroke="#a29478" strokeWidth="1.5"/>
    {[0,1,2].map(i=><circle key={i} cx={side*(40+i*60)} cy="0" r="10" fill="#263b37"/>)}
    <path d={side<0?'M-214 23 H-6':'M6 23 H215'} stroke="#fff" opacity=".5"/>
  </g>;
}
export default function Motion(props: {instanceId?:string;background?:string}) {
  const frame=useCurrentFrame(), {fps}=useVideoConfig(), s=sceneState(frame/fps);
  return <svg width="100%" height="100%" viewBox="0 0 960 540">
    <rect width="960" height="540" fill={props.background??'#e9e5d9'}/>
    <ellipse cx="480" cy="484" rx="275" ry="14" fill="#3b3528" opacity=".12"/>
    <Paper side={-1} drop={s.drop}/><Paper side={1} drop={s.drop}/>
    <g transform={`translate(${s.x} ${s.y-380*s.exit})`}><Scissors id={props.instanceId??'scissors'} angle={s.angle} swing={s.swing}/></g>
  </svg>;
}
