const el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};

/** 播放位置和交接区间分开保存，切换媒体只转换原片坐标。 */
export function appendReferencePlayer(parent,{id,kind,clip,video:source,offset,startMs,endMs,poster,detail}) {
  const params=new URLSearchParams(location.search);
  const linked=kind==='creative' ? params.get('card')===id : params.get('mechanism')===id;
  const first=Number(params.get('startMs')),last=Number(params.get('endMs'));
  let selection=linked && params.has('startMs') && params.has('endMs') && Number.isFinite(first) && Number.isFinite(last) && first>=0 && last>first
    ? {startMs:first,endMs:last} : {startMs,endMs};
  let full=!clip || selection.startMs<offset || selection.endMs>endMs;
  const section=el('section');section.className='mechanism-clip';
  const video=el('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.muted=true;video.poster=poster||'';
  video.setAttribute('aria-label',id+' 参考视频');
  const currentMs=()=>Math.max(0,Math.round(video.currentTime*1000)+(full?0:offset));
  const status=el('p'),notice=el('p');notice.setAttribute('role','status');
  const selectedFingerprint=linked?params.get('source_sha256'):null;
  let fingerprintRequest;
  const fingerprint=()=>fingerprintRequest??=(async()=>{
    try {
      const url=new URL('../api/library/reference-info',import.meta.url);url.search=new URLSearchParams({kind,id}).toString();
      const response=await fetch(url);if(!response.ok)return null;
      const info=await response.json();return typeof info.source_sha256==='string'?info.source_sha256:null;
    } catch {return null;}
  })();
  if(selectedFingerprint)void fingerprint().then(actual=>{if(actual&&actual!==selectedFingerprint)notice.textContent='资料库已变化，请重新读卡后再确认参考范围。';});
  const update=()=>{status.textContent=`原片选段 ${(selection.startMs/1000).toFixed(3)}–${(selection.endMs/1000).toFixed(3)} 秒（${selection.startMs}–${selection.endMs} 毫秒，左闭右开）；当前位置 ${(currentMs()/1000).toFixed(3)} 秒`;};
  const sourceButton=el('button');sourceButton.type='button';
  const setSource=(useFull,at)=>{
    full=useFull;sourceButton.textContent=full&&clip?'切回切片':'查看完整原片';sourceButton.disabled=!clip;
    video.src=full?source:clip;
    video.addEventListener('loadedmetadata',()=>{video.currentTime=Math.max(0,Math.min(video.duration||Infinity,(at-(full?0:offset))/1000));video.playbackRate=Number(speed.value);update();},{once:true});
    update();
  };
  sourceButton.addEventListener('click',()=>{
    const at=currentMs();
    if(full&&loop.checked&&(selection.startMs<offset||selection.endMs>endMs)){loop.checked=false;notice.textContent='选段超出切片，已关闭循环；可回完整原片循环整个选段。';}
    if(full && (at<offset || at>endMs)){notice.textContent='当前位置不在切片中，切回切片起点。';setSource(false,offset);}
    else setSource(!full,at);
  });
  video.addEventListener('play',()=>{for(const other of document.querySelectorAll('video'))if(other!==video)other.pause();});
  const controls=el('div');controls.className='clip-controls';
  const speedLabel=el('label','播放速度 '),speed=el('select');speed.setAttribute('aria-label',id+' 播放速度');
  for(const value of [0.25,0.5,1])speed.append(new Option(value===1?'原速':value+' 倍速',String(value)));
  speed.value='1';speed.addEventListener('change',()=>{video.playbackRate=Number(speed.value);});speedLabel.append(speed);
  const loopLabel=el('label'),loop=el('input');loop.type='checkbox';loopLabel.append(loop,' 循环选段');
  const mark=(label,isStart)=>{const button=el('button',label);button.type='button';button.addEventListener('click',()=>{
    const value=currentMs();
    if(isStart ? value>=selection.endMs : value<=selection.startMs){notice.textContent='选段终点必须晚于起点。';return;}
    selection=isStart?{...selection,startMs:value}:{...selection,endMs:value};notice.textContent='选段已更新；拖动播放位置不会修改选段。';update();
  });return button;};
  const copy=el('button','复制当前选段');copy.type='button';copy.addEventListener('click',async()=>{
    const actualFingerprint=await fingerprint();
    if(selectedFingerprint&&actualFingerprint&&selectedFingerprint!==actualFingerprint){notice.textContent='资料库已变化，请重新读卡后再复制选段。';return;}
    const source_sha256=actualFingerprint??selectedFingerprint;
    if(!source_sha256){notice.textContent='未取得资料库指纹，请通过读卡工具打开此卡后复制选段。';return;}
    const url=new URL(kind==='creative'?'creative.html':detail,location.href);
    if(kind==='creative')url.searchParams.set('card',id);
    url.searchParams.set('source_sha256',source_sha256);
    url.searchParams.set('startMs',String(selection.startMs));url.searchParams.set('endMs',String(selection.endMs));
    const value={kind,id,source_sha256,range:selection,preview_url:url.href};
    try{await navigator.clipboard.writeText(JSON.stringify(value));notice.textContent=actualFingerprint?'选段和复看链接已复制。':'选段已复制；当前页面无法核对库版本，请重新读卡确认。';}
    catch{notice.textContent=`复制失败，请手动复制链接：${url.href}`;}
  });
  video.addEventListener('timeupdate',()=>{
    if(loop.checked && currentMs()>=selection.endMs){video.currentTime=Math.max(0,(selection.startMs-(full?0:offset))/1000);}
    update();
  });
  loop.addEventListener('change',()=>{if(loop.checked&&!full&&(selection.startMs<offset||selection.endMs>endMs))setSource(true,selection.startMs);});
  video.addEventListener('ended',()=>{if(loop.checked){video.currentTime=Math.max(0,(selection.startMs-(full?0:offset))/1000);void video.play();}});
  video.addEventListener('error',()=>{notice.textContent='视频无法播放，请检查参考库文件。';});
  controls.append(speedLabel,loopLabel,sourceButton,mark('设当前位置为起点',true),mark('设当前位置为终点',false),copy);
  section.append(video,controls,status,notice);parent.append(section);setSource(full,selection.startMs);return true;
}
