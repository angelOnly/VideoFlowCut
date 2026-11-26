(() => {
  const origin = 2132, fps = 30, frameCount = 381;
  const stamp = frame => (frame - origin) / fps;
  const timeline = gsap.timeline({paused:true});
  const shown = target => timeline.set(target,{visibility:'visible'},0);
  const switchAt = (frame, previous, next) => {
    if(previous) timeline.set(previous,{visibility:'hidden'},stamp(frame));
    timeline.set(next,{visibility:'visible'},stamp(frame));
  };
  const hideAt = (frame, elements) => timeline.set(elements,{visibility:'hidden'},stamp(frame));
  // 同一根时钟控制揭幕、换版和九窗；素材自身的播放速度不变。
  shown('#desk-layer');
  timeline.to('#desk',{scale:1.03,duration:62/fps,ease:'power1.out'},0);
  switchAt(2188,null,'#paper-reveal');
  timeline.set('#paper-reveal',{clipPath:'polygon(100% 0%,100% 0%,100% 100%,100% 100%)'},stamp(2188));
  timeline.to('#paper-reveal',{clipPath:'polygon(57% 0%,100% 0%,100% 100%,58% 100%)',duration:4/fps,ease:'none'},stamp(2188));
  timeline.to('#paper-reveal',{clipPath:'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',duration:3/fps,ease:'none'},stamp(2192));
  // 揭幕先取实拍白页，再沿原边界归回全幅；素材时钟不动。
  timeline.set('#paper-motion',{x:1230},stamp(2188));
  timeline.to('#paper-motion',{x:1140,duration:2/fps,ease:'none'},stamp(2188));
  timeline.to('#paper-motion',{x:820,duration:2/fps,ease:'none'},stamp(2190));
  timeline.to('#paper-motion',{x:0,duration:3/fps,ease:'power1.out'},stamp(2192));
  hideAt(2195,'#desk-layer');
  switchAt(2270,'#paper-reveal','#code-layer');
  timeline.fromTo('#code',{scale:1},{scale:1.038,duration:34/fps,ease:'power1.inOut'},stamp(2270));
  switchAt(2304,'#code-layer','#probes-layer');
  switchAt(2341,'#probes-layer','#screen-layer');
  timeline.fromTo('#screen-core',{width:540},{width:512,duration:19/fps,ease:'power2.out'},stamp(2341));
  switchAt(2376,'#screen-layer','#question-bed');

  function press(id, start, angle, frames, direction) {
    timeline.set(id,{visibility:'visible',rotation:angle,x:-direction*37,y:-18,scale:1.02,opacity:.2},stamp(start));
    timeline.to(id,{x:0,y:0,scale:.97,opacity:1,duration:frames*.55/fps,ease:'power2.out'},stamp(start));
    timeline.to(id,{scale:1,duration:frames*.45/fps,ease:'back.out(1.5)'},stamp(start)+frames*.55/fps);
  }
  press('#stamp-job',2150,-8,8,1);
  press('#stamp-control',2188,5,7,1);
  // 章只在旧键纸层内后撤，由上方同一张纸笔揭幕遮住。
  timeline.to('#stamp-job',{x:-110,y:-58,duration:3/fps,ease:'power2.out'},stamp(2192));
  timeline.to('#stamp-control',{x:-84,y:-42,duration:3/fps,ease:'power1.out'},stamp(2192));
  hideAt(2195,['#stamp-job','#stamp-control']);

  const masks={left:'inset(0% 100% 0% 0%)',right:'inset(0% 0% 0% 100%)',up:'inset(0% 0% 100% 0%)'};
  function reveal(target, frame, frames, direction, options={}) {
    timeline.set(target,{visibility:'visible',clipPath:masks[direction],x:direction==='left'?-12:direction==='right'?12:0,y:options.y??0,opacity:options.opacity??.66,scale:options.scale??1},stamp(frame));
    timeline.to(target,{clipPath:'inset(0% 0% 0% 0%)',x:0,y:0,opacity:1,scale:1,duration:frames/fps,ease:'power2.out'},stamp(frame));
  }
  reveal('#paper-first',2217,10,'right'); reveal('#paper-last',2240,11,'right',{opacity:.35});
  hideAt(2270,['#paper-first','#paper-last']);
  reveal('#more',2279,7,'left'); reveal('#work',2290,7,'right');
  hideAt(2304,['#more','#work']);
  reveal('#delegate',2311,8,'left'); reveal('#ai',2315,7,'left',{scale:1.045});
  hideAt(2341,['#delegate','#ai']);
  reveal('#authority',2358,9,'left',{y:16}); hideAt(2376,'#authority');
  reveal('#cannot',2382,8,'up',{y:14}); reveal('#question',2385,8,'up',{y:14});
  reveal('#unasked',2403,8,'up',{y:14}); reveal('#do-it',2426,8,'left',{y:7});
  reveal('#even',2460,8,'left',{opacity:.25});

  const windowStarts=[2387,2391,2395,2397,2403,2409,2414,2420,2426];
  const windowDurations=[11,11,10,10,10,10,9,9,8];
  const windowAngles=[-2.4,2.1,-1.7,2.2,-2.7,1.9,-2.1,2.4,-2.5];
  const subjects=['键盘、手和展开页','主板与散热片','蓝色机房','俯视会议','签字纸和笔','芯片与走线','斜行代码与补全条','红黑探针','蓝屏与腕手'];
  subjects.forEach((subject,index) => {
    const tile=document.createElement('figure');
    tile.className='window';
    tile.style.left=[754,1124,1494][index%3]+'px';
    tile.style.top=[201,418,635][Math.floor(index/3)]+'px';
    tile.style.zIndex=String(subjects.length-index);
    const img=new Image(); img.alt=subject; img.src='assets/window-'+(index+1)+'.jpg';
    tile.append(img); document.getElementById('windows').append(tile);
    timeline.set(tile,{visibility:'visible',opacity:.12,x:9,y:208,scale:.89,rotation:windowAngles[index]},stamp(windowStarts[index]));
    timeline.to(tile,{opacity:1,x:0,y:0,scale:1,rotation:0,duration:windowDurations[index]/fps,ease:'power3.out'},stamp(windowStarts[index]));
  });
  for(const [name,frame] of Object.entries({入口:2132,纸笔接手:2195,代码接手:2270,探针接手:2304,双机接手:2341,暗底回切:2376,末窗归位:2434,停点:2513})) timeline.addLabel(name,stamp(frame));
  windowStarts.forEach((frame,index)=>{timeline.addLabel('窗'+(index+1)+'起',stamp(frame));timeline.addLabel('窗'+(index+1)+'归位',stamp(frame+windowDurations[index]));});
  timeline.to({clock:0},{clock:1,duration:frameCount/fps,ease:'none'},0);
  window.__timelines=window.__timelines||{}; window.__timelines.main=timeline;

  // 浏览器直接打开时用原轨声音作主时钟；正式抓帧时由渲染器接管。
  if(location.protocol==='file:' || new URLSearchParams(location.search).has('play')) {
    document.body.classList.add('player');
    const controls=document.querySelector('#transport'), audio=document.querySelector('#narration');
    const button=document.querySelector('#play'), slider=document.querySelector('#scrub'), position=document.querySelector('#position');
    const clips=[...document.querySelectorAll('video.clip')];
    controls.hidden=false; audio.src='assets/narration.wav';
    const resize=()=>document.documentElement.style.setProperty('--preview-scale',Math.min(innerWidth/1920,(innerHeight-56)/1080));
    resize(); window.addEventListener('resize',resize);
    function paint(seconds, exact) {
      const frame=Math.min(380,Math.floor(seconds*fps+1e-5)), time=frame/fps;
      timeline.seek(time,false); slider.value=frame; position.value=(frame===380 && audio.ended?12.7:time).toFixed(2)+' / 12.70';
      for(const clip of clips) {
        const from=Number(clip.dataset.start), duration=Number(clip.dataset.duration), offset=time-from;
        if(offset<-.00001||offset>=duration-.00001) { if(!clip.paused) clip.pause(); continue; }
        if(clip.readyState>0 && (exact||Math.abs(clip.currentTime-offset)>.10)) clip.currentTime=Math.max(0,offset);
        if(!audio.paused && clip.paused) clip.play().catch(()=>{});
        if(audio.paused && !clip.paused) clip.pause();
      }
    }
    let animation;
    function loop(){paint(audio.currentTime,false); if(!audio.paused)animation=requestAnimationFrame(loop);}
    button.addEventListener('click',()=>{if(audio.paused){if(audio.ended)audio.currentTime=0;audio.play().catch(()=>{});}else audio.pause();});
    audio.addEventListener('play',()=>{button.textContent='暂停';cancelAnimationFrame(animation);loop();});
    audio.addEventListener('pause',()=>{button.textContent='播放';cancelAnimationFrame(animation);paint(audio.currentTime,true);});
    slider.addEventListener('input',()=>{audio.currentTime=Number(slider.value)/fps;paint(audio.currentTime,true);});
    clips.forEach(clip=>clip.addEventListener('loadedmetadata',()=>paint(audio.currentTime,true),{once:true}));
    paint(0,true);
  }
})();
