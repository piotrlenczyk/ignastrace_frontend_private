'use client';

import { useGetUser } from '@/hooks/api/use-user';

import { FooterNav } from './product-layout/footer-nav';
import { HeaderNav } from './product-layout/header-nav';
import HeaderNavVertical from './product-layout/header-nav-vertical';

const ProductLayout = ({ children }: { children: React.ReactNode }) => {
  const { data } = useGetUser();
  const unreadCount = data ? data.unread_count : 0;

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
