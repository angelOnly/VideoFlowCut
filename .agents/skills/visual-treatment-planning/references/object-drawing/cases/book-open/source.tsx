// 新设计返修：固定书脊、刚性封面和等弧长纸条共用空间投影；无凭空新增页块。
import React from 'react';
import {useCurrentFrame,useVideoConfig,Img,random} from 'remotion';
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
const dot=(a:Point,b:Point)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub=(a:Point,b:Point):Point=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const add=(a:Point,b:Point,k=1):Point=>({x:a.x+b.x*k,y:a.y+b.y*k,z:a.z+b.z*k});
const unit=(v:Point):Point=>{const m=Math.hypot(v.x,v.y,v.z);return {x:v.x/m,y:v.y/m,z:v.z/m};};
export const LIGHT=unit({x:.55,y:-.8,z:1.3}),VIEW=unit({x:-.204,y:.833,z:.5684});
export function pageNormal(u:number,turn:number):Point {
 const tangent=sub(pagePoint(Math.min(210,u+.1),0,turn),pagePoint(Math.max(0,u-.1),0,turn));
 return unit({x:-tangent.z,y:0,z:tangent.x});
}
// 线性空间漫反射，再转换回 sRGB；不把横向缩窄当作亮度。
export function shadePaper(u:number,turn:number){
 const n=pageNormal(u,turn),front=dot(n,VIEW)>=0,visible=front?n:{x:-n.x,y:-n.y,z:-n.z};
 const brightness=.70+.30*Math.max(0,dot(visible,LIGHT));
 const linear=(c:number)=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
 const display=(c:number)=>c<=.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-.055;
 return `rgb(${(front?[246,243,234]:[234,228,214]).map(c=>(255*display(linear(c/255)*brightness)).toFixed(3)).join(',')})`;
}
const coverPoint=(u:number,v:number,angle:number,thickness=0):Point=>({x:u*Math.cos(angle)-thickness*Math.sin(angle),y:v,z:18+u*Math.sin(angle)+thickness*Math.cos(angle)});
function Cover({angle,id}:{angle:number;id:string}){
 const point=(u:number,v:number,d=0)=>coverPoint(u,v,angle,d),back=angle>Math.PI*.5,d=back?-3:3;
 const o=project(point(0,0,d)),u=project(point(1,0,d)),v=project(point(0,1,d));
 return <g><defs><pattern id={`${id}-weave`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0h2 M2 2h2" stroke="#9fa68b" strokeWidth=".6" opacity=".23"/><path d="M1 0v2 M3 2v2" stroke="#112d29" strokeWidth=".7" opacity=".28"/></pattern></defs>
 <path d={path([point(220,-164,3),point(220,164,3),point(220,164,-3),point(220,-164,-3)])} fill="#193f3b"/>
 <path d={path([point(0,164,3),point(220,164,3),point(220,164,-3),point(0,164,-3)])} fill="#193f3b"/>
 <g transform={`matrix(${u.x-o.x} ${u.y-o.y} ${v.x-o.x} ${v.y-o.y} ${o.x} ${o.y})`}>
 <rect x="0" y="-164" width="220" height="328" fill={back?'#d2cab6':'#315e53'}/>
 {!back&&<rect x="0" y="-164" width="220" height="328" fill={`url(#${id}-weave)`}/>}
 <rect x="3" y="-161" width="214" height="322" fill="none" stroke={back?'#bdb39d':'#20473e'} strokeWidth="2"/>
 <path d="M8 -160 V160" stroke="#172f28" opacity=".3" strokeWidth="3"/>
 {!back&&<g fill="none" stroke="#ac9d64" opacity=".8"><rect x="22" y="-140" width="176" height="280"/><path d="M110 -55 L148 0 L110 55 L72 0Z" strokeWidth="2"/><path d="M42 104 H176"/></g>}
 </g></g>;
}
// 本例所有静止接收面均为实际水平面；活动封面本身不充当另一活动页的接收面。
type Surface={id:string;origin:Point;normal:Point;polygon:Point[];layer:number};
const quad=(x0:number,x1:number,y0:number,y1:number,z:number):Point[]=>[{x:x0,y:y0,z},{x:x1,y:y0,z},{x:x1,y:y1,z},{x:x0,y:y1,z}];
export function receiverSurfaces(t:number):Surface[]{
 const s=sceneState(t),surfaces:Surface[]=[{id:'desk',origin:{x:0,y:0,z:-4},normal:{x:0,y:0,z:1},polygon:quad(-600,500,-400,400,-4),layer:0},
 {id:'right',origin:{x:0,y:0,z:20},normal:{x:0,y:0,z:1},polygon:quad(0,210,-155,155,20),layer:3}];
 if(t>=1.08)surfaces.push({id:'cover',origin:{x:0,y:0,z:21},normal:{x:0,y:0,z:1},polygon:quad(-220,0,-164,164,21),layer:1});
 if(s.sheets.some(v=>v.side==='left'))surfaces.push({id:'left',origin:{x:0,y:0,z:22},normal:{x:0,y:0,z:1},polygon:quad(-210,0,-155,155,22),layer:2});
 return surfaces;
}
const cross2=(a:Point,b:Point,q:Point)=>(b.x-a.x)*(q.y-a.y)-(b.y-a.y)*(q.x-a.x);
export const inside=(q:Point,poly:Point[])=>poly.every((a,i)=>cross2(a,poly[(i+1)%poly.length],q)>=-1e-6);
export function projectShadow(s:Point,surfaces:Surface[],direction:Point={x:-LIGHT.x,y:-LIGHT.y,z:-LIGHT.z}){
 let hit:{point:Point;surface:string;distance:number}|undefined;
 for(const r of surfaces){const den=dot(r.normal,direction);if(Math.abs(den)<1e-8)continue;const k=dot(r.normal,sub(r.origin,s))/den;
 if(k<=1e-5)continue;const q=add(s,direction,k);if(inside(q,r.polygon)&&(!hit||k<hit.distance))hit={point:q,surface:r.id,distance:k};}
 return hit;
}
// 凸多边形裁切和差集用于接收面边缘；上层页面截住的投影不继续穿到桌面。
function half(poly:Point[],distance:(p:Point)=>number):Point[]{
 const result:Point[]=[];poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length],da=distance(a),db=distance(b);if(da>=0)result.push(a);if((da>=0)!==(db>=0))result.push(add(a,sub(b,a),da/(da-db)));});return result;
}
export function clipPolygon(poly:Point[],boundary:Point[]){return boundary.reduce((v,a,i)=>half(v,q=>cross2(a,boundary[(i+1)%boundary.length],q)),poly);}
function subtract(poly:Point[],boundary:Point[]){let rest=poly;const out:Point[][]=[];boundary.forEach((a,i)=>{if(!rest.length)return;const d=(q:Point)=>cross2(a,boundary[(i+1)%boundary.length],q);const outside=half(rest,q=>-d(q));if(outside.length>=3)out.push(outside);rest=half(rest,d);});return out;}
const leafPoint=(u:number,v:number,turn:number):Point=>{const q=pagePoint(u,v,turn);return {...q,z:q.z+2*turn};};
export function shadowRegions(t:number){
 const state=sceneState(t),receivers=receiverSurfaces(t),triangles:Point[][]=[];
 const sheet=state.sheets.find(s=>s.side==='turning');
 if(sheet)for(let i=0;i<32;i++)for(let j=0;j<8;j++){
  const a=leafPoint(i*210/32,-155+j*310/8,sheet.turn),b=leafPoint((i+1)*210/32,-155+j*310/8,sheet.turn),c=leafPoint((i+1)*210/32,-155+(j+1)*310/8,sheet.turn),d=leafPoint(i*210/32,-155+(j+1)*310/8,sheet.turn);triangles.push([a,b,c],[a,c,d]);}
 const cover=quad(0,220,-164,164,0).map(q=>coverPoint(q.x,q.y,state.cover,state.cover>Math.PI*.5?-3:3));
 triangles.push([cover[0],cover[1],cover[2]],[cover[0],cover[2],cover[3]]);
 // 整个书体向桌面投影，静止页的低矮投影也参加同一个几何计算。
 for(const r of receivers.filter(r=>r.id!=='desk'))triangles.push([r.polygon[0],r.polygon[1],r.polygon[2]],[r.polygon[0],r.polygon[2],r.polygon[3]]);
 const regions:{receiver:Surface;polygons:Point[][];softness:number}[]=[];
 for(const r of receivers){const groups:Point[][][]=[[],[],[]],heights:number[][]=[[],[],[]];
 for(const tri of triangles){const high=half(tri,q=>q.z-r.origin.z-1e-4);if(high.length<3)continue;
 const projectTo=(q:Point,z:number)=>add(q,{x:-LIGHT.x,y:-LIGHT.y,z:-LIGHT.z},(q.z-z)/LIGHT.z);
 let pieces=[clipPolygon(high.map(q=>projectTo(q,r.origin.z)),r.polygon)].filter(v=>v.length>=3);
 for(const blocker of receivers.filter(b=>b.origin.z>r.origin.z+1e-3)){
  const bound=blocker.polygon.map(q=>projectTo(q,r.origin.z));pieces=pieces.flatMap(poly=>subtract(poly,bound));
 }
 const h=high.reduce((v,q)=>v+q.z-r.origin.z,0)/high.length;const bucket=h<15?0:h<65?1:2;groups[bucket].push(...pieces);heights[bucket].push(h);
 }
 groups.forEach((polygons,k)=>{if(polygons.length)regions.push({receiver:r,polygons,softness:Math.max(.5,Math.min(5,.5+.03*heights[k].reduce((a,b)=>a+b,0)/heights[k].length))});});}
 return regions;
}
const shadowPath=(polygons:Point[][])=>polygons.map(poly=>{const area=poly.reduce((v,q,i)=>v+q.x*poly[(i+1)%poly.length].y-poly[(i+1)%poly.length].x*q.y,0);return path(area<0?[...poly].reverse():poly);}).join(" ");
function drawReceiverShadow(id:string,receiver:Surface,regions:ReturnType<typeof shadowRegions>){
 const groups=regions.filter(r=>r.receiver.id===receiver.id);if(!groups.length)return null;
 const polygons=groups.flatMap(r=>r.polygons),pts=polygons.flat().map(project),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs)-16,y=Math.min(...ys)-16,w=Math.max(...xs)-x+16,h=Math.max(...ys)-y+16;
 // 先合并整个接收面的轮廓，再按距离区域软化；三角形内部边不参与模糊。
 return <g><defs><clipPath id={`${id}-clip-${receiver.id}`}><path d={path(receiver.polygon)}/></clipPath>
 {groups.map((r,i)=><g key={i}><filter id={`${id}-soft-${receiver.id}-${i}`} filterUnits="userSpaceOnUse" x={x} y={y} width={w} height={h}><feGaussianBlur stdDeviation={r.softness}/></filter>
 <mask id={`${id}-band-${receiver.id}-${i}`} maskUnits="userSpaceOnUse" x={x} y={y} width={w} height={h}><path d={shadowPath(r.polygons)} fill="white" stroke="white" strokeWidth={r.softness*6}/></mask></g>)}
 <mask id={`${id}-shadow-${receiver.id}`} maskUnits="userSpaceOnUse" x={x} y={y} width={w} height={h}>{groups.map((r,i)=><g key={i} mask={`url(#${id}-band-${receiver.id}-${i})`}><path filter={`url(#${id}-soft-${receiver.id}-${i})`} fill="white" stroke="white" strokeWidth=".6" d={shadowPath(polygons)}/></g>)}</mask></defs>
 <g clipPath={`url(#${id}-clip-${receiver.id})`}><rect x={x} y={y} width={w} height={h} fill="#292a23" opacity=".18" mask={`url(#${id}-shadow-${receiver.id})`}/></g></g>;
}
function PageMarks({turn,back,identity}:{turn:number;back:boolean;identity:number}){
 const pts=(u:number,v:number)=>leafPoint(back?BOOK.width-u:u,v,turn);
 const line=(v:number,end:number)=>Array.from({length:25},(_,i)=>pts(27+(end-27)*i/24,v));
 return <g fill="none" stroke={back?'#71827a':'#8e8067'} strokeWidth="1.7">
 {[0,1,2,3,4,5].map(i=><path key={i} d={path(line(-113+i*16,i===5?126:181)).replace(/Z$/,'')}/>)}
 {[0,1,2].map(i=><path key={i} d={path(line(77+i*15,i===2?141:181)).replace(/Z$/,'')}/>)}
 <path d={path(Array.from({length:41},(_,i)=>{const a=i/40*Math.PI*2;const r=back?22*(1+.16*Math.cos(4*a)):28;return pts(104+r*Math.cos(a),29+r*Math.sin(a));}))} stroke={identity===0?'#ba693d':'#337e87'} strokeWidth="3"/>
 <path d={path([pts(163,-10),pts(181,0),pts(163,10)])} strokeWidth="2.5"/>
 </g>;
}
function Leaf({turn,identity,id}:{turn:number;identity:number;id:string}){
 const pp=(u:number,v:number)=>leafPoint(u,v,turn),front=dot(pageNormal(105,turn),VIEW)>=0;
 // 远处条带先画；0.35 局部单位覆盖抗锯齿缝，不加反复叠深描边。
 const outline=[...Array.from({length:33},(_,i)=>pp(i*210/32,-155)),...Array.from({length:33},(_,i)=>pp((32-i)*210/32,155))];
 const strips=Array.from({length:32},(_,i)=>i).sort((a,b)=>dot(pp((a+.5)*210/32,0),VIEW)-dot(pp((b+.5)*210/32,0),VIEW));
 return <g><defs>{strips.map(i=>{const u=i*210/32,v=(i+1)*210/32,a=project(pp(u,0)),b=project(pp(v,0));return <linearGradient key={i} id={`${id}-${identity}-tone-${i}`} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}><stop stopColor={shadePaper(u,turn)}/><stop offset="1" stopColor={shadePaper(v,turn)}/></linearGradient>;})}</defs>
 <path d={path(outline)} fill={shadePaper(105,turn)}/>
 {strips.map(i=>{const u=Math.max(0,i*210/32-.35),v=Math.min(210,(i+1)*210/32+.35);return <path key={i} d={path([pp(u,-155),pp(v,-155),pp(v,155),pp(u,155)])} fill={`url(#${id}-${identity}-tone-${i})`}/>;})}
 {Array.from({length:95},(_,i)=>{const u=4+random(i+23)*200,v=-150+random(i+77)*300;return <path key={i} d={path([pp(u,v),pp(Math.min(210,u+2+random(i+15)*5),v+.6)]).replace(/Z$/,'')} fill="none" stroke={i%2?'#a59b83':'#fff'} strokeWidth=".45" opacity=".18"/>;})}
 <PageMarks turn={turn} back={!front} identity={identity}/>
 <path d={path([...Array.from({length:33},(_,i)=>pp(i*210/32,-155)),...Array.from({length:33},(_,i)=>pp((32-i)*210/32,155))])} fill="none" stroke="#beb39b" strokeWidth=".65"/>
 </g>;
}
function Book({id,t}:{id:string;t:number}){
 const s=sceneState(t),receivers=receiverSurfaces(t),regions=shadowRegions(t),draw=(name:string)=>{const r=receivers.find(r=>r.id===name);return r?drawReceiverShadow(id,r,regions):null;};
 const right=s.sheets.find(v=>v.side==='right'),left=[...s.sheets].reverse().find(v=>v.side==='left'),moving=s.sheets.find(v=>v.side==='turning');
 return <g>
 {draw('desk')}
 <path d={path(quad(0,220,-164,164,0))} fill="#244b48" stroke="#173b38" strokeWidth="4"/>
 <path d={path([{x:0,y:155,z:3},{x:210,y:155,z:3},{x:210,y:155,z:20},{x:0,y:155,z:20}])} fill="#b9ad95"/>
 <path d={path([{x:210,y:-155,z:3},{x:210,y:155,z:3},{x:210,y:155,z:20},{x:210,y:-155,z:20}])} fill="#d2c7af"/>
 {[5,8,11,14,17].map(z=><path key={z} d={path([{x:0,y:155,z},{x:210,y:155,z},{x:210,y:-155,z}]).replace(/Z$/,'')} fill="none" stroke="#e6decc" strokeWidth=".7"/>)}
 {s.cover>=Math.PI*.5&&<Cover angle={s.cover} id={id}/>}{draw('cover')}
 {left&&<Leaf turn={1} identity={TURNS.findIndex(v=>v.id===left.id)} id={id}/>}{draw('left')}
 <Leaf turn={0} identity={right?TURNS.findIndex(v=>v.id===right.id):2} id={id}/>{draw('right')}
 <path d={path([{x:0,y:-155,z:22},{x:0,y:155,z:22}]).replace(/Z$/,'')} fill="none" stroke="#514b3d" strokeWidth="2" opacity=".18"/>
 {moving&&<Leaf turn={moving.turn} identity={TURNS.findIndex(v=>v.id===moving.id)} id={id}/>}
 {s.cover<Math.PI*.5&&<Cover angle={s.cover} id={id}/>}
 </g>;
}
export default function Motion(props:{instanceId?:string;background?:string;startFrame?:number;assets?:Record<string,string>}){
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=(f-(props.startFrame??0))/fps;
 return <SceneFrame assets={props.assets}><svg width="960" height="540" viewBox="0 0 960 540" style={{position:"absolute"}}>

 <Book id={props.instanceId??'book'} t={t}/></svg></SceneFrame>;
}

// 图片与矢量统一设计坐标；缺资源直接报错，不回退纯色。
function SceneFrame({assets,children}:{assets?:Record<string,string>;children:React.ReactNode}) {
 const {width,height}=useVideoConfig(),scale=Math.min(width/960,height/540);
 if(!assets?.paper_base)throw new Error('缺少必需资源槽：paper_base');
 return <div style={{width:'100%',height:'100%',background:'#e9e5d9',position:'relative'}}><div style={{position:'absolute',width:960,height:540,left:(width-960*scale)/2,top:(height-540*scale)/2,transform:`scale(${scale})`,transformOrigin:'0 0'}}><Img src={assets.paper_base} style={{position:'absolute',width:960,height:540,left:0,top:0}}/>{children}</div></div>;
}
