/** Shared, chart-library-agnostic helpers for the app's hand-rolled SVG
 * charts (ProgressChart, WeeklySessionsChart) — no React here, just the
 * math/formatting every chart needs the same way. */

/** "YYYY-MM-DD" → "DD/MM", the date label used on every chart's x-axis. */
export function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

/** Rounds a [min, max] range out to "nice" step boundaries (1/2/5 × a
 * power of 10) and returns the tick values — the standard approach so
 * axis labels read as round numbers instead of raw data extremes. */
export function niceTicks(dataMin: number, dataMax: number, count = 4): number[] {
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
