/**
 * Copies out only the named headers, dropping everything else.
 *
 * Both proxies are built on allow-lists rather than deny-lists, in both
 * directions: what the browser may influence upstream, and what the upstream
 * answer may set on this origin. A header nobody named does not travel, so
 * adding one is a deliberate edit rather than something a backend can decide.
 */
export const pickHeaders = (headers: Headers, allowed: readonly string[]): Headers => {
  const picked = new Headers();

  for (const name of allowed) {
    const value = headers.get(name);

    if (value !== null) {
      picked.set(name, value);
    }
  }

  return picked;
};
