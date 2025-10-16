'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { reelLinks } from '@/lib/reel-data';
import { Copy, Share2, ExternalLink, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
      setError('अमान्य कोड। कृपया पुनः प्रयास करें।');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'लिंक कॉपी किया गया!',
      description: 'लिंक आपके क्लिपबोर्ड पर कॉपी हो गया है।',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'लिंक देखें',
        url: link,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'शेयर करने में असमर्थ',
        description: 'आपका ब्राउज़र शेयर फ़ंक्शन का समर्थन नहीं करता है।',
      });
    }
  };

  return (
    <div className="relative flex-grow flex flex-col items-center justify-center p-4 overflow-hidden text-center bg-gray-900 text-white">
      {/* Starfield background */}
      <div className="absolute inset-0 z-0">
        <div id="stars-sm" />
        <div id="stars-md" />
        <div id="stars-lg" />
      </div>
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-purple-600/30 rounded-full filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-blue-500/30 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-pink-500/30 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-4000" />

      <Card className="w-full max-w-md z-10 bg-black/30 backdrop-blur-md border-purple-500/50 text-white">
        <CardHeader>
          <CardTitle className="font-headline text-4xl font-bold tracking-tighter text-center">
            Cosmic Link Finder
          </CardTitle>
          <CardDescription className="text-center text-gray-400 pt-2">
            अपना सीक्रेट कोड दर्ज करें और ब्रह्मांड के लिंक खोजें।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center space-x-2 mb-4">
            <Input
              type="text"
              placeholder="यहाँ कोड दर्ज करें..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-gray-800/50 border-purple-400/50 text-white placeholder:text-gray-500 text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleSearch}
              className="bg-purple-600 hover:bg-purple-700 border-none"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          {link && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg border border-purple-500/30">
              <p className="text-sm text-gray-300 break-words mb-4">{link}</p>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="hover:bg-purple-500/20"
                >
                  <Copy className="h-5 w-5" />
                  <span className="sr-only">Copy</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="hover:bg-purple-500/20"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="sr-only">Share</span>
                </Button>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-purple-500/20"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span className="sr-only">Open</span>
                  </Button>
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="w-full absolute bottom-10">
        <InfiniteMovingCards
          items={testimonials}
          direction="right"
          speed="slow"
        />
      </div>
    </div>
  );
}
