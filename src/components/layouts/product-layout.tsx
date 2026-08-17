'use client';

import { useCurrentMember } from '@/network/api/hooks/use-current-member';

import { FooterNav } from './product-layout/footer-nav';
import { HeaderNav } from './product-layout/header-nav';
import HeaderNavVertical from './product-layout/header-nav-vertical';

const ProductLayout = ({ children }: { children: React.ReactNode }) => {
  const { data } = useCurrentMember();
  const unreadCount = data?.unread_count ?? 0;

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
