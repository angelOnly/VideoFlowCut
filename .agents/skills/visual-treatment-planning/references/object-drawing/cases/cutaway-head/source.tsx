// 轮廓改编自 Dashi AI Lab headPath；石材和内部改为固定 SVG 层，无 Canvas 缓存。
import React from 'react';
import {useCurrentFrame,useVideoConfig,random} from 'remotion';
const p=(t:number,a:number,d:number)=>Math.max(0,Math.min(1,(t-a)/d));
const smooth=(q:number)=>q*q*(3-2*q);
const HEAD_PATH='M124 360 A276 88 0 0 1 676 360 C688 392 698 440 696 478 C700 492 708 500 706 512 C703 526 698 538 700 548 C712 575 738 606 744 628 C748 640 728 652 714 652 C708 656 708 664 710 672 C714 676 722 682 720 688 C716 694 706 697 702 700 C710 704 716 710 714 718 C710 728 700 732 700 740 C704 748 716 760 712 772 C704 790 678 800 650 800 C622 800 600 804 590 812 C578 840 570 880 568 900 L300 900 C296 860 286 812 282 780 C230 740 182 700 160 640 C128 560 112 430 124 360Z';
export function sceneState(t:number) {
 return {cards:[0,1,2,3,4].map(i=>{const q=p(t,.65+i*.05,.42),settle=p(t,1.07+i*.05,.14);return {x:260+i*70,y:155+211*q*q-25*Math.sin(Math.PI*Math.min(1,q*1.6))*(1-q),squash:1-.07*Math.sin(Math.PI*settle)};}),zoom:1+.65*smooth(p(t,1.6,.65))};
}
export function resolveMotionEvents(props:{startFrame?:number},{fps}:{fps:number}) {
 return [0,1,2,3,4].map(i=>({id:`land-${i}`,meaning:'骨牌落在开口内部石阶上',startFrame:(props.startFrame??0)+Math.ceil((1.07+i*.05)*fps)}));
}
function StoneSurface({id}:{id:string}) {
 return <g>
   <path d={HEAD_PATH} fill={`url(#${id}-stone)`} stroke="#929487" strokeWidth="2"/>
   <g clipPath={`url(#${id}-shape)`}>
     {/* 固定种子的斑块、颗粒与裂纹随主体保持，不在逐帧随机重绘。 */}
     {Array.from({length:100},(_,i)=><ellipse key={i} cx={110+random(`hx${i}`)*650} cy={270+random(`hy${i}`)*630} rx={5+random(`hr${i}`)*27} ry={2+random(`hs${i}`)*13} fill={i%2?'#b6b6a5':'#080d08'} opacity=".09"/>)}
     {Array.from({length:480},(_,i)=><circle key={i} cx={110+random(`gx${i}`)*650} cy={270+random(`gy${i}`)*630} r={.5+random(`gr${i}`)*1.7} fill={i%2?'#e0dac5':'#060a08'} opacity=".24"/>)}
     <path d="M255 488 l23 40 -11 36 38 25 M552 650 l-21 43 14 27 -22 35" fill="none" stroke="#0d1711" strokeWidth="2" opacity=".5"/>
     <path d="M665 507 Q643 499 629 518 M639 521 Q655 532 670 522 M647 554 Q629 618 656 641 M687 704 Q662 707 647 698 M448 542 Q406 507 400 556 Q393 601 430 610 Q456 600 447 564" fill="none" stroke="#1d281f" strokeWidth="7"/>
     <path d="M415 548 Q445 536 439 578 M651 512 L675 514 M650 648 L690 658" fill="none" stroke="#a5a697" strokeWidth="3" opacity=".34"/>
   </g>
 </g>;
}
function StoneHead({id,cards}:{id:string;cards:ReturnType<typeof sceneState>["cards"]}) {
 return <g>
   <defs>
     <radialGradient id={`${id}-stone`} cx="75%" cy="50%" r="80%"><stop stopColor="#66685e"/><stop offset=".45" stopColor="#393e35"/><stop offset="1" stopColor="#111812"/></radialGradient>
     <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#77796f"/><stop offset="1" stopColor="#d6d1c2"/></linearGradient>
     <radialGradient id={`${id}-inside`}><stop stopColor="#354a46"/><stop offset="1" stopColor="#101b18"/></radialGradient>
     <radialGradient id={`${id}-ball`} cx="30%" cy="25%"><stop stopColor="#ffe2a0"/><stop offset=".7" stopColor="#e9a22c"/><stop offset="1" stopColor="#9d541e"/></radialGradient>
     <clipPath id={`${id}-inside-clip`}><ellipse cx="400" cy="360" rx="260" ry="78"/></clipPath>
     <clipPath id={`${id}-shape`}><path d={HEAD_PATH}/></clipPath>
     <clipPath id={`${id}-front`}><path d="M124 360 A276 88 0 0 0 676 360 L800 920 H100Z"/></clipPath>
   </defs>
   <StoneSurface id={id}/>
   <ellipse cx="400" cy="360" rx="276" ry="88" fill={`url(#${id}-rim)`}/>
   <ellipse cx="400" cy="360" rx="260" ry="78" fill={`url(#${id}-inside)`}/>
   <g clipPath={`url(#${id}-inside-clip)`}><g transform="translate(0 93.333333) scale(.416666667)">
    <path d="M1600 664 L1420 716 L1120 750 L800 766 L480 776 L480 806 L800 798 L1120 782 L1420 750 L1610 694Z" fill="#5b564c"/>
    <path d="M300 662 L1630 668 L1630 694 L300 688Z" fill="#8f8778"/>
    <path d="M300 636 L1630 642 L1630 668 L300 662Z" fill="#d6ccb8"/>
   </g></g>
   {cards.map((c,i)=><g key={i} transform={`translate(${c.x} ${c.y}) scale(1 ${c.squash})`}>
    <path d="M-24 -78 L-30 -83 L-30 -5 L-24 0Z" fill="#28342c"/>
    <path d="M-24 -78 L-30 -83 L18 -83 L24 -78Z" fill="#ece0bf"/>
    <path d="M-24 -78 H24 V0 H-24Z" fill={['#e2a638','#8ca164','#c67441','#346f78','#a34730'][i]}/>
    <path d="M-16 -39 H16" stroke="#f5ecd4" strokeWidth="2"/>
    <circle cy="-57" r="9" fill="none" stroke="#f5ecd4" strokeWidth="3"/>
    <circle cx="-9" cy="-26" r="3.5" fill="#f5ecd4"/><circle cx="9" cy="-12" r="3.5" fill="#f5ecd4"/>
   </g>)}
   {/* 前半开口独立覆盖内部；球体不以淡出冒充进入。 */}
   <path d="M124 360 A276 88 0 0 0 676 360 L660 360 A260 78 0 0 1 140 360 Z" fill={`url(#${id}-rim)`} stroke="#989a8c"/>
   <g clipPath={`url(#${id}-front)`}><StoneSurface id={id}/></g>
   <path d="M124 360 A276 88 0 0 0 676 360" fill="none" stroke="#d6d1c2" strokeWidth="4"/>
 </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number}) {
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),s=sceneState((frame-(props.startFrame??0))/fps);
 return <svg width="100%" height="100%" viewBox="0 0 960 540">
  <rect width="960" height="540" fill={props.background??'#e9e5d9'}/>
  <g transform={`translate(480 ${180+60*(s.zoom-1)/.65}) scale(${s.zoom}) translate(-480 -180)`}><ellipse cx="464" cy="488" rx="167" ry="12" fill="#1d281f" opacity=".17"/><g transform="translate(223 -53) scale(.6)"><StoneHead id={props.instanceId??'head'} cards={s.cards}/></g></g>
 </svg>;
}
