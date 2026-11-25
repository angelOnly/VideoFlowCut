(() => {
  const origin = 2132, fps = 30, last = 2513, duration = (last - origin) / fps;
  const at = frame => (frame - origin) / fps;
  const span = (from, to) => (to - from) / fps;
  const node = id => document.getElementById(id);
  const tl = gsap.timeline({paused:true});
  const clock = {time:0};
  tl.to(clock,{time:duration,duration,ease:'none'},0);
  const run = (id, first, end, initial, final, ease='power2.out') => tl.fromTo(node(id),initial,{...final,duration:span(first,end),ease,immediateRender:false},at(first));
  const fade = (id, first, end, opacity) => tl.to(node(id),{opacity,duration:span(first,end),ease:'power2.inOut'},at(first));
  const reveal = (id, first, end, from='below', offset=12) => run(id,first,end,
    {opacity:.10,x:from==='right'?offset:0,y:from==='below'?offset:0,clipPath:from==='right'?'inset(0 0 0 89%)':'inset(86% 0 0 0)'},
    {opacity:1,x:0,y:0,clipPath:'inset(0 0 0 0)'});
  const retire = (id, first, end) => tl.to(node(id),{y:-14,opacity:0,clipPath:'inset(0 0 90% 0)',duration:span(first,end),ease:'power2.in'},at(first));

  run('desk-a',2132,2177,{scale:1,x:0,y:0},{scale:1.04,x:-30,y:-3},'sine.inOut');
  gsap.set('#desk-b',{scale:1.04,x:-30,y:-3});
  run('desk-b',2270,2327,{scale:1.04,x:-30,y:-3},{scale:1.29,x:-123,y:-47},'sine.inOut');
  for (const [id, first, land, out] of [['career',2161,2170,2238],['control',2201,2211,2243]]) {
    run(id,first,land-2,{x:-10,y:-19,scale:1.10,rotation:-7,opacity:.22},{x:0,y:3,scale:.98,rotation:-7,opacity:1},'power3.out');
    tl.to(node(id),{y:0,scale:1,duration:2/fps,ease:'sine.out'},at(land-2));
    fade(id,out,2264,0);
  }
  run('signature',2194,2206,{x:356,y:52,scale:.8,opacity:.18},{x:0,y:0,scale:1,opacity:1},'power3.out');
  tl.to('#signature',{x:150,y:68,opacity:0,duration:span(2238,2264),ease:'power2.in'},at(2238));
  reveal('work',2270,2286,'right',23);
  reveal('decision',2287,2306,'below',17);
  retire('work',2316,2325);
  retire('decision',2318,2327);

  run('editor',2327,2331,{opacity:.24,clipPath:'polygon(0% 0%, 77% 0%, 37% 100%, 0% 100%)'},
    {opacity:1,clipPath:'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'},'power3.out');
  run('hand-mask',2327,2331,{opacity:.77},{opacity:1});
  run('hand',2327,2416,{x:0,y:0,scale:1},{x:-14,y:12,scale:1.055},'sine.inOut');
  run('mask-shape',2327,2416,{x:0,y:0},{x:16,y:7},'sine.inOut');
  reveal('can-do',2332,2340);
  run('probes',2358,2363,{opacity:.72,clipPath:'polygon(0% 0%, 49% 0%, 18% 100%, 0% 100%)'},
    {opacity:1,clipPath:'polygon(0% 0%, 84% 0%, 61% 100%, 0% 100%)'},'power2.out');
  tl.to('#probes',{clipPath:'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',duration:span(2363,2367),ease:'power2.out'},at(2363));
  fade('probe-shade',2358,2364,1);
  fade('probe-shade',2389,2393,0);
  tl.to('#can-do',{scale:116/133,duration:span(2358,2367),ease:'power2.out'},at(2358));
  for (let index=0;index<41;index++) {
    const tile=document.createElement('i'), size=12+(index*7)%9;
    tile.style.cssText=`left:${144+index*38}px;top:${137+index*19+(index*37)%64}px;width:${size}px;height:${size}px;background:${['#364671','#5666a6','#203347','#4a575c'][index%4]}`;
    node('pixels').append(tile);
    const onset=2384+index%5;
    tl.to(tile,{opacity:.37+(index%4)*.13,duration:1/fps},at(onset));
    tl.to(tile,{opacity:0,duration:2/fps},at(2389+index%3));
  }
  run('rack',2389,2393,{opacity:.85,clipPath:'polygon(0% 0%, 32% 0%, 8% 100%, 0% 100%)'},
    {opacity:1,clipPath:'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'},'power2.out');
  tl.to('#rack',{scale:1.05,x:26,duration:span(2393,2410),ease:'sine.inOut'},at(2393));
  retire('can-do',2389,2393);
  reveal('who',2393,2399);
  retire('who',2413,2417);
  fade('final-plate',2417,2420,1);

  const windows = [
    [2421,11,728,154,-.45,1.23,.88],[2427,11,1102,157,.45,1.18,.83],[2433,11,1472,153,-.30,1.14,.86],
    [2441,11,730,387,.42,.97,.78],[2446,11,1100,382,-.36,.99,.79],[2451,11,1470,388,.35,1.07,.87],
    [2458,8,727,620,-.38,1.05,.88],[2462,8,1104,617,.50,.92,.86],[2466,8,1472,621,-.44,.90,.88]
  ];
  windows.forEach(([start,frames,left,top,angle,gain,sat],index)=>{
    const id=`window-${index+1}`, entry=node(id);
    Object.assign(entry.style,{left:`${left}px`,top:`${top}px`});
    entry.style.setProperty('--gain',gain);
    entry.style.setProperty('--sat',sat);
    gsap.set(entry,{rotation:angle});
    if(index===8) {
      run(id,start,2472,{y:166,opacity:.55,rotation:-1.1},{y:18,opacity:1,rotation:angle-.10},'power2.out');
      tl.to(entry,{y:0,rotation:angle,duration:2/fps,ease:'sine.out'},at(2472));
    } else {
      run(id,start,start+frames,{y:105,opacity:.55,rotation:angle+(index%2?.7:-.7)},
        {y:0,opacity:1,rotation:angle},'power2.out');
    }
  });
  reveal('question-1',2420,2425);
  reveal('question-2',2427,2434);
  reveal('question-3',2443,2452);
  reveal('question-4',2466,2472);
  window.__timelines = {...window.__timelines,main:tl};

  if (location.protocol==='file:') {
    const media = [...document.querySelectorAll('video[data-start]')];
    const sync = () => {
      const time=tl.time();
      for (const video of media) {
        const start=Number(video.dataset.start), range=Number(video.dataset.duration);
        const active=time>=start && time<start+range;
        video.style.visibility=active?'visible':'hidden';
        if(!active) {if(!video.paused) video.pause();continue;}
        const local=Math.max(0,Math.min(time-start,(video.duration||range)-1/fps));
        if(video.readyState && Math.abs(video.currentTime-local) > .09 && !video.seeking) video.currentTime=local;
        if(tl.paused()) {if(!video.paused) video.pause();}
        else if(video.paused) video.play().catch(()=>{});
      }
      requestAnimationFrame(sync);
    };
    requestAnimationFrame(sync);
  }
})();
