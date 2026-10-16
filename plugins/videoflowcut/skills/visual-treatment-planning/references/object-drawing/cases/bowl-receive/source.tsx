// 本项目新设计：将开口、后壁、前壁和内容物拆层，检验容器画法迁移。
import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
const p=(t:number,a:number,d:number)=>Math.max(0,Math.min(1,(t-a)/d));
export function sceneState(t:number) {
 return [0,1,2].map(i=>{const q=p(t,.5+i*.65,.85),b=p(t,1.35+i*.65,.55);return {x:420+i*60,y:115+275*q*q-24*Math.sin(Math.PI*b)*(1-b),angle:95*q+i*35};});
}
export function resolveMotionEvents(_:unknown,{fps}:{fps:number}) {
 return [0,1,2].map(i=>({id:`land-${i}`,meaning:`第${i+1}个果实落入碗内`,startFrame:Math.round((1.35+i*.65)*fps)}));
}
function Fruit({id,x,y,angle,color}:{id:string;x:number;y:number;angle:number;color:string}) {
 return <g transform={`translate(${x} ${y}) rotate(${angle})`}>
  <defs><radialGradient id={`${id}-skin`} cx="30%" cy="25%"><stop stopColor="#ffe6a2"/><stop offset=".5" stopColor={color}/><stop offset="1" stopColor="#974723"/></radialGradient></defs>
  <path d="M0 -29 C37 -38 44 9 19 29 C7 39 -6 32 -14 31 C-46 21 -40 -35 0 -29Z" fill={`url(#${id}-skin)`}/>
  <path d="M0 -26 Q-7 -43 3 -47" fill="none" stroke="#493e25" strokeWidth="4"/>
  <path d="M1 -33 Q24 -55 28 -31 Q16 -24 1 -33Z" fill="#526c3a"/>
 </g>;
}
function BowlBack({id}:{id:string}) {
 return <g>
  <defs><linearGradient id={`${id}-body`}><stop stopColor="#315e66"/><stop offset=".4" stopColor="#82b2b5"/><stop offset=".7" stopColor="#538e96"/><stop offset="1" stopColor="#244f5a"/></linearGradient>
   <radialGradient id={`${id}-inner`} cx="50%" cy="30%"><stop stopColor="#163c44"/><stop offset=".7" stopColor="#447f87"/><stop offset="1" stopColor="#9dc8c5"/></radialGradient></defs>
  <ellipse cx="480" cy="322" rx="200" ry="62" fill="#b9d7cd"/>
  <ellipse cx="480" cy="322" rx="187" ry="50" fill={`url(#${id}-inner)`}/>
 </g>;
}
function BowlFront({id}:{id:string}) {
 return <g>
  <path d="M280 322 Q480 442 680 322 C660 418 589 459 480 462 C371 459 300 418 280 322Z" fill={`url(#${id}-body)`}/>
  <path d="M280 322 A200 62 0 0 0 680 322 L667 322 A187 50 0 0 1 293 322Z" fill="#b9d7cd"/>
  <path d="M324 377 Q480 467 636 377 M330 388 Q480 478 630 388" fill="none" stroke="#d4dfcb" strokeWidth="3" opacity=".6"/>
  <path d="M414 455 Q480 472 546 455 L540 468 Q480 484 420 468Z" fill="#345d63"/>
 </g>;
}
export default function Motion(props:{instanceId?:string;background?:string}) {
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),fruits=sceneState(frame/fps),id=props.instanceId??'bowl';
 return <svg width="100%" height="100%" viewBox="0 0 960 540">
  <rect width="960" height="540" fill={props.background??'#e9e5d9'}/>
  <ellipse cx="480" cy="475" rx="185" ry="15" fill="#3d4b3e" opacity=".17"/>
  <BowlBack id={id}/>
  {fruits.map((f,i)=><Fruit key={i} id={`${id}-fruit-${i}`} {...f} color={['#e4a92e','#d67739','#b7a73b'][i]}/>)}
  <BowlFront id={id}/>
 </svg>;
}
