/*
 * Next 16's generated `PageProps` types every search param as
 * `string | string[] | undefined`, because a query string is free to repeat a
 * key. The hand-written prop types this replaced declared `string | undefined`
 * and were simply wrong about it.
 *
 * Every caller in this codebase wants one value, and the first one is what a
 * repeated key already resolved to in practice.
 */
export const firstValue = (param: string | string[] | undefined): string | undefined =>
  Array.isArray(param) ? param[0] : param;
