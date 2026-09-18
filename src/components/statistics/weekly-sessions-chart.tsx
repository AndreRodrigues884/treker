"use client";

import { useId, useState } from "react";
import { formatDate, niceTicks } from "@/lib/chart-utils";
import type { WeekSessions } from "@/lib/gym/derive";

const WIDTH = 320;
const HEIGHT = 150;
const PAD_TOP = 20;
const PAD_BOTTOM = 26;
const PAD_LEFT = 22;
const PAD_RIGHT = 8;
const BAR_TOP = "#67e8f9"; // cyan-300
const BAR_BOTTOM = "#0891b2"; // cyan-600

/** A column chart for a fixed, small run of weeks (always exactly as many
 * bars as `data` has, zero-filled by the caller) — gradient-filled bars
 * instead of ProgressChart's line, everything else (nice ticks, hover
 * tooltip, sr-only table) follows the same conventions. */
export function WeeklySessionsChart({ data }: { data: WeekSessions[] }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.sessions), 1);
  const ticks = niceTicks(0, maxValue);
  const scaleMax = ticks.at(-1)!;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  function yFor(value: number) {
    return PAD_TOP + (1 - value / scaleMax) * plotHeight;
  }

  const slotWidth = (WIDTH - PAD_LEFT - PAD_RIGHT) / data.length;
  const barWidth = Math.min(28, slotWidth * 0.55);

  const bars = data.map((d, i) => {
    const cx = PAD_LEFT + slotWidth * (i + 0.5);
    const y = yFor(d.sessions);
    return { ...d, cx, y, x: cx - barWidth / 2, height: HEIGHT - PAD_BOTTOM - y };
  });

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    bars.forEach((b, i) => {
      const dist = Math.abs(b.cx - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? bars[hoverIndex] : null;

  return (
    <div className="space-y-1">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          role="img"
          aria-label="Sessions per week"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BAR_TOP} />
              <stop offset="100%" stopColor={BAR_BOTTOM} />
            </linearGradient>
          </defs>

          {ticks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={WIDTH - PAD_RIGHT}
                  y2={y}
                  stroke="#2c2c2a"
                  strokeWidth={1}
                  strokeDasharray="2,3"
                />
                <text
                  x={PAD_LEFT - 6}
                  y={y}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-zinc-500"
                  fontSize={9}
                >
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}

          {bars.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={barWidth}
              height={Math.max(b.height, 1.5)}
              rx={6}
              fill={`url(#${gradientId})`}
              opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.55}
            />
          ))}

          {bars.map((b, i) => (
            <text
              key={i}
              x={b.cx}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-zinc-500"
              fontSize={9}
            >
              {formatDate(b.weekStart)}
            </text>
          ))}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-xs shadow-lg"
            style={{
              left: `${(hovered.cx / WIDTH) * 100}%`,
              top: `${(hovered.y / HEIGHT) * 100}%`,
            }}
          >
            <p className="font-semibold text-zinc-100">
              {hovered.sessions} {hovered.sessions === 1 ? "sessão" : "sessões"}
            </p>
            <p className="text-zinc-500">{formatDate(hovered.weekStart)}</p>
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>Sessions per week</caption>
        <thead>
          <tr>
            <th>Week</th>
            <th>Sessions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.weekStart}</td>
              <td>{d.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
