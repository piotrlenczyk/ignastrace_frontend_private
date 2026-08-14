import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { SessionProvider } from '@/contexts/session-context';
import type { SessionUser } from '@/server/session/session.types';

import { useSession } from './use-session';

const MEMBER: SessionUser = {
  id: 'user-1',
  email: 'member@example.com',
  type: 'USER',
  roles: ['STANDARD_USER'],
};

/** What the root layout renders: the identity out of the sealed session, or none. */
const rendered = (user: SessionUser | null) => {
  const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider user={user}>{children}</SessionProvider>;

  return renderHook(() => useSession(), { wrapper });
};

describe('useSession', () => {
  it('reports a visitor the server rendered no session for as signed out', () => {
    const { result } = rendered(null);

    expect(result.current).toEqual({ session: null, isSignedIn: false });
  });

  it('reports the identity the server rendered', () => {
    const { result } = rendered(MEMBER);

    expect(result.current).toEqual({ session: { user: MEMBER }, isSignedIn: true });
  });

  it('reports a session carrying nothing but an id as signed in all the same', () => {
    const { result } = rendered({ id: 'user-1' });

    expect(result.current).toEqual({ session: { user: { id: 'user-1' } }, isSignedIn: true });
  });

  it('carries nothing a page script could authenticate with', () => {
    const { result } = rendered(MEMBER);

    expect(Object.keys(result.current.session!)).toEqual(['user']);
  });

  it('follows the identity a fresh server render supplies', () => {
    const Identity = () => {
      const { session, isSignedIn } = useSession();

      return <span data-testid="identity">{isSignedIn ? session?.user.email : 'signed out'}</span>;
    };
    const tree = (user: SessionUser | null) => (
      <SessionProvider user={user}>
        <Identity />
      </SessionProvider>
    );

    const { rerender } = render(tree(MEMBER));

    expect(screen.getByTestId('identity')).toHaveTextContent('member@example.com');

    rerender(tree(null));

    expect(screen.getByTestId('identity')).toHaveTextContent('signed out');
  });

  it('refuses to report a session outside the provider, rather than inventing one', () => {
    expect(() => renderHook(() => useSession())).toThrow('useSession must be used inside a SessionProvider');
  });
});
