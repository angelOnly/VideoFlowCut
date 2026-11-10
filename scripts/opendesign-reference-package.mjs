import {readFile, unlink, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {clearPrepared, prepareReferencePackage, verifyReferenceDelivery} from '../packages/edit-application/src/opendesign-reference-package.mjs';

export {prepareReferencePackage, verifyReferenceDelivery};
const readJson = async path => JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));

async function runCli() {
  try {
    const [mode,...args] = process.argv.slice(2);
    if (mode === 'prepare' && args.length === 2) {
      const [inputFile,output]=args;
      // 输入文件无法读取或解析时，也不能保留上一轮的制作请求。
      await clearPrepared(resolve(output));
      const result=await prepareReferencePackage(await readJson(inputFile),output);
      console.log(JSON.stringify({output:resolve(output),files:result.files.length,diagnostics:result.diagnostics,scenes:result.scenes?.map(({sceneId,status,diagnostics})=>({sceneId,status,diagnostics}))},null,2));
      if (result.diagnostics.some(item=>item.requiredForRun!==false) || (result.scenes && !result.scenes.some(scene=>scene.status==='ready'))) process.exitCode=1;
    } else if (mode === 'verify' && args.length === 3) {
      const [manifestFile,listingFile,checkFile]=args;
      // 核验失败或输入已变化时，不能留下上一次的可发送请求。
      for (const name of ['start-run-prompt.md','verified-manifest.json']) {
        await unlink(join(dirname(manifestFile),name)).catch(error=>{if(error.code!=='ENOENT')throw error;});
      }
      const manifest=await readJson(manifestFile);
      const listing=await readJson(listingFile);
      const check=await readJson(checkFile);
      const result=await verifyReferenceDelivery(manifest,listing,check.revision,check.odProjectId);
      await writeFile(join(dirname(manifestFile),'verified-manifest.json'),JSON.stringify(result.manifest,null,2)+'\n','utf8');
      if (result.prompt) await writeFile(join(dirname(manifestFile),'start-run-prompt.md'),result.prompt+'\n','utf8');
      console.log(JSON.stringify({verificationErrors:result.manifest.verificationErrors,diagnostics:result.manifest.diagnostics},null,2));
      if (!result.prompt) process.exitCode=1;
    } else throw new Error('用法：node scripts/opendesign-reference-package.mjs prepare 输入.json 输出目录；或 verify 交付清单.json OD文件清单.json 核验输入.json');
  } catch (error) { console.error(error.message); process.exitCode=1; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void runCli();
