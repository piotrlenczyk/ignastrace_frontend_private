import { Footer } from '../footer';
import { Navbar } from '../navigation/navbar';

type WebsiteLayoutProps = {
  children: React.ReactNode;
};

const WebsiteLayout: React.FC<WebsiteLayoutProps> = async ({ children }) => {
  return (
    <div className="layout-default">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
};

export default WebsiteLayout;
