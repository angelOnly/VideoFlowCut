// 保留 Dashi AI Lab 剪刀比例、0.42 秒到位与短促切割；重建两刃夹纸和切口几何。
import React from 'react';
import {useCurrentFrame,useVideoConfig,Img,random} from 'remotion';
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
    <defs><linearGradient id={`${id}-metal`} gradientUnits="userSpaceOnUse" x1="-16" y1="0" x2="16" y2="0"><stop stopColor="#f2f4f2"/><stop offset=".32" stopColor="#b3b9b8"/><stop offset=".48" stopColor="#e1e5e2"/><stop offset=".6" stopColor="#969e9e"/><stop offset="1" stopColor="#656e70"/></linearGradient></defs>
    {[side].map(sign=><g key={sign} transform={`rotate(${sign*angle})`}>
      {sign===-1&&<g transform={`translate(-36 -92) rotate(${swing})`}>
        <path d="M0 0 L-38 55" fill="none" stroke="#343936" strokeWidth="2"/>
        <path d="M-38 48 L-69 51 L-88 50 L-111 54 L-109 65 L-114 77 L-111 87 L-113 99 L-82 96 L-63 97 L-33 95Z" transform="translate(-2 3)" fill="#493c29" opacity=".16"/><path d="M-38 48 L-69 51 L-88 50 L-111 54 L-109 65 L-114 77 L-111 87 L-113 99 L-82 96 L-63 97 L-33 95Z" fill="#f4f0e5" stroke="#d5caba" strokeWidth=".8"/>
        <circle cx="-41" cy="58" r="3" fill="#343936"/>
        <path d="M-99 70 L-55 67 M-99 81 L-69 79" stroke="#a99d87" strokeWidth="2"/>
      </g>}
      <path d={`M${-18*sign} -18 L${12*sign} 0 L0 224 L${-7*sign} 221 Q${-22*sign} 66 ${-18*sign} -18Z`} fill={`url(#${id}-metal)`} stroke="#586365" strokeWidth="1.5"/>
      <path d={`M${12*sign} 0 L0 224`} stroke="#f7faf5" strokeWidth="2"/>
      <path d={`M${-18*sign} -18 Q${-22*sign} 66 ${-7*sign} 221`} fill="none" stroke="#394649" strokeWidth="2.5"/>
      <path d="M-8 -14 L8 -14 Q10 -40 45 -55 L22 -66 Q0 -46 -8 -14Z" transform={`scale(${sign} 1)`} fill={`url(#${id}-metal)`} stroke="#565d5e" strokeWidth="1.6"/>
      <ellipse cx={36*sign} cy="-92" rx="29" ry="38" transform={`rotate(${-sign*20} ${36*sign} -92)`} fill="none" stroke="#f75e18" strokeWidth="17"/>
      <path d={`M${18*sign} -59 Q${37*sign} -45 ${54*sign} -67`} fill="none" stroke="#a94319" strokeWidth="4" opacity=".5"/><path d={`M${16*sign} -115 Q${30*sign} -139 ${48*sign} -124`} fill="none" stroke="#ff9750" strokeWidth="5" opacity=".35"/>
    </g>)}

  </g>;
}
// 四个裁片共享整张纸的固定坐标；不是每片重新生成纹理。
function PaperSurface({back}:{back:boolean}) {
 return <g><path d="M230 305 L290 304.4 L350 305.3 L410 304.7 L470 305.2 L530 304.5 L590 305.1 L630 305 V364 L570 363.2 L510 364.4 L450 363.7 L390 364.3 L330 363.4 L270 364.1 L230 364Z" fill={back?'#d9c7a5':'#f6f3ea'}/>
 {Array.from({length:110},(_,k)=><path key={k} d={`M${231+random(k+201)*398} ${306+random(k+501)*56} l${2+random(k+71)*5} -.6`} stroke={k%2?'#a1957d':'#fff'} strokeWidth=".6" opacity=".18"/>)}
 {[0,1,2,3].map(i=><g key={i} transform={`translate(${280+100*i} 334)`}><path d={i%2?'M-15 -12 L15 -12 L15 12 L-15 12Z':'M0 -15 L18 0 L0 15 L-18 0Z'} fill="none" stroke={back?'#a65732':'#293b36'} strokeWidth="3"/></g>)}
 </g>;
}
function Paper({t,state,id}:{t:number;state:ReturnType<typeof sceneState>;id:string}) {
 return <g>{[0,1,2,3].map(i=>{
 const released=(i===0||state.finished[i-1])&&(i===3||state.finished[i]);
 const release=CUTS[Math.min(i,2)]+.10,q=released?p(t,release,.42):0;
 const center=280+i*100,x=center+(i-1.5)*20*out(q),y=334+120*q*q-25*Math.sin(Math.PI*q);
 const flip=Math.cos(Math.PI*q),width=Math.max(.025,Math.abs(flip));
 return <g key={i} transform={`translate(${x} ${y}) rotate(${(i-1.5)*7*q}) scale(${width} 1)`}>
 <defs><clipPath id={`${id}-slice-${i}`}><rect x={center-50} y="302" width="100" height="64"/></clipPath>
 <mask id={`${id}-cuts-${i}`} maskUnits="userSpaceOnUse" x="230" y="302" width="400" height="64"><rect x="230" y="302" width="400" height="64" fill="white"/>{state.cutProgress.map((v,j)=><path key={j} d={`M${330+j*100} 305 v${59*v}`} stroke="black" strokeWidth="1.4"/>)}</mask></defs>
 <g transform={`translate(${-center} -334)`} clipPath={`url(#${id}-slice-${i})`} mask={`url(#${id}-cuts-${i})`}>
 <g transform="translate(-1 2)" opacity=".1"><PaperSurface back={true}/></g><PaperSurface back={flip<0}/>
 </g></g>;
 })}</g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number;assets?:Record<string,string>}) {
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=(f-(props.startFrame??0))/fps,s=sceneState(t),id=props.instanceId??'scissors';
 const transform=`translate(${s.x} ${s.y}) rotate(${s.rotation})`;
 return <SceneFrame assets={props.assets}><svg width="960" height="540" viewBox="0 0 960 540" style={{position:"absolute"}}>
  <path d="M206 377 L651 377 L671 392 L198 392Z" fill="#d9d1be" opacity=".4"/>
  <g transform={transform}><Scissors id={`${id}-rear`} side={-1} angle={s.angle} swing={s.swing}/></g>
  <Paper t={t} state={s} id={id}/>
  <defs><clipPath id={`${id}-contact`}><rect x="230" y="305" width="400" height="59"/></clipPath></defs><g clipPath={`url(#${id}-contact)`}><path d={`M${s.x-2} 305 L${s.x-8} 364 L${s.x+2} 364Z`} fill="#3b3d36" opacity={s.finished[2]?0:.13}/></g>
  <g transform={transform}><Scissors id={`${id}-front`} side={1} angle={s.angle} swing={s.swing}/><circle r="11" fill="#414c4b"/><circle r="7" fill="#c5cfcb"/><path d="M-4 2 L4 -2" stroke="#54605e" strokeWidth="2"/></g>
 </svg></SceneFrame>;
}

// 图片与矢量统一设计坐标；缺资源直接报错，不回退纯色。
function SceneFrame({assets,children}:{assets?:Record<string,string>;children:React.ReactNode}) {
 const {width,height}=useVideoConfig(),scale=Math.min(width/960,height/540);
 if(!assets?.paper_base)throw new Error('缺少必需资源槽：paper_base');
 return <div style={{width:'100%',height:'100%',background:'#e9e5d9',position:'relative'}}><div style={{position:'absolute',width:960,height:540,left:(width-960*scale)/2,top:(height-540*scale)/2,transform:`scale(${scale})`,transformOrigin:'0 0'}}><Img src={assets.paper_base} style={{position:'absolute',width:960,height:540,left:0,top:0}}/>{children}</div></div>;
}
