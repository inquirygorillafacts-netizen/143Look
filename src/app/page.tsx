import { ReelForm } from '@/components/ReelForm';

export default function Home() {
  return (
    <div className="relative flex-grow flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl opacity-50" />

      <div className="w-full max-w-md text-center z-10">
        <h1 className="font-headline text-5xl md:text-6xl font-bold">
          <span className="text-primary">Reel</span>
          <span className="text-foreground">Direct</span>
        </h1>
        <p className="mt-4 text-lg text-foreground/80 max-w-sm mx-auto">
          Saw a product in a Reel? Enter the number below and go straight to the
          product page.
        </p>
        <div className="mt-8">
          <ReelForm />
        </div>
      </div>
    </div>
  );
}
