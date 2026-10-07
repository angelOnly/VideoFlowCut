import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BoundVideo} from '@videoflowcut/motion';

type SceneKey = 's1' | 's2' | 's3' | 's4' | 's5' | 's6';
type Props = {
  scene: SceneKey;
  fontFamily: string;
  title: string;
  sourceLabel: string;
  labels: string[];
  credits: string[];
};
const C = {green: '#173B31', paper: '#F3EEE4', cream: '#FBF6EA', brick: '#A66D58'};
const T = {
  s1: {titleIn: 5, titleReady: 19, titleOut: 53, titleGone: 65},
  s3: {bookIn: 32, bookReady: 50, turn: 67, turned: 89, close: 120,
    closed: 138, quietIn: 144, quietReady: 150, quietOut: 174, quietGone: 180,
    aisleIn: 185, aisleReady: 191, aisleOut: 221, aisleGone: 228,
    release: 228, handoff: 245},
  s4: {move: 0, firstReady: 18, firstTextIn: 8, firstTextReady: 18,
    compact: 46, compactReady: 64, secondIn: 44, secondReady: 60,
    gather: 156, labelsGone: 172, gathered: 178,
    thirdIn: 178, thirdReady: 196, wipe: 215, covered: 226},
  s5: {uncovered: 12, fade: 84, paper: 101},
  s6: {ready: 6}
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const linear = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const ease = (f: number, a: number, b: number) => {
  const p = linear(f, a, b);
  return p * p * (3 - 2 * p);
};
const gate = (f: number, a: number, b: number, c: number, d: number) =>
  ease(f, a, b) * (1 - ease(f, c, d));

function Copy({text, x, y, size, opacity = 1, color = C.green, weight = 500,
  align = 'left', width = 672, dy = 0}: {
  text: string; x: number; y: number; size: number; opacity?: number;
  color?: string; weight?: number; align?: 'left' | 'center'; width?: number; dy?: number;
}) {
  return <div style={{position: 'absolute', left: x, top: y, width,
    fontSize: size, lineHeight: 1.3, fontWeight: weight, color, opacity,
    textAlign: align, whiteSpace: 'nowrap', transform: `translateY(${dy}px)`}}>{text}</div>;
}
function Source({text, y, plate = false, opacity = 1}: {
  text: string; y: number; plate?: boolean; opacity?: number;
}) {
  return <div style={{position: 'absolute', left: plate ? 36 : 48,
    top: plate ? y - 10 : y, padding: plate ? '10px 12px' : 0,
    fontSize: 23, lineHeight: '32px', fontWeight: 400,
    color: plate ? C.cream : C.green,
    backgroundColor: plate ? 'rgba(23,59,49,0.88)' : 'transparent',
    opacity, whiteSpace: 'nowrap'}}>{text}</div>;
}
function Footage({y = 0, height = 1344, fit = 'cover', opacity = 1}: {
  y?: number; height?: number; fit?: 'cover' | 'contain'; opacity?: number;
}) {
  return <div style={{position: 'absolute', left: 0, top: y, width: 768,
    height, overflow: 'hidden', opacity}}>
    <BoundVideo slot="footage" offsetInFrames={0} fit={fit}
      style={{width: '100%', height: '100%'}} />
  </div>;
}

// 闭合书体是跨场共同对象；封面、书脊、页边、书签始终共享变换。
function BookBody({w, h, cover = C.cream}: {w: number; h: number; cover?: string}) {
  return <g>
    <rect x={0} y={0} width={w} height={h} rx={4} fill={cover}
      stroke={C.green} strokeOpacity={0.32} strokeWidth={1} />
    <rect x={0} y={0} width={8} height={h} rx={2} fill={C.green} />
    <path d={`M ${w * 0.72} 0 L ${w * 0.72 + 12} 0 L ${w * 0.72 + 12} 30 L ${w * 0.72 + 6} 25 L ${w * 0.72} 30 Z`}
      fill={C.brick} />
    {[4, 7, 10].map((n) => <line key={n} x1={w - n} x2={w - n}
      y1={10} y2={h - 10} stroke={C.paper} strokeWidth={1} />)}
  </g>;
}
function ClosedBook({cx, cy, w, h, cover = C.cream, opacity = 1}: {
  cx: number; cy: number; w: number; h: number; cover?: string; opacity?: number;
}) {
  return <g transform={`translate(${cx - w / 2},${cy - h / 2})`} opacity={opacity}>
    <rect x={5} y={5} width={w} height={h} rx={4} fill={C.green} opacity={0.12} />
    <BookBody w={w} h={h} cover={cover} />
  </g>;
}
function PageFace({w, h}: {w: number; h: number}) {
  return <g>
    <path d={`M 0 9 Q ${w / 2} -3 ${w} 3 L ${w} ${h - 5} Q ${w / 2} ${h - 10} 0 ${h} Z`}
      fill={C.cream} stroke={C.green} strokeOpacity={0.34} strokeWidth={1.2} />
    {[48, 65, 82, 118, 135, 152].map((y, i) => <line key={i}
      x1={22} y1={y} x2={w - (i === 2 || i === 5 ? 44 : 20)} y2={y - 3}
      stroke={C.green} strokeOpacity={0.14} strokeWidth={1.4} />)}
  </g>;
}
function ReadingBook({f}: {f: number}) {
  const t = T.s3;
  if (f >= t.closed) {
    return <ClosedBook cx={384} cy={lerp(902, 886, ease(f, t.release, t.handoff))}
      w={182} h={232} />;
  }
  const q = ease(f, t.close, t.closed);
  const entry = ease(f, t.bookIn, t.bookReady);
  const w = 182;
  const h = lerp(228, 232, q);
  const spineX = lerp(384, 293, q);
  const cy = lerp(834, 902, q) + 32 * (1 - entry);
  const fold = Math.cos(Math.PI * q);
  const page = ease(f, t.turn, t.turned);
  const turnX = Math.cos(Math.PI * page);
  return <g transform={`translate(${spineX},${cy - h / 2})`} opacity={entry}>
    <g transform="translate(5,5)" opacity={0.12} fill={C.green}>
      <rect width={w} height={h} rx={4} />
      <g transform={`scale(${fold},1)`}><rect x={-w} width={w} height={h} rx={4} /></g>
    </g>
    <BookBody w={w} h={h} />
    <g opacity={1 - ease(q, 0.5, 1)}><PageFace w={w} h={h} /></g>
    <g transform={`scale(${fold},1)`}>
      <g transform="scale(-1,1)">
        {q < 0.5 ? <PageFace w={w} h={h} /> : <BookBody w={w} h={h} />}
      </g>
    </g>
    {f >= t.turn && f < t.turned && <g transform={`scale(${turnX},1)`}>
      <PageFace w={w} h={h} />
    </g>}
    {q < 0.5 && <line x1={0} x2={0} y1={9} y2={h}
      stroke={C.green} strokeOpacity={0.5} strokeWidth={2} />}
  </g>;
}
function GraphicPlane({children}: {children: React.ReactNode}) {
  return <svg width={768} height={1344} viewBox="0 0 768 1344"
    style={{position: 'absolute', left: 0, top: 0, overflow: 'hidden'}}>{children}</svg>;
}

// 一张832px纸页匀速经过两场；两个边界采样都完全遮盖内容。
function PaperWipe({sceneFrame}: {sceneFrame: number}) {
  const left = 768 - 64 * (sceneFrame - (T.s4.wipe - 1));
  return <div style={{position: 'absolute', left, top: 0, width: 832,
    height: 1344, backgroundColor: C.paper}} />;
}
function SceneOne({p, f}: {p: Props; f: number}) {
  const t = T.s1;
  const enter = ease(f, t.titleIn, t.titleReady);
  const leave = ease(f, t.titleOut, t.titleGone);
  return <>
    <Footage y={384} height={432} fit="contain" />
    <Copy text={p.title} x={52} y={168} size={58} color={C.cream} weight={500}
      opacity={enter * (1 - leave)} dy={16 * (1 - enter) - 8 * leave} />
    <Copy text={p.sourceLabel} x={48} y={844} size={23} color={C.cream} weight={400} />
  </>;
}
function SceneThree({p, f}: {p: Props; f: number}) {
  const t = T.s3;
  const opacity = 1 - ease(f, t.release, t.handoff);
  return <>
    <Footage y={144} height={432} fit="contain" opacity={opacity} />
    <Source text={p.sourceLabel} y={94} opacity={opacity} />
    <GraphicPlane><ReadingBook f={f} /></GraphicPlane>
    <Copy text={p.labels[0]} x={48} y={682} width={672} size={40} align="center"
      opacity={gate(f, t.quietIn, t.quietReady, t.quietOut, t.quietGone)} />
    <Copy text={p.labels[1]} x={48} y={682} width={672} size={40} align="center"
      opacity={gate(f, t.aisleIn, t.aisleReady, t.aisleOut, t.aisleGone)} />
  </>;
}
function SceneFour({p, f}: {p: Props; f: number}) {
  const t = T.s4;
  const move = ease(f, t.move, t.firstReady);
  const compact = ease(f, t.compact, t.compactReady);
  const gather = ease(f, t.gather, t.gathered);
  const second = ease(f, t.secondIn, t.secondReady);
  const third = ease(f, t.thirdIn, t.thirdReady);
  const firstX = lerp(lerp(384, 220, move), 202, gather);
  const firstY = lerp(lerp(lerp(886, 510, move), 312, compact), 650, gather);
  const firstW = lerp(lerp(lerp(182, 210, move), 140, compact), 154, gather);
  const firstH = lerp(lerp(lerp(232, 270, move), 180, compact), 198, gather);
  const labelOut = 1 - ease(f, t.gather, t.labelsGone);
  const labelOne = ease(f, t.firstTextIn, t.firstTextReady) * labelOut;
  const labelTwo = ease(f, t.secondReady - 6, t.secondReady) * labelOut;
  return <>
    <Copy text={p.labels[0]} x={48} y={94} size={26} weight={400} opacity={ease(f, 0, 8)} />
    <GraphicPlane>
      <path d="M307 576V551H332 M436 551H461V576 M307 724V749H332 M436 749H461V724"
        fill="none" stroke={C.green} strokeWidth={1.5} opacity={0.28 * gather * (1 - third)} />
      <ClosedBook cx={firstX} cy={firstY} w={firstW} h={firstH} />
      <ClosedBook cx={lerp(220, 566, gather)} cy={lerp(lerp(880, 710, second), 650, gather)}
        w={lerp(210, 154, gather)} h={lerp(270, 198, gather)} cover={C.brick} opacity={second} />
      <ClosedBook cx={384} cy={lerp(890, 650, third)} w={154} h={198}
        cover={C.green} opacity={third} />
    </GraphicPlane>
    <Copy text={p.labels[1]} x={386} y={lerp(457, 263, compact)} width={334}
      size={lerp(40, 30, compact)} opacity={labelOne} />
    <Copy text={p.labels[2]} x={386} y={lerp(513, 309, compact)} width={334}
      size={lerp(32, 28, compact)} weight={400} opacity={labelOne} />
    <Copy text={p.labels[3]} x={386} y={657} width={334} size={40} opacity={labelTwo} />
    <Copy text={p.labels[4]} x={386} y={713} width={334} size={32} weight={400} opacity={labelTwo} />
    {f >= t.wipe && <PaperWipe sceneFrame={f} />}
  </>;
}
function SceneFive({p, f}: {p: Props; f: number}) {
  const t = T.s5;
  const opacity = 1 - ease(f, t.fade, t.paper);
  return <>
    <Footage opacity={opacity} />
    <Source text={p.sourceLabel} y={52} plate opacity={opacity * ease(f, 6, t.uncovered)} />
    {f < t.uncovered && <PaperWipe sceneFrame={f + 227} />}
  </>;
}
function Credits({p, f}: {p: Props; f: number}) {
  const opacity = ease(f, 0, T.s6.ready);
  return <div style={{position: 'absolute', inset: 0, opacity}}>
    <GraphicPlane>
      <line x1={72} x2={696} y1={422} y2={422} stroke={C.green} strokeWidth={1} opacity={0.22} />
      <line x1={72} x2={696} y1={430} y2={430} stroke={C.green} strokeWidth={1} opacity={0.1} />
    </GraphicPlane>
    {p.credits.map((text, i) => <Copy key={i} text={text} x={72} y={480 + 68 * i}
      width={624} size={30} weight={400} />)}
  </div>;
}

// 与实际运动共用时间常量；事件只是声音及审阅锚点，不代表自动通过。
export function resolveMotionEvents(p: Props) {
  if (p.scene === 's1') return [
    {id: 'title-enter', meaning: '标题从下方16px建立', startFrame: T.s1.titleIn, endFrame: T.s1.titleReady},
    {id: 'title-release', meaning: '标题退出，把注意留给真实空间', startFrame: T.s1.titleOut, endFrame: T.s1.titleGone}
  ];
  if (p.scene === 's2') return [{id: 'shelves-observe', meaning: '持续观察真实书架', startFrame: 0, endFrame: 220}];
  if (p.scene === 's3') return [
    {id: 'book-enter', meaning: '原创摊开书建立', startFrame: T.s3.bookIn, endFrame: T.s3.bookReady},
    {id: 'page-turn', meaning: '右页绕中脊向左翻一次', startFrame: T.s3.turn, endFrame: T.s3.turned},
    {id: 'book-close', meaning: '左半书合至右半并向下收势', startFrame: T.s3.close, endFrame: T.s3.closed},
    {id: 'quiet-label', meaning: '轻声建议', startFrame: T.s3.quietIn, endFrame: T.s3.quietGone},
    {id: 'aisle-label', meaning: '留出通道建议', startFrame: T.s3.aisleIn, endFrame: T.s3.aisleGone},
    {id: 'book-handoff', meaning: '视频退去，同一书抵达下场入口', startFrame: T.s3.release, endFrame: T.s3.handoff}
  ];
  if (p.scene === 's4') return [
    {id: 'first-case', meaning: '继承书抵达阅后书情境', startFrame: T.s4.move, endFrame: T.s4.firstReady},
    {id: 'first-case-reference', meaning: '阅后情境上收保留参照', startFrame: T.s4.compact, endFrame: T.s4.compactReady},
    {id: 'second-case', meaning: '借阅书情境进入，两种情况并存', startFrame: T.s4.secondIn, endFrame: T.s4.secondReady},
    {id: 'books-gather', meaning: '标签退休，书形成可继续使用的原创排列', startFrame: T.s4.gather, endFrame: T.s4.gathered},
    {id: 'third-book', meaning: '第三书进入留出的书位', startFrame: T.s4.thirdIn, endFrame: T.s4.thirdReady},
    {id: 'paper-cover', meaning: '纸页遮幅完全覆盖场面', startFrame: T.s4.wipe, endFrame: T.s4.covered}
  ];
  if (p.scene === 's5') return [
    {id: 'paper-reveal', meaning: '同一匀速纸页退出，实景在后持续播放', startFrame: 0, endFrame: T.s5.uncovered},
    {id: 'image-to-paper', meaning: '实景柔和转纸白，字幕独立保留', startFrame: T.s5.fade, endFrame: T.s5.paper}
  ];
  return [{id: 'credits-ready', meaning: '署名显现并稳定阅读', startFrame: 0, endFrame: T.s6.ready}];
}
export default function Motion(p: Props) {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: p.scene === 's1' ? C.green : C.paper,
    fontFamily: p.fontFamily, overflow: 'hidden'}}>
    {p.scene === 's1' && <SceneOne p={p} f={f} />}
    {p.scene === 's2' && <><Footage /><Source text={p.sourceLabel} y={52} plate /></>}
    {p.scene === 's3' && <SceneThree p={p} f={f} />}
    {p.scene === 's4' && <SceneFour p={p} f={f} />}
    {p.scene === 's5' && <SceneFive p={p} f={f} />}
    {p.scene === 's6' && <Credits p={p} f={f} />}
  </AbsoluteFill>;
}