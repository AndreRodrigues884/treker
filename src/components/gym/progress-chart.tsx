"use client";

import { useId, useState } from "react";
import type { ProgressPoint } from "@/lib/gym/derive";

const WIDTH = 320;
const HEIGHT = 120;
const PAD_X = 10;
const PAD_Y = 18;

function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

function formatValue(value: number, unit: string) {
  const rounded = Math.round(value);
  return rounded >= 1000
    ? `${(rounded / 1000).toFixed(1)}k${unit}`
    : `${rounded}${unit}`;
}

export function ProgressChart({
  points,
  unit = "",
}: {
  points: ProgressPoint[];
  unit?: string;
}) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) {
    const message =
      points.length === 0
        ? "Log at least two sessions to see your progress"
        : "1 more session to see your progress";
    return (
      <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
        <span className="text-xl">📈</span>
        <p className="px-4 text-sm text-zinc-500">{message}</p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xStep = (WIDTH - PAD_X * 2) / (points.length - 1);
  const coords = points.map((p, i) => ({
    ...p,
    x: PAD_X + i * xStep,
    y: PAD_Y + (1 - (p.value - min) / range) * (HEIGHT - PAD_Y * 2),
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${coords.at(-1)!.x} ${HEIGHT - PAD_Y} L ${coords[0].x} ${HEIGHT - PAD_Y} Z`;

  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;
  const lastPoint = coords.at(-1)!;

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          role="img"
          aria-label="Progress chart"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <line
            x1={PAD_X}
            y1={PAD_Y}
            x2={WIDTH - PAD_X}
            y2={PAD_Y}
            stroke="#2c2c2a"
            strokeWidth={1}
          />
          <line
            x1={PAD_X}
            y1={HEIGHT - PAD_Y}
            x2={WIDTH - PAD_X}
            y2={HEIGHT - PAD_Y}
            stroke="#2c2c2a"
            strokeWidth={1}
          />

          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke="#818cf8"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hovered && (
            <line
              x1={hovered.x}
              y1={PAD_Y}
              x2={hovered.x}
              y2={HEIGHT - PAD_Y}
              stroke="#818cf8"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          )}

          {coords.map((c, i) => {
            const isLast = i === coords.length - 1;
            const isHovered = i === hoverIndex;
            if (!isLast && !isHovered) return null;
            return (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={4}
                fill="#818cf8"
                stroke="#0a0a0a"
                strokeWidth={2}
              />
            );
          })}

          <text
            x={lastPoint.x}
            y={lastPoint.y - 8}
            textAnchor="end"
            className="fill-zinc-300"
            fontSize={11}
          >
            {formatValue(lastPoint.value, unit)}
          </text>
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs shadow-lg"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              top: `${(hovered.y / HEIGHT) * 100}%`,
            }}
          >
            <p className="font-semibold text-zinc-100">
              {formatValue(hovered.value, unit)}
            </p>
            <p className="text-zinc-500">{formatDate(hovered.date)}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-zinc-500">
        <span>{formatDate(coords[0].date)}</span>
        <span>{formatDate(lastPoint.date)}</span>
      </div>

      <table className="sr-only">
        <caption>Progress per session</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>
                {p.value}
                {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
