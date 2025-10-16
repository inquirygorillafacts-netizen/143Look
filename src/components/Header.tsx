import Link from 'next/link';
import { PanelsTopLeft } from 'lucide-react';

const Header = () => {
  return (
    <header className="w-full py-6 px-4 md:px-8 z-10">
      <nav className="max-w-6xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <PanelsTopLeft className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold">Stellar Links</span>
        </Link>
        <Link
          href="/analytics"
          className="text-sm font-medium text-neutral-300 hover:text-primary transition-colors"
        >
          Analytics
        </Link>
      </nav>
    </header>
  );
};

export default Header;
