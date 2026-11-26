import fs from "node:fs";
import path from "node:path";

const [input, output] = process.argv.slice(2);
const { fps, frameCount, edges, assets, sceneIds = [], unitHandoffs = [] } = JSON.parse(fs.readFileSync(input, "utf8"));
if (edges.length !== 19 || edges[0] !== 0 || edges.at(-1) !== frameCount || edges.some((n, i) => !Number.isInteger(n) || (i && n <= edges[i - 1]))) {
  throw new Error("需要十八段实际旁白的连续项目帧边界");
}
const at = (paragraph, fraction = 0) => Math.round(edges[paragraph - 1] + (edges[paragraph] - edges[paragraph - 1]) * fraction);
const firstReturn = at(17,.20);
const finalHandoff = at(18,.89);
const shots = [];
const bindings = {};
const extras = [];
const add = (name, asset, sourceStart, start, end, crop = "") => {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start<0 || start>=end || end>frameCount) throw new Error(name + " 的根帧范围无效");
  const sourceEnd = sourceStart + Math.round((end - start) * 1000 / fps);
  if (sourceEnd > assets[asset].durationMs) throw new Error(name + " 超出源片");
  shots.push({ name, start, end, crop });
  bindings[name] = { assetId: assets[asset].id, sourceStartMs: sourceStart, sourceEndMs: sourceEnd, startFrame: start, endFrame: end };
};
const beat = (p, list) => list.forEach(([name, asset, source, t, crop], i) => {
  add(name, asset, source, at(p, t), at(p, list[i + 1]?.[3] ?? 1), crop);
});
// 空翻由同一机位完整演完。临近第二段尾部才把视觉重点交给落脚点。
const first = Math.min(at(3) - 1, at(1) + Math.round(fps * 6.3));
add("launch", "air", 7100, 0, first);
add("land", "air", 13400, first, at(3));
beat(3, [["rack", "hands", 110000, 0, "trim"], ["bin", "pick", 14000, .46]]);
beat(4, [["reach", "hands", 36300, 0, "trim"]]);
beat(5, [["partmove", "pick", 17900, 0], ["retarget", "hands", 82000, .35, "hand"], ["reseat", "hands", 89700, .72, "hand"]]);
beat(6, [["xyz", "hands", 117000, 0, "trim"], ["workcell", "bmw", 5200, .55]]);
beat(7, [["handoff", "digit", 12400, 0]]);
beat(8, [["repeatOne", "digit", 17800, 0], ["repeatTwo", "digit", 23000, .52]]);
beat(9, [["repeatThree", "digit", 17400, 0]]);
beat(10, [["self", "hands", 84900, 0, "hand"], ["conveyor", "digit", 23500, .46]]);
beat(11, [["shift", "hands", 124000, 0, "trim"], ["line", "fanuc", 33700, .53]]);
beat(12, [["arm", "fanuc", 8600, 0]]);
beat(13, [["station", "fanuc", 28700, 0], ["repeatArm", "fanuc", 42000, .55]]);
beat(14, [["humanSpace", "digit", 13100, 0], ["humanTool", "bmw", 500, .32], ["humanMove", "bmw", 5900, .62]]);
beat(15, [["digitEntry", "digit", 11000, 0], ["digitCarry", "digit", 17900, .38]]);
add("warehouse", "digitshort", 1100, at(16), at(16,.36));
add("digitPlace", "digit", 21800, at(16,.36), at(16,.69));
add("digitExit", "digit", 28800, at(16,.69), firstReturn);
add("altFlip", "air", 71100 + Math.round((firstReturn-at(16,.80))*1000/fps), firstReturn, at(18));
add("again", "pick", 13200, at(18), at(18,.34));
add("handle", "hands", 83900, at(18,.34), finalHandoff, "hand");
add("next", "digit", 14500 + Math.round((finalHandoff-at(18,.60))*1000/fps), finalHandoff, at(18,1));

