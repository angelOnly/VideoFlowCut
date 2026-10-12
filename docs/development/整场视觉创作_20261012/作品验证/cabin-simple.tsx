import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {TimelineVideo} from '@videoflowcut/motion';
export default function Motion(props){
 const f=useCurrentFrame(),p=Math.max(0,Math.min(1,(f-36)/24)),enter=1-Math.pow(1-p,3),font=props.fonts.title;
 return <AbsoluteFill style={{backgroundColor:'#103e43'}}>
   <TimelineVideo slot="cabin" fit="cover" style={{width:'100%',height:'100%'}}/>
   <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(4,27,29,0.88),transparent 40%)',opacity:enter}}/>
   <div style={{position:'absolute',left:42,bottom:32,fontFamily:font.family,fontWeight:font.weight,fontSize:43,letterSpacing:1,color:'#fff',opacity:enter,transform:'translateY('+(1-enter)*18+'px)'}}>座椅的重复，让纵深可见</div>
 </AbsoluteFill>
}
