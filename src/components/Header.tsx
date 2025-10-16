import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="py-4 px-6 md:px-8 bg-transparent absolute top-0 left-0 right-0 z-20">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
        >
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-headline font-bold">Cosmic Links</span>
        </Link>
        <Link
          href="/analytics"
          className="font-bold text-sm text-white hover:text-purple-400 transition-colors"
        >
          Analytics
        </Link>
      </nav>
    </header>
  );
};

export default Header;
