import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

type CapacityStreamProps = {
  title?: string;
  expandedTitle?: string;
  sourceLabels?: string[];
  outputLabels?: string[];
  conclusion?: string;
};

const limit = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = limit(value);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, value: number) => a + (b - a) * value;
type Point = { x: number; y: number };
const cubic = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const s = 1 - t;
  return { x: s * s * s * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t * t * t * d.x, y: s * s * s * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t * t * t * d.y };
};

/** 同一组曲线先收窄再展开，包沿曲线行进；所有速度、位置、分配都由帧号决定。 */
export default function CapacityStream({
  title = "流量，挤在这一处。",
  expandedTitle = "通道打开，流向重排。",
  sourceLabels = ["请求 A", "请求 B", "请求 C"],
  outputLabels = ["检索", "合成", "写入"],
  conclusion = "找到瓶颈，再安排每一份流量。",
}: CapacityStreamProps) {
  const frame = useCurrentFrame();
  const widening = smooth((frame - 178) / 100);
  const headerExit = smooth((frame - 174) / 18);
  const headerEnter = smooth((frame - 198) / 22);
  const allocation = smooth((frame - 285) / 66);
  const focus = smooth((frame - 64) / 35) * (1 - smooth((frame - 177) / 60));
  const settled = smooth((frame - 354) / 30);
  const braking = Math.min(30, Math.max(0, frame - 354));
  const flowFrame = Math.min(frame, 354) + braking - braking * braking / 60;
  const neckHalf = mix(32, 118, widening);
  const capacity = Math.round(mix(48, 120, widening));
  const inputXs = [148, 360, 572];
  const outputs = [Math.round(mix(40, 36, allocation)), Math.round(mix(40, 60, allocation)), Math.round(mix(40, 24, allocation))];
  const ink = "#183A50";
  const blue = "#397084";
  const orange = "#D67643";
  const mint = "#B5D8C7";
  const phase = frame < 178 ? 0 : frame < 285 ? 1 : 2;

  // 三十条等权流线由 10/10/10 改为 9/15/6，与 30%/50%/20% 严格一致。
  const lanes = Array.from({ length: 30 }, (_, index) => {
    const source = Math.floor(index / 10);
    const sourceX = inputXs[source] + ((index % 10) - 4.5) * 4.5;
    const narrowX = 360 + (index - 14.5) * (neckHalf * 1.62 / 29);
    const originalGroup = Math.floor(index / 10);
    const finalGroup = index < 9 ? 0 : index < 24 ? 1 : 2;
    const destinationX = mix(inputXs[originalGroup] + (index % 10 - 4.5) * 4.5, inputXs[finalGroup] + (finalGroup === 0 ? index - 4 : finalGroup === 1 ? index - 16 : index - 26.5) * 4.5, allocation);
    const first: Point[] = [{ x: sourceX, y: 432 }, { x: sourceX, y: 529 }, { x: narrowX, y: 568 }, { x: narrowX, y: 675 }];
    const second: Point[] = [{ x: narrowX, y: 675 }, { x: narrowX, y: 827 }, { x: destinationX, y: 872 }, { x: destinationX, y: 988 }];
    const d = `M${sourceX} 432C${sourceX} 529 ${narrowX} 568 ${narrowX} 675C${narrowX} 827 ${destinationX} 872 ${destinationX} 988`;
    return { index, first, second, d, finalGroup };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#EEF0EB", fontFamily: "Arial, 'Noto Sans CJK SC', sans-serif" }}>
      <svg width="720" height="1280" viewBox="0 0 720 1280">
        <defs>
          <linearGradient id="cp-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F9FAF4" /><stop offset="1" stopColor="#E4EBE6" /></linearGradient>
          <linearGradient id="cp-channel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DEE7E0" stopOpacity="0.45" /><stop offset="0.5" stopColor="#D2E1D9" /><stop offset="1" stopColor="#DEE7E0" stopOpacity="0.4" /></linearGradient>
          <radialGradient id="cp-node" cx="30%" cy="20%" r="90%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E3EAE2" /></radialGradient>
        </defs>
        <rect width="720" height="1280" fill="url(#cp-paper)" />
        <path d="M48 78H672" stroke="#BECFC6" />
        <text x="48" y="59" fontSize="17" letterSpacing="3" fontWeight="700" fill="#738B81">资源 / 看见流动的限制</text>
        <text x="672" y="59" textAnchor="end" fontSize="18" fontWeight="700" fill={orange}>02—03</text>
        <g opacity={1 - headerExit} transform={`translate(0 ${-8 * headerExit})`}>
          <text x="48" y="151" fontSize="48" fontWeight="800" letterSpacing="-2" fill={ink}>{title}</text>
          <text x="50" y="201" fontSize="23" fill="#738B81">沿着同一股流，找到最窄的位置。</text>
        </g>
        <g opacity={headerEnter} transform={`translate(0 ${8 * (1 - headerEnter)})`}>
          <text x="48" y="151" fontSize="46" fontWeight="800" letterSpacing="-2" fill={ink}>{expandedTitle}</text>
          <text x="50" y="201" fontSize="23" fill="#738B81">容量释放后，把资源送到需要的地方。</text>
        </g>

        {/* 三段进度以一条线连接，避免将讲解切成互不相干的画面。 */}
        <path d="M61 264H653" stroke="#CAD8CF" strokeWidth="2" />
        <path d={`M61 264H${61 + Math.min(1, frame / 351) * 592}`} stroke={ink} strokeWidth="2" />
        {["01  找到窄口", "02  扩宽通道", "03  重新分配"].map((label, index) => (
          <g key={label}><circle cx={61 + index * 296} cy="264" r={phase === index ? 6 : 4} fill={phase >= index ? ink : "#CAD8CF"} /><text x={48 + index * 228} y="295" fontSize="17" fontWeight={phase === index ? 700 : 400} fill={phase === index ? ink : "#91A197"}>{label}</text></g>
        ))}

        {/* 三入口、一个公共窄口、三出口共同组成一件完整的流动装置。 */}
        <path d={`M95 432C95 544 ${360 - neckHalf} 562 ${360 - neckHalf} 675C${360 - neckHalf} 837 95 879 95 991L625 991C625 879 ${360 + neckHalf} 837 ${360 + neckHalf} 675C${360 + neckHalf} 562 625 544 625 432Z`} fill="url(#cp-channel)" />
        <path d={`M95 432C95 544 ${360 - neckHalf} 562 ${360 - neckHalf} 675C${360 - neckHalf} 837 95 879 95 991M625 432C625 544 ${360 + neckHalf} 562 ${360 + neckHalf} 675C${360 + neckHalf} 837 625 879 625 991`} fill="none" stroke="#BACFC2" strokeWidth="1.5" />

        {lanes.map((lane) => (
          <path key={`lane-${lane.index}`} d={lane.d} fill="none" stroke={lane.index >= 9 && lane.index < 24 ? blue : "#84A999"} strokeWidth="1.3" opacity="0.48" />
        ))}
        {lanes.map((lane) => (
          <g key={`packets-${lane.index}`}>
            {Array.from({ length: 3 }, (_, packet) => {
              // 路段比例在收窄时压缩到窄口之前；扩宽后平滑恢复完整行程。
              const cycle = ((flowFrame * 0.0053 + packet / 3 + lane.index * 0.037) % 1 + 1) % 1;
              const constrained = cycle < 0.7 ? (cycle / 0.7) * 0.45 : 0.45 + ((cycle - 0.7) / 0.3) * 0.55;
              const travel = mix(constrained, cycle, widening);
              const onFirst = travel < 0.46;
              const segment = onFirst ? lane.first : lane.second;
              const t = onFirst ? travel / 0.46 : (travel - 0.46) / 0.54;
              const point = cubic(segment[0], segment[1], segment[2], segment[3], t);
              const inQueue = travel > 0.29 && travel < 0.49;
              const packetColor = inQueue && widening < 0.65 ? orange : lane.finalGroup === 1 ? ink : blue;
              return <circle key={`packet-${packet}`} cx={point.x} cy={point.y} r={inQueue && widening < 0.65 ? 3.6 : 2.8} fill={packetColor} opacity={0.65 + (1 - Math.abs(travel - 0.5) * 2) * 0.35} />;
            })}
          </g>
        ))}

        {/* 窄口的两块机械挡片沿水平方向退开，留下可追踪的轮廓和刻度。 */}
        <g>
          <path d={`M${360 - neckHalf - 11} 632V717M${360 + neckHalf + 11} 632V717`} stroke={ink} strokeWidth="10" strokeLinecap="round" />
          <path d={`M${360 - neckHalf - 11} 641V706M${360 + neckHalf + 11} 641V706`} stroke={widening < 0.5 ? orange : mint} strokeWidth="4" strokeLinecap="round" />
          <path d={`M${360 - neckHalf + 5} 745H${360 + neckHalf - 5}`} stroke="#8CA99B" strokeWidth="1.5" />
          <path d={`M${360 - neckHalf + 5} 739V751M${360 + neckHalf - 5} 739V751`} stroke="#8CA99B" strokeWidth="1.5" />
          <text x="360" y="780" textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="2" fill="#738B81">共享通道</text>
        </g>
        <g transform="translate(51 637)">
          <text y="0" fontSize="17" fill="#738B81">通道容量</text>
          <text y="65" fontSize="61" fontWeight="800" letterSpacing="-3" fill={widening < 0.4 ? orange : ink}>{capacity}</text>
          <text y="96" fontSize="15" fill="#738B81">单位 / 秒</text>
          <path d="M2 114H85" stroke="#BECFC6" />
        </g>
        <g opacity={focus}>
          <path d={`M${360 + neckHalf + 23} 637L539 591H663`} fill="none" stroke={orange} strokeWidth="1.5" />
          <circle cx={360 + neckHalf + 23} cy="637" r="4" fill={orange} />
          <text x="663" y="561" textAnchor="end" fontSize="21" fontWeight="700" fill={orange}>在此排队</text>
          <text x="663" y="585" textAnchor="end" fontSize="15" fill="#9C816C">入口大于出口容量</text>
        </g>
        <g opacity={widening * (1 - settled * 0.35)} transform="translate(588 672)">
          <circle r="29" fill={mint} />
          <path d="M-11 0L-3 8L13 -10" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <text y="58" textAnchor="middle" fontSize="18" fill={ink} fontWeight="700">窄口已扩宽</text>
        </g>

        {inputXs.map((x, index) => (
          <g key={`source-${index}`} transform={`translate(${x} 371)`}>
            <circle cy="5" r="44" fill="#C4D3C8" opacity="0.65" />
            <circle r="44" fill="url(#cp-node)" stroke="#BBCDBF" strokeWidth="1.5" />
            {index === 0 ? <g fill="none" stroke={ink} strokeWidth="2.5"><rect x="-15" y="-14" width="24" height="24" rx="4" /><rect x="-7" y="-6" width="24" height="24" rx="4" fill="#F2F5ED" /></g> : index === 1 ? <g fill={ink}>{[-1, 1].map((row) => [-1, 1].map((column) => <rect key={`${row}-${column}`} x={column * 10 - 6} y={row * 10 - 6} width="12" height="12" rx="2" />))}</g> : <g fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round"><path d="M-17 -14H-9M-17 -14V14H-9M17 -14H9M17 -14V14H9" /><path d="M-4 -8L5 0L-4 8" /></g>}
            <text y="66" textAnchor="middle" fontSize="19" fontWeight="700" fill={ink}>{sourceLabels[index] ?? `请求 ${index + 1}`}</text>
          </g>
        ))}

        {inputXs.map((x, index) => {
          const emphasis = index === 1 ? allocation : 0;
          const radius = 40 + emphasis * 10;
          return <g key={`output-${index}`} transform={`translate(${x} 1024)`}>
            <circle cy="4" r={radius} fill="#C4D3C8" opacity="0.55" />
            <circle r={radius} fill={index === 1 ? ink : "#EAF1E6"} stroke={index === 1 ? ink : "#A7C2B1"} strokeWidth="1.5" />
            <text y="11" textAnchor="middle" fontSize={31 + emphasis * 5} fontWeight="800" fill={index === 1 ? "#E5F0D7" : ink}>{Math.round(outputs[index] * mix(0.4, 1, widening))}</text>
            <text y="80" textAnchor="middle" fontSize="21" fontWeight="700" fill={ink}>{outputLabels[index] ?? `任务 ${index + 1}`}</text>
            <text y="108" textAnchor="middle" fontSize="16" fill="#738B81" opacity={allocation}>{[30, 50, 20][index]}% 配额</text>
          </g>;
        })}

        <path d="M48 1175H76" stroke={orange} strokeWidth="5" strokeLinecap="round" />
        <text x="93" y="1185" fontSize="27" fontWeight="800" fill={ink}>{conclusion}</text>
        <path d="M48 1213H672" stroke="#BECFC6" />
        <text x="48" y="1242" fontSize="14" fill="#738B81">假设模型 · 总需求 120 单位/秒 · 数值用于解释，不代表真实测速</text>
        <circle cx="668" cy="1237" r="4" fill={orange} />
      </svg>
    </AbsoluteFill>
  );
}
