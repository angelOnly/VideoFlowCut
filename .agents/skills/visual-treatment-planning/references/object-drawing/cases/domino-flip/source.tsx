// 改编自 Dashi AI Lab domino / domState / drawStrip 的厚度、翻面和落定方法。
import React from 'react';
import {useCurrentFrame,useVideoConfig,Img,random} from 'remotion';
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
    <defs><linearGradient id={`${id}-tone`}><stop stopColor="#fff" stopOpacity=".07"/><stop offset="1" stopColor="#352415" stopOpacity=".07"/></linearGradient></defs>
    <path d="M-62 -218 L-77 -227 L-77 -9 L-62 0Z" fill="#92542b"/>
    <path d="M-62 -218 L-77 -227 L47 -227 L62 -218Z" fill="#d59a59"/>
    <rect x="-62" y="-218" width="124" height="218" rx="1" fill="#c77c37"/>
    <rect x="-62" y="-218" width="124" height="218" fill={`url(#${id}-tone)`}/>
    {Array.from({length:650},(_,i)=><rect key={i} x={-61+random(i+77)*120} y={-217+random(i+19)*215} width={.6+random(i+31)*1.6} height="1.5" fill={i%2?'#593e22':'#f5e2bc'} opacity=".15"/>)}
    <path d="M-40 -106 H40" stroke="#513f34" strokeWidth="3"/>
    <circle cx="0" cy="-164" r="21" fill="none" stroke="#f4ecd9" strokeWidth="5"/>
    {[-1,0,1].map(j=><circle key={j} cx={j*25} cy={-55+j*23} r="9.5" fill="#f4ecd9"/>)}
    <path d="M-60 -216 H59" stroke="#efd9b0" opacity=".25"/>
  </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number;assets?:Record<string,string>}) {
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),s=sceneState((frame-(props.startFrame??0))/fps);
 return <SceneFrame assets={props.assets}><svg width="960" height="540" viewBox="0 0 960 540" style={{position:"absolute"}}>

   <path d="M280 408 L642 405 L705 457 L305 461Z" fill="#f6f3ea"/><path d="M305 461 L705 457 L705 460 L305 464Z" fill="#c5bba6"/>
   <path d={`M${480-62*Math.abs(s.face)} 415 L${480+62*Math.abs(s.face)} 415 L${480+62*Math.abs(s.face)-95} ${448+(1-s.q)*8} L${480-62*Math.abs(s.face)-95} ${448+(1-s.q)*8}Z`} fill="#353a30" opacity={.08+.1*s.q}/>
   <path d={`M${480-63*Math.abs(s.face)} 415 h${126*Math.abs(s.face)} l-8 3 h${-126*Math.abs(s.face)}Z`} fill="#252d24" opacity={.24*s.q}/>
   <g transform={`translate(480 ${s.y})`}>
     {s.face>0?<g transform={`scale(${s.face} 1)`}><path d="M-62 -218 L62 -216 L64 -4 L-61 0Z" fill="#f6f3ea" stroke="#c6bca6"/><circle cx="0" cy="-164" r="21" fill="none" stroke="#c8683e" strokeWidth="5"/><path d="M-39 -105 H39 M-39 -85 H30 M-39 -65 H16" stroke="#a99d87" strokeWidth="3"/></g>:<Domino id={props.instanceId??'domino'} widthScale={-s.face*s.spread} squash={s.squash}/>}
     {/* 翻面最薄处仍保留物件边缘，不能在中途消失。 */}
     <path d="M0 -218 V0" stroke="#a18562" strokeWidth={2*(1-Math.abs(s.face))}/>
   </g>
 </svg></SceneFrame>;
}

// 图片与矢量统一设计坐标；缺资源直接报错，不回退纯色。
function SceneFrame({assets,children}:{assets?:Record<string,string>;children:React.ReactNode}) {
 const {width,height}=useVideoConfig(),scale=Math.min(width/960,height/540);
 if(!assets?.paper_base)throw new Error('缺少必需资源槽：paper_base');
 return <div style={{width:'100%',height:'100%',background:'#e9e5d9',position:'relative'}}><div style={{position:'absolute',width:960,height:540,left:(width-960*scale)/2,top:(height-540*scale)/2,transform:`scale(${scale})`,transformOrigin:'0 0'}}><Img src={assets.paper_base} style={{position:'absolute',width:960,height:540,left:0,top:0}}/>{children}</div></div>;
}
