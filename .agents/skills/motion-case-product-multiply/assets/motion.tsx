import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

type Props = {
  productName?: string;
  quantity?: number;
  actionLabel?: string;
  accent?: string;
  transparent?: boolean;
};

const font = "Arial, 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif";
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const soft = Easing.bezier(0.65, 0, 0.35, 1);
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
const blend = (a: number, b: number, t: number) => a + (b - a) * t;
const fading = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

function Tablet({accent, tiny = false}: {accent: string; tiny?: boolean}) {
  return <g>
    <rect x="-110" y="-146" width="224" height="296" rx="22" fill="#A6AEB5"/>
    <rect x="-112" y="-148" width="221" height="294" rx="21" fill="url(#product-metal)" stroke="#434953" strokeWidth="1.2"/>
    <rect x="-109" y="-145" width="215" height="288" rx="19" fill="#101924" stroke="#8C97A4" strokeWidth="0.6"/>
    <rect x="-101" y="-133" width="199" height="264" rx="12" fill="url(#product-display)"/>
    <g clipPath="url(#product-screen)">
      <circle cx="83" cy="-109" r="104" fill={accent} opacity="0.73"/>
      <circle cx="83" cy="-109" r="76" fill="none" stroke="#ECF3FF" strokeWidth="0.8" opacity="0.2"/>
      <circle cx="83" cy="-109" r="53" fill="none" stroke="#ECF3FF" strokeWidth="0.8" opacity="0.3"/>
      <path d="M-117 135 Q-19 16 112 92 V145 Z" fill="#B8D1FF" opacity="0.92"/>
      <path d="M-115 148 Q-13 41 111 110 V151 Z" fill="#EEF4FF"/>
      {!tiny && <g>
        <text x="-84" y="-113" fill="#DDE9FE" fontSize="6.5" letterSpacing="1.6">FOCUS SPACE</text>
        <circle cx="81" cy="-116" r="2.6" fill="#E6F1FF"/>
        <text x="-85" y="-78" fill="white" fontSize="22" fontWeight="700" letterSpacing="-0.7">Make room.</text>
        <text x="-85" y="-56" fill="#CCDCF7" fontSize="10">给重要的事，留一点空间。</text>
        <rect x="-85" y="-33" width="165" height="113" rx="9" fill="#FBFCFF"/>
        <rect x="-73" y="-19" width="7" height="7" rx="2" fill={accent}/>
        <text x="-59" y="-12" fill="#263548" fontSize="8.5" fontWeight="700">今日计划</text>
        {[0, 1, 2].map(i => <g key={i} transform={`translate(0 ${i * 24})`}>
          <rect x="-73" y="4" width="10" height="10" rx="3" fill={i === 0 ? accent : '#E3EAF4'}/>
          {i === 0 && <path d="M-70 9 L-68 11 L-65 6" fill="none" stroke="white" strokeWidth="1"/>}
          <rect x="-53" y="4" width={78 - i * 15} height="3" rx="1.5" fill={i === 0 ? '#364661' : '#8996AA'}/>
          <rect x="-53" y="11" width={51 + i * 7} height="2.5" rx="1.2" fill="#CBD4E1"/>
        </g>)}
        <rect x="-25" y="99" width="50" height="18" rx="9" fill="#FFFFFF" fillOpacity="0.7"/>
        {[-13, 0, 13].map((x, i) => <rect key={i} x={x - 3} y="105" width="6" height="6" rx="2" fill={i === 1 ? accent : '#8294AC'}/>)}
      </g>}
      {tiny && <g><rect x="-74" y="-22" width="143" height="94" rx="8" fill="#F7FAFF"/>{[0, 1, 2].map(i => <path key={i} d={`M-51 ${i * 21 - 1} H44`} stroke="#9EADC1" strokeWidth="7" strokeLinecap="round"/>)}</g>}
      <path d="M-101 -133 H-20 L-101 105 Z" fill="#FFFFFF" opacity="0.055"/>
    </g>
    <circle cx="-2" cy="-140" r="2.1" fill="#29364A"/><circle cx="-2.4" cy="-140.5" r="0.75" fill="#506583"/>
    <path d="M-18 137 H15" stroke="#596472" strokeWidth="2" strokeLinecap="round"/>
    <path d="M-111 -101 V-77 M-111 -64 V-39" stroke="#CDD3D8" strokeWidth="2.3" strokeLinecap="round"/>
    <path d="M-91 -147 H86" stroke="#DFE5E8" strokeWidth="1.1" strokeLinecap="round" opacity="0.75"/>
  </g>;
}

