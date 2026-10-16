import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {checkReferencePublication} from '../plugins/videoflowcut/scripts/check-reference-publication.mjs';
import {syncTree} from '../plugins/videoflowcut/scripts/sync-tree.mjs';

test('完整参考禁止音频、压缩包和带声音视频，无声版本可同步并清除旧声音',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'vfc-reference-'));
 const source=join(dir,'source'),target=join(dir,'target'),rel='visual-treatment-planning/references/object-drawing/full-scenes/surreal-collage-token';
 const root=join(source,rel);await mkdir(join(root,'nested'),{recursive:true});
 try {
  for(const file of ['nested/口播.wav','upstream-source.zip']){
   await writeFile(join(root,file),'受限音频');await assert.rejects(checkReferencePublication(source),/禁止公开/);await rm(join(root,file));
  }
  const mp4=join(root,'preview.mp4');
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=s=16x16:r=30','-f','lavfi','-i','sine=frequency=440','-t','0.1','-c:v','libx264','-c:a','aac',mp4]);
  await assert.rejects(checkReferencePublication(source),/含音轨/);
  await syncTree(source,target);
  execFileSync('ffmpeg',['-v','error','-i',mp4,'-map','0:v:0','-c','copy','-an',join(root,'silent.mp4')]);
  await rm(mp4);await checkReferencePublication(source);await syncTree(source,target);await checkReferencePublication(target);
  await assert.rejects(import('node:fs/promises').then(fs=>fs.stat(join(target,rel,'preview.mp4'))),/ENOENT/);
 } finally {await rm(dir,{recursive:true,force:true});}
});

