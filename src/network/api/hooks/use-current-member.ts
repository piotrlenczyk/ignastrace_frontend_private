'use client';

import { useMemo } from 'react';

import { composeMember } from '@/libs/membership-mock';

import { useCurrentUserQuery } from './use-current-user-query';

/**
 * The signed-in member as a page script sees one: the account read through the
 * proxy, stitched together with the membership facts no endpoint publishes yet.
 *
 * The browser-side twin of the server composer in the subscription policy module,
 * and the same bargain — the result is the shape the screens already read, so
 * migrating a call site is one line, and the merge lives in one function that goes
 * away when the commercial endpoints arrive.
 *
 * `data` is undefined until the account has been read, and stays undefined for a
 * visitor who is not signed in, because the query underneath does not fire for
 * one. A caller that has a decision to make must handle that state rather than
 * treat it as an answer.
 */
export const useCurrentMember = () => {
  const { data, ...rest } = useCurrentUserQuery();

  // Composed once per answer rather than once per render: the result is a fresh
  // object every time, and a consumer holding it in a dependency list would
  // otherwise see it change on every render of its parent.
  const member = useMemo(() => (data ? composeMember(data) : undefined), [data]);

  return { ...rest, data: member };
};
