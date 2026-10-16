import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cameraAt,scissorsState,pieceState,resolveMotionEvents} from '../.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/managed/source.js';
const root='.agents/skills/visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token/managed/';
const d=JSON.parse(readFileSync(root+'demo-props.json','utf8')).props;
test('镜头及七连切中途与原 Canvas 函数采样一致',()=>{
 const samples=JSON.parse(readFileSync(root+'original-motion-samples.json','utf8'));
 for(const s of samples){
  const cam=cameraAt(s.t,d);for(const key of ['x','y','z'] as const)assert.ok(Math.abs(cam[key]-s.camera[key])<.02,`${s.t} camera ${key}`);
  if(s.scissors){const st=scissorsState(s.t,d);for(const key of ['x','y','angle','rot','a','swing'] as const)assert.ok(Math.abs(st[key]-s.scissors[key])<.02,`${s.t} scissors ${key}`);}
 }
});
test('翻面与接触交接：侧面前仍是纸，侧面后才是骨牌，八片错峰落地',()=>{
 const cuts=resolveMotionEvents(d,{fps:30}).filter(e=>e.id.startsWith('cut-'));
 assert.deepEqual(cuts.map(e=>e.startFrame),[69,72,74,76,78,80,82]);
 for(let j=0;j<8;j++){
  const start=d.FALL+.02+j*.05;
  assert.ok(pieceState(start+.20,j,d).flip>0);assert.ok(pieceState(start+.22,j,d).flip<0);
  const landed=pieceState(start+.42,j,d);assert.ok(Math.abs(landed.p-1)<1e-9);assert.ok(Math.abs(landed.y+109-650)<1e-9);
  if(j>0)assert.ok(Math.abs(landed.land-pieceState(start,j-1,d).land-.05)<1e-9);
 }
});
