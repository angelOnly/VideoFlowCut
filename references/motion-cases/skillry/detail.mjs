const $=id=>document.getElementById(id);
const element=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
// 报告只呈现文字、标题、列表和安全链接；作者输入始终作为文字显示。
function inline(parent,text){
  const pattern=/\[([^\]]+)\]\(([^)]+)\)/g;let last=0;
  for(const m of text.matchAll(pattern)){
    parent.append(document.createTextNode(text.slice(last,m.index)));
    if(/^https?:\/\//.test(m[2])){const a=element('a',m[1]);a.href=m[2];a.target='_blank';a.rel='noopener noreferrer';parent.append(a);}
    else parent.append(document.createTextNode(m[1]));
    last=m.index+m[0].length;
  }
  parent.append(document.createTextNode(text.slice(last)));
}
function render(text){
  let code=null,paragraph=[],list=null;
  function flush(){if(paragraph.length){const p=element('p','');inline(p,paragraph.join('\n'));$('report').append(p);paragraph=[];}}
  for(const line of text.split('\n')){
    if(line.startsWith('```')){flush();list=null;if(code){$('report').append(element('pre',code.join('\n')));code=null;}else code=[];continue;}
    if(code){code.push(line);continue;}
    if(!line.trim()){flush();list=null;continue;}
    const heading=line.match(/^(#{1,3})\s+(.+)/);
    if(heading){flush();list=null;if(heading[1].length>1)$('report').append(element('h'+heading[1].length,heading[2]));continue;}
    if(line.startsWith('- ')){flush();if(!list){list=element('ul','');$('report').append(list);}const li=element('li','');inline(li,line.slice(2));list.append(li);continue;}
    paragraph.push(line);
  }
  flush();if(code)$('report').append(element('pre',code.join('\n')));
}
try{
  const slug=new URLSearchParams(location.search).get('case');
  let path='README.md';
  if(slug){
    const res=await fetch('case-catalogue.json');if(!res.ok)throw new Error('索引读取失败');
    const c=(await res.json()).cases.find(c=>c.slug===slug);if(!c)throw new Error('没有这个案例');
    path=c.analysis;$('title').textContent=`${String(c.case_number).padStart(3,'0')} ${c.title}`;
    $('media-note').textContent=c.media_note;const video=$('video');video.hidden=false;video.src=c.media;
    $('download').href=c.media;$('source').href=c.source_url;$('source').target='_blank';$('source').rel='noopener';
    let end=null;video.addEventListener('timeupdate',()=>{if(end!==null&&video.currentTime>=end){video.pause();end=null;}});
    video.addEventListener('error',()=>{$('error').textContent='视频无法加载，请确认仓库已完整拉取，或打开网站原作。';});
    for(const s of c.recommended_segments){const button=element('button',`播放 ${s.start.toFixed(2)}–${s.end.toFixed(2)} 秒 · ${s.reason}`);button.className='segment';button.addEventListener('click',async()=>{video.currentTime=s.start;end=s.end;try{await video.play();}catch{$('error').textContent='播放未成功，请使用视频控件重试。';}});$('segments').append(button);}
    const t=Number(new URLSearchParams(location.hash.slice(1)).get('t'));if(t>0&&t<c.duration)video.currentTime=t;
  }else{$('title').textContent='参考库使用说明';$('download').hidden=true;$('source').hidden=true;}
  const report=await fetch(path);if(!report.ok)throw new Error('拆解文档读取失败');render(await report.text());
}catch(error){$('title').textContent='资料未加载';$('error').textContent=error.message+'。请从参考库首页重新选择。';}
