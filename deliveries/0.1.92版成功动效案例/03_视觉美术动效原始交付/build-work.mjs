import fs from 'node:fs';
import path from 'node:path';
const dir=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const timing={person:10.09,transfer:22.49,recursive:26.18,generation:29.21,night:35.89,boundary:41.58,escape:52.1,safety:57.6,standards:66.32,race:72.72,advantage:81.06,door:90.75,dilemma:100.66,opportunity:108.11,caution:112.99,ending:116.95,end:123.066667};
const work={name:'AI 的油门与刹车',creativeBrief:'保留用户27段全文，以真实作者、文章和官方复盘建立身份，再连续展开研发递归、授权越界、安全评估和双路竞争。美术用墨蓝、纸白、活动黄与越界珊瑚红；重点花字与对象交接；独立字幕不随主画面运动。原文保持真实像素，中文编辑提炼独立显示，不制造终端证据。时序依据真实123.06秒OmniVoice段级音频，段内视觉动作是编辑安排，非逐词时间认证。047-m08横向接续及退镜外提参考已核读正文分镜，整片047通过重叠范围模型分析覆盖；未冒称作者原速连续观看。',durationInFrames:3692,fps:30,width:1920,height:1080,fontBindings:{title:'aa-houdi-hei',body:'noto-sans-sc-bold',quote:'noto-serif-sc-semibold'},imageBindings:{liu:'asset_c9b98380-ed3f-48ba-8fd3-b402f1305490',portrait:'asset_8d744500-1457-40ba-b0ca-d9bd8109244c',openai:'asset_75ca0a09-4079-4a27-ab9e-81330ead38c8',openai_code:'asset_713697be-26d8-456f-940c-d3d982878157',dario:'asset_8fd9cf33-1434-4ac0-9222-ad79b6baf48e'},videoBindings:{work:{assetId:'asset_d71fbb9c-1fff-43e4-958c-d1c37a3154eb',sourceStartMs:2000,sourceEndMs:5933,startFrame:0,endFrame:118},interview:{assetId:'asset_d1e56c69-8943-4175-a600-7078fa76da30',sourceStartMs:19000,sourceEndMs:27000,startFrame:1728,endFrame:1968}},props:{timing},source:fs.readFileSync(path.join(dir,'AiBrakes.tsx'),'utf8')};
fs.writeFileSync(path.join(dir,'motion-work.json'),JSON.stringify(work,null,2));
console.log(JSON.stringify({durationInFrames:work.durationInFrames,slots:Object.keys(work.imageBindings),file:path.join(dir,'motion-work.json')}));


