const $=id=>document.getElementById(id);
const el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
let records=[];
function render(){
  const terms=$('query').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),purpose=$('purpose').value,source=$('case').value;
  const found=records.filter(m=>(!purpose||m.purpose===purpose)&&(!source||String(m.case_number)===source)&&terms.every(t=>[m.id,m.title,m.summary,m.purpose,m.relation,m.start_state,m.end_state,...m.tags].join(' ').toLocaleLowerCase().includes(t)));
  const params=new URLSearchParams();if(terms.length)params.set('q',$('query').value);if(purpose)params.set('purpose',purpose);if(source)params.set('case',source);
  history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));
  $('count').textContent=`找到 ${found.length} / ${records.length} 个运动机制`;$('results').replaceChildren();
  if(!found.length)$('results').append(el('p','已整理机制中没有文字匹配结果，可减少筛选条件，或返回全部机制比较起始与结束状态。'));
  for(const m of found){
    const card=el('article',''),heading=el('div',''),id=el('span',m.id);heading.className='mechanism-heading';id.className='num';heading.append(id,el('h2',m.title));card.append(heading);
    // 直接复用已有分镜，不生成额外缩略图；完整显示各阶段，避免裁掉运动过程。
    const preview=el('a',''),picture=document.createElement('img');preview.className='mechanism-preview';preview.href=m.detail;preview.setAttribute('aria-label','查看'+m.title+'的运动指令与分镜');
    picture.src=m.storyboard;picture.alt=m.title+'的分镜预览';picture.loading='lazy';picture.decoding='async';
    picture.addEventListener('error',()=>{picture.remove();preview.append(el('span','分镜图暂未加载，点击查看指令'));},{once:true});preview.append(picture);card.append(preview);
    const info=el('div',''),summary=el('p',m.summary);info.className='mechanism-info';summary.className='mechanism-summary';info.append(summary);
    const tags=el('div','');tags.className='tags';for(const t of m.tags.slice(0,3)){const tag=el('span',t);tag.className='tag';tags.append(tag);}info.append(tags);
    const actions=el('div','');actions.className='actions';const read=el('a','查看运动指令');read.href=m.detail;const overview=el('a',String(m.case_number).padStart(3,'0')+' 原片总览');overview.href='detail.html?case='+encodeURIComponent(m.case_slug);actions.append(read,overview);info.append(actions);card.append(info);$('results').append(card);
  }
}
try{
  const response=await fetch('mechanism-index.json');if(!response.ok)throw new Error('机制索引读取失败');const index=await response.json();records=index.mechanisms;$('scope').textContent=index.scope;
  for(const purpose of [...new Set(records.map(m=>m.purpose))])$('purpose').append(new Option(purpose,purpose));
  for(const number of [...new Set(records.map(m=>m.case_number))])$('case').append(new Option(String(number).padStart(3,'0'),String(number)));
  const params=new URLSearchParams(location.search);$('query').value=params.get('q')??'';
  for(const key of ['purpose','case'])if([...$(key).options].some(o=>o.value===params.get(key)))$(key).value=params.get(key);
  $('query').addEventListener('input',render);$('purpose').addEventListener('change',render);$('case').addEventListener('change',render);
  $('reset').addEventListener('click',()=>{for(const key of ['query','purpose','case'])$(key).value='';render();});render();
}catch(e){$('count').textContent='机制未加载';$('error').textContent=e.message+'，请检查参考库文件是否完整。';}
