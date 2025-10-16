import Link from 'next/link';

const Header = () => {
  return (
    <header className="w-full py-6 px-4 md:px-8 z-10 bg-background/80 backdrop-blur-sm sticky top-0">
      <nav className="max-w-6xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <span className="text-3xl font-black tracking-tighter">
            <span className="text-primary">143</span>look
          </span>
        </Link>
        <Link
          href="/analytics"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Analytics
        </Link>
      </nav>
    </header>
  );
};

export default Header;
