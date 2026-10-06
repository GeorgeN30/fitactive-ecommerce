export const PRODUCTS_PER_PAGE = 5;

export function paginateProducts<T>(
  products: T[],
  page: number,
  pageSize = PRODUCTS_PER_PAGE,
): T[] {
  const safePageSize = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : PRODUCTS_PER_PAGE;
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const startIndex = (safePage - 1) * safePageSize;
  return products.slice(startIndex, startIndex + safePageSize);
}
