/**
 * PostgREST (and so Supabase) caps every response at `max_rows` — 1000 by
 * default, see supabase/config.toml. A query for "every row" past that
 * point doesn't fail, it just silently returns the first 1000. Anything
 * that reads a user's full history goes through this helper instead,
 * which keeps asking for the next page until one comes back short.
 *
 * PAGE_SIZE must not be larger than max_rows: a page capped at max_rows
 * would look "short" and stop the loop early.
 */
const PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PageResult<T>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}