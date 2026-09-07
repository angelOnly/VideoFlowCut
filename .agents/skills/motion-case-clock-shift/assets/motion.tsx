import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

type ClockShiftProps = {
  title?: string;
  subtitle?: string;
  sunriseLabel?: string;
  departureLabel?: string;
  conclusion?: string;
};

const bounded = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = bounded(value);
  return t * t * (3 - 2 * t);
};
const blend = (a: number, b: number, t: number) => a + (b - a) * t;
const polar = (angle: number, radius: number) => ({
  x: Math.sin(angle * Math.PI / 180) * radius,
  y: -Math.cos(angle * Math.PI / 180) * radius,
});

/** 同一物体贯穿全片；时刻读数与太阳位置分开表达，避免把拨钟画成日照变化。 */
export default function ClockShift({
  title = "把时钟，拨快一小时。",
  subtitle = "同一束晨光，换了一套时间刻度。",
  sunriseLabel = "日出",
  departureLabel = "通勤出门",
  conclusion = "读数向前，出门更早。",
}: ClockShiftProps) {
  const frame = useCurrentFrame();
  const arrival = ease(frame / 48);
  const shift = ease((frame - 68) / 130);
  const commute = ease((frame - 226) / 86);
  const ending = ease((frame - 324) / 30);
  const hour = 8 + shift;
  const minute = Math.min(59, Math.floor(shift * 60));
  const readout = shift > 0.998 ? "09:00" : `08:${String(minute).padStart(2, "0")}`;
  const hand = polar(hour * 30, 126);
  const minuteHand = polar(shift * 360, 178);
  const commuteX = blend(405, 319, commute);
  const ink = "#243C3A";
  const orange = "#C9653B";
  const muted = "#7D8477";

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4F0E5", fontFamily: "Arial, 'Noto Sans CJK SC', sans-serif" }}>
      <svg width="720" height="1280" viewBox="0 0 720 1280">
        <defs>
          <linearGradient id="cs-paper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FCF9EF" /><stop offset="1" stopColor="#EAE5D6" />
          </linearGradient>
          <radialGradient id="cs-face" cx="38%" cy="26%" r="80%">
            <stop offset="0" stopColor="#FFFEF8" /><stop offset="0.7" stopColor="#F2EDDB" /><stop offset="1" stopColor="#DCD4BF" />
          </radialGradient>
          <linearGradient id="cs-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F1CC98" /><stop offset="0.34" stopColor="#C07B49" /><stop offset="0.65" stopColor="#C58F5C" /><stop offset="1" stopColor="#7D5137" />
          </linearGradient>
          <linearGradient id="cs-sky" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#F4D3A1" /><stop offset="1" stopColor="#EFEBDC" />
          </linearGradient>
          <filter id="cs-shadow" x="-40%" y="-40%" width="180%" height="200%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <clipPath id="cs-band"><rect x="48" y="864" width="624" height="204" rx="28" /></clipPath>
        </defs>

        <rect width="720" height="1280" fill="url(#cs-paper)" />
        {/* 细线与宽留白形成纸面编辑感，铜色只服务于拨钟动作。 */}
        <path d="M48 79H672" stroke="#C6CABB" strokeWidth="1" />
        <text x="48" y="60" fontSize="17" fontWeight="700" letterSpacing="3" fill={muted}>时间 / 同一刻的两种读法</text>
        <text x="672" y="60" textAnchor="end" fontSize="18" fontWeight="700" fill={orange}>01—03</text>
        <text x="48" y="149" fontSize="45" fontWeight="800" letterSpacing="-2" fill={ink}>{title}</text>
        <text x="49" y="198" fontSize="23" fill={muted}>{subtitle}</text>

        <g opacity="0.45" fill="none" stroke="#C5C7B6">
          <ellipse cx="365" cy="540" rx="307" ry="235" transform="rotate(-13 365 540)" />
          <ellipse cx="365" cy="540" rx="329" ry="253" transform="rotate(-13 365 540)" strokeDasharray="2 9" />
        </g>
        <ellipse cx="372" cy="755" rx="211" ry="35" fill="#827764" opacity="0.17" filter="url(#cs-shadow)" />

        {/* 以同一 SVG 组维持斜角透视与材质；分针整圈、时针一格严格同步。 */}
        <g transform={`translate(360 ${508 + (1 - arrival) * 20}) rotate(-15) scale(${0.94 + arrival * 0.04} ${0.81 + arrival * 0.035})`}>
          <circle cy="25" r="252" fill="#88583B" />
          <circle cy="19" r="251" fill="url(#cs-rim)" />
          <circle r="252" fill="url(#cs-rim)" />
          <circle r="240" fill="#E3C8A1" stroke="#F9E5C0" strokeWidth="2" />
          <circle r="230" fill="url(#cs-face)" stroke="#AE8760" strokeWidth="3" />
          <path d="M-197 -126A234 234 0 0 1 112 -207" fill="none" stroke="#FFF7DE" strokeWidth="5" opacity="0.72" strokeLinecap="round" />
          <circle r="213" fill="none" stroke="#D2CBB7" strokeWidth="1" />
          {Array.from({ length: 60 }, (_, index) => {
            const outer = polar(index * 6, 211);
            const inner = polar(index * 6, index % 5 === 0 ? 195 : 203);
            return <line key={`tick-${index}`} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={index % 5 === 0 ? ink : "#A4A38E"} strokeWidth={index % 5 === 0 ? 3 : 1.5} />;
          })}
          {Array.from({ length: 12 }, (_, index) => {
            const number = index + 1;
            const point = polar(number * 30, 171);
            return <text key={`hour-${number}`} x={point.x} y={point.y + 11} textAnchor="middle" fontSize="34" fill={ink} fontWeight="600">{number}</text>;
          })}
          <path d="M-139 80A160 160 0 0 1 -160 0" fill="none" stroke={orange} strokeWidth="14" opacity={0.13 + shift * 0.25} strokeLinecap="round" />
          <text x="0" y="-70" textAnchor="middle" fontSize="12" letterSpacing="3" fontWeight="700" fill={muted}>晨间时间</text>
          <rect x="-67" y="82" width="134" height="49" rx="11" fill="#E6E2D4" stroke="#D4CCB8" />
          <text x="0" y="116" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="31" fontWeight="700" fill={ink}>{readout}</text>
          <text x="0" y="150" textAnchor="middle" fontSize="11" letterSpacing="2" fill={muted}>同一物理时刻</text>
          <line x1="5" y1="8" x2={minuteHand.x + 5} y2={minuteHand.y + 8} stroke="#8A7D64" strokeWidth="9" opacity="0.16" strokeLinecap="round" />
          <line x1="3" y1="8" x2={hand.x + 3} y2={hand.y + 8} stroke="#8A7D64" strokeWidth="17" opacity="0.2" strokeLinecap="round" />
          <line x1={-minuteHand.x * 0.14} y1={-minuteHand.y * 0.14} x2={minuteHand.x} y2={minuteHand.y} stroke={ink} strokeWidth="7" strokeLinecap="round" />
          <line x1={-hand.x * 0.22} y1={-hand.y * 0.22} x2={hand.x} y2={hand.y} stroke={ink} strokeWidth="16" strokeLinecap="round" />
          <line x1="0" y1="0" x2={hand.x * 0.85} y2={hand.y * 0.85} stroke="#526F64" strokeWidth="4" strokeLinecap="round" />
          <circle r="17" fill={orange} /><circle r="6" fill="#F4D5A4" />
        </g>

        <g transform={`translate(535 ${305 - shift * 9})`}>
          <circle r="51" fill={orange} />
          <text x="0" y="-3" textAnchor="middle" fontSize="31" fontWeight="800" fill="#FFF8E9">+1</text>
          <text x="0" y="23" textAnchor="middle" fontSize="15" fontWeight="700" fill="#FFF8E9">小时</text>
        </g>
        <g opacity={1 - commute * 0.75}>
          <path d="M83 690L83 745L183 745" fill="none" stroke={orange} strokeWidth="1.5" />
          <circle cx="83" cy="690" r="4" fill={orange} />
          <text x="81" y="774" fontSize="19" fill={orange} fontWeight="700">08:00 → 09:00</text>
        </g>
        <text x="671" y="816" textAnchor="end" fontSize="17" fill={muted}>太阳位置不变</text>
        <text x="48" y="816" fontSize="19" fontWeight="700" fill={ink}>把读数，放回一天里</text>

        <g clipPath="url(#cs-band)">
          <rect x="48" y="864" width="624" height="204" fill="url(#cs-sky)" />
          <path d="M48 945Q190 921 296 938T672 926V1070H48Z" fill="#E0DDC7" />
          <path d="M48 984Q270 956 672 965V1070H48Z" fill="#D1D8C0" />
          <circle cx="147" cy="944" r="22" fill="#D2854B" />
          <path d="M119 945H175" stroke="#F7E7CA" strokeWidth="3" />
          <path d="M48 950H672" stroke="#B6BDA9" strokeWidth="1" />
          {Array.from({ length: 8 }, (_, index) => {
            const x = 61 + index * 86;
            return <g key={`band-${index}`}><path d={`M${x} 997V1004`} stroke="#7D8B7B" /><text x={x} y="1037" textAnchor="middle" fontSize="17" fill="#6D7A6B" opacity={1 - shift}>{String(5 + index).padStart(2, "0")}</text><text x={x} y="1037" textAnchor="middle" fontSize="17" fill="#6D7A6B" opacity={shift}>{String(6 + index).padStart(2, "0")}</text></g>;
          })}
          <line x1="147" y1="955" x2="147" y2="991" stroke="#AD8054" strokeWidth="1.5" strokeDasharray="3 4" />
          <text x="147" y="902" textAnchor="middle" fontSize="20" fontWeight="700" fill="#856445">{sunriseLabel}</text>
          <g opacity={commute * 0.5}>
            <path d="M405 960H327" stroke={ink} strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M333 954L324 960L333 966" stroke={ink} strokeWidth="1.5" fill="none" />
            <circle cx="405" cy="960" r="7" fill="none" stroke={ink} strokeWidth="1.5" />
          </g>
          <g transform={`translate(${commuteX} 941)`}>
            <circle cy="10" r="21" fill={ink} />
            <rect x="-9" y="-1" width="18" height="16" rx="3" fill="#ECF0DF" />
            <path d="M-5 -4V-6H5V-4M-9 7H9" stroke="#ECF0DF" fill="none" strokeWidth="2" />
            <line y1="33" y2="53" stroke={ink} strokeWidth="2" />
            <text y="-49" textAnchor="middle" fontSize="20" fontWeight="700" fill={ink}>{departureLabel}</text>
          </g>
          <text x="619" y="897" textAnchor="end" fontSize="14" fill="#7D8477">日照带保持原位</text>
        </g>

        <g opacity={1 - ending}>
          <text x="48" y="1120" fontSize="23" fill={ink} fontWeight="700">{commute < 0.1 ? "读数整体 +1 小时，日出仍在原处。" : "仍按 09:00 出门，就比原来更早。"}</text>
        </g>
        <g opacity={ending}>
          <path d="M48 1117H78" stroke={orange} strokeWidth="5" strokeLinecap="round" />
          <text x="96" y="1129" fontSize="34" fontWeight="800" fill={ink}>{conclusion}</text>
          <text x="48" y="1175" fontSize="22" fill={muted}>改的是约定的刻度；相对日出的通勤提前了。</text>
        </g>
        <path d="M48 1213H672" stroke="#C6CABB" />
        <text x="48" y="1242" fontSize="15" fill={muted}>概念示意 · 统一拨快 1 小时 · 出门仍定在 09:00</text>
        <circle cx="668" cy="1237" r="4" fill={orange} />
      </svg>
    </AbsoluteFill>
  );
}
