'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { reelLinks } from '@/lib/reel-data';
import { Copy, Share2, ExternalLink, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { testimonials } from '@/lib/testimonials';

export default function Home() {
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSearch = () => {
    setError('');
    const foundLink = reelLinks[code];
    if (foundLink) {
      setLink(foundLink);
    } else {
      setLink('');
      setError('Invalid code. Please try again.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied!',
      description: 'The link has been copied to your clipboard.',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this look on 143look',
        url: link,
      });
    } else {
       handleCopy();
    }
  };
  
  const handleRedirect = () => {
    if(link) {
      window.open(link, '_blank');
    }
  }

  return (
    <>
      <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
        <div className="z-10 flex flex-col items-center w-full">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-foreground">
            Find Your Look.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-lg mb-8 px-4">
            Saw something you loved in a Reel? Enter the code below to get the direct link to the product.
          </p>

          <div className="flex w-full max-w-xs sm:max-w-sm items-center space-x-2 mb-4 px-4">
            <Input
              type="text"
              placeholder="Enter Reel Code..."
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-12 text-base border-border focus:ring-primary text-center"
            />
            <Button
              size="icon"
              onClick={handleSearch}
              className="h-12 w-12 flex-shrink-0 bg-primary hover:bg-primary/90"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          {link && (
            <Card className="w-full max-w-xs sm:max-w-sm mt-8 bg-card border-border/50 shadow-lg">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground break-words mb-4 text-left p-2 bg-secondary rounded-md">
                  {link}
                </p>
                <div className="flex justify-center space-x-2 flex-wrap gap-2">
                   <Button variant="ghost" onClick={handleCopy} className="flex-1 min-w-[80px]">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="ghost" onClick={handleShare} className="flex-1 min-w-[80px]">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button onClick={handleRedirect} className="flex-1 min-w-[80px] bg-accent text-accent-foreground hover:bg-accent/90">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <div className="w-full flex flex-col items-center justify-center py-12 md:py-20 bg-secondary">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-foreground">
          What Our Users Say
        </h2>
        <InfiniteMovingCards
          items={testimonials}
          direction="left"
          speed="slow"
        />
      </div>
    </>
  );
}
