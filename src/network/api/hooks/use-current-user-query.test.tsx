import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionProvider } from '@/contexts/session-context';
import type { SessionUser } from '@/server/session/session.types';

import { API_PROXY_BASE_PATH } from '../api-proxy-path';

/*
 * A relative URL resolves against the document in a browser. jsdom implements no
 * fetch, so these tests are handed Node's `Request` instead, and that one rejects
 * a relative URL outright — which is a property of the test environment and not
 * of the client. Resolving it here is what puts the browser's behaviour back.
 */
const NodeRequest = globalThis.Request;

vi.stubGlobal(
  'Request',
  class extends NodeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(typeof input === 'string' ? new URL(input, window.location.origin) : input, init);
    }
  },
);

/*
 * The network, substituted once and for the whole file: the generated client
 * captures `globalThis.fetch` — and `globalThis.Request` — when it is created,
 * and the hook pulls that client in transitively, so both substitutes have to be
 * in place before the module under test is imported.
 */
const sentRequests: Request[] = [];

const PROFILE = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'member@example.com',
  name: 'John Doe',
  isBlocked: false,
  unlimitedPdfDownloadsUnlocked: false,
  type: 'USER',
  status: 'ACTIVE',
  photo: null,
} as const;

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return Response.json(PROFILE);
});

/** Imported after the network is in place, for the reason above. */
const { useCurrentUserQuery } = await import('./use-current-user-query');

/** Where the profile is answered from: this origin, under the proxy's mount. */
const PROFILE_URL = `${window.location.origin}${API_PROXY_BASE_PATH}/api/v1/user/me`;

const SIGNED_IN: SessionUser = { id: PROFILE.id, email: PROFILE.email, type: 'USER', roles: ['STANDARD_USER'] };

const wrapperFor = (user: SessionUser | null) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <SessionProvider user={user}>{children}</SessionProvider>
      </QueryClientProvider>
    );
  };

beforeEach(() => {
  sentRequests.length = 0;
  document.documentElement.lang = 'en';
});

describe('the current user', () => {
  it('reads the profile from the current-user path, under the proxy’s mount', async () => {
    const { result } = renderHook(() => useCurrentUserQuery(), { wrapper: wrapperFor(SIGNED_IN) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sentRequests).toHaveLength(1);
    expect(sentRequests[0]?.url).toBe(PROFILE_URL);
    expect(sentRequests[0]?.method).toBe('GET');
    expect(result.current.data).toEqual(PROFILE);
  });

  it('sends nothing at all when nobody is signed in', async () => {
    renderHook(() => useCurrentUserQuery(), { wrapper: wrapperFor(null) });

    /*
     * A request the hook was going to make it makes on mount, so a turn of the
     * event loop is long enough for one to show up if the gate is gone. The case
     * above is the control: the same wrapper does send for a signed-in member.
     */
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sentRequests).toHaveLength(0);
  });
});
