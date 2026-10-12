import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {TimelineVideo} from '@videoflowcut/motion';
export default function Motion(props){
 const f=useCurrentFrame(),c=x=>Math.max(0,Math.min(1,x)),ease=x=>1-Math.pow(1-c(x),3);
 const enter=ease((f-60)/25),late=ease((f-99)/42),boundary=ease((f-154)/24),limit=ease((f-204)/18),font=props.fonts.title;
 return <AbsoluteFill style={{backgroundColor:'#e7efef',fontFamily:font.family,fontWeight:font.weight,color:'#143e43',width:960,height:540,transform:'scale(2)',transformOrigin:'0 0'}}>
  <div style={{position:'absolute',left:0,top:0,width:960,height:430,overflow:'hidden',opacity:1-enter}}><TimelineVideo slot="cabin" fit="cover" style={{width:'100%',height:'100%'}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,#123236dd,transparent 60%)'}}/><div style={{position:'absolute',left:46,top:36,fontSize:35,color:'white'}}>这一班的座位</div></div>
  <div style={{position:'absolute',inset:0,opacity:enter*(1-boundary)}}>
   <div style={{position:'absolute',left:70,top:50,fontSize:24}}>可重新出售的时间</div>
   <div style={{position:'absolute',left:70,top:150,width:760,height:4,background:'#adc5c7'}}/>
   <div style={{position:'absolute',left:70+440*late,top:140,width:760-440*late,height:24,background:'#bb8947',borderRadius:6}}/>
   <div style={{position:'absolute',left:70+440*late,top:105,fontSize:23}}>取消</div>
   <div style={{position:'absolute',left:814,top:111,width:3,height:98,background:'#143e43'}}/>
   <div style={{position:'absolute',left:790,top:230,fontSize:23}}>起飞</div>
   <div style={{position:'absolute',left:70,top:300,fontSize:45,opacity:late}}>越晚取消，窗口越短</div>
  </div>
  <div style={{position:'absolute',left:72,top:70,width:816,opacity:boundary}}>
   <div style={{fontSize:25,color:'#56767a'}}>解释的边界</div>
   <div style={{fontSize:52,marginTop:26}}>只能解释一部分</div>
   <div style={{fontSize:44,marginTop:46,opacity:limit,color:'#9b5e33'}}>费用不一定等于航司损失</div>
  </div>
 </AbsoluteFill>
}
