import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {BoundVideo} from '@videoflowcut/motion';
export const defaultProps={};
const FONT='Microsoft YaHei, Noto Sans SC, sans-serif';
const T={splitStart:24,splitEnd:60,focusStart:52,focusEnd:102,end:252};
const clamp=(p:number)=>Math.max(0,Math.min(1,p));
const smooth=(f:number,a:number,b:number)=>{const p=clamp((f-a)/(b-a));return p*p*(3-2*p);};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
// 已查看源帧的手工取景点，不宣称逐帧自动跟踪。
const centers=[[0,.900,.605],[26,.847,.648],[52,.842,.620],[78,.818,.540],[104,.795,.556],[130,.730,.585],[157,.742,.656],[183,.766,.650],[209,.766,.657],[235,.770,.664],[261,.768,.693],[287,.770,.682]];
function centerAt(f:number){for(let i=1;i<centers.length;i++){if(f<=centers[i][0]){const a=centers[i-1],b=centers[i],p=clamp((f-a[0])/(b[0]-a[0]));return [mix(a[1],b[1],p),mix(a[2],b[2],p)];}}return [.77,.682];}
export const resolveMotionEvents=()=>[
{id:'meadow.establish',meaning:'在单幅真实全景中认识羊群',startFrame:0,endFrame:T.splitStart},
{id:'meadow.split',meaning:'移动裁切边界，展开同源同钟活动视窗',startFrame:T.splitStart,endFrame:T.splitEnd},
{id:'meadow.focus',meaning:'中央真实个体取得面积，侧窗退向两侧',startFrame:T.focusStart,endFrame:T.focusEnd},
{id:'meadow.observe',meaning:'窗口稳定，继续观察同一只羊的真实过程',startFrame:T.focusEnd,endFrame:T.end}
];
type Box={x:number;y:number;w:number;h:number};
function FieldWindow({box,mediaWidth,cx,cy,primary=false}:{box:Box;mediaWidth:number;cx:number;cy:number;primary?:boolean}){
const mh=mediaWidth*9/16;
// 每个实际视窗都限制取景边界，影像不能在窗内露空。
const mediaLeft=Math.min(0,Math.max(box.w-mediaWidth,box.w/2-cx*mediaWidth));
const mediaTop=Math.min(0,Math.max(box.h-mh,box.h/2-cy*mh));
return <div style={{position:'absolute',left:box.x,top:box.y,width:box.w,height:box.h,overflow:'hidden',boxSizing:'border-box',border:primary?'3px solid #AA9067':'1px solid #BFBDAE',boxShadow:primary?'0 16px 32px rgba(47,53,39,.15)':'none',filter:primary?'none':'saturate(.65) brightness(.87)'}}>
<div style={{position:'absolute',left:mediaLeft,top:mediaTop,width:mediaWidth,height:mh}}>
<BoundVideo slot="meadow" offsetInFrames={0} fit="fill" style={{width:'100%',height:'100%'}}/>
</div></div>;}
export default function MeadowFocus(){
const f=useCurrentFrame(),split=smooth(f,T.splitStart,T.splitEnd),focus=smooth(f,T.focusStart,T.focusEnd),c=centerAt(f);
const main={x:mix(mix(40,228,split),80,focus),y:mix(mix(390,368,split),326,focus),w:mix(mix(688,312,split),608,focus),h:mix(mix(387,422,split),570,focus)};
const mw=mix(mix(688,1400,split),3200,focus);
return <AbsoluteFill style={{background:'#E7E5DA',fontFamily:FONT,overflow:'hidden',color:'#364235'}}>
<div style={{position:'absolute',left:64,top:77,fontSize:24,letterSpacing:4,color:'#7B7E6B'}}>草地观察</div>
<div style={{position:'absolute',left:62,top:140,fontSize:64,fontWeight:700,lineHeight:1.15}}>把目光<br/>留给这一只</div>
{split>0?<>
<FieldWindow box={{x:mix(24,-12,focus),y:mix(438,418,focus),w:split*mix(178,58,focus),h:mix(384,388,focus)}} mediaWidth={960} cx={Math.max(.2,c[0]-.46)} cy={c[1]}/>
<FieldWindow box={{x:mix(566,722,focus),y:mix(342,380,focus),w:split*mix(178,58,focus),h:mix(432,422,focus)}} mediaWidth={900} cx={.54} cy={.33}/>
</>:null}
{/* 主窗保留同一实例；三窗不经Sequence，源局部时钟一致。 */}
<FieldWindow box={main} mediaWidth={mw} cx={mix(.5,c[0],split)} cy={mix(.5,c[1],split)} primary/>
<div style={{position:'absolute',left:64,top:1142,fontSize:20,color:'#7B7E6B',lineHeight:1.6}}>影像：Joaquim Baeta · CC BY 4.0<br/>The Sheep of Stonehenge</div>
</AbsoluteFill>;
}