/** 上方 600 px 是人物预留的构图假设，仍须叠真实人物与字幕复核遮挡。 */
export default function ProductMultiply({
  productName = '轻薄工作平板',
  quantity = 70,
  actionLabel = '查看配置清单',
  accent = '#4979F5',
  transparent = true,
}: Props) {
  const frame = useCurrentFrame();
  // 3–70 件保持单屏十列清晰；更大数量应另做分组语义与版式。
  const count = Math.max(3, Math.min(70, Math.round(quantity)));
  const entrance = ramp(frame, 0, 42);
  const spread = ramp(frame, 75, 130);
  const grid = interpolate(frame, [178, 240], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: soft});
  const collect = interpolate(frame, [324, 378], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: soft});
  const cta = ramp(frame, 357, 386);
  const oneLabel = entrance * (1 - fading(frame, 70, 91));
  const threeLabel = fading(frame, 95, 116) * (1 - fading(frame, 167, 184));
  const countLabel = fading(frame, 191, 214) * (1 - fading(frame, 322, 344));
  const endLabel = fading(frame, 346, 369);
  const firstXs = [360, 180, 540];
  const firstYs = [945, 966, 966];
  const firstScales = [0.86, 0.71, 0.71];
  const firstAngles = [0, -10, 10];
  const appearances = Array.from({length: count}, (_, index) => index < 3 ? 1 : ramp(frame, 190 + Math.floor(index / 10) * 6 + (index % 10) * 2.1, 215 + Math.floor(index / 10) * 6 + (index % 10) * 2.1));
  const visibleCount = appearances.reduce((sum, p) => sum + (p > 0.6 ? 1 : 0), 0);
  const finalY = 979;

  return <AbsoluteFill style={{backgroundColor: transparent ? 'transparent' : '#F2F0EB', fontFamily: font}}>
    <svg width="720" height="1280" viewBox="0 0 720 1280">
      <defs>
        <linearGradient id="product-metal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#D8E0E6"/><stop offset="0.13" stopColor="#5B626C"/><stop offset="0.52" stopColor="#1D2734"/><stop offset="0.94" stopColor="#73818E"/><stop offset="1" stopColor="#DBE0E4"/></linearGradient>
        <linearGradient id="product-display" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1B305A"/><stop offset="0.65" stopColor="#35578F"/><stop offset="1" stopColor="#94B9EE"/></linearGradient>
        <radialGradient id="product-halo"><stop stopColor={accent} stopOpacity="0.11"/><stop offset="1" stopColor={accent} stopOpacity="0"/></radialGradient>
        <clipPath id="product-screen"><rect x="-101" y="-133" width="199" height="264" rx="12"/></clipPath>
        <filter id="product-shadow" x="-55%" y="-35%" width="220%" height="210%"><feDropShadow dx="0" dy="15" stdDeviation="12" floodColor="#12203A" floodOpacity="0.17"/><feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#24344E" floodOpacity="0.2"/></filter>
      </defs>
      {/* 不绘制假人物；最早的可见信息基线在 646 px。 */}
      <ellipse cx="360" cy="984" rx="350" ry="240" fill="url(#product-halo)" opacity={entrance * (1 - grid * 0.3)}/>
      <g opacity={entrance}>
        <rect x="54" y="621" width="7" height="7" rx="1.5" fill={accent}/>
        <text x="73" y="629" fill="#7A828D" fontSize="12" fontWeight="700" letterSpacing="2.3">WORK, TOGETHER.</text>
        <text x="664" y="629" textAnchor="end" fill="#7B8490" fontSize="13">{productName}</text>
      </g>

      <g opacity={oneLabel} transform={`translate(0 ${(1 - entrance) * 18})`}>
        <text x="360" y="708" textAnchor="middle" fill="#202A39" fontSize="52" fontWeight="800" letterSpacing="-2">从一台开始。</text>
        <text x="360" y="751" textAnchor="middle" fill="#727D8E" fontSize="21">一个清晰的工作空间</text>
      </g>
      <g opacity={threeLabel} transform={`translate(0 ${14 * (1 - ramp(frame, 95, 126))})`}>
        <text x="360" y="708" textAnchor="middle" fill="#202A39" fontSize="52" fontWeight="800" letterSpacing="-2">让协作，展开。</text>
        <text x="360" y="751" textAnchor="middle" fill="#727D8E" fontSize="21">从个人，到同伴，再到整个团队</text>
      </g>
      <g opacity={countLabel}>
        <text x="54" y="689" fill="#596575" fontSize="22">团队设备计划</text>
        <text x="48" y="794" fill="#202A39" fontSize="116" fontWeight="850" letterSpacing="-8">{visibleCount}<tspan dx="13" fontSize="27" letterSpacing="0" fontWeight="550">台</tspan></text>
        <path d="M254 734 V790" stroke="#CBD1D9" strokeWidth="1"/>
        <text x="277" y="753" fill="#273346" fontSize="23" fontWeight="650">每一台，都算数。</text>
        <text x="277" y="788" fill="#7B8695" fontSize="17">十列展开 · 数量看得见</text>
        <text x="658" y="819" textAnchor="end" fill="#7A8698" fontSize="11" fontFamily="monospace" letterSpacing="1.3">{String(visibleCount).padStart(2, '0')} / {String(count).padStart(2, '0')}</text>
      </g>
      <g opacity={endLabel}>
        <text x="360" y="704" textAnchor="middle" fill="#202A39" fontSize="49" fontWeight="800" letterSpacing="-1.8">{count} 台，一个共同起点。</text>
        <text x="360" y="748" textAnchor="middle" fill="#748091" fontSize="21">把数量理清，把下一步准备好。</text>
      </g>

      <ellipse cx="360" cy="1138" rx={132 + 130 * spread} ry="16" fill="#7E8C9F" opacity={0.09 * entrance * (1 - grid)}/>
      {/* 先画新增单元，前三台保持原身份与连续变换，避免用截图替换。 */}
      {Array.from({length: Math.max(0, count - 3)}, (_, offset) => {
        const index = offset + 3;
        const arrival = appearances[index];
        const gx = 108 + (index % 10) * 56;
        const gy = 860 + Math.floor(index / 10) * 47;
        const travel = ramp(frame, 324 + Math.floor(index / 10) * 1.5, 370 + Math.floor(index / 10) * 1.5);
        const x = blend(blend(360, gx, arrival), 190, travel);
        const y = blend(blend(945, gy, arrival), finalY, travel);
        const size = 0.125 * arrival * (1 - travel * 0.7);
        return <g key={index} opacity={arrival * (1 - travel)} transform={`translate(${x} ${y}) scale(${size}) rotate(${12 * (1 - arrival)})`}><Tablet accent={accent} tiny/></g>;
      })}

      {[1, 2, 0].map(index => {
        const born = index === 0 ? entrance : ramp(frame, 76 + index * 6, 118 + index * 6);
        const fanX = blend(360, firstXs[index], spread);
        const fanY = blend(961, firstYs[index], spread);
        const fanScale = blend(0.96, firstScales[index], spread);
        const gridX = 108 + index * 56;
        const x = blend(blend(fanX, gridX, grid), 190, collect);
        const y = blend(blend(fanY + 42 * (1 - entrance), 860, grid), finalY, collect);
        const size = blend(blend(fanScale, 0.125, grid), index === 0 ? 0.66 : 0.055, collect) * (index === 0 ? 0.9 + 0.1 * entrance : 1);
        const rotate = blend(blend(-7 * (1 - spread) + firstAngles[index] * spread, 0, grid), index === 0 ? -7 : 0, collect);
        return <g key={index} opacity={born * (index === 0 ? 1 : 1 - collect)} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size})`} filter={grid > 0.96 && collect < 0.04 ? undefined : 'url(#product-shadow)'}><Tablet accent={accent}/></g>;
      })}

      <g opacity={cta} transform={`translate(${20 * (1 - cta)} 0)`}>
        <rect x="336" y="866" width="103" height="26" rx="13" fill={accent} fillOpacity="0.11"/>
        <circle cx="351" cy="879" r="3" fill={accent}/>
        <text x="363" y="884" fill={accent} fontSize="12" fontWeight="700">{count} 台已规划</text>
        <text x="335" y="941" fill="#233046" fontSize="31" fontWeight="750">从配置清单</text>
        <text x="335" y="982" fill="#233046" fontSize="31" fontWeight="750">开始下一步。</text>
        <rect x="334" y="1012" width="296" height="65" rx="13" fill={accent}/>
        <text x="357" y="1053" fill="#FFFFFF" fontSize={actionLabel.length > 8 ? 20 : 23} fontWeight="650">{actionLabel}</text>
        <path d="M590 1044 H608 M600 1037 L608 1044 L600 1051" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="337" y="1105" fill="#788394" fontSize="14">统一整理 · 再按需求分配</text>
      </g>

      <g opacity={entrance}>
        <path d="M54 1187 H666" stroke="#C9CED5" strokeWidth="1"/>
        <text x="54" y="1220" fill="#858D98" fontSize="13">示意产品 · 数量用于演示</text>
        <g transform="translate(624 1213)">{[0, 1, 2].map(i => <circle key={i} cx={i * 15} cy="0" r="3" fill={frame < 178 ? (frame < 75 ? i === 0 : i === 1) ? accent : '#CBD1D8' : i === 2 ? accent : '#CBD1D8'}/>)}</g>
      </g>
    </svg>
  </AbsoluteFill>;
}