// 小窗与主体共享根帧时钟，交接不重置源动作。
const overlay = (...args) => {
  add(...args);
  extras.push(shots.pop());
};
overlay("rackApproach", "hands", 109100, at(2,.79), at(3,.46), "trim");
overlay("parallelTray", "pick", 14800, at(5,.18), at(5,.53));
overlay("fixedToFlexible", "bmw", 3100, at(13,.80), at(14,.17));
overlay("backToGround", "air", 71100, at(16,.80), firstReturn);
overlay("nextTote", "digit", 14500, at(18,.60), finalHandoff);
const frames = [...shots,...extras].map(s => '<div id="shot-' + s.name + '" class="shot ' + s.crop + '"><img id="video-' + s.name + '" data-vfc-video-slot="' + s.name + '" alt=""></div>').join("\n");
const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>后空翻之后</title><style>' +
String.raw`
*{box-sizing:border-box}
html,body{margin:0;background:#102a2c}
#film{position:relative;isolation:isolate;width:1920px;height:1080px;overflow:hidden;background:#102a2c;color:#f4eddc;font-family:var(--vfc-font-body),sans-serif}
.shot{position:absolute;display:none;overflow:hidden;background:#102a2c}
.shot img{position:absolute;width:100%;height:100%;object-fit:cover}
.shot.trim img{width:124%;height:124%;left:-12%;top:0}
.shot.hand img{width:139%;height:139%;left:-30%;top:-5%}
.shot.paper{outline:3px solid #90f0d3}
.layer{position:absolute;display:none;pointer-events:none}
#shade{inset:0;background:linear-gradient(90deg,rgba(14,35,37,.93),rgba(14,35,37,.45) 39%,transparent 73%)}
#bracket{outline:3px solid #90f0d3;outline-offset:8px;box-shadow:0 0 0 1px #102a2c}
#route{height:4px;background:#90f0d3;transform-origin:left top}
#plain{font-weight:700;font-size:53px;line-height:1.2;border-left:5px solid #90f0d3;padding:13px 23px;background:#102a2ce8;white-space:pre}
#metric{width:470px}
#metric p{font-size:35px;line-height:1.35;margin:0 0 14px}
#number{font-family:var(--vfc-font-display),sans-serif;font-size:154px;color:#90f0d3;line-height:1.06;letter-spacing:-8px;white-space:nowrap}
#qualifier{margin-top:24px;font-size:31px;line-height:1.4}
#ticks{display:grid;grid-template-columns:repeat(10,18px);gap:9px;margin-top:28px}
#ticks i{width:18px;height:9px;background:#90f0d3;transform-origin:left}
#branch{display:none;width:564px;font-size:41px;line-height:1.35}
#branch div{border-left:4px solid #90f0d3;padding:14px 19px;margin:16px 0;background:#102a2cf2;white-space:pre}
#branch div:nth-child(2){border-color:#f5bf80}
#legal{display:none;position:absolute;bottom:126px;color:#f4eddc;background:#102a2c;font-size:26px;padding:8px 14px}
` + '</style></head><body><main id="film" data-composition-id="film" data-start="0" data-width="1920" data-height="1080" data-duration="' + frameCount / fps + '">' + frames +
String.raw`
<div class="layer" id="shade"></div><div class="layer" id="route"></div><div class="layer" id="bracket"></div><div class="layer" id="plain"></div>
<div class="layer" id="metric"><p id="topic"></p><div id="number"></div><div id="qualifier"></div><div id="ticks"></div></div>
<div class="layer" id="branch"><div id="branchA"></div><div id="branchB"></div></div>
<script>
(() => {
  const cuts = ` + JSON.stringify(shots) + ", extra = " + JSON.stringify(extras) + ", e = " + JSON.stringify(edges) + ", fps = " + fps + ";" + String.raw`
  const $ = id => document.getElementById(id);
  const items = [...cuts,...extra].map(s => ({ ...s, node: $("shot-" + s.name) }));
  const layers = [...document.querySelectorAll(".layer")];
  const ticks = Array.from({length:100}, () => document.createElement("i"));
  $("ticks").append(...ticks);
  const clock = { f:0 };
  const full = [0,0,1920,1080];
  const left = [72,172,1110,624];
  const right = [638,122,1200,675];
  const step = (a,b,x) => Math.max(0,Math.min(1,(x-a)/Math.max(1,b-a)));
  const ease = x => x*x*(3-2*x);
  const blend = (a,b,t) => a.map((v,i) => v+(b[i]-v)*t);
  const box = (node,[x,y,w,h],z,alpha=1) => {
    Object.assign(node.style,{display:"block",left:x+"px",top:y+"px",width:w+"px",height:h?h+"px":"auto",zIndex:z,opacity:alpha});
  };
  const words = (letter,x,y,alpha=1) => {
    const node = $("plain"); node.textContent = letter; box(node,[x,y,0,0],12,alpha);
    node.style.width = "max-content";
  };
  const line = (x,y,w,f) => box($("route"),[x,y,w*f,4],9);
  const axis = (x,y,w,h,alpha) => box($("bracket"),[x,y,w,h],8,alpha);
  const metric = (x,y,topic,amount,qualifier,filled,alpha=1) => {
    $("topic").textContent = topic; $("number").textContent = amount; $("qualifier").textContent = qualifier;
    box($("metric"),[x,y,490,0],10,alpha);
    $("ticks").style.display = filled === null ? "none" : "grid";
    if (filled !== null) ticks.forEach((node,i) => { node.style.opacity = i<filled ? ".95" : ".18"; });
  };
  const update = () => {
    const f = Math.min(e.at(-1)-1,Math.max(0,Math.round(clock.f)));
    const p = e.findIndex(x => x>f);
    const rel = step(e[p-1],e[p],f);
    const shot = items.find(s => s.start<=f && f<s.end);
    items.forEach(s => { s.node.style.display = "none"; });
    layers.forEach(node => { node.style.display = "none"; });
    const at = (paragraph, fraction=0) => e[paragraph-1] + (e[paragraph]-e[paragraph-1])*fraction;
    let viewport=full;
    if (p===5) viewport=blend(full,left,ease(step(.18,.37,rel)));
    if (p===7) viewport=blend(full,left,ease(step(.46,.94,rel)));
    if (p===8 || p===9 || p===10) viewport=left;
    if (p===9 && rel<.56) viewport=blend(left,[72,108,1110,624],ease(step(.06,.53,rel)));
    if (p===9 && rel>=.56) viewport=blend([72,108,1110,624],left,ease(step(.56,.92,rel)));
    if (p===11) viewport=blend(left,full,ease(step(.56,.98,rel)));
    if (p===13) viewport=blend(full,right,ease(step(.14,.31,rel))*(1-ease(step(.82,.99,rel))));
    if (p===15 || p===16) viewport=full;

    box(shot.node,viewport,1);
    shot.node.classList.toggle("paper",viewport[0]>8);
    const insets = {
      rackApproach: [[1040,688,580,326],full,at(2,.89),at(3,.26)],
      parallelTray: [[1207,497,590,331],[1237,512,485,273],at(5,.23),at(5,.50)],
      fixedToFlexible: [[91,620,487,274],full,at(13,.90),at(14,.14)],
      backToGround: [[1180,603,589,331],full,at(16,.92),at(17,.20)],
      nextTote: [[1245,591,588,331],full,at(18,.65),at(18,.89)]
    };
    for (const inset of items.slice(cuts.length)) {
      if (inset.start>f || f>=inset.end) continue;
      const [a,b,s,t] = insets[inset.name];
      const t0 = ease(step(s,t,f));
      const fade = inset.name === "parallelTray" ? 1-ease(step(at(5,.46),at(5,.53),f)) : 1;
      box(inset.node,blend(a,b,t0),4,fade*ease(step(inset.start,inset.start+8,f)));
      inset.node.classList.toggle("paper",t0<.96);
    }
    if (p===2 && rel>.65) line(1067,844,327,ease(step(.65,.95,rel)));
    if (p===3 && rel<.34) line(610,729,443,1-ease(step(.17,.34,rel)));
    if (p===4 && rel>.57) axis(935,378,425,303,ease(step(.57,.72,rel)));
    if (p===5 && rel>=.29) {
      if (rel<.48) words("看见变位",1237,335,ease(step(.29,.38,rel)));
      else if (rel<.73) words("重新找准",1237,335);
      else words("再次对位",1237,335);
      line(1237,461,412,ease(step(.33,.91,rel)));
    }
    if (p===7 && rel>.72) line(1232,547,120,ease(step(.72,.98,rel)));
    if (p===8) metric(1232,251,"假设每次成功率","99%","且各次结果互不影响",null,ease(step(0,1,rel/.16)));
    if (p===9) {
      const count = Math.min(100,Math.floor(ease(step(.04,.54,rel))*100));
      if (rel<.56) metric(1232,228,"连续操作",String(count)+" 次","求全部成功的概率",count);
      else metric(1232,228,"100 次全部成功","≈37%","0.99¹⁰⁰ ≈ 36.6% · 各次独立",null);
    }
    if (p===10) {
      const a=$("branchA"), b=$("branchB");
      a.textContent="可自动恢复  →  继续"; b.textContent="需要人工  →  下游等待";
      box($("branch"),[1223,303,610,0],12);
      a.style.opacity=ease(step(0,1,(rel-.09)/.13));
      b.style.opacity=ease(step(0,1,(rel-.42)/.20));
      line(1184,390,37,ease(step(0,1,(rel-.09)/.14)));
    }
    if (p===11 && rel<.62) {
      words(rel<.28?"持续工作":rel<.48?"处理异常":"减少人工介入",1222,350);
    }
    if (p===13 && rel>.28 && rel<.85) {
      words(rel<.51?"来料位置固定":rel<.68?"接位固定":"动作可重复",83,353);
      line(88,484,472,ease(step(.27,.79,rel)));
    }
    if (p===15 && rel>.37) {
      box($("shade"),full,5,.94*ease(step(0,1,(rel-.37)/.12)));
      metric(92,255,"Digit · 仓库搬运","10 万+","累计搬运料箱",null,ease(step(0,1,(rel-.46)/.18)));
    }
    if (p===17 && rel>.70) line(1020,848,331,ease(step(.70,.91,rel)));
    if (p===18 && rel>.81) words("下一件",116,365,ease(step(0,1,(rel-.81)/.15)));
  };
  const timeline = gsap.timeline({paused:true});
  timeline.to(clock,{f:e.at(-1),duration:e.at(-1)/fps,ease:"none",onUpdate:update},0);
  window.__timelines = {film:timeline};
  window.getVfcMotionEvents = () => [
    {id:"first-touchdown",meaning:"空翻落地",startFrame:Math.round(fps*3.55)},
    {id:"reliability-read",meaning:"连续成功概率显示",startFrame:Math.ceil(e[8]+.56*(e[9]-e[8]))}
  ];
  update();
})();
</script></main></body></html>
`;
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,"film.html"),html);
fs.writeFileSync(path.join(output,"work.json"),JSON.stringify({name:"机器人进厂的每一天",width:1920,height:1080,fps,durationInFrames:frameCount,compositing:"opaque",creativeBrief:"以机器人原始实拍为主，透过落脚、触点、对位、重复和料箱交接组织七场。动作中的字幕与旁白由项目合成。",fontBindings:{body:"noto-sans-sc-bold",display:"smiley-sans-oblique"},videoBindings:bindings},null,2));

