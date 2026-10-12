import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
export default function Motion(props){
 const f=useCurrentFrame(),c=(x)=>Math.max(0,Math.min(1,x)),e=(x)=>{const t=c(x);return t*t*(3-2*t)};
 const focus=e((f-52)/30), ink=e((f-18)/28), headline=e((f-75)/22), condition=e((f-112)/20);
 const font=props.fonts.title, body=props.fonts.body;
 return <AbsoluteFill style={{backgroundColor:'#dfe3e9',fontFamily:body.family,fontWeight:body.weight,color:'#222832'}}>
   <div style={{position:'absolute',left:52-36*focus,top:46+24*focus,width:856,height:442,background:'#fff',padding:44,boxSizing:'border-box',transform:'scale('+(1-0.45*focus)+') rotate('+(-3*focus)+'deg)',transformOrigin:'left center',boxShadow:'0 16px 35px #22283218'}}>
    <div style={{fontSize:22,color:'#687381'}}>AGENTS.md · 开发原则摘录</div>
    <div style={{height:1,background:'#d9dde2',marginTop:18,marginBottom:22}}/>
    <div style={{fontFamily:font.family,fontWeight:font.weight,fontSize:34,marginBottom:18}}>不要过度设计。</div>
    <div style={{fontSize:25,lineHeight:1.75}}>优先选择满足当前需求的最简单、可靠、可维护方案，<br/><span style={{position:'relative'}}>只实现明确需要的功能<span style={{position:'absolute',left:0,right:0,bottom:-3,height:6,background:'#c34343',transform:'scaleX('+ink+')',transformOrigin:'left'}}/></span>，<br/>不为假设中的未来需求增加复杂度。</div>
    <div style={{fontSize:17,lineHeight:1.5,color:'#69727c',marginTop:20}}>当“简单方案有明确代价、复杂方案更完善但明显更臃肿”时，<br/>先简要说明取舍，并在开发前询问我是否接受该代价，<br/>不要默认选择复杂方案。</div>
   </div>
   <div style={{position:'absolute',left:517,top:94,width:405,fontFamily:font.family,fontWeight:font.weight,opacity:headline,transform:'translateY('+(1-headline)*36+'px)'}}>
    <div style={{fontSize:51,lineHeight:1.25}}>先满足<br/><span style={{color:'#b52e35'}}>当前需要</span></div>
    <div style={{height:4,width:270*headline,background:'#b52e35',marginTop:20}}/>
   </div>
   <div style={{position:'absolute',left:521,top:323,fontSize:29,lineHeight:1.55,opacity:condition,transform:'translateY('+(1-condition)*20+'px)'}}>简单方案有明确代价？<br/><span style={{fontFamily:font.family,fontWeight:font.weight}}>先说明，再确认。</span></div>
 </AbsoluteFill>
}
