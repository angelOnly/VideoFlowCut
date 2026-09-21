import test from "node:test";
import assert from "node:assert/strict";
import type { ProjectSnapshot, MediaAdoption } from "@videocut/contracts";
import { mediaUsageState, mediaUsageProblem, mediaUsageFindings } from "../packages/media-intelligence/src/usage.js";

test("内部视频采用核对范围、声音、槽位和每次放置版本，历史缺摘要不猜测",()=>{
  const snapshot={assets:[{id:"source",kind:"video",sourceHash:"hash"},{id:"work",kind:"video",motion:{version:"v1",fps:30,videoSources:[{slot:"footage",assetId:"source",sourceHash:"hash",sourceStartMs:200,sourceEndMs:1000}]}}],timeline:{fps:30,items:[]},effectCues:[{id:"cue",type:"ManagedMotion",status:"ready",startFrame:0,endFrame:30,assetBindings:[{slot:"motion",assetId:"work"}]},{id:"cue2",type:"ManagedMotion",status:"ready",startFrame:30,endFrame:60,assetBindings:[{slot:"motion",assetId:"work"}]}],cutaways:[]} as unknown as ProjectSnapshot;
  const adoption={id:"adopt",status:"current",assetId:"source",sourceHash:"hash",range:{startMs:0,endMs:1000},audioPolicy:"mute"} as MediaAdoption;
  const target={effectCueId:"cue",motionVideoSlot:"footage"};const state=mediaUsageState(snapshot,target)!;
  assert.equal(state.asset.id,"source");assert.equal(mediaUsageProblem(snapshot,adoption,target),undefined);
  assert.match(mediaUsageProblem(snapshot,{...adoption,audioPolicy:"retain"},target)!,/静音/);
  assert.match(mediaUsageProblem(snapshot,{...adoption,range:{startMs:0,endMs:900}},target)!,/超出/);
  assert.match(mediaUsageProblem(snapshot,adoption,{...target,motionVideoSlot:"missing"})!,/摘要/);
  const second=mediaUsageState(snapshot,{...target,effectCueId:"cue2"})!;assert.notEqual(state.signature,second.signature);
  snapshot.mediaAdoptions=[{...adoption,uses:[{target,signature:state.signature}]}];
  snapshot.assets[1].motion!.version="v2";assert.equal(mediaUsageFindings(snapshot).length,1);
  delete snapshot.assets[1].motion!.videoSources;assert.equal(mediaUsageFindings(snapshot).length,1);
});
