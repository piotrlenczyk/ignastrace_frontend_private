'use client';

import { useUnreadNotificationCountQuery } from '@/network/api/hooks/use-unread-notification-count-query';

import { FooterNav } from './product-layout/footer-nav';
import { HeaderNav } from './product-layout/header-nav';
import HeaderNavVertical from './product-layout/header-nav-vertical';

const ProductLayout = ({ children }: { children: React.ReactNode }) => {
  /*
   * The member's real unread count, rather than the hard-coded three the mocked
   * membership answered with for every signed-in member. Nothing is shown until
   * it has been read: an unknown count draws no badge, which is the same picture
   * as none to read.
   */
  const { data } = useUnreadNotificationCountQuery();
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="layout-default lg:layout-desktop">
      <HeaderNavVertical unreadCount={unreadCount} />
      <HeaderNav unreadCount={unreadCount} />
      {children}
      <FooterNav />
    </div>
  );
};

export default ProductLayout;
