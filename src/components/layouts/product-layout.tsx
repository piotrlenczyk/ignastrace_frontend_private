'use client';

import { FooterNav } from './product-layout/footer-nav';
import { HeaderNav } from './product-layout/header-nav';
import HeaderNavVertical from './product-layout/header-nav-vertical';

/**
 * The badge is zero until the new API publishes a notification count.
 * `/api/v1/user/me` answers with the account and nothing about notifications,
 * and no endpoint in the specification carries the tally the legacy
 * `GET /user` used to return alongside the profile.
 */
const UNREAD_COUNT = 0;

const ProductLayout = ({ children }: { children: React.ReactNode }) => {
  // TODO: [refactor] get unread count from new API
  // const { data } = useGetUser();
  // const unreadCount = data ? data.unread_count : 0;

  return (
    <div className="layout-default lg:layout-desktop">
      <HeaderNavVertical unreadCount={UNREAD_COUNT} />
      <HeaderNav unreadCount={UNREAD_COUNT} />
      {children}
      <FooterNav />
    </div>
  );
};

export default ProductLayout;
