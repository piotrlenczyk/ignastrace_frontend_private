'use client';

import { $api } from '../api-browser-client';

/**
 * Marks the notifications the member has been shown as read.
 *
 * The write takes the ids explicitly and offers no "mark all", where the legacy
 * call it replaces took an empty body and marked everything. So the screen sends
 * the unread ids of the pages it actually loaded, and "read" means "shown to
 * you" — the truer of the two claims. Walking the whole cursor first to
 * reconstruct "everything" is an unbounded number of upstream calls inside one
 * screen open, which is the cost the activity list refused for the same reason.
 *
 * A mutation rather than a server action because marking read sets no cookie,
 * causes no navigation and changes nothing rendered on the server. It does change
 * the header badge, which is a query of its own, so the call site invalidates
 * that key — rather than setting the count to zero by hand, which would be wrong
 * whenever unread notifications sit behind the cursor.
 */
export const useMarkNotificationsReadMutation = () => $api.useMutation('put', '/api/v1/notification/center/read');
