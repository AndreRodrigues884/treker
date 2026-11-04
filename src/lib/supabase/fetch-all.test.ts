import { describe, expect, it } from "vitest";
import { fetchAllRows } from "./fetch-all";

function fakeTable(total: number) {
  const rows = Array.from({ length: total }, (_, i) => i);
  const calls: [number, number][] = [];
  const fetchPage = (from: number, to: number) => {
    calls.push([from, to]);
    return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
  };
  return { fetchPage, calls };
}

describe("fetchAllRows", () => {
  it("returns everything when it fits in one page", async () => {
    const { fetchPage, calls } = fakeTable(10);
    expect(await fetchAllRows(fetchPage)).toHaveLength(10);
    expect(calls).toEqual([[0, 999]]);
  });

  it("keeps paging past the 1000-row cap", async () => {
    const { fetchPage, calls } = fakeTable(2500);
    const rows = await fetchAllRows(fetchPage);
    expect(rows).toHaveLength(2500);
    expect(rows[2499]).toBe(2499);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("asks for one extra empty page on an exact multiple", async () => {
    const { fetchPage, calls } = fakeTable(1000);
    expect(await fetchAllRows(fetchPage)).toHaveLength(1000);
    expect(calls).toHaveLength(2);
  });

  it("throws instead of returning a partial list on error", async () => {
    await expect(
      fetchAllRows(() =>
        Promise.resolve({ data: null, error: { message: "boom" } }),
      ),
    ).rejects.toThrow("boom");
  });
});