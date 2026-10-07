import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
const C={paper:'#F2F0EA',ink:'#17242C',teal:'#187E86',white:'#FBFCF8',gray:'#9BAAA6'};
const FONT='Microsoft YaHei, Arial, sans-serif';
const T={paperIn:24,zoomIn:24,readable:50,usageStart:50,usageCondition:80,reveal:80,rule:137,ownTerms:151,retract:218,reminder:230,end:238};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(f:number,a:number,b:number)=>{const p=clamp((f-a)/(b-a));return p*p*(3-2*p);};
function Phone({f}:{f:number}) {
  const enlarged=ease(f,T.zoomIn,T.readable);
  const retract=ease(f,T.retract,T.end-1);
  const w=mix(mix(288,416,enlarged),288,retract);
  const cy=mix(mix(672,665,enlarged),672,retract);
  const page=ease(f,0,T.paperIn)*(1-retract);
  const reveal=ease(f,T.reveal,T.rule);
  const used=ease(f,T.usageStart,T.usageCondition);
  return <div style={{position:'absolute',left:384-w/2,top:cy-w*568/576,width:288,height:568,transform:'scale('+w/288+')',transformOrigin:'top left'}}>
    <svg width="288" height="568" viewBox="0 0 288 568">
      <defs>
        <clipPath id="s04-page-window"><rect x="24" y="118" width="240" height="402" rx="14"/></clipPath>
        <clipPath id="s04-cover-window"><rect x="0" y="50" width="240" height="352"/></clipPath>
      </defs>
      <rect x="2" y="4" width="284" height="560" rx="38" fill={C.ink}/>
      <rect x="13" y="15" width="262" height="538" rx="28" fill={C.white}/>
      <rect x="109" y="24" width="70" height="7" rx="3.5" fill={C.ink} opacity="0.75"/>
      {[10,16,22,28].map((h,i)=><rect key={i} x={195+i*15} y={64-h} width="9" height={h} rx="2" fill={C.teal}/>)}
      <rect x="33" y="44" width="38" height="6" rx="3" fill={C.gray} opacity="0.5"/>
      <rect x="30" y="145" width="228" height="180" rx="18" fill="#E5ECE6"/>
      <path d="M30 291 L89 216 L126 255 L178 202 L258 291 V307 Q258 325 240 325 H48 Q30 325 30 307Z" fill="#CBDAD3" opacity="0.9"/>
      <rect x="48" y="296" width="107.52" height="7" rx="3.5" fill={C.teal} opacity="0.75"/>
      <rect x="32" y="354" width="223" height="11" rx="5.5" fill="#C5D3CE"/>
      <rect x="32" y="382" width="162" height="10" rx="5" fill="#D8E1DC"/>
      <rect x="32" y="410" width="193" height="10" rx="5" fill="#D8E1DC"/>
      <rect x="32" y="455" width="224" height="6" rx="3" fill="#DFE7E1"/>
      <rect x="32" y="455" width="125.44" height="6" rx="3" fill={C.teal} opacity="0.7"/>
      <text x="144" y="507" textAnchor="middle" fontSize="20" fill="#82938B">界面示意</text>
      <g clipPath="url(#s04-page-window)">
        <g transform={'translate(24 '+(118+402*(1-page))+')'}>
          <rect x="0" y="0" width="240" height="402" rx="14" fill={C.paper}/>
          <text x="18" y="31" fontSize="18" fill="#7F8F84">条款示意</text>
          <path d="M18 48 H222" stroke="#C4D2C8" strokeWidth="1.5"/>
          <rect x="12" y="163" width="216" height="135" rx="14" fill="#E0EAE3"/>
          <text x="120" y="207" textAnchor="middle" fontSize="25" fontWeight="600" fill={C.ink}>达到约定条件后</text>
          <text x="120" y="249" textAnchor="middle" fontSize="25" fontWeight="600" fill={C.ink}>的速度规则</text>
          <path d="M46 277 H194" stroke={C.teal} strokeWidth="4" strokeLinecap="round"/>
          <g clipPath="url(#s04-cover-window)">
            <g transform={'translate(0 '+(-296*reveal)+')'}>
              <rect x="0" y="50" width="240" height="296" fill={C.paper}/>
              <text x="18" y="92" fontSize="25" fontWeight="600" fill={C.ink}>高速流量额度</text>
              <rect x="18" y="111" width="204" height="36" rx="8" fill="#DEE8E0"/>
              <path d="M32 129 H208" stroke="#A8BDB0" strokeWidth="3" strokeLinecap="round"/>
              <text x="18" y="197" fontSize="25" fontWeight="600" fill={C.ink}>已用情况</text>
              <rect x="18" y="216" width="204" height="36" rx="8" fill="#E8ECE4"/>
              <rect x="32" y="224" width={mix(46,162,used)} height="20" rx="5" fill={C.teal}/>
              <path d="M194 210 V263" stroke={C.ink} strokeWidth="2" strokeDasharray="3 3"/>
              <text x="194" y="284" textAnchor="middle" fontSize="18" fontWeight="600" fill={C.ink}>约定条件</text>
              <path d="M0 342 H240" stroke="#BFCFC3" strokeWidth="2"/>
              <path d="M0 346 H240" stroke="#CFDAD0" strokeWidth="5" opacity="0.5"/>
            </g>
          </g>
        </g>
      </g>
      <rect x="108" y="533" width="72" height="5" rx="2.5" fill={C.ink} opacity="0.3"/>
    </svg>
  </div>;
}
export function resolveMotionEvents(_props:Record<string,unknown>,_context:{fps:number;durationInFrames:number}) {
  return [
    {id:'plan_page_entered',meaning:'纸面从同一手机内容区进入完成，保留信号栏',startFrame:T.paperIn,endFrame:T.paperIn+1},
    {id:'allowance_and_usage_readable',meaning:'额度及已用情况随同一手机放大到可读尺度',startFrame:T.readable,endFrame:T.readable+1},
    {id:'usage_reaches_agreed_condition',meaning:'无数字已用条到达约定条件标记，同一纸片随后移开揭示速度规则',startFrame:T.usageCondition,endFrame:T.usageCondition+1},
    {id:'condition_reveal_begins',meaning:'上层额度纸片开始移开，下层速度条件逐步露出',startFrame:T.reveal,endFrame:T.reveal+1},
    {id:'speed_rule_readable',meaning:'达到约定条件后的速度规则完整露出',startFrame:T.rule,endFrame:T.rule+1},
    {id:'own_terms_readable',meaning:'以自己的套餐条款为准成为稳定主读',startFrame:T.ownTerms,endFrame:T.ownTerms+1},
    {id:'plan_check_reminder',meaning:'核对套餐作为出口提示达到可读状态',startFrame:T.reminder,endFrame:T.reminder+1},
    {id:'primary_phone_handoff',meaning:'237帧回到中心384,672和288×568；238为下一作品边界',startFrame:T.end-1,endFrame:T.end}
  ];
}
export default function Motion() {
  const f=useCurrentFrame();
  const early=ease(f,8,T.paperIn);
  const own=ease(f,T.rule,T.ownTerms);
  const out=ease(f,T.retract,T.reminder);
  const hint=ease(f,T.retract,T.reminder);
  const headline=f<T.rule?'有些套餐':f<T.retract?'以自己的套餐条款为准':'核对套餐';
  const headlineAlpha=f<T.rule?early:f<T.retract?own:hint;
  return <AbsoluteFill style={{background:C.paper,fontFamily:FONT,color:C.ink}}>
    <div style={{position:'absolute',left:48,top:121,width:672,height:84,fontSize:54,lineHeight:1.2,fontWeight:700}}>
      <div style={{opacity:headlineAlpha,transform:'translateY('+(12*(1-headlineAlpha))+'px)'}}>{headline}</div>
    </div>
    <Phone f={f}/>
  </AbsoluteFill>;
}