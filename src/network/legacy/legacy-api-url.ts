/**
 * The one host the legacy backend is reached at, including the path prefix it
 * mounts its endpoints under. `INTERNAL_API_URL` names it by its container host
 * and wins where a deployment sets one; the public variable is the fallback.
 *
 * `NEXT_PUBLIC_API_URL` keeps its name because renaming it would be a
 * deployment change, not because a page script may read it — since the legacy
 * proxy, this value is only ever read on the server.
 *
 * Read through a function rather than a module constant so that a test can put
 * an environment in place before the first call.
 */
export const legacyApiUrl = (): string => process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || '';
