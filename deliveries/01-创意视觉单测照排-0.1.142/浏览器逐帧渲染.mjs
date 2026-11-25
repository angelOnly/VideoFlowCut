import puppeteer from 'puppeteer-core';
import http from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const [source, output, executablePath]=process.argv.slice(2);
const html=(await readFile(join(source,'index.html'),'utf8')).replace(/<script data-od-motion-source-player[\s\S]*?<\/script>/,'');
const types={html:'text/html; charset=utf-8',js:'text/javascript',css:'text/css',mp4:'video/mp4',jpg:'image/jpeg',wav:'audio/wav',ttf:'font/ttf'};
const server=http.createServer(async(req,res)=>{
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/'){res.setHeader('Content-Type',types.html); return res.end(html);}
    const file=join(source,path), size=(await stat(file)).size, range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');
    const headers={'Content-Type':types[file.split('.').at(-1)]||'application/octet-stream','Accept-Ranges':'bytes'};
    if(range){
      const start=+range[1],end=range[2]?Math.min(+range[2],size-1):size-1;
      res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${size}`});
      return createReadStream(file,{start,end}).pipe(res);
    }
    res.writeHead(200,{...headers,'Content-Length':size});
    createReadStream(file).pipe(res);
  }catch(error){res.writeHead(404);res.end(String(error));}
});
await mkdir(output,{recursive:true});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
try{
 const url='http://127.0.0.1:'+server.address().port;
 await Promise.all([0,1,2].map(async worker=>{
  const page=await browser.newPage();
  await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
  page.on('pageerror',e=>console.error(e.message));
  await page.goto(url,{waitUntil:'load'});
  console.log(JSON.stringify(await page.evaluate(()=>({href:location.href,title:document.title,body:document.body?.innerHTML.slice(0,100),gsap:typeof gsap,scripts:[...document.scripts].map(s=>s.src),timeline:!!window.__timelines?.main})))); await page.waitForFunction(()=>!!window.__timelines?.main,{timeout:8000});
  await page.evaluate(async()=>{
   await document.fonts.ready;
   await Promise.all([...document.querySelectorAll('video')].map(v=>v.readyState>=2?null:new Promise((resolve,reject)=>{
    v.addEventListener('loadeddata',resolve,{once:true});v.addEventListener('error',()=>reject(new Error(v.currentSrc)),{once:true});
   })));
  });
  for(let f=worker;f<381;f+=3){
   await page.evaluate(async f=>{
    const time=(f+0.00001)/30;
    window.__timelines.main.pause().seek(time,false);
    await Promise.all([...document.querySelectorAll('video')].map(v=>{
     const start=+v.dataset.start,active=time>=start&&time<start+ +v.dataset.duration;
     v.style.visibility=active?'visible':'hidden';
     if(!active)return;
     const target=Math.min(Math.max(0,time-start),v.duration-0.016);
     if(Math.abs(target-v.currentTime)<0.0002)return;
     return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Seek timeout '+v.currentSrc)),5000);
      v.addEventListener('seeked',()=>{clearTimeout(timer);resolve();},{once:true});v.currentTime=target;
     });
    }));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   },f);
   await page.screenshot({path:join(output,'frame'+String(f).padStart(4,'0')+'.jpg'),type:'jpeg',quality:95});
   if(f%30===worker)console.log('frame',f);
  }
  await page.close();
 }));
}finally{await browser.close();server.close();}
