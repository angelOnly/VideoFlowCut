// 本项目新设计：将开口、后壁、前壁和内容物拆层，检验容器画法迁移。
import React from 'react';
import {useCurrentFrame,useVideoConfig,Img,random} from 'remotion';
const p=(t:number,a:number,d:number)=>Math.max(0,Math.min(1,(t-a)/d));
// 接触点按碗内壁与已有果实编排，三颗身份与最终承载关系固定。
export const FRUITS=[
 {start:.2,hit:.72,from:[245,110],contact:[359,345],rest:[415,350]},
 {start:.85,hit:1.37,from:[735,80],contact:[589,338],rest:[485,350]},
 {start:1.55,hit:2.05,from:[552,74],contact:[467,286],rest:[450,289]}
];
export function sceneState(t:number) {
 return FRUITS.map((f,i)=>{
  const q=p(t,f.start,f.hit-f.start),r=p(t,f.hit,.45),roll=1-Math.pow(1-r,3);
  const flightX=f.from[0]+(f.contact[0]-f.from[0])*q;
  const flightY=f.from[1]+(f.contact[1]-f.from[1])*q*q;
  return {x:flightX+(f.rest[0]-f.contact[0])*roll,y:flightY+(f.rest[1]-f.contact[1])*roll-26*Math.sin(Math.PI*r)*(1-r),angle:(i===1?-1:1)*(55*q+38*roll)};
 });
}
export function resolveMotionEvents(props:{startFrame?:number},{fps}:{fps:number}) {
 return FRUITS.map((f,i)=>({id:`contact-${i}`,meaning:i<2?'果实接触碗内壁后向内部滚动':'第三颗果实接触已有两颗果实并落定',startFrame:(props.startFrame??0)+Math.ceil(f.hit*fps)}));
}
function Fruit({id,x,y,angle,color}:{id:string;x:number;y:number;angle:number;color:string}) {
 const outline="M0 -29 C37 -38 44 9 19 29 C7 39 -6 32 -14 31 C-46 21 -40 -35 0 -29Z";
 return <g transform={`translate(${x} ${y})`}>
 <defs><clipPath id={`${id}-skin-clip`} clipPathUnits="userSpaceOnUse"><path d={outline} transform={`rotate(${angle})`}/></clipPath>
 <linearGradient id={`${id}-light`} gradientUnits="userSpaceOnUse" x1="24" y1="-32" x2="-24" y2="32"><stop stopColor="#fff3c9" stopOpacity=".18"/><stop offset=".4" stopColor="#eab16b" stopOpacity="0"/><stop offset="1" stopColor="#492b17" stopOpacity=".45"/></linearGradient></defs>
 <g transform={`rotate(${angle})`}><path d={outline} fill={color}/>
 {Array.from({length:80},(_,i)=>{const a=random(i+8)*6.283,r=Math.sqrt(random(i+18))*27;return <circle key={i} cx={Math.cos(a)*r} cy={Math.sin(a)*r} r=".6" fill={i%2?'#713e1c':'#e8bf76'} opacity=".3"/>;})}
 <path d="M0 -26 Q-7 -43 3 -47" fill="none" stroke="#493e25" strokeWidth="4"/><path d="M1 -33 Q24 -55 28 -31 Q16 -24 1 -33Z" fill="#526c3a"/>
 </g>
 {/* 受光保持场景方向，裁切轮廓随果实转；表皮颗粒才随物体旋转。 */}
 <g clipPath={`url(#${id}-skin-clip)`}><rect x="-48" y="-48" width="96" height="96" fill={`url(#${id}-light)`}/><path d="M10 -22 Q20 -23 24 -13" fill="none" stroke="#ffe0a1" strokeWidth="3" opacity=".2"/></g>
 </g>;
}
function BowlBack({id}:{id:string}) {
 return <g>
  <defs><linearGradient id={`${id}-body`} x1=".85" y1="0" x2=".25" y2="1"><stop stopColor="#7fa5a2"/><stop offset=".55" stopColor="#557e7d"/><stop offset="1" stopColor="#294d51"/></linearGradient>
   <radialGradient id={`${id}-inner`} cx="70%" cy="20%"><stop stopColor="#739d96"/><stop offset=".7" stopColor="#3b6868"/><stop offset="1" stopColor="#254d51"/></radialGradient></defs>
  <ellipse cx="480" cy="322" rx="200" ry="62" fill="#9fbdb4"/>
  <ellipse cx="480" cy="322" rx="187" ry="50" fill={`url(#${id}-inner)`}/>
 </g>;
}
function BowlFront({id}:{id:string}) {
 return <g>
  <path d="M280 322 Q480 442 680 322 C660 418 589 459 480 462 C371 459 300 418 280 322Z" fill={`url(#${id}-body)`}/>
 <path d="M620 377 Q606 412 565 432" fill="none" stroke="#d5dfca" strokeWidth="3" opacity=".4"/>
 <path d="M293 347 Q345 437 444 451" fill="none" stroke="#1f4348" strokeWidth="3" opacity=".25"/>
  <path d="M280 322 A200 62 0 0 0 680 322 L667 322 A187 50 0 0 1 293 322Z" fill="#9fbdb4"/>
  <path d="M324 377 Q480 467 636 377 M330 388 Q480 478 630 388" fill="none" stroke="#d4dfcb" strokeWidth="3" opacity=".6"/>
  <path d="M414 455 Q480 472 546 455 L540 468 Q480 484 420 468Z" fill="#345d63"/>
 </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number;assets?:Record<string,string>}) {
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),fruits=sceneState((frame-(props.startFrame??0))/fps),id=props.instanceId??'bowl';
 return <SceneFrame assets={props.assets}><svg width="960" height="540" viewBox="0 0 960 540" style={{position:"absolute"}}>

  <path d="M301 421 Q275 472 387 488 L526 488 Q577 483 547 466 L420 461Z" fill="#3d4639" opacity=".14"/><path d="M421 470 Q480 482 540 470" fill="none" stroke="#283c34" strokeWidth="4" opacity=".23"/>
  <BowlBack id={id}/>
  {fruits.map((f,i)=><g key={i}>
 {i<2&&<path d={`M${f.x-25} 369 q25 8 50 0 l-8 -5 h-34Z`} fill="#233d32" opacity={.22*Math.max(0,1-Math.abs(f.y-350)/40)}/>}
 {i===2&&[0,1].map(j=>{const a=fruits[j],distance=Math.hypot(f.x-a.x,f.y-a.y),x=(f.x+a.x)/2,y=(f.y+a.y)/2;return <path key={j} d={`M${x-13} ${y-3} q13 10 26 0`} fill="none" stroke="#554124" strokeWidth="5" opacity={.24*Math.max(0,1-Math.abs(distance-70)/16)}/>;})}
 <Fruit id={`${id}-fruit-${i}`} {...f} color={['#ca9434','#ba6b37','#a59b43'][i]}/></g>)}
  <BowlFront id={id}/>
 </svg></SceneFrame>;
}

// 图片与矢量统一设计坐标；缺资源直接报错，不回退纯色。
function SceneFrame({assets,children}:{assets?:Record<string,string>;children:React.ReactNode}) {
 const {width,height}=useVideoConfig(),scale=Math.min(width/960,height/540);
 if(!assets?.paper_base)throw new Error('缺少必需资源槽：paper_base');
 return <div style={{width:'100%',height:'100%',background:'#e9e5d9',position:'relative'}}><div style={{position:'absolute',width:960,height:540,left:(width-960*scale)/2,top:(height-540*scale)/2,transform:`scale(${scale})`,transformOrigin:'0 0'}}><Img src={assets.paper_base} style={{position:'absolute',width:960,height:540,left:0,top:0}}/>{children}</div></div>;
}
