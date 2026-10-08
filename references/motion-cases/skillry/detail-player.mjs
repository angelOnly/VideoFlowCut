const video=document.querySelector('video');
let end=null;
video.addEventListener('timeupdate',()=>{if(end!==null && video.currentTime>=end){video.pause();end=null;}});
for(const button of document.querySelectorAll('[data-start]')) button.addEventListener('click',async()=>{
  video.currentTime=Number(button.dataset.start);end=Number(button.dataset.end);
  try{await video.play();video.scrollIntoView({behavior:'smooth',block:'center'});}catch{button.textContent='播放未成功，请使用视频控件或原作页';}
});
const hash=new URLSearchParams(location.hash.slice(1)),start=Number(hash.get('t'));
if(hash.has('t') && Number.isFinite(start) && start>=0)video.currentTime=start;
