'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { reelLinks } from '@/lib/reel-data';
import { Copy, Share2, ExternalLink, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

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
        title: 'Check out this link',
        url: link,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Unable to share',
        description: 'Your browser does not support the share function.',
      });
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-small-white/[0.2] z-0"></div>
      
      <div className="z-10 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50 mb-4">
          Stellar Links
        </h1>
        <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mb-8">
          Enter your secret code to unveil the link from your digital universe. Fast, secure, and always ready.
        </p>
        
        <div className="flex w-full max-w-md items-center space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Enter your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-12 text-base bg-secondary border-border focus:ring-primary text-center"
          />
          <Button
            size="icon"
            onClick={handleSearch}
            className="h-12 w-12 bg-primary hover:bg-primary/90"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {link && (
          <Card className="w-full max-w-md mt-8 bg-secondary/50 border-border/50">
            <CardContent className="p-6">
              <p className="text-base text-neutral-200 break-words mb-4 text-left">
                {link}
              </p>
              <div className="flex justify-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={handleCopy}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <a href={link} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
