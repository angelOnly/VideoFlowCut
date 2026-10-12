import React from 'react';
import {AbsoluteFill,useCurrentFrame,interpolate} from 'remotion';
import {TimelineVideo} from '@videoflowcut/motion';
export default function Motion(props){
 const f=useCurrentFrame();
 const c=(x)=>Math.max(0,Math.min(1,x)); const ease=(x)=>1-Math.pow(1-c(x),3);
 const p=ease((f-40)/35), title=ease((f-10)/18), next=ease((f-61)/24);
 const font=props.fonts.title;
 return <AbsoluteFill style={{backgroundColor:'#e8eeee',fontFamily:font.family,fontWeight:font.weight,color:'#103e43'}}>
   <div style={{position:'absolute',left:28*p,top:48*p,width:960-306*p,height:540-96*p,overflow:'hidden',borderRadius:14*p,transform:'rotate('+(-1.1*Math.sin(p*Math.PI))+'deg)'}}>
    <TimelineVideo slot="cabin" fit="cover" style={{width:'100%',height:'100%'}}/>
    <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(5,25,30,0.7),transparent 38%)',opacity:1-p}}/>
    <div style={{position:'absolute',left:42,bottom:28,color:'white',fontSize:64,letterSpacing:2,opacity:title*(1-p),transform:'translateY('+(1-title)*20+'px)'}}>往里看</div>
   </div>
   <div style={{position:'absolute',left:724,top:102,width:215,overflow:'hidden',opacity:next}}>
    <div style={{fontSize:76,lineHeight:1.05,letterSpacing:-3,transform:'translateX('+(1-next)*210+'px)'}}>空间</div>
    <div style={{height:7,width:178*next,background:'#c49340',marginTop:16,borderRadius:4}}/>
    <div style={{fontSize:28,lineHeight:1.45,marginTop:27,transform:'translateY('+(1-next)*24+'px)'}}>沿着过道<br/>向里展开</div>
   </div>
   <div style={{position:'absolute',left:42,top:502,fontSize:21,letterSpacing:2,opacity:next,color:'#29555a'}}>座椅的重复，让纵深变得可见</div>
 </AbsoluteFill>
}
