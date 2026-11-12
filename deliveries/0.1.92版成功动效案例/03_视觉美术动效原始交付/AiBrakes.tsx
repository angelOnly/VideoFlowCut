import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolateColors} from 'remotion';
import {TimelineVideo} from '@videoflowcut/motion';

type Props={assets:Record<string,string>;fonts:Record<string,{family:string;weight:number;style:string}>;timing:Record<string,number>};
const C={ink:'#182C46',paper:'#F3F0E6',yellow:'#F3E640',red:'#F16A55',blue:'#345BD4',muted:'#8E9CAC',white:'#FFFFFF'};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const x=clamp(v);return x*x*(3-2*x)};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const at=(t:number,a:number,d=.75)=>ease((t-a)/d);
const box=(left:number,top:number,width?:number,height?:number):React.CSSProperties=>({position:'absolute',left,top,width,height});
// 正式版本由真实配音句群时间注入，不按字符数制造词级落点。
const provisional={person:10.09,transfer:22.49,recursive:26.18,generation:29.21,night:35.89,boundary:41.58,escape:52.1,safety:57.6,standards:66.32,race:72.72,advantage:81.06,door:90.75,dilemma:100.66,opportunity:108.11,caution:112.99,ending:116.95,end:123.066667};
export const resolveMotionEvents=(props:Props,ctx:{fps:number})=>{
 const t={...provisional,...props.timing};return [
 {id:'handoff',meaning:'人的工作台向 Agent 控制台让位',startFrame:Math.round(t.transfer*ctx.fps),endFrame:Math.round((t.transfer+2)*ctx.fps)},
 {id:'handoff_land',meaning:'转业字组与控制关系落定',startFrame:Math.round((t.transfer+1.4)*ctx.fps)},
 {id:'recursive',meaning:'研发结果沿路径成为下一代研发输入',startFrame:Math.round(t.generation*ctx.fps),endFrame:Math.round(t.night*ctx.fps)},
 {id:'recursive_depart',meaning:'研发结果开始沿回路返回',startFrame:Math.round((t.generation+3)*ctx.fps)},
 {id:'recursive_return',meaning:'研发结果抵达下一轮 AI 输入',startFrame:Math.round((t.generation+6)*ctx.fps)},
 {id:'escape',meaning:'测试对象越过授权边界',startFrame:Math.round(t.escape*ctx.fps),endFrame:Math.round((t.escape+2)*ctx.fps)},
 {id:'escape_cross',meaning:'Agent 中心穿过授权边界',startFrame:Math.round((t.escape+.77)*ctx.fps)},
 {id:'competition',meaning:'两路竞速形成互相等待的减速困局',startFrame:Math.round(t.race*ctx.fps),endFrame:Math.round(t.dilemma*ctx.fps)},
 {id:'brake',meaning:'两路合流，刹车问题停留',startFrame:Math.round(t.ending*ctx.fps),endFrame:Math.round(t.end*ctx.fps)}];
};

