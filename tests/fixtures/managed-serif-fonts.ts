import {motionHtml} from "./hyperframes.js";
import { motionSubmissionSchema } from "../../packages/motion-work/src/schema.js";

/** 字体审阅子代理提供的独立样张；只用于平台候选验证，不作为正式视频创作输入。 */
export const serifFontFixture = motionSubmissionSchema.parse({
  name: "受管宋体600与900字样核查", width: 1920, height: 1280, fps: 30, durationInFrames: 2,
  fontBindings: { semi: "noto-serif-sc-semibold", black: "noto-serif-sc-black" },
  props: { titleA: "时代不同", titleB: "平台的观众变了", hero: "不能冷场", paper: "终极PK、抽奖" },
  creativeBrief: "平台字体目录补全的独立技术与轮廓字样。左右列分别使用平台注入的Noto Serif SC实际600与900字重，以相同字号、正常字宽展示时代不同、平台的观众变了、不能冷场；禁用字体合成，无描边、阴影与非等比变形。纸条分别展示24px与26px工作字号、184×36纸面，并以3倍等比字号展示26px字样细节。检验真实加载后的中文宋体横竖反差、尖角收笔、主干重量、最长纸条标点及拉丁字母，不等于正式项目窄高排印、侧转、手机合成、镜片阅读与整片审美通过。首帧与次帧相同，加载记录与字体源哈希由候选渲染结果核对。",
  source: motionHtml('<div id="sheet" style="position:absolute;inset:0;background:#111615"></div>', `
for (const column of [{slot:'semi',label:'Noto Serif SC · 600',x:64},{slot:'black',label:'Noto Serif SC · 900',x:976}]) {
 const font=vfc.fonts[column.slot],panel=document.createElement('div');
 Object.assign(panel.style,{position:'absolute',left:column.x+'px',top:'0',width:'880px',height:'1280px',fontFamily:font.family,fontWeight:font.weight,fontStyle:font.style,fontSynthesis:'none',letterSpacing:'0',whiteSpace:'nowrap',color:'#EEEAE0',lineHeight:1.35});
 document.querySelector('#sheet').append(panel);
 function text(value,top,size,style={}){const el=document.createElement('div');el.textContent=value;Object.assign(el.style,{position:'absolute',left:'0',top:top+'px',fontSize:size+'px'},style);panel.append(el);}
 text(column.label,48,42);text('96px / 正常字宽 / 无描边',120,24);text(props.titleA,160,96);
 text('96px / 正常字宽',310,24);text(props.titleB,350,96);text('128px / 正常字宽',500,24);text(props.hero,540,128);
 text('最长纸条 / 184×36 / 24px 与 26px',735,24);
 for(const [index,size] of [24,26].entries())text(props.paper,790,size,{left:index*240+'px',width:'184px',height:'36px',borderRadius:'5px',backgroundColor:'#E8E8E1',color:'#151917',lineHeight:'36px',textAlign:'center'});
 text('26px 字样的 3 倍等比细节 / 不挤压字形',865,24);
 text(props.paper,915,78,{width:'552px',height:'108px',borderRadius:'15px',backgroundColor:'#E8E8E1',color:'#151917',lineHeight:'108px',textAlign:'center'});
 text('静态候选：字形检查，不代表正式作品验收',1100,24);
}`,{width:1920,height:1280,fps:30,durationInFrames:2})
});
