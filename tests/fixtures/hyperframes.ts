/** 仅用于隔离技术验证；实际创作正文不由模板函数产生。 */
export function motionHtml(body = '<div id="subject"></div>', script = '', config: {width?:number;height?:number;fps?:number;durationInFrames?:number} = {}) {
  const { width = 320, height = 320, fps = 30, durationInFrames = 18 } = config;
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><main data-composition-id="main" data-start="0" data-duration="${durationInFrames / fps}" data-width="${width}" data-height="${height}" style="position:relative;width:${width}px;height:${height}px">${body}</main><script>
const {props,config}=window.vfc;
const tl=gsap.timeline({paused:true});
tl.to({}, {duration:config.durationInFrames/config.fps});
${script}
window.__timelines.main=tl;
</script></body></html>`;
}

/** 调整技术夹具的画布/时长时，同步其 HTML 合成声明；不用于正式提交。 */
export function sizeMotionFixture<T extends {source:string;width:number;height:number;fps:number;durationInFrames:number}>(work:T):T {
  if(!work.source.trimStart().startsWith('<!doctype'))return work;
  const values:Record<string,number>={'data-width':work.width,'data-height':work.height,'data-duration':work.durationInFrames/work.fps};
  let source=work.source;
  for(const [attr,value] of Object.entries(values))source=source.replace(new RegExp(attr+'="[^\"]*"'),attr+'="'+value+'"');
  source=source.replace(/style="position:relative;width:\d+px;height:\d+px"/,`style="position:relative;width:${work.width}px;height:${work.height}px"`);
  return {...work,source};
}

export function frameHtml(body:string, update:string, setup='') {
  return motionHtml(body, `${setup}
const state={frame:0};function render(){const f=Math.round(state.frame),p=props;${update}}
render();tl.to(state,{frame:config.durationInFrames,duration:config.durationInFrames/config.fps,ease:'none',onUpdate:render},0);`);
}
