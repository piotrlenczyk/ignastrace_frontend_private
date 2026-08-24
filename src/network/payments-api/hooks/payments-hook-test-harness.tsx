import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

/*
 * The environment every payments hook test needs, in one place: a browser-shaped
 * `Request`, a substituted network, and a query client that does not retry.
 *
 * It is a module rather than a copy in each test file because the shim is
 * indifferent to which hook is under test — the three files that had it verbatim
 * shared not only the shape but the comments. Extracting it also fixes the trap
 * in it: the stubs have to be installed *before* the module under test is
 * imported, and a static import of this harness is evaluated before the importing
 * file's own body, so `await import('./the-hook')` in a test is late enough by
 * construction rather than by the author remembering.
 *
 * Not named `*.test.tsx`, so the runner does not collect it as a suite of its own.
 */

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

/** Every request a hook has sent since the last reset, oldest first. */
export const sentRequests: Request[] = [];

/**
 * What the substituted network answers next. A test swaps the answer rather than
 * the function, because the generated client captures `globalThis.fetch` — and
 * `globalThis.Request` — once, when it is created.
 */
let respond: () => Promise<Response> = async () => Response.json({ message: 'Operation success' }, { status: 201 });

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return respond();
});

/** Forgets what was sent and sets what the service answers next. */
export const resetNetwork = (answer?: () => Promise<Response>) => {
  sentRequests.length = 0;
  respond = answer ?? (async () => Response.json({ message: 'Operation success' }, { status: 201 }));
};

/** Answers the next call with this, for the one test that needs a refusal or a richer body. */
export const answerWith = (answer: () => Promise<Response>) => {
  respond = answer;
};

/** The one request the hook made, or a failure saying it made none. */
export const sentRequest = () => {
  const [request] = sentRequests;

  if (!request) {
    throw new Error('No request was sent.');
  }

  return request;
};

/** A query client that lets a refusal be a refusal instead of retrying it away. */
export const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);
