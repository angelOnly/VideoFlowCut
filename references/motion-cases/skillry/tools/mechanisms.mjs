/** 从机制 Markdown 生成轻量索引；默认只读分页，不做语义排序。 */
import {readFileSync,writeFileSync,readdirSync,existsSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseMechanism,resolveLibraryLink} from '../document-format.mjs';
const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function localFile(root,path){
  if(typeof path!=='string'||!path||path.includes(':')||path.includes('\\')||isAbsolute(path)||path.split('/').some(p=>p==='..'||p==='.'||!p))throw new Error('资料路径无效');
  const file=resolve(root,path),rel=relative(realpathSync(root),realpathSync(file));
  if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw new Error('资料路径越界');
  return file;
}
export function buildIndex(root=defaultRoot){
  const catalogue=JSON.parse(readFileSync(resolve(root,'case-catalogue.json'),'utf8'));
  const mechanisms=[],sources=[];
  for(const c of catalogue.cases.filter(c=>c.analysis_kind==='mechanisms-v1')){
    const dir=localFile(root,c.directory+'/mechanisms');
    const files=readdirSync(dir).filter(f=>f.endsWith('.md')).sort();
    if(!files.length)throw new Error(`${c.case_number} 没有机制文档`);
    for(const name of files){
      const document=c.directory+'/mechanisms/'+name;
      const bytes=readFileSync(localFile(root,document));
      const {metadata:m,body}=parseMechanism(bytes.toString('utf8'));
      if(m.case_number!==c.case_number||name!==m.id.split('-')[1]+'.md')throw new Error(`${document} 编号与路径不符`);
      const storyboard=document.replace(/\.md$/,'.jpg');localFile(root,storyboard);
      const imageLinks=[...body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(x=>resolveLibraryLink(x[1],document));
      if(!imageLinks.some(x=>x?.kind==='local'&&x.path===storyboard))throw new Error(`${document} 未嵌入自身分镜`);
      sources.push([document,hash(bytes)]);
      mechanisms.push({...m,document,storyboard,case_slug:c.slug,overview:c.analysis,
        detail:`detail.html?case=${encodeURIComponent(c.slug)}&mechanism=${encodeURIComponent(m.id)}`});
    }
  }
  if(new Set(mechanisms.map(m=>m.id)).size!==mechanisms.length)throw new Error('机制编号重复');
  // 覆盖范围随目录声明计算，后续扩充案例不再维护一份手写数量。
  const converted=catalogue.cases.filter(c=>c.analysis_kind==='mechanisms-v1');
  const scope=`已整理 ${converted.length} / ${catalogue.cases.length} 个案例（${converted.map(c=>String(c.case_number).padStart(3,'0')).join('、')}）；其余 ${catalogue.cases.length-converted.length} 个尚未转换`;
  return {schema_version:1,scope,source_sha256:hash(JSON.stringify(sources)),count:mechanisms.length,mechanisms};
}
export function selectMechanisms(index,{offset=0,limit=20,ids=null}={}){
  if(ids){
    if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw new Error('机制编号无效或重复');
    const byId=new Map(index.mechanisms.map(m=>[m.id,m]));
    for(const id of ids)if(!byId.has(id))throw new Error(`未知机制：${id}`);
    return {scope:index.scope,source_sha256:index.source_sha256,total:index.count,cards:ids.map(id=>byId.get(id)),notice:'仅返回指定机制，正文及分镜按需读取。'};
  }
  if(!Number.isSafeInteger(offset)||offset<0||offset>index.count||!Number.isSafeInteger(limit)||limit<1||limit>50)throw new Error('分页范围无效');
  const cards=index.mechanisms.slice(offset,offset+limit),next=offset+cards.length;
  return {scope:index.scope,source_sha256:index.source_sha256,total:index.count,offset,next_offset:next<index.count?next:null,exhausted:next>=index.count,cards,notice:'语义理解由模型完成；本脚本不排名、不读取视频。'};
}
export function main(args){
  const path=resolve(defaultRoot,'mechanism-index.json');
  if(args.length===1&&['--build','--check'].includes(args[0])){
    const value=JSON.stringify(buildIndex(),null,2)+'\n';
    if(args[0]==='--build'){writeFileSync(path,value);process.stdout.write('机制索引已更新\n');}
    else if(!existsSync(path)||readFileSync(path,'utf8')!==value)throw new Error('机制索引过期，请重新生成');
    else process.stdout.write('机制索引与文档一致\n');
    return;
  }
  const options={},seen=new Set();
  for(let i=0;i<args.length;i+=2){
    const key=args[i],v=args[i+1];
    if(!['--offset','--limit','--ids'].includes(key)||seen.has(key)||v===undefined)throw new Error('仅支持 --build、--check，或 --offset N --limit N / --ids 002-m01');
    seen.add(key);
    if(key==='--ids')options.ids=v.split(',').map(s=>s.trim());
    else {if(!/^\d+$/.test(v))throw new Error('分页必须为非负整数');options[key.slice(2)]=Number(v);}
  }
  if(options.ids&&(seen.has('--offset')||seen.has('--limit')))throw new Error('编号定位不能混用分页');
  const index=JSON.parse(readFileSync(path,'utf8'));
  process.stdout.write(JSON.stringify(selectMechanisms(index,options),null,2)+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main(process.argv.slice(2));}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
}
