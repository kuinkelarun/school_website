import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PublicLoadingGate } from '@/components/public/PublicLoadingGate';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicLoadingGate>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </PublicLoadingGate>
  );
}