export default function AiBrakes(props:Props){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps,T={...provisional,...props.timing};
 const font=(s:string):React.CSSProperties=>({fontFamily:props.fonts[s].family,fontWeight:props.fonts[s].weight,fontStyle:props.fonts[s].style as 'normal'});
 const title=font('title'),body=font('body'),quote=font('quote');
 const Text=({text,x,y,size=60,color=C.ink,style={}}:{text:React.ReactNode;x:number;y:number;size?:number;color?:string;style?:React.CSSProperties})=><div style={{...box(x,y),...body,color,fontSize:size,lineHeight:1.24,...style}}>{text}</div>;
 const Big=({text,x,y,size=120,color=C.ink,style={}}:{text:React.ReactNode;x:number;y:number;size?:number;color?:string;style?:React.CSSProperties})=><Text text={text} x={x} y={y} size={size} color={color} style={{...title,letterSpacing:-3,...style}}/>;
 const Arrow=({x,y,w=180,color=C.ink,p=1}:{x:number;y:number;w?:number;color?:string;p?:number})=><svg style={box(x,y,w,44)} viewBox={`0 0 ${w} 44`}><path d={`M0 22 H${w-18} m-16 -15 l18 15 -18 15`} fill="none" stroke={color} strokeWidth="7" strokeDasharray="800" strokeDashoffset={800*(1-p)}/></svg>;
 const Doc=({slot,x,y,w,h,rotate=0,scale=1,cropY=0,cropX=0,cropWidth=0,naturalWidth=0}:{slot:string;x:number;y:number;w:number;h:number;rotate?:number;scale?:number;cropY?:number;cropX?:number;cropWidth?:number;naturalWidth?:number})=><div style={{...box(x,y,w,h),background:C.white,overflow:'hidden',border:`2px solid ${C.ink}`,transform:`rotate(${rotate}deg) scale(${scale})`,transformOrigin:'center center'}}>{props.assets[slot]?<Img src={props.assets[slot]} style={naturalWidth?{position:'absolute',width:w*naturalWidth/(cropWidth||naturalWidth),height:'auto',top:-cropY*w/(cropWidth||naturalWidth),left:-cropX*w/(cropWidth||naturalWidth)}:{width:'100%',height:'100%',objectFit:'contain'}}/>:null}</div>;
 // 六处交接分别沿资料面、研发方向、授权边界、评估横线、双轨和合流路径接管。
 const Layer=({start,end,kind='left',bg=C.paper,children}:{start:number;end:number;kind?:string;bg?:string;children:React.ReactNode})=>{
  if(t<start-1||t>end+1)return null;const enter=at(t,start-1,1),leave=at(t,end-.7,1.4);
  const clip=kind==='up'?`inset(${100*(1-enter)}% 0 0 0)`:kind==='circle'?`circle(${150*enter}% at 78% 52%)`:`inset(0 ${100*(1-enter)}% 0 0)`;
  return <AbsoluteFill style={{background:bg,clipPath:clip,transform:`translateX(${-55*leave}px)`}}>{children}</AbsoluteFill>;
 };
 const p0=at(t,.1,1.25),p1=at(t,2.06,.7),p2=at(t,4.4,.8);
 const personFocus=at(t,14.65,1.3),transfer=at(t,T.transfer,1.4);
 const recur=at(t,T.generation,1),night=at(t,T.night,1.1);
 const escape=at(t,T.escape,1.4),safetyMove=at(t,T.standards,1.4),evidence=at(t,T.boundary+4,1.2);
 const advantage=at(t,T.advantage,1.4),door=at(t,T.door,1.3),dilemma=at(t,T.dilemma,1.5);
 // 向右竞速始终保留蓝方领先，门槛落在两车空隙内，且先画后车。
 const raceProgress=clamp((t-T.race-5)/18),brake=at(t,T.race+6,2),resume=at(t,T.dilemma,3);
 const redX=300+280*raceProgress+120*resume,blueX=redX+460-60*brake+50*advantage;
 const gateX=100+(redX+365+blueX)/2-13;
 // 同一阅读区先退旧信息再进新信息，至少留 9 帧清场。
 const chipVisible=advantage*(1-at(t,T.door-.8,.5));
 const doorVisible=door*(1-at(t,T.dilemma-.6,.4));
 const final=at(t,T.ending,1.8);
 return <AbsoluteFill style={{background:C.paper,...body,overflow:'hidden'}}>
  <Layer start={0} end={T.person} bg={C.ink}>
   <div style={{...box(0,0,1920,1080),opacity:1-at(t,3,.8)}}><TimelineVideo slot="work" fit="cover"/><AbsoluteFill style={{background:'linear-gradient(90deg,rgba(24,44,70,.95),rgba(24,44,70,.1))'}}/></div>
   <div style={{...box(1080-120*p0,60,780,850),background:C.blue,transform:`rotate(${-8+4*p0}deg)`}}/>
   <Doc slot="portrait" x={1090} y={145+200*(1-p0)} w={610} h={650} rotate={8-6*p0}/>
   <div style={{...box(90,110,950,80),overflow:'hidden'}}><Text text="离 AI 最近的人" x={0} y={80*(1-p0)} size={62} color={C.paper}/></div>
   <Big text="正在害怕。" x={84-90*(1-p0)} y={265} size={154} color={C.yellow} style={{transform:`scale(${mix(.88,1,p0)})`,transformOrigin:'left center'}}/>
   <div style={{...box(100,505,710,8),background:C.yellow,transform:`scaleX(${p1})`,transformOrigin:'left'}}/>
   <Text text="本事被替代" x={100} y={552+50*(1-p1)} size={59} color={C.paper} style={{opacity:p1}}/>
   <Text text="人类的风险" x={100} y={664+50*(1-p2)} size={59} color={C.paper} style={{opacity:p2}}/>
   <div style={{...box(860,555,130,130),border:`5px solid ${C.yellow}`,borderRadius:'50%',transform:`scale(${p2})`}}><Big text="?" x={34} y={-6} size={104} color={C.yellow}/></div>
  </Layer>
  <Layer start={T.person} end={T.recursive} kind="up">
   <div style={{...box(0,0,850-220*transfer,1080),background:'#E6E6DB'}}/>
   <Doc slot="liu" x={80-400*transfer} y={90} w={mix(1720,790,personFocus)} h={790} rotate={0} cropX={370} cropWidth={720} cropY={mix(0,515,personFocus)} naturalWidth={1440}/>
   <div style={{...box(910-200*transfer,108,980,700),transform:`translate(${1100*(1-personFocus)}px,${-35*transfer}px)`}}>
    <Text text="刘胜与" x={0} y={0} size={52}/>
    <Text text="《我不得不把才华埋葬在昨天》" x={0} y={98} size={47} style={{...quote,maxWidth:880}}/>
    <div style={{...box(0,235,820,5),background:C.blue,transform:`scaleX(${personFocus})`,transformOrigin:'left'}}/>
    <Big text="半年到一年" x={0} y={295} size={104} color={C.blue} style={{opacity:personFocus}}/>
    <Text text="苦练的能力，可能被追上" x={0} y={450} size={48} style={{opacity:personFocus*(1-transfer)}}/>
   </div>

   <div style={{...box(690,580,1080,260),background:C.yellow,transform:`translateX(${1250*(1-transfer)}px) rotate(${-2*transfer}deg)`}}>
    <Big text="人得“转业”了" x={50} y={34} size={102}/><Text text="亲自干活 → 指挥 Agent" x={55} y={169} size={42}/>
   </div>
   <Arrow x={420} y={720} w={200} p={transfer}/>
  </Layer>
  <Layer start={T.recursive} end={T.boundary} bg={C.ink}>
   <Text text="AI，开始帮助人类研发 AI" x={100} y={86} size={64} color={C.paper}/>
   <div style={{...box(0,250,2500,580),transform:`translateX(${-80*recur}px) scale(${mix(1,.88,night)})`,transformOrigin:'1000px 300px'}}>
    {[0,1,2,3].map((i)=>{const q=at(t,T.recursive+.6+i*1.7,1.2);return <div key={i} style={{...box(100+i*450,40,350,420),border:`5px solid ${i===3?C.yellow:C.paper}`,transform:`translateY(${100*(1-q)-55*night}px) rotateY(${-10*night}deg)`,opacity:q*(i===0?1-.58*night:1)}}>
     <Text text={i===0?'人类研究员':i===1?'AI 参与研发':i===2?'更强的 AI':'下一代 AI'} x={28} y={35} size={43} color={C.paper}/>
     {[0,1,2].map(j=><div key={j} style={{...box(30,150+j*60,280*at(t,T.recursive+.6+i*1.7+j*.28,.6),28),background:j===2?C.yellow:C.blue,transform:`translateY(${night*(j+1)*22}px)`}}/>)}
     {i>0?<div style={{...box(30+240*((Math.max(0,t-T.night)+i*.45)%2.8)/2.8,358,40,8),background:C.paper,opacity:night}}/>:null}
     {i<3?<Arrow x={365} y={190} w={70} color={C.yellow} p={at(t,T.recursive+1.4+i*1.7,1)}/>:null}
    </div>})}
   </div>
   <svg width="1920" height="1080" style={box(0,0)}><path d="M1660 665 V745 Q1660 770 1630 770 H720 Q690 770 690 740 V700" stroke={C.yellow} strokeWidth="7" fill="none" strokeDasharray="1500" strokeDashoffset={1500*(1-at(t,T.generation+1.7,2.5))}/><path d="M675 716 L690 700 L705 716" stroke={C.yellow} strokeWidth="7" fill="none" opacity={at(t,T.generation+4,1)}/></svg>
   <div style={{...box(mix(1630,680,at(t,T.generation+3,3)),730,38,38),background:C.paper,borderRadius:9,opacity:at(t,T.generation+2.8,.3)*(1-at(t,T.generation+6.3,.3)),transform:`rotate(${90*at(t,T.generation+3,3)}deg)`}}/>
   <Text text="研发结果 → 下一轮输入" x={900} y={705} size={31} color={C.paper} style={{opacity:at(t,T.generation+2.8,1)}}/>
   <div style={{...box(100,785,1600,85),overflow:'hidden'}}><Big text="递归式自我改进" x={0} y={100*(1-recur)} size={84} color={C.yellow}/></div>
   <div style={{...box(1010,128,790,98),background:C.paper,transform:`translateY(${-280*(1-night)}px)`}}><Text text="人下班了，Agent 还在跑" x={30} y={19} size={46}/></div>
  </Layer>
  <Layer start={T.boundary} end={T.safety} kind="circle">
   <Text text="能力越强，边界越重要" x={100} y={70} size={65}/>
   <Doc slot="openai" x={mix(100,70,evidence)-420*escape} y={225} w={mix(1720,760,evidence)} h={600} rotate={-2*evidence} scale={mix(1,.82,escape)} cropY={90} naturalWidth={1391}/>
   <div style={{...box(940-420*escape,260,640,500),border:`6px dashed ${C.blue}`,transform:`translateX(${1200*(1-evidence)}px) scale(${mix(1,1.12,escape)})`}}>
    <Text text="授权测试范围" x={40} y={35} size={47} color={C.blue}/>
    <div style={{...box(160+640*escape,200-40*Math.sin(escape*Math.PI),230,145),background:interpolateColors(escape,[0,1],[C.yellow,C.red]),transform:`rotate(${12*Math.sin(escape*Math.PI)}deg)`}}><Big text="Agent" x={25} y={29} size={65}/></div>
   </div>
   <div style={{...box(1330,325,470,380),background:C.ink,transform:`translateX(${600*(1-escape)}px)`}}><Text text="外部服务器" x={42} y={40} size={48} color={C.paper}/><Text text="执行代码" x={42} y={230} size={62} color={C.yellow}/></div>
   <Text text="内部安全评估" x={110} y={820} size={34} color={C.blue} style={{opacity:1-escape}}/>
   <div style={{...box(650,790,1110,100),overflow:'hidden'}}><Big text="做题 → 突破考场" x={0} y={115*(1-escape)} size={81} color={C.red}/></div>
  </Layer>
  <Layer start={T.safety} end={T.race} kind="up" bg="#E5EADF">
   <Doc slot="dario" x={mix(90,-140,safetyMove)} y={92} w={mix(1030,840,safetyMove)} h={760} rotate={mix(-2,0,safetyMove)} cropY={1380} naturalWidth={1440}/>
   <div style={{...box(90,92,1030,760),overflow:'hidden',transform:`translateY(${-850*at(t,T.safety+7,1)}px)`}}><TimelineVideo slot="interview" fit="cover" style={{width:'100%',height:'100%'}}/></div>
   <div style={{...box(1130-350*safetyMove,150,1020,650)}}>
    <Text text="达里奥 · 阿莫迪" x={0} y={0} size={50}/><Big text={'给安全\n追赶的时间'} x={0} y={125} size={100} color={C.blue} style={{whiteSpace:'pre-line',opacity:1-at(t,T.standards-.5,.45)}}/>
    {['独立测试','共同安全标准','国际合作'].map((text,i)=>{const q=at(t,T.standards+i*1.2,.8);return <div key={text} style={{...box(0,130+i*178,970,136),borderBottom:`4px solid ${C.ink}`,transform:`translateX(${750*(1-q)}px)`,opacity:q}}><Text text={text} x={80} y={27} size={62}/><div style={{...box(0,45,36,36),background:i===1?C.yellow:C.blue,transform:`rotate(${45*q}deg)`}}/></div>})}
   </div>
   <div style={{...box(100,864,1710,6),background:C.blue,transform:`scaleX(${at(t,T.safety,2)})`,transformOrigin:'left'}}/>
  </Layer>
  <Layer start={T.race} end={T.ending} bg={C.ink}>
   <Big text="谁先减速？" x={95} y={80} size={105} color={C.yellow} style={{transform:`translateY(${-10*door+70*dilemma}px) scaleY(${1-dilemma})`,transformOrigin:'center bottom',opacity:1-at(t,T.dilemma,.4)}}/>
   <div style={{...box(100,207,1640*dilemma,6),background:C.yellow}}/>
   <div style={{...box(95,80,1700,135),overflow:'hidden'}}><Big text="谁都不敢先松油门" x={0} y={150*(1-at(t,T.dilemma+.7,.9))} size={105} color={C.yellow}/></div>
   <div style={{...box(gateX,300,26,390),background:C.yellow,transform:`scaleY(${doorVisible})`,transformOrigin:'top'}}/>
   {[0,1].map(i=>{const launch=at(t,T.race+2+i*.4,1.3),x=i===0?blueX:redX;return <div key={i} style={{...box(100,310+i*240,1700,175),transform:`translateY(${50*(1-launch)}px)`,opacity:launch}}>
    <Text text={i===0?'我们':'竞争对手'} x={0} y={35} size={49} color={C.paper}/>
    <div style={{...box(280,125,1400,5),background:C.muted}}/>
    {[0,1,2,3,4].map(j=><div key={j} style={{...box(320+j*280,112,4,29),background:C.muted}}/>)}
    <div style={{...box(x,20,365,110),background:i===0?C.blue:C.red,transform:`skewX(${-10*(1-dilemma)}deg)`}}><Text text={resume>.5?'继续加速':advantage>.5?(i===0?'保持领先':'继续追赶'):i===0&&brake>.5?'先减速？':'继续加速'} x={36} y={23} size={46} color={C.paper}/></div>
   </div>})}
   <div style={{...box(1040,730,740,110),background:C.paper,transform:`translateY(${300*(1-advantage)}px)`,opacity:chipVisible}}><Text text="芯片 · 算力 · 模型保护" x={35} y={31} size={42}/></div>
   <div style={{...box(930,770,900,94),overflow:'hidden',opacity:doorVisible}}><Big text="风险，还是门槛？" x={0} y={100*(1-door)} size={70} color={C.paper}/></div>
   {/* 困局说明始终留在字幕上方，以水平遮罩揭示，不穿越底部字幕。 */}
   <div style={{...box(100,825,1650,80),background:C.ink,opacity:dilemma*(1-at(t,T.opportunity-.5,.4)),overflow:'hidden',clipPath:`inset(0 ${100*(1-dilemma)}% 0 0)`}}><Text text="共同减速更安全，却不能确定别人会减速" x={0} y={6} size={52} color={C.paper}/></div>
   <div style={{...box(100,280,1700,520),background:C.ink,clipPath:`inset(0 ${100*(1-at(t,T.opportunity,1.2))}% 0 0)`}}>
    <Big text="眼前的机会" x={0} y={85} size={105} color={C.yellow}/><Big text="可能的风险" x={920} y={250} size={105} color={C.red} style={{opacity:at(t,T.caution,1)}}/>
    <svg width="1700" height="520" style={box(0,0)}><path d="M720 175 C990 175 680 350 880 350" fill="none" stroke={C.paper} strokeWidth="7" strokeDasharray="900" strokeDashoffset={900*(1-at(t,T.caution,1.5))}/></svg>
   </div>
  </Layer>
  <Layer start={T.ending} end={T.end+1} kind="circle">
   <svg width="1920" height="1080" style={box(0,0)}><path d="M-100 320 H450 Q650 320 800 500 H1230 M-100 720 H450 Q650 720 800 500" fill="none" stroke={C.blue} strokeWidth="18" strokeDasharray="2600" strokeDashoffset={2600*(1-final)}/></svg>
   <div style={{...box(1110,390,560,240),background:C.yellow,transform:`translateX(${700*(1-final)}px) rotate(${3*(1-final)}deg)`}}><Big text="刹车？" x={76} y={44} size={138}/></div>
   <Text text="最懂 AI 的人，也没有一致答案" x={100} y={100} size={62}/>
   <Big text="继续踩油门之前" x={100} y={760} size={100}/>
  </Layer>
 </AbsoluteFill>;
}






