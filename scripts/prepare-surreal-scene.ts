/** 从未修改的原页面提取静态材料和几何数据；不截动画序列、不生成新渲染器。 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const root=resolve('.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token');
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 const page=await browser.newPage();await page.goto(pathToFileURL(join(root,'scene/index.html')).href);
 await page.waitForFunction('window.ready === true');
 const data:any=await page.evaluate(`(() => {
  const assets={paper:PAPER,head:HEADTEX,grain:GRAIN,light:LIGHT,sun:SUN.c,teal:TEAL.c,graph:GRAPH.c};
  BRUSH.forEach((a,i)=>assets['brush'+i]=a);SWEEP.forEach((a,i)=>assets['sweep'+i]=a.c);
  // 仅入场背景卡片与固定页眉离线烘焙；纸条、剪刀、骨牌、石阶和镜头均另行使用 SVG。
  let old=g;let c=mk(W,H);g=c.getContext('2d');drawCard(8.1);assets.card=c;
  c=mk(W,H);g=c.getContext('2d');drawHeader();assets.header=c;g=old;
  const subs=TL.cues.map((c,i)=>({ ...c, ...SUBS[i],width:tw(c.text,SUBF),points:tornRect(tw(c.text,SUBF)+100,104,SUBS[i].seed,{edge:1.2,endL:7,endR:7}),segments:SUBS[i].segs.map(s=>({...s,x:tw(c.text.slice(0,s.j),SUBF)})),brushes:SUBS[i].br.map(b=>({...b,x:tw(c.text.slice(0,b.j),SUBF),width:tw(c.text.substr(b.j,b.n),SUBF)})) }));
  return {assets:Object.fromEntries(Object.entries(assets).map(([k,c])=>[k,{data:c.toDataURL(),width:c.width,height:c.height}])),props:{TOK,STW,SHALF,SHH,SPOLY,BOUND,PIECE,CAM,CUTS,FALL,FLY0,FLY1,HEADIN,SWEEP_C,TOKEN_T,TOKEN_HIT,DIVE,HB,DOMX,DOMY,OPEN_D,A:W2D(cardToWorld(BUBBLE.x,BUBBLE.y).x,cardToWorld(BUBBLE.x,BUBBLE.y).y),example:TL.example.text,subs,tokenWidth:tw('Token',fHead(170)),tokenPrefix:tw('T',fHead(170)),tokenAccent:tw('o',fHead(170)),aiTag:tornRect(150,78,51,{edge:1,endL:2,endR:2}),tag:tornRect(196,76,41,{edge:1,endL:3,endR:.5}),sun:{w:SUN.w,h:SUN.h,pad:SUN.pad},teal:{w:TEAL.w,h:TEAL.h,pad:TEAL.pad},graph:{w:GRAPH.w,h:GRAPH.h,pad:GRAPH.pad,pts:GRAPH.pts},sweep:SWEEP.map(s=>({w:s.w,h:s.h,pts:s.pts})),scraps:SCRAPS.map(({c,...s},i)=>{assets['scrap'+i]=c;return s;})}};
 })()`);
 // 纸屑是独立的小纸材料，不是场面截图。
 const scraps:any=await page.evaluate(`SCRAPS.map(s=>({data:s.c.toDataURL(),width:s.c.width,height:s.c.height}))`);
 const reference=await page.evaluate(`(() => {const saved=scissors;let captured=null;scissors=(x,y,angle,rot,a,tag,swing)=>{captured={x,y,angle,rot,a,swing};};try{return [8.1,8.6,9.2,9.64,9.9,10.1,10.4,10.433333,10.47,10.7,10.82,11.1,11.4,12.5,13.5,13.966667].map(t=>{captured=null;drawScissors(t);return {t,camera:camAt(t),scissors:captured};});}finally{scissors=saved;}})()`);
 scraps.forEach((s:any,i:number)=>data.assets['scrap'+i]=s);
 await mkdir(join(root,'managed/resources'),{recursive:true});
 await writeFile(join(root,'managed/original-motion-samples.json'),JSON.stringify(reference,null,2));
 const resources=[];
 for(const [slot,item] of Object.entries(data.assets) as any){
  const bytes=Buffer.from(item.data.split(',')[1],'base64');await writeFile(join(root,'managed/resources',slot+'.png'),bytes);
  resources.push({slot,path:'resources/'+slot+'.png',width:item.width,height:item.height,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
 await writeFile(join(root,'managed/resources.json'),JSON.stringify({source:'../scene/index.html',sourceHash:createHash('sha256').update(await readFile(join(root,'scene/index.html'))).digest('hex'),resources},null,2));
 data.props.sweep=data.props.sweep.map(({w,h}:any)=>({w,h}));
 data.props.subs=data.props.subs.filter((s:any)=>s.hide>8.1&&s.show<14);
 // 几何坐标保留百分之一像素，避免把浮点尾数和段外字幕塞进受管 Props。
 const compact=JSON.parse(JSON.stringify(data.props,(_k,v)=>typeof v==='number'?Math.round(v*100)/100:v));
 await writeFile(join(root,'managed/demo-props.json'),JSON.stringify({name:'原作纸条切分与骨牌成形完整段落',width:1920,height:1080,fps:30,fontBindings:{display:'noto-serif-sc-black'},durationInFrames:177,props:{...compact,sourceStart:8.1},creativeBrief:'保留原场面纸条飞入、镜头钻入、剪刀七连切、八片翻成骨牌、逐个落地压缩、轻跳和 Token 命名，再由斜扫纸条接出。待返修，不自动推荐。'},null,2));
 console.log('静态材料、原字宽与场面参数已保存');
} finally {await browser.close();}
