import WebsiteLayout from '@/components/layouts/website-layout';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebsiteLayout>
      <main className="s-main p-6">
        <div className="container-wide content-html">
          {children}
        </div>
      </main>
    </WebsiteLayout>
  );
}
