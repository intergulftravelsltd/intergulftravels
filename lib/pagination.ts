/* ------------------------------------------------------------------ *
 *  URL-driven pagination shared by every long list in the console.
 *  ?page=N&per=25 — plain module (no 'use client') so server pages slice
 *  their rows and the client <Pagination> bar renders the controls.
 * ------------------------------------------------------------------ */

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PER_PAGE = 25;

export type Paging = { page: number; per: number };

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pages: number;
  per: number;
  /** 1-based index of the first row on this page (0 when empty). */
  start: number;
  /** 1-based index of the last row on this page. */
  end: number;
  isFirst: boolean;
  isLast: boolean;
};

export function parsePaging(sp: { page?: string; per?: string } | undefined, defaultPer = DEFAULT_PER_PAGE): Paging {
  const perRaw = Number(sp?.per);
  const per = (PAGE_SIZES as readonly number[]).includes(perRaw) ? perRaw : defaultPer;
  const page = Math.max(1, Math.floor(Number(sp?.page) || 1));
  return { page, per };
}

export function paginate<T>(rows: T[], paging: Paging): Paged<T> {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / paging.per));
  const page = Math.min(paging.page, pages);
  const startIdx = (page - 1) * paging.per;
  const items = rows.slice(startIdx, startIdx + paging.per);
  return {
    items,
    total,
    page,
    pages,
    per: paging.per,
    start: total ? startIdx + 1 : 0,
    end: startIdx + items.length,
    isFirst: page === 1,
    isLast: page === pages,
  };
}
