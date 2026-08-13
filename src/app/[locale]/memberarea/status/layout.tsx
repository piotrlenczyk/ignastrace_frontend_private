import ProductLayout from '@/components/layouts/product-layout';

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductLayout>
      <main className="s-main">
        <div className="flex min-h-full flex-col">{children}</div>
      </main>
    </ProductLayout>
  );
}