const sceneText = [["落脚","训练场的侧视全身","保留脚与地板，在动作者起、翻、落、稳的同一轴线原速观察。下一场还在小窗时，只在落脚线后另开工位。","同一机位实拍、落脚线、开始露出的架口"],["零件与接触","蓝架开口与手中盖板","架口小窗扩展接管，料箱演示随后作为平行过程；再次接同一个盖板，看到接触、位置变化和再次靠近。","料箱、格口、机械手和盖板；‘看见变位／重新找准／再次对位’"],["连续完成的概率","Digit 料箱交接动作","原速动作持续，小幅换位露出数据区，从单次百分比到100次计数，再停在全部成功的概率。","假设每次成功率99%，各次互不影响；0.99¹⁰⁰约36.6%"],["从异常到停等","Atlas 黑盖板与物流线","夹爪回撤后实际重新对位，另一路物流线对应条件分支；先保住工作点再扩展到周围工位。","‘可自动恢复 → 继续／需要人工 → 下游等待’；场面只表达条件"],["固定路径和可移动工位","FANUC 工盘和 Figure 黄治具","黄臂围栏先落定，来料和固定接位在动作中可见；黄色治具小窗从固定工位同轴放大，再用独立的人形工作面接管。","黄臂和围栏始终可辨；‘来料位置固定／接位固定／动作可重复’"],["真实仓库","GXO 围栏内的 Digit 与蓝料箱","让搬运和转身在同一个空间持续；数字等到任务看明白再建立，在清楚的背景区停留；箱沿引出训练场回望。","‘Digit · 仓库搬运／10万+／累计搬运料箱’"],["下一件","比赛落脚、部件落点和料箱交接","仓储小画面先让观众认出训练场，再由侧视机位落脚接管；工作台、夹爪、下一件逐渐替换训练空间，最后留下交接动作。","侧景落脚、蓝架和蓝箱；‘下一件’"]];
const paragraphs = [[1,2],[3,6],[7,9],[10,11],[12,14],[15,16],[17,18]];
const all = [...shots,...extras];
const scenes = sceneText.map(([title,primary,process,relations],i) => {
  const [p0,p1] = paragraphs[i];
  const startFrame = at(p0), endFrame = at(p1,1);
  const sceneId = sceneIds[i] || "__待绑定场面_" + (i+1);
  const related = all.filter(s => s.start<endFrame && s.end>startFrame);
  const visualRoles = related.map(({name}) => {
    const b = bindings[name];
    return {role:name, referenceFunction:primary, usage:"本场真实画面 " + name, assetIds:[b.assetId], sourceRanges:[{assetId:b.assetId,startMs:b.sourceStartMs,endMs:b.sourceEndMs}]};
  });
  const handoff = unitHandoffs[i];
  const unitId = handoff?.unitId || "robot0143-scene-" + (i+1);
  const locked = [process,relations];
  return {title,sceneId,startFrame,endFrame,process,visualRoles,status:handoff?"ready":"pending",references:handoff?.references||[],resourceIds:handoff?.resourceIds||[],visualPlan:{
    primaryRoles:[visualRoles[0].role],
    units:[{id:unitId,title,startFrame,endFrame,mode:"full_reference",...(handoff?.unitFields || {})}],
    composition:{opening:primary,primarySubject:primary,supportingSubjects:visualRoles.slice(1).map(r=>r.role),textAndGraphics:relations,ending:process},
    sequence:[{unitId,purpose:title,subjects:visualRoles.map(r=>r.role),action:process,retainedElements:[relations],transition:process}],
    researchLayers:handoff?.researchLayers||[],referenceMappings:handoff?.referenceMappings||[],
    attentionPath:[primary,relations],
    odBoundaries:{locked,adjustable:["依真实旁白停顿微调曲线和画面重叠"],escalation:"更改关键源动作、数字含义或主要连续关系需回导演稿"}
  }};
});
const md = ["# 机器人进厂的每一天 · 视觉导演稿","","横屏 1920×1080。保留中文原旁白；使用官方机器人实拍组织叙事。薄荷绿放在工作触点、切换轴和唯一的数据重点。普通字幕由时间线独立呈现，底部留出可读空间。","","## 发给 OD 的完整请求","","所有视频槽按成片根时钟正常速度播放并保持静音。只有同一摄影片段可表为同一动作；不同设备之间的构图衔接只作为不同现场的比较。",...scenes.flatMap(({sceneId,title,visualPlan,visualRoles})=>["","### 场面 "+sceneId,"",title,"",...visualPlan.odBoundaries.locked,"","素材范围",...visualRoles.map(r=>"- "+r.role+" · "+r.assetIds[0]+" · "+r.sourceRanges[0].startMs+"–"+r.sourceRanges[0].endMs+" 毫秒")])].join("\n")+"\n";
fs.writeFileSync(path.join(output,"视觉导演稿.md"),md);
fs.writeFileSync(path.join(output,"画面计划.json"),JSON.stringify({scenes},null,2));
fs.writeFileSync(path.join(output,"时间计划.json"),JSON.stringify({fps,startFrame:0,endFrame:frameCount,durationInFrames:frameCount,sceneTiming:scenes.map(({sceneId,startFrame,endFrame})=>({sceneId,startFrame,endFrame})),scenes:scenes.map(({sceneId,startFrame,endFrame})=>({sceneId,startFrame,endFrame}))},null,2));
