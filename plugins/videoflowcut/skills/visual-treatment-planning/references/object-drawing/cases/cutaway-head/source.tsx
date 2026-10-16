// Dashi AI Lab HEADTEX 静态图集与实时 SVG 内腔共用坐标；运行时无 Canvas。
import React from 'react';
import {useCurrentFrame,useVideoConfig,Img,random} from 'remotion';
const p=(t:number,a:number,d:number)=>Math.max(0,Math.min(1,(t-a)/d));
const smooth=(q:number)=>q*q*(3-2*q);
const HEAD_PATH='M124 360 A276 88 0 0 1 676 360 C688 392 698 440 696 478 C700 492 708 500 706 512 C703 526 698 538 700 548 C712 575 738 606 744 628 C748 640 728 652 714 652 C708 656 708 664 710 672 C714 676 722 682 720 688 C716 694 706 697 702 700 C710 704 716 710 714 718 C710 728 700 732 700 740 C704 748 716 760 712 772 C704 790 678 800 650 800 C622 800 600 804 590 812 C578 840 570 880 568 900 L300 900 C296 860 286 812 282 780 C230 740 182 700 160 640 C128 560 112 430 124 360Z';
export function sceneState(t:number) {
 return {cards:[0,1,2,3,4].map(i=>{const q=p(t,.65+i*.05,.42),settle=p(t,1.07+i*.05,.14);return {x:260+i*70,y:155+211*q*q-25*Math.sin(Math.PI*Math.min(1,q*1.6))*(1-q),squash:1-.07*Math.sin(Math.PI*settle)};}),zoom:1+.65*smooth(p(t,1.6,.65))};
}
export function resolveMotionEvents(props:{startFrame?:number},{fps}:{fps:number}) {
 return [0,1,2,3,4].map(i=>({id:`land-${i}`,meaning:'骨牌落在开口内部石阶上',startFrame:(props.startFrame??0)+Math.ceil((1.07+i*.05)*fps)}));
}
type Atlas={width:number;height:number;local:{x:number;y:number;width:number;height:number;scale:number};regions:Record<string,{x:number;y:number;width:number;height:number}>};
function StoneSurface({src,atlas,region}:{src:string;atlas:Atlas;region:string}) {
 const r=atlas.regions[region],l=atlas.local;
 return <div style={{position:'absolute',left:l.x,top:l.y,width:l.width,height:l.height,overflow:'hidden'}}><Img src={src} style={{position:'absolute',width:atlas.width/l.scale,height:atlas.height/l.scale,left:-r.x/l.scale,top:-r.y/l.scale}}/></div>;
}
function StoneHead({id,cards,src,atlas}:{id:string;cards:ReturnType<typeof sceneState>["cards"];src:string;atlas:Atlas}) {
 return <div style={{position:'absolute',width:800,height:920,transform:'translate(223px, -53px) scale(.6)',transformOrigin:'0 0'}}>
 <StoneSurface src={src} atlas={atlas} region="full"/>
 <svg width="800" height="920" style={{position:'absolute'}}><defs>
 <pattern id={`${id}-grain`} width="64" height="64" patternUnits="userSpaceOnUse">{Array.from({length:441},(_,i)=><rect key={i} x={(i%21)*3} y={Math.floor(i/21)*3} width="3" height="3" fill={random(i+11)<.5?'#000':'#fff'} opacity={random(i+31)*random(i+91)*.20}/>)}</pattern>
 <linearGradient id={`${id}-step`} gradientUnits="userSpaceOnUse" x1="300" x2="1630"><stop stopColor="#b7ad9b"/><stop offset=".5" stopColor="#d6ccb8"/><stop offset="1" stopColor="#e4dccb"/></linearGradient>
 <linearGradient id={`${id}-inside`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#30352f"/><stop offset="1" stopColor="#060909"/></linearGradient>
 <clipPath id={`${id}-inside-clip`}><ellipse cx="400" cy="360" rx="260" ry="78"/></clipPath></defs>
 <ellipse cx="400" cy="360" rx="260" ry="78" fill={`url(#${id}-inside)`}/><ellipse cx="400" cy="360" rx="260" ry="78" fill={`url(#${id}-grain)`}/>
   <g clipPath={`url(#${id}-inside-clip)`}><g transform="translate(0 93.333333) scale(.416666667)">
    <path d="M1600 664 L1420 716 L1120 750 L800 766 L480 776 L480 806 L800 798 L1120 782 L1420 750 L1610 694Z" fill="#5b564c"/>
    <path d="M300 662 L1630 668 L1630 694 L300 688Z" fill="#8f8778"/>
    <path d="M300 636 L1630 642 L1630 668 L300 662Z" fill={`url(#${id}-step)`}/>
   </g></g>
   <g clipPath={`url(#${id}-inside-clip)`}>{cards.map((c,i)=><path key={i} d={`M${c.x-25} 366 l-32 8 h52 l30 -8Z`} fill="#151a17" opacity={.24*Math.max(0,1-(366-c.y)/80)}/>)}</g>
   {cards.map((c,i)=><g key={i} transform={`translate(${c.x} ${c.y}) scale(1 ${c.squash})`}>
    <path d="M-24 -78 L-30 -83 L-30 -5 L-24 0Z" fill="#28342c"/>
    <path d="M-24 -78 L-30 -83 L18 -83 L24 -78Z" fill="#ece0bf"/>
    <path d="M-24 -78 H24 V0 H-24Z" fill={['#e2a638','#8ca164','#c67441','#346f78','#a34730'][i]}/>
    <path d="M-24 -78 H24 V0 H-24Z" fill={`url(#${id}-grain)`} opacity=".7"/>
    <path d="M-16 -39 H16" stroke="#f5ecd4" strokeWidth="2"/>
    <circle cy="-57" r="9" fill="none" stroke="#f5ecd4" strokeWidth="3"/>
    <circle cx="-9" cy="-26" r="3.5" fill="#f5ecd4"/><circle cx="9" cy="-12" r="3.5" fill="#f5ecd4"/>
   </g>)}
 </svg><StoneSurface src={src} atlas={atlas} region="front"/>
 </div>;
}
export default function Motion(props:{instanceId?:string;startFrame?:number;assets?:Record<string,string>;stoneAtlas:Atlas}) {
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),s=sceneState((frame-(props.startFrame??0))/fps);
 if(!props.assets?.stone_head)throw new Error('缺少必需资源槽：stone_head');
 return <SceneFrame assets={props.assets}><div style={{position:'absolute',width:960,height:540,transform:`translate(480px, ${180+60*(s.zoom-1)/.65}px) scale(${s.zoom}) translate(-480px, -180px)`,transformOrigin:'0 0'}}>
 <svg width="960" height="540" style={{position:'absolute'}}><path d="M403 487 L564 487 L646 505 L398 507 L334 499Z" fill="#343a30" opacity=".16"/></svg>
 <StoneHead id={props.instanceId??'head'} cards={s.cards} src={props.assets.stone_head} atlas={props.stoneAtlas}/>
 </div></SceneFrame>;
}
// 图片与矢量统一设计坐标；缺资源直接报错，不回退纯色。
function SceneFrame({assets,children}:{assets?:Record<string,string>;children:React.ReactNode}) {
 const {width,height}=useVideoConfig(),scale=Math.min(width/960,height/540);
 if(!assets?.paper_base)throw new Error('缺少必需资源槽：paper_base');
 return <div style={{width:'100%',height:'100%',background:'#e9e5d9',position:'relative'}}><div style={{position:'absolute',width:960,height:540,left:(width-960*scale)/2,top:(height-540*scale)/2,transform:`scale(${scale})`,transformOrigin:'0 0'}}><Img src={assets.paper_base} style={{position:'absolute',width:960,height:540,left:0,top:0}}/>{children}</div></div>;
}
