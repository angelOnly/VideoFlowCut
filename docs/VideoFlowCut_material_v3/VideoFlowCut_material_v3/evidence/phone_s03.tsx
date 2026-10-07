import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';

type Props = {assets: {tower: string; crowd: string}};
type Point = {x: number; y: number};
type Request = {key: string; phone: number; start: number; arrive: number; grant: number; done: number; slot: number; baseline?: boolean};
const C = {paper:'#F2F0EA', ink:'#17242C', teal:'#187E86', amber:'#E6A949', pale:'#DCE7E2', gray:'#9BAAA6', white:'#FBFCF8'};
const FONT = 'Microsoft YaHei, Arial, sans-serif';
const T = {
  detail:24, modelIn:54, established:72, first:90, second:112, third:132,
  crowdIn:142, modelReturn:201, exceeds:230, focus:256, waiting:268,
  qualification:367, relief:395, capacity:425, exit:448, titleExit:468, handoff:476
};
const clamp = (x:number) => Math.max(0,Math.min(1,x));
const mix = (a:number,b:number,p:number) => a+(b-a)*p;
const ease = (f:number,a:number,b:number) => {const p=clamp((f-a)/(b-a)); return p*p*(3-2*p);};
const lerpPoint = (a:Point,b:Point,p:number):Point => ({x:mix(a.x,b.x,p),y:mix(a.y,b.y,p)});
const REQUESTS:Request[] = [
  {key:'base-a',phone:0,start:78,arrive:T.first,grant:T.first,done:104,slot:0,baseline:true},
  {key:'base-b',phone:1,start:100,arrive:T.second,grant:T.second,done:126,slot:1,baseline:true},
  {key:'base-c',phone:2,start:120,arrive:T.third,grant:T.third,done:141,slot:2,baseline:true},
  {key:'a',phone:1,start:203,arrive:217,grant:250,done:262,slot:0},
  {key:'b',phone:2,start:206,arrive:221,grant:289,done:301,slot:1},
  {key:'c',phone:3,start:210,arrive:225,grant:330,done:342,slot:2},
  {key:'d',phone:4,start:214,arrive:229,grant:T.relief,done:407,slot:3},
  {key:'e',phone:0,start:218,arrive:233,grant:403,done:415,slot:4},
  {key:'f',phone:1,start:224,arrive:239,grant:411,done:423,slot:5},
  {key:'g',phone:2,start:260,arrive:272,grant:419,done:431,slot:0},
  {key:'h',phone:3,start:299,arrive:312,grant:427,done:439,slot:1},
  {key:'i',phone:4,start:341,arrive:354,grant:435,done:447,slot:2}
];
function phoneGeometry(id:number,f:number) {
  const focus=ease(f,T.focus,T.waiting);
  const exit=ease(f,T.exit,T.handoff-1);
  if(id===0) {
    const w=mix(mix(196,248,focus),288,exit);
    return {x:384,y:mix(mix(862,835,focus),672,exit),w,h:w*568/288,opacity:1};
  }
  const g = id===1?{x:174,y:855,w:128}:id===2?{x:594,y:855,w:128}:id===3?{x:76,y:735,w:94}:{x:692,y:735,w:94};
  const reveal=id<3?1:ease(f,T.modelReturn,T.modelReturn+16);
  return {x:g.x+(id===1||id===3?-24:24)*exit,y:g.y+32*(1-reveal)+26*exit,w:g.w,h:g.w*568/288,opacity:reveal*(1-exit)};
}
function Phone({id,f}:{id:number;f:number}) {
  const g=phoneGeometry(id,f);
  const firstDone=id===0?104:id===1?126:id===2?141:10000;
  const pending=REQUESTS.some(r=>r.phone===id&&f>=r.start&&f<r.done);
  const completed=REQUESTS.filter(r=>r.phone===id&&f>=r.done).length;
  const isLoading=pending || (id<3&&f<firstDone);
  const main=id===0;
  const focusLabel=main?ease(f,T.focus,T.waiting)*(1-ease(f,T.exit,T.handoff-1)):0;
  const progress=Math.min(1,0.2+completed*0.18);
  return <div style={{position:'absolute',left:g.x-g.w/2,top:g.y-g.h/2,width:288,height:568,transform:'scale('+g.w/288+')',transformOrigin:'top left',opacity:g.opacity}}>
    <svg width="288" height="568" viewBox="0 0 288 568">
      <rect x="2" y="4" width="284" height="560" rx="38" fill={C.ink}/>
      <rect x="13" y="15" width="262" height="538" rx="28" fill={C.white}/>
      <rect x="109" y="24" width="70" height="7" rx="3.5" fill={C.ink} opacity="0.75"/>
      {[10,16,22,28].map((h,i)=><rect key={i} x={195+i*15} y={64-h} width="9" height={h} rx="2" fill={C.teal}/>)}
      <rect x="33" y="44" width="38" height="6" rx="3" fill={C.gray} opacity="0.5"/>
      <text x="144" y="101" textAnchor="middle" fontSize="27" fontWeight="700" fill={C.teal} opacity={focusLabel}>满格</text>
      <rect x="30" y="145" width="228" height="180" rx="18" fill="#E5ECE6"/>
      <path d="M30 291 L89 216 L126 255 L178 202 L258 291 V307 Q258 325 240 325 H48 Q30 325 30 307Z" fill="#CBDAD3" opacity={isLoading?0.48:0.9}/>
      {!isLoading&&<rect x="48" y="296" width={192*progress} height="7" rx="3.5" fill={C.teal} opacity="0.75"/>}
      {isLoading&&<g>
        <circle cx="144" cy="225" r="27" fill={C.white} opacity="0.86"/>
        <circle cx="144" cy="225" r="19" fill="none" stroke={C.amber} strokeWidth="6" strokeDasharray="77 43" strokeLinecap="round" transform={'rotate('+((f*7)%360)+' 144 225)'}/>
        <text x="144" y="287" textAnchor="middle" fontSize="25" fontWeight="600" fill={C.ink}>等待</text>
      </g>}
      <rect x="32" y="354" width="223" height="11" rx="5.5" fill="#C5D3CE"/>
      <rect x="32" y="382" width="162" height="10" rx="5" fill="#D8E1DC"/>
      <rect x="32" y="410" width="193" height="10" rx="5" fill="#D8E1DC"/>
      <rect x="32" y="455" width="224" height="6" rx="3" fill="#DFE7E1"/>
      <rect x="32" y="455" width={224*progress} height="6" rx="3" fill={C.teal} opacity="0.7"/>
      {main&&<text x="144" y="507" textAnchor="middle" fontSize="20" fill="#82938B">界面示意</text>}
      <rect x="108" y="533" width="72" height="5" rx="2.5" fill={C.ink} opacity="0.3"/>
    </svg>
  </div>;
}
function CroppedPhoto({src,sourceWidth,sourceHeight,crop,x,y,width}:{src:string;sourceWidth:number;sourceHeight:number;crop:number[];x:number;y:number;width:number}) {
  const scale=width/crop[2];
  const height=crop[3]*scale;
  return <div style={{position:'absolute',left:x,top:y,width,height,overflow:'hidden',borderRadius:22,background:'#DCE3DB'}}>
    <Img src={src} style={{position:'absolute',left:-crop[0]*scale,top:-crop[1]*scale,width:sourceWidth*scale,height:sourceHeight*scale,maxWidth:'none'}}/>
  </div>;
}
function ResourceModel({f}:{f:number}) {
  const enter=ease(f,T.modelIn,T.established);
  const exit=ease(f,T.exit,T.handoff-1);
  const queueX=[118,182,246,522,586,650];
  const resourceX=[224,384,544];
  const active=REQUESTS.filter(r=>f>=r.start&&f<r.done);
  const slots=resourceX.map((x,i)=>({x,lit:REQUESTS.some(r=>r.phone%3===i&&f>=r.grant+(r.baseline?0:4)&&f<r.done)}));
  const atCapacity=ease(f,T.capacity,T.capacity+12);
  const titleExit=1-ease(f,T.titleExit,T.handoff-1);
  const baseTitle=f<T.exceeds?'共享有限资源':f<T.focus?'需求超过可用资源':'可能降速';
  return <>
    <div style={{position:'absolute',left:48,top:72,width:672,fontSize:22,fontWeight:600,color:'#75857E',letterSpacing:2,opacity:enter*(1-exit)}}>机制示意</div>
    <div style={{position:'absolute',left:48,top:121,width:672,height:82,fontSize:54,lineHeight:1.2,fontWeight:700,color:C.ink,opacity:enter*titleExit,overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,opacity:1-atCapacity,transform:'translateY('+(-82*atCapacity)+'px)'}}>{baseTitle}</div>
      <div style={{position:'absolute',inset:0,opacity:atCapacity,transform:'translateY('+(82*(1-atCapacity))+'px)'}}>还要看需求与容量</div>
    </div>
    <div style={{position:'absolute',inset:0,opacity:enter*(1-exit),transform:'translateY('+(18*(1-enter)-14*exit)+'px)'}}>
      <svg width="768" height="1110" viewBox="0 0 768 1110">
        <ellipse cx="384" cy="1068" rx="224" ry="18" fill="#D8E1D8" opacity="0.7"/>
        <path d="M375 283 H393 L398 418 H370Z" fill="#A7BBB4"/>
        <path d="M339 273 H430" fill="none" stroke={C.ink} strokeWidth="7" strokeLinecap="round"/>
        <path d="M347 314 H421" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round"/>
        <rect x="326" y="249" width="25" height="79" rx="5" fill={C.white} stroke={C.ink} strokeWidth="3"/>
        <rect x="371" y="235" width="26" height="88" rx="5" fill={C.white} stroke={C.ink} strokeWidth="3"/>
        <rect x="418" y="249" width="25" height="79" rx="5" fill={C.white} stroke={C.ink} strokeWidth="3"/>
        <path d="M355 424 H413" stroke={C.ink} strokeWidth="7" strokeLinecap="round"/>
        <path d="M384 426 V452" stroke="#A1B4AC" strokeWidth="3"/>
        <rect x="104" y="452" width="560" height="132" rx="24" fill={C.white} stroke="#90A79E" strokeWidth="2"/>
        <text x="384" y="492" textAnchor="middle" fontSize="28" fontWeight="600" fill={C.ink}>可用资源</text>
        {slots.map((s,i)=><g key={i}>
          <rect x={s.x-56} y="522" width="112" height="30" rx="15" fill={s.lit?C.teal:'#DCE8E0'}/>
          <rect x={s.x-34} y="534" width="68" height="6" rx="3" fill={s.lit?'#D2EFE6':'#A5BEB2'}/>
        </g>)}
        {active.map(r=>{
          const g=phoneGeometry(r.phone,f);
          const from={x:g.x,y:g.y-g.h/2+12};
          const queue={x:queueX[r.slot],y:625};
          const pool={x:resourceX[r.phone%3],y:537};
          let p:Point;
          let a:Point;
          let b:Point;
          let teal=false;
          if(r.baseline) {
            if(f<r.grant) {a=from;b=pool;p=lerpPoint(a,b,ease(f,r.start,r.grant));}
            else {a=pool;b=from;p=lerpPoint(a,b,ease(f,r.grant,r.done));teal=true;}
          } else if(f<r.arrive) {a=from;b=queue;p=lerpPoint(a,b,ease(f,r.start,r.arrive));}
          else if(f<r.grant) {a=queue;b=queue;p=queue;}
          else if(f<r.grant+4) {a=queue;b=pool;p=lerpPoint(a,b,ease(f,r.grant,r.grant+4));}
          else {a=pool;b=from;p=lerpPoint(a,b,ease(f,r.grant+4,r.done));teal=true;}
          const held=!r.baseline&&f>=r.arrive&&f<r.grant;
          return <g key={r.key}>
            {!held&&<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={teal?C.teal:'#ABBAB3'} strokeWidth="2" opacity="0.3" strokeDasharray={teal?undefined:'4 7'}/>}
            {held&&<rect x={p.x-20} y={p.y-15} width="40" height="30" rx="10" fill="#F6E6C5" stroke={C.amber} strokeWidth="2"/>}
            <circle cx={p.x} cy={p.y} r={teal?9:6} fill={teal?C.teal:C.amber}/>
          </g>;
        })}
      </svg>
    </div>
    <div style={{position:'absolute',inset:0,opacity:enter}}>
      {[3,4,1,2,0].map(id=><Phone key={id} id={id} f={f}/>)}
    </div>
    {f>=T.qualification&&f<T.capacity&&<div style={{position:'absolute',left:48,top:207,width:672,fontSize:26,color:'#6F8077',opacity:ease(f,T.qualification,T.qualification+8)}}>这是一个可能原因</div>}
  </>;
}
export function resolveMotionEvents(_props:Props,_context:{fps:number;durationInFrames:number}) {
  return [
    {id:'tower_detail',meaning:'同一真实通信塔照片的上部面板裁切停稳',startFrame:T.detail,endFrame:T.detail+1},
    {id:'model_established',meaning:'固定资源托盘和三台手机建立完成',startFrame:T.established,endFrame:T.established+1},
    {id:'first_resource_granted',meaning:'第一份传输机会离开固定资源托盘',startFrame:T.first,endFrame:T.first+1},
    {id:'second_resource_granted',meaning:'第二台手机获得传输机会',startFrame:T.second,endFrame:T.second+1},
    {id:'third_resource_granted',meaning:'第三台手机获得传输机会',startFrame:T.third,endFrame:T.third+1},
    {id:'crowd_cut_in',meaning:'真实静态交通大厅照片完全取代模型',startFrame:T.crowdIn,endFrame:T.crowdIn+1},
    {id:'model_return',meaning:'返回相同模型投影并引入新增请求',startFrame:T.modelReturn,endFrame:T.modelReturn+1},
    {id:'demand_exceeds_resource',meaning:'请求积累且需求超过可用资源标题可读',startFrame:T.exceeds,endFrame:T.exceeds+1},
    {id:'full_bars_waiting',meaning:'主手机放大停稳，满格和加载等待同时可见',startFrame:T.waiting,endFrame:T.waiting+1},
    {id:'qualification_begins',meaning:'可能原因限定开始，继续保持等待状态',startFrame:T.qualification,endFrame:T.qualification+1},
    {id:'demand_relief',meaning:'旧等待队列开始顺序释放，容量边界不变',startFrame:T.relief,endFrame:T.relief+1},
    {id:'capacity_qualification',meaning:'需求与容量限定进入，和旧状态交叠',startFrame:T.capacity,endFrame:T.capacity+1},
    {id:'primary_phone_handoff',meaning:'主手机在475帧到达中心384,672及288×568；476为下一场交接边界',startFrame:T.handoff-1,endFrame:T.handoff}
  ];
}
export default function Motion(props:Props) {
  const f=useCurrentFrame();
  const exit=ease(f,T.exit,T.handoff-1);
  const bg='rgb('+Math.round(mix(236,242,exit))+',240,'+Math.round(mix(235,234,exit))+')';
  if(f<T.modelIn) {
    const d=ease(f,12,T.detail);
    const crop=[mix(0,390,d),mix(0,70,d),mix(1746,1050,d),mix(2875,1280,d)];
    const width=mix(512,560,d);
    return <AbsoluteFill style={{background:C.paper,fontFamily:FONT,color:C.ink}}>
      <div style={{position:'absolute',left:48,top:40,fontSize:22,color:'#7F8B83'}}>现实画面</div>
      <CroppedPhoto src={props.assets.tower} sourceWidth={1746} sourceHeight={2875} crop={crop} x={(768-width)/2} y={mix(102,170,d)} width={width}/>
      <div style={{position:'absolute',left:104,top:966,fontSize:30,fontWeight:600}}>通信塔外观</div>
      <div style={{position:'absolute',left:104,top:1012,fontSize:22,color:'#7F8B83'}}>Wikideas1 · CC0</div>
    </AbsoluteFill>;
  }
  if(f>=T.crowdIn&&f<T.modelReturn) {
    return <AbsoluteFill style={{background:C.paper,fontFamily:FONT,color:C.ink}}>
      <div style={{position:'absolute',left:48,top:72,fontSize:22,color:'#7F8B83'}}>现实画面</div>
      <div style={{position:'absolute',left:48,top:138,width:672,fontSize:54,fontWeight:700}}>公共场所</div>
      <CroppedPhoto src={props.assets.crowd} sourceWidth={960} sourceHeight={640} crop={[40,288,592,352]} x={48} y={312} width={672}/>
      <div style={{position:'absolute',left:48,top:752,fontSize:28,fontWeight:600}}>交通大厅中的人群</div>
      <div style={{position:'absolute',left:48,top:806,fontSize:22,color:'#7F8B83'}}>Henrysz · CC BY 4.0</div>
    </AbsoluteFill>;
  }
  return <AbsoluteFill style={{background:bg,fontFamily:FONT,color:C.ink}}><ResourceModel f={f}/></AbsoluteFill>;
}