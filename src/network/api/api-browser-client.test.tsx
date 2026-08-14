import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
 * The network, substituted once and for the whole file rather than per test: the
 * generated client captures `globalThis.fetch` — and `globalThis.Request` — when
 * it is created, so a stub installed later would never be the one it uses. Each
 * test swaps what the answer is instead of swapping the function.
 */
const sentRequests: Request[] = [];
let respond: (request: Request) => Promise<Response> = async () => new Response(null, { status: 204 });

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return respond(request);
});

/** Imported after the network is in place, for the reason above. */
const { apiQueries } = await import('./api-browser-client');

const CONTACT_PATH = '/api/v1/support/contact-us';

const MESSAGE = {
  name: 'Ada',
  surname: 'Lovelace',
  email: 'ada@example.com',
  message: 'The form works.',
  subject: 'TECHNICAL',
} as const;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

/**
 * A mutation driven the way a screen drives it, so what these tests exercise is
 * the client, the hooks and react-query together rather than the client alone.
 */
const sendMessage = async (options: { onError?: () => void } = {}) => {
  const { result } = renderHook(() => apiQueries.useMutation('post', CONTACT_PATH, options), { wrapper });

  result.current.mutate({ body: MESSAGE });

  await waitFor(() => expect(result.current.isPending).toBe(false));

  return result;
};

/** The one request the client made, or a failure saying it made none. */
const sentRequest = () => {
  const [request] = sentRequests;

  if (!request) {
    throw new Error('No request was sent.');
  }

  return request;
};

beforeEach(() => {
  sentRequests.length = 0;
  respond = async () => new Response(null, { status: 204 });
  document.documentElement.lang = 'en';
});

describe('the browser client', () => {
  it('sends a specification path to this origin, where the proxy answers', async () => {
    await sendMessage();

    expect(sentRequests).toHaveLength(1);
    expect(sentRequest().url).toBe(`${window.location.origin}${CONTACT_PATH}`);
    expect(sentRequest().method).toBe('POST');
  });

  it('sends the body the caller gave, as JSON', async () => {
    await sendMessage();

    expect(sentRequest().headers.get('content-type')).toBe('application/json');
    await expect(sentRequest().json()).resolves.toEqual(MESSAGE);
  });

  it('carries no credential of its own — the proxy attaches the bearer', async () => {
    await sendMessage();

    expect(sentRequest().headers.has('authorization')).toBe(false);
  });

  it('states the language the page was rendered in', async () => {
    document.documentElement.lang = 'es';

    await sendMessage();

    expect(sentRequest().headers.get('x-locale')).toBe('es');
  });

  it('states no language when the document declares none', async () => {
    document.documentElement.lang = '';

    await sendMessage();

    expect(sentRequest().headers.has('x-locale')).toBe(false);
  });

  it('leaves a locale the caller chose alone', async () => {
    const { result } = renderHook(() => apiQueries.useMutation('post', CONTACT_PATH), { wrapper });

    result.current.mutate({ body: MESSAGE, headers: { 'x-locale': 'es' } });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(sentRequest().headers.get('x-locale')).toBe('es');
  });
});

describe('a call through the query hooks', () => {
  it('succeeds on a response that has no body', async () => {
    const result = await sendMessage();

    expect(result.current.isSuccess).toBe(true);
  });

  it('fails with the envelope the API described', async () => {
    const error = { message: 'Too many messages.', errorCode: 'RATE_LIMIT_EXCEEDED', code: 'TOO_MANY_REQUESTS' };

    respond = async () => Response.json({ error }, { status: 429 });

    const result = await sendMessage();

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual({ error });
  });

  it('reports a refusal to the call site rather than handling it centrally', async () => {
    respond = async () =>
      Response.json({ error: { errorCode: 'UNAUTHORIZED', code: 'UNAUTHORIZED' } }, { status: 401 });

    const onError = vi.fn();

    await sendMessage({ onError });

    expect(onError).toHaveBeenCalledOnce();
  });
});
