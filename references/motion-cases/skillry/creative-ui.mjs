import {splitDocument,resolveLibraryLink} from './document-format.mjs';
import {appendReferencePlayer} from './reference-player.mjs';

const $=id=>document.getElementById(id);
const element=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
const formatTime=ms=>`${String(Math.floor(ms/60000)).padStart(2,'0')}:${(ms%60000/1000).toFixed(3).padStart(6,'0')}`;
const pageSize=8;

// 只创建文本和库内链接，卡片正文中的 HTML 不作为网页代码执行。
function appendInline(parent,text,documentPath){
  const pattern=/\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;let last=0;
  for(const match of text.matchAll(pattern)){
    parent.append(document.createTextNode(text.slice(last,match.index)));
    if(match[1])parent.append(element('strong',match[1]));
    else {
      const target=resolveLibraryLink(match[3],documentPath);
      if(target){const link=element('a',match[2]);link.href=target.kind==='external'?target.href:target.path+target.hash;link.target='_blank';link.rel='noopener noreferrer';parent.append(link);}
      else parent.append(document.createTextNode(match[2]));
    }
    last=match.index+match[0].length;
  }
  parent.append(document.createTextNode(text.slice(last)));
}

function renderDocument(parent,text,documentPath,mainStoryboard){
  const {body}=splitDocument(text);let paragraph=[],list=null,code=null;
  const flush=()=>{if(paragraph.length){const p=element('p');appendInline(p,paragraph.join(' '),documentPath);parent.append(p);paragraph=[];}};
  for(const line of body.split(/\r?\n/)){
    if(line.startsWith('```')){flush();list=null;if(code){parent.append(element('pre',code.join('\n')));code=null;}else code=[];continue;}
    if(code){code.push(line);continue;}
    if(!line.trim()){flush();list=null;continue;}
    const picture=line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if(picture){
      flush();list=null;const target=resolveLibraryLink(picture[2],documentPath);
      // 主分镜已在卡片中展示，正文中的补充分镜仍需保留。
      if(target?.kind==='local'&&target.path!==mainStoryboard&&/\.(jpg|jpeg|png|webp)$/i.test(target.path)){
        const figure=element('figure'),link=element('a'),image=document.createElement('img');
        link.href=target.path;link.target='_blank';link.rel='noopener';image.src=target.path;image.alt=picture[1];image.loading='lazy';
        image.addEventListener('error',()=>{image.replaceWith(element('span','补充分镜加载失败，请检查参考库文件。'));},{once:true});
        link.append(image);figure.append(link,element('figcaption',picture[1]+' · 点击查看大图'));parent.append(figure);
      }
      continue;
    }
    const heading=line.match(/^(#{1,3})\s+(.+)/);
    if(heading){flush();list=null;if(heading[1].length>1)parent.append(element('h'+heading[1].length,heading[2]));continue;}
    if(line.startsWith('- ')){flush();if(!list){list=element('ul');parent.append(list);}const li=element('li');appendInline(li,line.slice(2),documentPath);list.append(li);continue;}
    paragraph.push(line);
  }
  flush();if(code)parent.append(element('pre',code.join('\n')));
}

function addPlayer(parent,card){
  return appendReferencePlayer(parent,{id:card.id,kind:'creative',clip:card.clip===card.video?null:card.clip,video:card.video,
    offset:card.clip===card.video?0:card.start_ms,startMs:card.start_ms,endMs:card.end_ms,poster:card.storyboard});
}

async function readJson(path){const response=await fetch(path);if(!response.ok)throw new Error(path+' 读取失败');return response.json();}
try{
  const [index,catalogue]=await Promise.all([readJson('creative-index.json'),readJson('case-catalogue.json')]);
  const names=new Map(catalogue.cases.map(c=>[c.case_number,c.title]));
  const cards=[...index.cards].sort((a,b)=>a.case_number-b.case_number||a.start_ms-b.start_ms||a.id.localeCompare(b.id));
  const known=new Set(cards.map(c=>c.id)),params=new URLSearchParams(location.search);
  const selected=new Set((params.get('selected')||'').split(',').filter(id=>known.has(id)));
  let page=0;
  $('scope').textContent=`已整理 ${index.processed_cases.length} / ${index.catalogue_case_count} 个来源视频 · ${index.count} 张创意卡`;
  for(const number of index.processed_cases)$('case').append(new Option(`${String(number).padStart(3,'0')} · ${names.get(number)||'参考视频'}`,String(number)));
  $('query').value=params.get('q')||'';
  if(index.processed_cases.includes(Number(params.get('case'))))$('case').value=params.get('case');
  $('selected-only').checked=params.get('only')==='1';
  function syncUrl(){
    const url=new URL(location.href);
    for(const key of ['q','case','selected','only'])url.searchParams.delete(key);
    if($('query').value.trim())url.searchParams.set('q',$('query').value.trim());
    if($('case').value)url.searchParams.set('case',$('case').value);
    if(selected.size)url.searchParams.set('selected',[...selected].join(','));
    if($('selected-only').checked)url.searchParams.set('only','1');
    history.replaceState(null,'',url);$('selection-count').textContent=`（${selected.size}）`;
  }
  function addCard(card){
    const article=element('article');article.className='creative-card';article.classList.toggle('chosen',selected.has(card.id));
    const heading=element('div');heading.className='creative-heading';
    const number=element('span',card.id);number.className='num';
    const meta=element('p',`来源 ${String(card.case_number).padStart(3,'0')} · ${names.get(card.case_number)||'参考视频'} · 原片 ${formatTime(card.start_ms)}–${formatTime(card.end_ms)}`);meta.className='meta';
    heading.append(number,element('h2',card.title),meta);article.append(heading);addPlayer(article,card);
    const info=element('div');info.className='creative-info';
    info.append(element('p',card.summary));
    const use=element('p');use.className='use-when';use.append(element('strong','适合：'),document.createTextNode(card.use_when));info.append(use);
    const frames=element('details'),frameSummary=element('summary','展开真实源帧分镜'),preview=element('a');preview.className='creative-storyboard';preview.href=card.storyboard;preview.target='_blank';preview.rel='noopener';
    const img=document.createElement('img');img.src=card.storyboard;img.alt=card.id+' 的真实源帧分镜';img.loading='lazy';img.decoding='async';
    img.addEventListener('error',()=>{img.replaceWith(element('span','分镜加载失败，请检查参考库文件。'));},{once:true});preview.append(img,element('small','点击查看大图 · 时间标记为原片时间'));
    frames.append(frameSummary,preview);info.append(frames);
    const details=element('details'),summary=element('summary','阅读完整创意拆解'),documentBody=element('div');documentBody.className='creative-document';details.append(summary,documentBody);
    let loaded=false,loading=false;
    details.addEventListener('toggle',async()=>{
      if(!details.open||loaded||loading)return;loading=true;documentBody.textContent='正在读取正文…';
      try{const response=await fetch(card.card);if(!response.ok)throw new Error('正文读取失败');const raw=await response.text();documentBody.replaceChildren();renderDocument(documentBody,raw,card.card,card.storyboard);loaded=true;}
      catch(error){documentBody.replaceChildren();const note=element('p',error.message+'，关闭后可重新打开重试。');note.className='document-error';documentBody.append(note);}
      finally{loading=false;}
    });
    info.append(details);
    const actions=element('div');actions.className='actions';
    const source=element('a','完整原片');source.href=card.video;source.target='_blank';source.rel='noopener';
    const overview=element('a','本片创意总览');overview.href=card.card.slice(0,card.card.lastIndexOf('/')+1)+'overview.md';overview.target='_blank';overview.rel='noopener';
    const save=element('button',selected.has(card.id)?'移出候选':'保留候选');save.type='button';
    save.addEventListener('click',()=>{
      if(selected.has(card.id))selected.delete(card.id);else selected.add(card.id);
      if($('selected-only').checked){render();return;}
      article.classList.toggle('chosen',selected.has(card.id));save.textContent=selected.has(card.id)?'移出候选':'保留候选';syncUrl();
    });
    actions.append(source,overview,save);info.append(actions);article.append(info);return article;
  }
  function render(){
    const terms=$('query').value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const filtered=cards.filter(card=>{
      const haystack=[card.id,card.title,card.summary,card.use_when,names.get(card.case_number)||''].join(' ').toLocaleLowerCase();
      return (!params.get('card')||card.id===params.get('card'))&&terms.every(term=>haystack.includes(term))&&(!$('case').value||String(card.case_number)===$('case').value)&&(!$('selected-only').checked||selected.has(card.id));
    });
    const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.max(0,Math.min(page,totalPages-1));
    $('count').textContent=`找到 ${filtered.length} / ${cards.length} 张创意卡`;$('page').textContent=`第 ${page+1} / ${totalPages} 页`;
    $('previous').disabled=page===0;$('next').disabled=page>=totalPages-1;$('results').replaceChildren();
    for(const card of filtered.slice(page*pageSize,(page+1)*pageSize))$('results').append(addCard(card));
    if(!filtered.length){const empty=element('div','没有匹配的创意卡。可以更换关键词、来源视频或关闭“只看已保留的候选”。');empty.className='empty';$('results').append(empty);}
    syncUrl();
  }
  const clearDeepLink=()=>{for(const key of ['card','startMs','endMs','source_sha256'])params.delete(key);const url=new URL(location.href);for(const key of ['card','startMs','endMs','source_sha256'])url.searchParams.delete(key);history.replaceState(null,'',url);};
  for(const id of ['query','case','selected-only'])$(id).addEventListener(id==='query'?'input':'change',()=>{clearDeepLink();page=0;render();});
  $('reset').addEventListener('click',()=>{clearDeepLink();$('query').value='';$('case').value='';$('selected-only').checked=false;page=0;render();});
  $('previous').addEventListener('click',()=>{page--;render();});$('next').addEventListener('click',()=>{page++;render();});
  $('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('notice').textContent='当前浏览链接已复制，包含候选与筛选条件。';}catch{$('notice').textContent='复制失败，请从浏览器地址栏复制当前链接。';}});
  render();
}catch(error){$('count').textContent='创意卡未加载';$('error').textContent=error.message+'，请检查参考库文件并通过本地预览服务打开。';}
