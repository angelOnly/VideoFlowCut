import {frameHtml,sizeMotionFixture} from "./hyperframes.js";
import { motionSubmissionSchema } from "../../packages/motion-work/src/schema.js";

/** 根据 Onda Highlight 公开动态观察独立编写；不是复制其工程或字体资源。 */
export const observedHighlight = motionSubmissionSchema.parse({
  creativeBrief: "候选技术验证：以真实中文重点揭示与稳定阅读检查固定版本、透明合成和局部时间，不将测试输入当作审美通过。",
  name: "在线观察复现候选 · 中文重点揭示",
  source: sizeMotionFixture({source:frameHtml('<div id="stage" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="position:relative;display:inline-block"><div id="highlight" style="position:absolute;inset:-5px -8px"></div><span id="text" style="position:relative;font-size:34px;line-height:1.45;font-weight:600;color:#f2f2f4"></span></div></div>',`const clamp=x=>Math.max(0,Math.min(1,x)),reveal=1-Math.pow(1-clamp(f/18),3);document.querySelector('#stage').style.opacity=1-clamp((f-48)/11);Object.assign(document.querySelector('#highlight').style,{width:'calc('+reveal*100+'% + 16px)',background:p.accent});document.querySelector('#text').style.opacity=clamp((f-8)/10);`,`document.querySelector('#text').textContent=props.text;`),width:320,height:320,fps:30,durationInFrames:60}).source,
  props: { text: "把重点讲清楚", accent: "#D96B82" }, width: 320, height: 320, fps: 30, durationInFrames: 60,
  reference: { url: "https://remotion.onda.video/components/highlight", observation: {
    layout: "实际预览是黑色场地上居中的一条短句，粉色矩形贴合文字，不是通用圆角卡片。",
    motion: "点击 Play preview 后，粉色窄竖条从左侧伸展到短句宽度，白字随后显现并停稳。",
    rhythm: "已观察出现和停稳以及循环；采样不包含音效，不能据此推定声音节奏。",
    adaptation: "保留底色扩展与文字层级，改成六字中文；背景透明，字号适应候选画布。末尾淡出是本候选自行设计，并非声称复制原站退出。",
    evidence: "2026-09-05 在公开详情页实际点击播放并采集连续样本，观察到窄条、完整文字与停稳；仅据可见关系独立实现。"
  } },
});
