// 新设计返修：固定书脊、刚性封面和等弧长纸条共用空间投影；无凭空新增页块。
import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
type Point={x:number;y:number;z:number};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const p=(t:number,a:number,d:number)=>clamp((t-a)/d);
const ease=(q:number)=>q<.3?q*q/.3:1-(1-q)*(1-q)/.7;
export const BOOK={width:210,halfLength:155,hingeZ:20};
export const TURNS=[{id:'leaf-a',start:1.18,duration:.78},{id:'leaf-b',start:2.25,duration:.70}];
export const project=(v:Point)=>({x:480+.98*v.x+.24*v.y,y:348+.58*v.y-.85*v.z});
const path=(pts:Point[])=>pts.map((v,i)=>{const a=project(v);return `${i?'L':'M'}${a.x.toFixed(3)} ${a.y.toFixed(3)}`;}).join(' ')+'Z';
// 积分纸面切线，保持条带弧长；u=0 永远是同一书脊，不随抬页平移。
export function pagePoint(u:number,v:number,turn:number):Point {
 const steps=32,du=u/steps;let x=0,z=BOOK.hingeZ;
 for(let i=0;i<steps;i++){
  const position=(i+.5)*du/BOOK.width;
  const angle=Math.PI*turn+.82*Math.sin(Math.PI*turn)*(position-.15);
  x+=du*Math.cos(angle);z+=du*Math.sin(angle);
 }
 return {x,y:v,z};
}
export function sceneState(t:number){
 const q=p(t,.20,.7),settle=p(t,.90,.18);
 return {cover:Math.PI*(1-Math.pow(1-q,3))-.025*Math.sin(Math.PI*settle),
  sheets:TURNS.map(s=>{const turn=ease(p(t,s.start,s.duration));return {id:s.id,turn,side:turn===0?'right':turn===1?'left':'turning'};})};
}
export function resolveMotionEvents(props:{startFrame?:number},{fps}:{fps:number}){
 const offset=props.startFrame??0;
 return [{id:'cover-open',meaning:'封面绕书脊落在左侧',startFrame:offset+Math.ceil(1.08*fps)},
  ...TURNS.map(s=>({id:s.id,meaning:'同一页从右侧翻过书脊并落定在左侧',startFrame:offset+Math.ceil((s.start+s.duration)*fps)}))];
}
function Cover({angle,id}:{angle:number;id:string}){
 const point=(u:number,v:number,thickness=0):Point=>({x:u*Math.cos(angle)-thickness*Math.sin(angle),y:v,z:18+u*Math.sin(angle)+thickness*Math.cos(angle)});
 const pts=[point(0,-164,3),point(220,-164,3),point(220,164,3),point(0,164,3)];
 const back=angle>Math.PI*.57;
 return <g>
  <path d={path([point(220,-164,3),point(220,164,3),point(220,164,-3),point(220,-164,-3)])} fill="#173e40"/>
  <path d={path([point(0,164,3),point(220,164,3),point(220,164,-3),point(0,164,-3)])} fill="#173e40"/>
  <path d={path(pts)} fill={back?'#c9c0a8':`url(#${id}-cloth)`} stroke="#284e4c" strokeWidth="2"/>
  {!back&&<g fill="none" stroke="#d9bf75"><path d={path([point(20,-142,3.1),point(198,-142,3.1),point(198,142,3.1),point(20,142,3.1)])}/>
   <path d={path([point(110,-55,3.2),point(148,0,3.2),point(110,55,3.2),point(72,0,3.2)])} strokeWidth="3"/>
  </g>}
 </g>;
}
function PageMarks({turn,back,identity}:{turn:number;back:boolean;identity:number}){
 const pts=(u:number,v:number)=>pagePoint(back?BOOK.width-u:u,v,turn);
 const line=(v:number,end:number)=>Array.from({length:25},(_,i)=>pts(27+(end-27)*i/24,v));
 return <g fill="none" stroke={back?'#71827a':'#8e8067'} strokeWidth="1.7">
 {[0,1,2,3,4,5].map(i=><path key={i} d={path(line(-113+i*16,i===5?126:181)).replace(/Z$/,'')}/>)}
 {[0,1,2].map(i=><path key={i} d={path(line(77+i*15,i===2?141:181)).replace(/Z$/,'')}/>)}
 <path d={path(Array.from({length:41},(_,i)=>{const a=i/40*Math.PI*2;const r=back?22*(1+.16*Math.cos(4*a)):28;return pts(104+r*Math.cos(a),29+r*Math.sin(a));}))} stroke={identity===0?'#ba693d':'#337e87'} strokeWidth="3"/>
 <path d={path([pts(163,-10),pts(181,0),pts(163,10)])} strokeWidth="2.5"/>
 </g>;
}
function Leaf({turn,identity}:{turn:number;identity:number}){
 const n=32,parts=Array.from({length:n},(_,i)=>{
  const u=i*BOOK.width/n,next=(i+1)*BOOK.width/n;
  const a=pagePoint(u,0,turn),b=pagePoint(next,0,turn);
  const front=.5684*(b.x-a.x)+.204*(b.z-a.z)>0;
  const light=.5+.5*Math.abs((b.x-a.x)/(BOOK.width/n));
  return {i,u,next,front,fill:front?`rgb(${233+Math.round(13*light)},${226+Math.round(13*light)},${205+Math.round(20*light)})`:'#e0d6bd'};
 });
 const center=parts[Math.floor(n/2)];
 return <g>
  {parts.map(s=><path key={s.i} d={path([pagePoint(s.u,-155,turn),pagePoint(s.next,-155,turn),pagePoint(s.next,155,turn),pagePoint(s.u,155,turn)])} fill={s.fill} stroke={s.fill} strokeWidth=".5"/>)}
  <PageMarks turn={turn} back={!center.front} identity={identity}/>
  <path d={path([...Array.from({length:33},(_,i)=>pagePoint(i*BOOK.width/32,-155,turn)),...Array.from({length:33},(_,i)=>pagePoint((32-i)*BOOK.width/32,155,turn))])} fill="none" stroke="#c1b399" strokeWidth="1"/>
 </g>;
}
function Book({id,t}:{id:string;t:number}){
 const s=sceneState(t);
 const quad=(z:number)=>[{x:0,y:-164,z},{x:220,y:-164,z},{x:220,y:164,z},{x:0,y:164,z}];
 const sheets=s.sheets.map((v,i)=>({...v,index:i})).sort((a,b)=>Number(a.side==='turning')-Number(b.side==='turning')||b.index-a.index);
 return <g>
  <defs><linearGradient id={`${id}-cloth`}><stop stopColor="#28534e"/><stop offset=".35" stopColor="#4a7e74"/><stop offset="1" stopColor="#214c49"/></linearGradient></defs>
  <path d={path(quad(0))} fill="#244b48" stroke="#173b38" strokeWidth="5"/>
  <path d={path([{x:0,y:155,z:3},{x:210,y:155,z:3},{x:210,y:155,z:18},{x:0,y:155,z:18}])} fill="#c2b69d"/>
  <path d={path([{x:210,y:-155,z:3},{x:210,y:155,z:3},{x:210,y:155,z:18},{x:210,y:-155,z:18}])} fill="#d2c7af"/>
  {[5,8,11,14,17].map(z=><path key={z} d={path([{x:0,y:155,z},{x:210,y:155,z},{x:210,y:-155,z}]).replace(/Z$/,'')} fill="none" stroke="#f1ead8" strokeWidth="1"/>)}
  <Leaf turn={0} identity={2}/>
  {s.cover>=Math.PI*.5&&<Cover angle={s.cover} id={id}/>}
  {sheets.map(sheet=><Leaf key={sheet.id} turn={sheet.turn} identity={sheet.index}/>)}
  {s.cover<Math.PI*.5&&<Cover angle={s.cover} id={id}/>}
 </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number}){
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=(f-(props.startFrame??0))/fps;
 return <svg width="100%" height="100%" viewBox="0 0 960 540"><rect width="960" height="540" fill={props.background??'#e9e5d9'}/>
 <ellipse cx="486" cy="445" rx="264" ry="17" fill="#493f30" opacity=".12"/>
 <Book id={props.instanceId??'book'} t={t}/></svg>;
}
