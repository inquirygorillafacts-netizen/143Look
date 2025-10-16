import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="py-4 px-6 md:px-8 border-b border-foreground/5 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-headline font-bold">Aura.Creative</span>
        </Link>
        <Link
          href="/analytics"
          className="font-bold text-sm text-foreground hover:text-primary transition-colors"
        >
          Analytics
        </Link>
      </nav>
    </header>
  );
};

export default Header;
