import { NavbarV2 } from '../navigation/v2/navbar';
import { FooterV2 } from './v2/footer';

type WebsiteLayoutV2Props = {
  children: React.ReactNode;
};

/*
 * The new-design shell.
 *
 * This exists rather than swapping `NavbarV2` into website-layout.tsx because that
 * layout is rendered by every page still on the legacy design — changing it would
 * restyle ~15 screens that have not been rebuilt or reviewed. The two layouts
 * coexist the way the two stylesheets do, and this one takes over as each screen
 * lands (ADR 0005).
 *
 */
const WebsiteLayoutV2: React.FC<WebsiteLayoutV2Props> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-bg-primary">
      <NavbarV2 />
      {children}
      <FooterV2 />
    </div>
  );
};

export default WebsiteLayoutV2;
