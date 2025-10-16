import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="w-full py-6 px-4 md:px-8 z-10 bg-background/80 backdrop-blur-sm sticky top-0 border-b border-border/20">
      <nav className="max-w-6xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <div className="text-3xl font-black tracking-tighter">
            <span className="font-poppins font-light text-primary">1</span>
            <span className="font-poppins font-bold text-primary">4</span>
            <span className="font-poppins font-normal italic text-primary">3</span>
            <span className="text-foreground">look</span>
          </div>
        </Link>
        <Link href="/analytics" passHref>
          <Button variant="ghost">Analytics</Button>
        </Link>
      </nav>
    </header>
  );
};

export default Header;
