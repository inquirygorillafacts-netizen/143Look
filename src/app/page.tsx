'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { Copy, Share2, ExternalLink, ArrowRight, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { testimonials } from '@/lib/testimonials';

interface Reel {
  id: string;
  reelNumber: string;
  productUrl: string;
}

export default function Home() {
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSearch = async () => {
    if (!code) {
      setError('Please enter a Reel Code.');
      return;
    }
    if (!firestore) {
      setError('Database connection not available.');
      return;
    }

    setError('');
    setIsLoading(true);
    setLink('');

    try {
      const reelsCollection = collection(firestore, 'reels');
      const q = query(reelsCollection, where('reelNumber', '==', code));
      const querySnapshot = await getDocs(q);
      
      let foundReel: Reel | null = null;
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        foundReel = { id: doc.id, ...doc.data() } as Reel;
        setLink(foundReel.productUrl);
        
        // Log search event
        const analyticsCollection = collection(firestore, `reels/${foundReel.id}/analytics_events`);
        await addDoc(analyticsCollection, {
            eventType: 'reel_entry',
            eventTimestamp: Timestamp.now(),
        });

      } else {
        setLink('');
        setError('Invalid code. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while searching.');
    } finally {
      setIsLoading(false);
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

  const handleRedirect = async () => {
    if (link && firestore) {
       try {
        const reelsCollection = collection(firestore, 'reels');
        const q = query(reelsCollection, where('productUrl', '==', link));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const reelDoc = querySnapshot.docs[0];
             const analyticsCollection = collection(firestore, `reels/${reelDoc.id}/analytics_events`);
             await addDoc(analyticsCollection, {
                eventType: 'click_through',
                eventTimestamp: Timestamp.now(),
            });
        }
       } catch (e) {
        console.error("Failed to log click event", e);
       }
      window.open(link, '_blank');
    }
  };

  return (
    <>
      <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
        <div className="z-10 flex flex-col items-center w-full">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 text-foreground">
            Find Your Look.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mb-6 px-4">
            Saw something you loved in a Reel? Enter the code below to get the direct link to the product.
          </p>

          <div className="flex w-full max-w-xs items-center space-x-2 mb-4 px-4">
            <Input
              type="text"
              placeholder="Enter Reel Code..."
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-11 text-sm border-border focus:ring-primary text-center"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSearch}
              className="h-11 w-11 flex-shrink-0 bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {link && (
            <Card className="w-full max-w-xs mt-6 bg-card border-border/50 shadow-lg">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground break-words mb-3 text-left p-2 bg-secondary rounded-md">
                  {link}
                </p>
                <div className="flex justify-center space-x-2 flex-wrap gap-1">
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="flex-1 min-w-[70px]">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleShare} className="flex-1 min-w-[70px]">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button size="sm" onClick={handleRedirect} className="flex-1 min-w-[70px] bg-accent text-accent-foreground hover:bg-accent/90">
                    <ExternalLink className="h-4 w-4 mr-1" />
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
