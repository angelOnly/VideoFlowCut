import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame} from 'remotion';
type Props={assets:{phone:string}};
const C={paper:'#F2F0EA',ink:'#17242C',teal:'#187E86',amber:'#E6A949',white:'#FBFCF8',gray:'#9BAAA6'};
const FONT='Microsoft YaHei, Arial, sans-serif';
const T={cut:48,judgment:84,readable:90,end:129};
const ease=(f:number,a:number,b:number)=>{const p=Math.max(0,Math.min(1,(f-a)/(b-a)));return p*p*(3-2*p);};
function Phone({f}:{f:number}) {
  return <div style={{position:'absolute',left:240,top:388,width:288,height:568}}>
    <svg width="288" height="568" viewBox="0 0 288 568">
      <rect x="2" y="4" width="284" height="560" rx="38" fill={C.ink}/>
      <rect x="13" y="15" width="262" height="538" rx="28" fill={C.white}/>
      <rect x="109" y="24" width="70" height="7" rx="3.5" fill={C.ink} opacity="0.75"/>
      {[10,16,22,28].map((h,i)=><rect key={i} x={195+i*15} y={64-h} width="9" height={h} rx="2" fill={C.teal}/>)}
      <rect x="33" y="44" width="38" height="6" rx="3" fill={C.gray} opacity="0.5"/>
      <rect x="30" y="145" width="228" height="180" rx="18" fill="#E5ECE6"/>
      <path d="M30 291 L89 216 L126 255 L178 202 L258 291 V307 Q258 325 240 325 H48 Q30 325 30 307Z" fill="#CBDAD3" opacity="0.48"/>
      <circle cx="144" cy="225" r="27" fill={C.white} opacity="0.86"/>
      <circle cx="144" cy="225" r="19" fill="none" stroke={C.amber} strokeWidth="6" strokeDasharray="77 43" strokeLinecap="round" transform={'rotate('+((f*7)%360)+' 144 225)'}/>
      <text x="144" y="287" textAnchor="middle" fontSize="25" fontWeight="600" fill={C.ink}>等待</text>
      <rect x="32" y="354" width="223" height="11" rx="5.5" fill="#C5D3CE"/>
      <rect x="32" y="382" width="162" height="10" rx="5" fill="#D8E1DC"/>
      <rect x="32" y="410" width="193" height="10" rx="5" fill="#D8E1DC"/>
      <rect x="32" y="455" width="224" height="6" rx="3" fill="#DFE7E1"/>
      <rect x="32" y="455" width="44.8" height="6" rx="3" fill={C.teal} opacity="0.7"/>
      <text x="144" y="507" textAnchor="middle" fontSize="20" fill="#82938B">界面示意</text>
      <rect x="108" y="533" width="72" height="5" rx="2.5" fill={C.ink} opacity="0.3"/>
    </svg>
  </div>;
}
export function resolveMotionEvents(_props:Props,_context:{fps:number;durationInFrames:number}) {
  return [
    {id:'photo_cut_to_interface',meaning:'从真实静态照片明确切入原创手机加载示意',startFrame:T.cut,endFrame:T.cut+1},
    {id:'not_speedometer_readable',meaning:'信号格不是网速表的判断完整可读',startFrame:T.readable,endFrame:T.readable+1},
    {id:'phone_handoff',meaning:'128帧保留同一手机，129为下一作品交接边界',startFrame:T.end-1,endFrame:T.end}
  ];
}
export default function Motion(props:Props) {
  const f=useCurrentFrame();
  const scale=576/952;
  if(f<T.cut)return <AbsoluteFill style={{background:C.paper,fontFamily:FONT,color:C.ink}}>
    <div style={{position:'absolute',left:96,top:24,fontSize:22,color:'#7F8B83'}}>现实画面</div>
    <div style={{position:'absolute',left:96,top:60,width:576,height:1667*scale,overflow:'hidden',borderRadius:22}}>
      <Img src={props.assets.phone} style={{position:'absolute',left:-1380*scale,top:0,width:2500*scale,height:1667*scale,maxWidth:'none'}}/>
    </div>
    <div style={{position:'absolute',left:96,top:1084,fontSize:22,color:'#7F8B83'}}>Leidolv Magelssen · CC BY 2.0</div>
  </AbsoluteFill>;
  const headline=f<T.judgment?'满格，还在加载':'信号格 ≠ 网速表';
  const alpha=f<T.judgment?1:ease(f,T.judgment,T.readable);
  return <AbsoluteFill style={{background:C.paper,fontFamily:FONT,color:C.ink}}>
    <div style={{position:'absolute',left:48,top:121,width:672,fontSize:54,lineHeight:1.2,fontWeight:700,opacity:alpha,transform:'translateY('+(8*(1-alpha))+'px)'}}>{headline}</div>
    <Phone f={f}/>
  </AbsoluteFill>;
}