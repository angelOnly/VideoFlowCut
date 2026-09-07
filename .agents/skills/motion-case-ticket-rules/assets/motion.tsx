import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

type Props = {
  title?: string;
  ticketName?: string;
  discount?: number;
  serviceFee?: number;
  minimumSpend?: number;
  cancelHours?: number;
  accent?: string;
};

const font = "Arial, 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif";
const ink = '#20261E';
const paper = '#FFFEF7';
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const ramp = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
const fade = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** 连续票据：展开只改变纸张长度与内部排版，票头和票根始终属于同一张纸。 */
export default function TicketRules({
  title = '一张券，算清三件事',
  ticketName = '周末入场优惠凭证',
  discount = 30,
  serviceFee = 8,
  minimumSpend = 100,
  cancelHours = 24,
  accent = '#D1FA57',
}: Props) {
  const frame = useCurrentFrame();
  const entrance = ramp(frame, 0, 45);
  const unfold = ramp(frame, 67, 118);
  const finish = ramp(frame, 333, 371);
  const detach = ramp(frame, 361, 396);
  const fold = ramp(frame, 47, 81) * (1 - ramp(frame, 96, 118));
  const height = 434 + 320 * unfold;
  const stubY = height - 111;
  const ticketY = 367 - 40 * unfold - 22 * finish + (1 - entrance) * 142;
  const ticketRotation = -5 * (1 - entrance) + Math.sin(frame / 47) * 0.27 * (1 - finish);
  const earned = discount - serviceFee;
  const phases = [ramp(frame, 125, 153), ramp(frame, 197, 225), ramp(frame, 269, 296)];
  const current = frame < 197 ? 0 : frame < 269 ? 1 : 2;
  const summaryAlpha = fade(frame, 338, 360);
  const numberTick = Math.round(interpolate(frame, [338, 364], [discount, Math.abs(earned)], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}));
  const detailAlpha = 1 - fade(frame, 328, 348) * 0.46;
  const paperEdge = `M0 0 H560 V${stubY - 14} C552 ${stubY - 14} 546 ${stubY - 8} 546 ${stubY} H14 C14 ${stubY - 8} 8 ${stubY - 14} 0 ${stubY - 14} Z`;
  const stubEdge = `M14 ${stubY} H546 C546 ${stubY + 8} 552 ${stubY + 14} 560 ${stubY + 14} V${height - 9} ${Array.from({length: 28}, (_, i) => `L${550 - i * 20} ${height - (i % 2 ? 9 : 0)}`).join(' ')} L0 ${height - 9} V${stubY + 14} C8 ${stubY + 14} 14 ${stubY + 8} 14 ${stubY} Z`;
  const rows = [
    {n: '01', label: '先看费用', main: `服务费 ¥${serviceFee}`, note: '每单收取 · 从优惠里扣除', code: 'FEE'},
    {n: '02', label: '再看门槛', main: `满 ¥${minimumSpend} 可用`, note: '达到金额，优惠才生效', code: 'LIMIT'},
    {n: '03', label: '最后看退改', main: `${cancelHours} 小时前可退`, note: '超过时限，请核对退改规则', code: 'REFUND'},
  ];

  return <AbsoluteFill style={{backgroundColor: '#E6E8DF', fontFamily: font}}>
    <svg width="720" height="1280" viewBox="0 0 720 1280">
      <defs>
        <linearGradient id="ticket-backdrop" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#F3F3EC"/><stop offset="1" stopColor="#DCE1D1"/></linearGradient>
        <linearGradient id="ticket-paper" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#F5F3E8"/><stop offset="0.035" stopColor={paper}/><stop offset="0.94" stopColor={paper}/><stop offset="1" stopColor="#F0EFE5"/></linearGradient>
        <linearGradient id="ticket-fold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#EFF0E4"/><stop offset="1" stopColor="#D7DDC6"/></linearGradient>
        <filter id="ticket-shadow" x="-25%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="20" stdDeviation="17" floodColor="#283218" floodOpacity="0.15"/><feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#283218" floodOpacity="0.1"/></filter>
        <clipPath id="ticket-inner"><rect x="28" y="244" width="504" height={Math.max(0, 332 * unfold)}/></clipPath>
      </defs>
      <rect width="720" height="1280" fill="url(#ticket-backdrop)"/>
      <path d="M0 1164 L720 1003" stroke="#C4CCB4" strokeWidth="1" opacity="0.5"/>
      <path d="M-120 1182 L690 1000" stroke="#FFFFFF" strokeWidth="1" opacity="0.5"/>

      <g opacity={entrance} transform={`translate(0 ${18 * (1 - entrance)})`}>
        <rect x="54" y="64" width="10" height="10" rx="2" fill={ink}/>
        <text x="79" y="74" fill={ink} fontSize="15" letterSpacing="2.5" fontWeight="700">THE SMALL PRINT</text>
        <text x="660" y="75" textAnchor="end" fill="#6B735E" fontSize="15" fontFamily="monospace">01 / 03</text>
        <text x="52" y="158" fill={ink} fontSize={title.length > 12 ? 44 : 49} fontWeight="800" letterSpacing="-2">{title}</text>
        <text x="54" y="205" fill="#69715F" fontSize="24">把小字展开，才知道真正的优惠。</text>
        <path d={`M55 249 H${55 + 610 * fade(frame, 6, 65)}`} stroke="#B7C0A5" strokeWidth="1"/>
      </g>

      <g transform={`translate(80 ${ticketY}) rotate(${ticketRotation} 280 340)`} opacity={entrance} filter="url(#ticket-shadow)">
        <path d={paperEdge} fill="url(#ticket-paper)"/>
        {/* 印刷细节跟着票面走；无贴图也能读出纸张材质与真实比例。 */}
        {Array.from({length: 6}, (_, i) => <path key={i} d={`M${9 + i * 3} 8 V${stubY - 17}`} stroke="#EBE9DE" strokeWidth="0.6" opacity="0.65"/>)}
        <path d="M31 28 H529" stroke={ink} strokeWidth="2"/>
        <text x="34" y="63" fill={ink} fontSize="14" letterSpacing="3" fontWeight="700">ADMIT ONE / WEEKEND</text>
        <text x="527" y="62" textAnchor="end" fill="#818674" fontFamily="monospace" fontSize="12">№ 0428</text>
        <text x="33" y="108" fill={ink} fontSize="28" fontWeight="700">{ticketName}</text>
        <text x="34" y="151" fill="#727867" fontSize="18">票面优惠</text>
        <g transform={`translate(${finish * 8} 0)`}>
          <rect x="29" y="169" width="252" height="61" fill={accent} opacity="0.6" transform="rotate(-1 150 198)"/>
          <text x="34" y="220" fill={ink} fontSize="58" fontWeight="800" letterSpacing="-2">¥{discount}<tspan fontSize="19" fontWeight="500" dx="11">优惠券</tspan></text>
        </g>
        <text x="523" y="187" fill={ink} textAnchor="end" fontSize="14" opacity={1 - unfold}>请展开查看</text>
        <text x="523" y="210" fill="#737B63" textAnchor="end" fontSize="14" opacity={1 - unfold}>使用条件 ↘</text>
        <g opacity={unfold}>
          <text x="523" y="185" textAnchor="end" fill="#687057" fontFamily="monospace" fontSize="12">TERMS INCLUDED</text>
          <text x="523" y="210" textAnchor="end" fill={ink} fontSize="16">3 条关键信息</text>
        </g>

        <g clipPath="url(#ticket-inner)" opacity={detailAlpha}>
          {rows.map((row, index) => {
            const y = 261 + index * 103;
            const reveal = phases[index];
            const active = current === index && frame >= 125 && frame < 333;
            return <g key={row.n}>
              <path d={`M32 ${y - 16} H528`} stroke="#D9DDCD" strokeDasharray="3 5"/>
              <rect x="27" y={y - 6} width={506 * reveal} height="94" rx="2" fill={accent} opacity={active ? 0.48 : 0.1 * reveal}/>
              <text x="35" y={y + 19} fill="#626B54" fontFamily="monospace" fontSize="14">{row.n}</text>
              <text x="74" y={y + 19} fill="#68705B" fontSize="15">{row.label}</text>
              <text x="520" y={y + 19} textAnchor="end" fill="#6A7456" fontFamily="monospace" fontSize="11" letterSpacing="1">{row.code}</text>
              <g opacity={0.18 + 0.82 * reveal} transform={`translate(${14 * (1 - reveal)} 0)`}>
                <text x="73" y={y + 52} fill={ink} fontSize="29" fontWeight="750">{row.main}</text>
                <text x="74" y={y + 78} fill="#667054" fontSize="16">{row.note}</text>
              </g>
              <g opacity={reveal} transform={`translate(502 ${y + 51})`}><circle r="10" fill={ink}/><path d="M-4 0 L-1 3 L5 -4" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></g>
            </g>;
          })}
        </g>

        {/* 折角沿纸张右上角掀起，露出强调色，随后还原为展开的票据。 */}
        <g opacity={fold}>
          <path d="M450 0 H560 V110 Z" fill={accent}/>
          <path d={`M450 0 Q${489 - 20 * fold} ${52 + 13 * fold} 560 110 L${453 - 13 * fold} ${109 + 8 * fold} Z`} fill="url(#ticket-fold)" stroke="#CACFBA" strokeWidth="0.5"/>
          <path d="M450 0 L560 110" stroke="#ACB798" strokeWidth="1" opacity="0.5"/>
        </g>

        <g transform={`translate(0 ${detach * 17})`}>
          <path d={stubEdge} fill={paper}/>
          <path d={stubEdge} fill={accent} opacity={finish}/>
          <path d={`M22 ${stubY} H538`} stroke="#8B927C" strokeWidth="1.3" strokeDasharray="6 7"/>
          <g opacity={1 - summaryAlpha}>
            <text x="34" y={stubY + 30} fill="#6E755F" fontSize="13" letterSpacing="2">请保留票根 / KEEP THIS PART</text>
            {Array.from({length: 58}, (_, i) => <rect key={i} x={35 + i * 5.05} y={stubY + 43} width={i % 3 === 0 ? 3.3 : 1.6} height={i % 7 === 0 ? 37 : 31} fill={ink}/>)}
            <text x="519" y={stubY + 65} textAnchor="end" fill={ink} fontSize="16" fontWeight="700">看清再下单</text>
          </g>
          <g opacity={summaryAlpha}>
            <text x="34" y={stubY + 30} fill="#415125" fontSize="15">符合门槛时 · 扣除服务费后</text>
            <text x="33" y={stubY + 79} fill={ink} fontSize="24" fontWeight="700">{earned >= 0 ? '实际省' : '还需付'}</text>
            <text x="133" y={stubY + 81} fill={ink} fontSize="48" fontWeight="850" letterSpacing="-2">¥{numberTick}</text>
            <text x="523" y={stubY + 59} textAnchor="end" fill={ink} fontSize="17" fontWeight="700">{discount} − {serviceFee} = {earned}</text>
            <text x="523" y={stubY + 82} textAnchor="end" fill="#4F5E35" fontSize="13">退改条件单独核对</text>
          </g>
        </g>
      </g>

      <g opacity={fade(frame, 84, 109) * (1 - summaryAlpha)}>
        <text x="360" y="1149" textAnchor="middle" fill={ink} fontSize="20" fontWeight="600">{frame < 197 ? '费用，决定你真正省多少。' : frame < 269 ? '门槛，决定这张券能不能用。' : '退改，决定计划变动的代价。'}</text>
        {[0, 1, 2].map(i => <rect key={i} x={329 + i * 23} y="1175" width={i === current ? 18 : 6} height="5" rx="2.5" fill={i === current ? ink : '#ABB59A'}/>)}
      </g>
      <g opacity={summaryAlpha}>
        <text x="360" y="1155" textAnchor="middle" fill={ink} fontSize="27" fontWeight="750">大字吸引你，小字保护你。</text>
        <path d={`M191 1168 H${191 + 338 * finish}`} stroke="#94A969" strokeWidth="2"/>
      </g>
      <text x="360" y="1236" textAnchor="middle" fill="#79836C" fontSize="13">演示票据与条件，仅用于说明阅读顺序</text>
    </svg>
  </AbsoluteFill>;
}
