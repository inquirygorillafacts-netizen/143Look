import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative flex-grow flex flex-col items-center justify-center p-4 overflow-hidden text-center">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl opacity-50 animate-pulse delay-2000" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl opacity-40 animate-pulse delay-4000" />

      <div className="w-full max-w-3xl z-10">
        <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tighter">
          <span className="text-primary">Aura</span>
          <span className="text-foreground">.Creative</span>
        </h1>
        <p className="mt-6 text-xl text-foreground/80 max-w-xl mx-auto">
          Crafting digital experiences that captivate, inspire, and elevate.
        </p>
        <div className="mt-10">
          <Button size="lg">
            Explore Our Work <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
