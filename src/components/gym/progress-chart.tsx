"use client";

import { useId, useState } from "react";
import type { ProgressPoint } from "@/lib/gym/derive";

const WIDTH = 320;
const HEIGHT = 150;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const PAD_LEFT = 34;
const PAD_RIGHT = 8;
const DEFAULT_COLOR = "#818cf8";
const MAX_X_LABELS = 6;

function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

function defaultFormatValue(unit: string) {
  return (value: number) => {
    const rounded = Math.round(value);
    return rounded >= 1000
      ? `${(rounded / 1000).toFixed(1)}k${unit}`
      : `${rounded}${unit}`;
  };
}

/** Rounds a [min, max] range out to "nice" step boundaries (1/2/5 × a
 * power of 10) and returns the tick values — the standard approach so
 * axis labels read as round numbers instead of raw data extremes. */
function niceTicks(dataMin: number, dataMax: number, count = 4): number[] {
  const min = dataMin === dataMax ? dataMin - 1 : dataMin;
  const max = dataMin === dataMax ? dataMax + 1 : dataMax;
  const roughStep = (max - min) / (count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  const niceStep =
    (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;

  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep / 2; v += niceStep) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

/** Evenly-spaced indices to label on the X axis — every point if there
 * are few, thinned out to avoid overlapping text once there are many. */
function pickLabelIndices(count: number, max = MAX_X_LABELS): number[] {
  if (count <= max) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (max - 1);
  const indices = new Set<number>();
  for (let i = 0; i < max; i++) indices.add(Math.round(i * step));
  return [...indices].sort((a, b) => a - b);
}

/** A smooth (Catmull-Rom-derived) cubic-bezier path through every point,
 * instead of straight segments — reads as a trend line rather than a
 * sequence of exact angles. */
function smoothLinePath(coords: { x: number; y: number }[]): string {
  if (coords.length < 2) return "";
  if (coords.length === 2) {
    return `M ${coords[0].x} ${coords[0].y} L ${coords[1].x} ${coords[1].y}`;
  }
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function ProgressChart({
  points,
  unit = "",
  color = DEFAULT_COLOR,
  formatValue,
}: {
  points: ProgressPoint[];
  unit?: string;
  /** Hex line/fill color — lets different stat cards use different
   * accents (e.g. violet for total strength, amber for a single
   * exercise's 1RM) while sharing this one chart implementation. */
  color?: string;
  /** Custom formatter for every number shown (ticks, the last-point
   * label, the hover tooltip, the sr-only table) — e.g. swim times as
   * "1:23" instead of a raw "83s". Defaults to a rounded number plus
   * `unit`. */
  formatValue?: (value: number) => string;
}) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const format = formatValue ?? defaultFormatValue(unit);

  if (points.length < 2) {
    const message =
      points.length === 0
        ? "Log at least two sessions to see your progress"
        : "1 more session to see your progress";
    return (
      <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/40 text-center">
        <span className="text-xl">📈</span>
        <p className="px-4 text-sm text-zinc-500">{message}</p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const scaleMin = ticks[0];
  const scaleMax = ticks.at(-1)!;
  const scaleRange = scaleMax - scaleMin || 1;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  function yFor(value: number) {
    return PAD_TOP + (1 - (value - scaleMin) / scaleRange) * plotHeight;
  }

  const xStep = (WIDTH - PAD_LEFT - PAD_RIGHT) / (points.length - 1);
  const coords = points.map((p, i) => ({
    ...p,
    x: PAD_LEFT + i * xStep,
    y: yFor(p.value),
  }));

  const linePath = smoothLinePath(coords);
  const areaPath = `${linePath} L ${coords.at(-1)!.x} ${HEIGHT - PAD_BOTTOM} L ${coords[0].x} ${HEIGHT - PAD_BOTTOM} Z`;
  const labelIndices = pickLabelIndices(coords.length);

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
                  {format(tick)}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hovered && (
            <line
              x1={hovered.x}
              y1={PAD_TOP}
              x2={hovered.x}
              y2={HEIGHT - PAD_BOTTOM}
              stroke={color}
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          )}

          {coords.map((c, i) => {
            const isLast = i === coords.length - 1;
            const isHovered = i === hoverIndex;
            const emphasized = isLast || isHovered;
            return (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={emphasized ? 4 : 2.5}
                fill={color}
                stroke="#0a0a0a"
                strokeWidth={emphasized ? 2 : 1.5}
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
            {format(lastPoint.value)}
          </text>

          {labelIndices.map((i) => {
            const c = coords[i];
            const anchor =
              i === 0 ? "start" : i === coords.length - 1 ? "end" : "middle";
            return (
              <text
                key={i}
                x={c.x}
                y={HEIGHT - 8}
                textAnchor={anchor}
                className="fill-zinc-500"
                fontSize={9}
              >
                {formatDate(c.date)}
              </text>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-xs shadow-lg"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              top: `${(hovered.y / HEIGHT) * 100}%`,
            }}
          >
            <p className="font-semibold text-zinc-100">
              {format(hovered.value)}
            </p>
            <p className="text-zinc-500">{formatDate(hovered.date)}</p>
          </div>
        )}
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
          {points.map((p, i) => (
            <tr key={i}>
              <td>{p.date}</td>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
