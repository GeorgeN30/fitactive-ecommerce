import Header from "./Header";
import Footer from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-light-bg dark:bg-brand-dark-bg text-slate-800 dark:text-slate-200 flex flex-col justify-between">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
