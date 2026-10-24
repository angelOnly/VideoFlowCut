import { motionHtml } from "./hyperframes.js";
import { motionSubmissionSchema } from "../../packages/motion-work/src/schema.js";

/** 人工设计的候选 fixture，只验证链路，不冒称来自真实在线动画观察。 */
export const motionFixture = motionSubmissionSchema.parse({
  creativeBrief: "候选技术验证：以真实中文重点揭示与稳定阅读检查固定版本、透明合成和局部时间，不将测试输入当作审美通过。",
  name: "候选隔离验证：重点揭示",
  source: motionHtml('<div id="title" style="position:absolute;left:30px;top:130px;color:#fff4da;font-size:38px">重点</div><div id="line" style="position:absolute;left:45px;top:205px;height:5px;background:#e8b654"></div>', `
+document.querySelector('#title').textContent=props.text;
+tl.fromTo('#title',{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:Math.min(8,config.durationInFrames)/config.fps},0);
+tl.fromTo('#line',{width:0},{width:230,duration:Math.min(8,config.durationInFrames)/config.fps},0);`.replace(/^\+/gm,'')),
  props: { text: "让重点更清楚" }, width: 320, height: 320, fps: 30, durationInFrames: 18,
  reference: { url: "https://jitter.video/templates/text/", observation: { layout: "这是隔离测试的排版说明，不是已观看外站的证据。", motion: "文字通过遮罩逐步揭示，线条随后建立强调。", rhythm: "测试片段包含进入和稳定，不作为正式审美验收。", adaptation: "候选测试使用中文短句，保护上下留白。", evidence: "固定测试 fixture，不能冒称已经与外站逐帧对照。" } },
});
