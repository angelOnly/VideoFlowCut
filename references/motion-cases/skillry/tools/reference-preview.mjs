/** 链接保存原片半开区间，地址由当前 Runtime 提供，不写入项目记录。 */
export function referencePreview({origin,kind,id,source_sha256,range,detail}) {
  if (range && (!Number.isFinite(range.startMs) || !Number.isFinite(range.endMs) || range.startMs < 0 || range.endMs <= range.startMs)) throw new Error(`${id} 原片范围无效`);
  if (!origin) return undefined;
  const url=new URL(kind==='creative' ? 'creative.html' : detail, `${origin.replace(/\/$/,'')}/library/`);
  if (kind==='creative') url.searchParams.set('card',id);
  if (source_sha256) url.searchParams.set('source_sha256',source_sha256);
  if (range) {url.searchParams.set('startMs',String(range.startMs));url.searchParams.set('endMs',String(range.endMs));}
  return url.href;
}
