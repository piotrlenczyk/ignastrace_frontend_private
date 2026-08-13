import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';

import { Logotype } from '../logotype';

type FunnelLayoutProps = {
  children: React.ReactNode;
  positionMobileHeader?: 'sticky' | 'static';
  showLogoLink?: boolean;
  isReverseLookup?: boolean;
};

const FunnelLayout: React.FC<FunnelLayoutProps> = async ({
  children,
  positionMobileHeader = 'sticky',
  showLogoLink = true,
  isReverseLookup = false,
}) => {
  const logoHref = isReverseLookup ? ROUTES.REVERSE_LOOKUP.HOME : ROUTES.HOME;

  return (
    <div className="layout-default" style={{ '--s-header--position': positionMobileHeader } as React.CSSProperties}>
      <header className="s-header">
        <nav className="s-header-nav">
          <div className="mr-auto flex items-center space-x-4">
            {showLogoLink ? (
              <Link href={logoHref} className="text-2xl font-bold text-primary">
                <Logotype />
              </Link>
            ) : (
              <div className="text-2xl font-bold text-primary">
                <Logotype />
              </div>
            )}
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
};

export default FunnelLayout;
