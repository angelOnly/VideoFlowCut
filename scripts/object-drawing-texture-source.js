// Copyright (c) 2026 Dashi AI Lab. MIT，完整许可见 object-drawing/LICENSE。
// 固定来源 aa620f3；只摘取静态 PAPER、HEADTEX 及必要辅助，新增同源前侧裁切。
const W=1920,H=1080,TAU=Math.PI*2;
const lerp=(a,b,p)=>a+(b-a)*p;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
const PAPER = (() => {
  const c = mk(W, H), x = c.getContext('2d'), id = x.createImageData(W, H), d = id.data, r = mulberry32(5);
  const grid = (S) => { const gx = Math.ceil(W / S) + 2, gy = Math.ceil(H / S) + 2, a = new Float32Array(gx * gy); for (let i = 0; i < a.length; i++) a[i] = r() - 0.5; return { a, gx, S }; };
  const smp = ({ a, gx, S }, px, py) => { const fx = px / S, fy = py / S, ix = fx | 0, iy = fy | 0, ux = fx - ix, uy = fy - iy, sx = ux * ux * (3 - 2 * ux), sy = uy * uy * (3 - 2 * uy);
    const p = a[iy * gx + ix], q = a[iy * gx + ix + 1], s = a[(iy + 1) * gx + ix], u = a[(iy + 1) * gx + ix + 1]; return p + (q - p) * sx + (s - p) * sy + (p - q - s + u) * sx * sy; };
  const G1 = grid(90), G2 = grid(22);   // 不加逐像素噪点：H.264 下看不出来，还会让逐帧 PNG 截图变大变慢
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const i = (y * W + xx) * 4, vx = xx / W - 0.5, vy = y / H - 0.5;
    const m = smp(G1, xx, y) * 10 + smp(G2, xx, y) * 4 - 16 * (vx * vx * 0.7 + vy * vy * 0.5);
    d[i] = 233 + m; d[i + 1] = 229 + m; d[i + 2] = 217 + m * 0.9; d[i + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  x.lineCap = 'round';
  for (let k = 0; k < 1100; k++) { const px = r() * W, py = r() * H, a = r() * TAU, L = 4 + r() * 16;
    x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(120,105,80,0.07)'; x.lineWidth = 0.6 + r();
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * L / 2 + (r() - 0.5) * 4, py + Math.sin(a) * L / 2 + (r() - 0.5) * 4, px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); }
  return c;
})();
const HEAD = { ox: 400, oy: 360, rx: 260, ry: 78, rxo: 276, ryo: 88 };
function headPath(c) {
  const { ox, oy, rxo, ryo } = HEAD;
  c.beginPath(); c.moveTo(ox - rxo, oy);
  c.ellipse(ox, oy, rxo, ryo, 0, Math.PI, 2 * Math.PI);            // 切口外沿（上半圈）
  c.bezierCurveTo(688, 392, 698, 440, 696, 478);                   // 额头
  c.bezierCurveTo(700, 492, 708, 500, 706, 512);                   // 眉骨
  c.bezierCurveTo(703, 526, 698, 538, 700, 548);                   // 眼窝
  c.bezierCurveTo(712, 575, 738, 606, 744, 628);                   // 鼻梁 → 鼻尖
  c.bezierCurveTo(748, 640, 728, 652, 714, 652);                   // 鼻底
  c.bezierCurveTo(708, 656, 708, 664, 710, 672);                   // 人中
  c.bezierCurveTo(714, 676, 722, 682, 720, 688);                   // 上唇
  c.bezierCurveTo(716, 694, 706, 697, 702, 700);                   // 嘴
  c.bezierCurveTo(710, 704, 716, 710, 714, 718);                   // 下唇
  c.bezierCurveTo(710, 728, 700, 732, 700, 740);
  c.bezierCurveTo(704, 748, 716, 760, 712, 772);                   // 下巴
  c.bezierCurveTo(704, 790, 678, 800, 650, 800);
  c.bezierCurveTo(622, 800, 600, 804, 590, 812);                   // 下颌 → 喉
  c.bezierCurveTo(578, 840, 570, 880, 568, 900);                   // 脖子前面
  c.lineTo(300, 900);                                              // 平切的底
  c.bezierCurveTo(296, 860, 286, 812, 282, 780);                   // 脖子后面
  c.bezierCurveTo(230, 740, 182, 700, 160, 640);                   // 后颈
  c.bezierCurveTo(128, 560, 112, 430, ox - rxo, oy);               // 后脑
  c.closePath();
}
const HB = { x0: 96, y0: 266, x1: 762, y1: 904, s: 2.4 };   // 头像贴图的范围（世界坐标）和放大倍数（镜头会推到 2.4 倍）
const HEADTEX = (() => {
  const c = mk((HB.x1 - HB.x0) * HB.s, (HB.y1 - HB.y0) * HB.s), x = c.getContext('2d'), r = mulberry32(31);
  x.setTransform(HB.s, 0, 0, HB.s, -HB.x0 * HB.s, -HB.y0 * HB.s);
  headPath(x); x.save(); x.clip();
  const gr = x.createRadialGradient(650, 600, 10, 600, 610, 540);
  gr.addColorStop(0, '#5f6158'); gr.addColorStop(0.3, '#3a3c35'); gr.addColorStop(0.7, '#1f221e'); gr.addColorStop(1, '#101311');
  x.fillStyle = gr; x.fillRect(HB.x0, HB.y0, HB.x1 - HB.x0, HB.y1 - HB.y0);
  for (let k = 0; k < 140; k++) { const bx = lerp(HB.x0, HB.x1, r()), by = lerp(HB.y0, HB.y1, r()), br = 8 + r() * 60, l = r() < 0.5;
    const bg = x.createRadialGradient(bx, by, 0, bx, by, br); bg.addColorStop(0, l ? 'rgba(150,150,138,0.10)' : 'rgba(0,0,0,0.16)'); bg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = bg; x.fillRect(bx - br, by - br, br * 2, br * 2); }
  for (let k = 0; k < 5200; k++) { const px = lerp(HB.x0, HB.x1, r()), py = lerp(HB.y0, HB.y1, r());
    x.fillStyle = r() < 0.55 ? `rgba(205,203,190,${0.05 + r() * 0.16})` : `rgba(0,0,0,${0.1 + r() * 0.25})`; x.beginPath(); x.arc(px, py, 0.25 + r() * 0.8, 0, TAU); x.fill(); }
  x.lineWidth = 7; x.strokeStyle = 'rgba(200,198,184,0.16)'; headPath(x); x.stroke();          // 脸侧受光的浅边
  x.lineWidth = 2.2; x.strokeStyle = 'rgba(225,222,208,0.22)'; headPath(x); x.stroke();
  const sg = x.createLinearGradient(0, 760, 0, 900); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(0.3, 'rgba(0,0,0,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0.15)');
  x.fillStyle = sg; x.fillRect(HB.x0, 760, HB.x1 - HB.x0, 140);                                 // 下巴下面背光
  const bg2 = x.createLinearGradient(110, 0, 430, 0); bg2.addColorStop(0, 'rgba(0,0,0,0.38)'); bg2.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = bg2; x.fillRect(HB.x0, HB.y0, 340, HB.y1 - HB.y0);                              // 后脑更暗
  x.restore();
  const { ox, oy, rx, ry, rxo, ryo } = HEAD;                                                    // 切口一圈石头边
  x.beginPath(); x.ellipse(ox, oy, rxo, ryo, 0, 0, TAU); x.moveTo(ox + rx, oy); x.ellipse(ox, oy, rx, ry, 0, 0, TAU, true);
  const rg = x.createLinearGradient(0, oy - ryo, 0, oy + ryo); rg.addColorStop(0, '#77796f'); rg.addColorStop(0.45, '#a3a397'); rg.addColorStop(1, '#d6d1c2');
  x.fillStyle = rg; x.fill();
  x.save(); x.clip();
  for (let k = 0; k < 1200; k++) { const a = r() * TAU, rr = lerp(0.94, 1.03, r()); x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(40,40,36,0.22)'; x.beginPath(); x.arc(ox + Math.cos(a) * rxo * rr, oy + Math.sin(a) * ryo * rr, 0.3 + r() * 0.7, 0, TAU); x.fill(); }
  x.restore();
  x.lineWidth = 1.4; x.strokeStyle = 'rgba(20,22,20,0.6)'; x.beginPath(); x.ellipse(ox, oy, rx, ry, 0, 0, TAU); x.stroke();
  x.lineWidth = 1.2; x.strokeStyle = 'rgba(240,236,224,0.55)'; x.beginPath(); x.ellipse(ox, oy, rxo - 0.6, ryo - 0.6, 0, Math.PI, TAU); x.stroke();
  return c;
})();

const gap=16, sw=HEADTEX.width, sh=HEADTEX.height;
const atlas=mk(sw*2+gap,sh), ax=atlas.getContext('2d');
ax.drawImage(HEADTEX,0,0);
ax.save();ax.translate(sw+gap,0);
ax.setTransform(HB.s,0,0,HB.s,sw+gap-HB.x0*HB.s,-HB.y0*HB.s);
ax.beginPath();ax.moveTo(124,360);ax.ellipse(400,360,276,88,0,Math.PI,0,true);ax.lineTo(800,920);ax.lineTo(100,920);ax.closePath();ax.clip();
ax.drawImage(HEADTEX,HB.x0,HB.y0,sw/HB.s,sh/HB.s);ax.restore();
({paper:PAPER.toDataURL(),stone:atlas.toDataURL(),width:atlas.width,height:atlas.height,regions:{full:{x:0,y:0,width:sw,height:sh},front:{x:sw+gap,y:0,width:sw,height:sh}},local:{x:HB.x0,y:HB.y0,width:sw/HB.s,height:sh/HB.s,scale:HB.s}})
