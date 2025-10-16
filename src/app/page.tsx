
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc, doc } from 'firebase/firestore';
import { Copy, Share2, ExternalLink, ArrowRight, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface Reel {
  id: string;
  reelNumber: string;
  productUrl: string;
  productImageUrl: string;
}

export default function Home() {
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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
    setImageUrl('');

    const reelsCollection = collection(firestore, 'reels');
    const q = query(reelsCollection, where('reelNumber', '==', code));
    
    getDocs(q).then(async (querySnapshot) => {
      let foundReel: Reel | null = null;
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        foundReel = { id: doc.id, ...doc.data() } as Reel;
        setLink(foundReel.productUrl);
        setImageUrl(foundReel.productImageUrl);
        
        // Log search event
        const analyticsCollection = collection(firestore, `reels/${foundReel.id}/analytics_events`);
        const eventData = {
            eventType: 'reel_entry',
            eventTimestamp: Timestamp.now(),
        };
        addDoc(analyticsCollection, eventData).catch(e => {
            const contextualError = new FirestorePermissionError({ operation: 'create', path: analyticsCollection.path, requestResourceData: eventData });
            errorEmitter.emit('permission-error', contextualError);
        });

      } else {
        setLink('');
        setImageUrl('');
        setError('Invalid code. Please try again.');
      }
    }).catch(e => {
        const contextualError = new FirestorePermissionError({ operation: 'list', path: 'reels' });
        errorEmitter.emit('permission-error', contextualError);
        setError('An error occurred while searching. Check permissions.');
    }).finally(() => {
        setIsLoading(false);
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied!',
      description: 'The link has been copied to your clipboard.',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '143 Look पर यह स्टाइल देखें',
          text: 'यह प्रोडक्ट मुझे 143 Look से मिला! आप भी ट्राई करें।',
          url: link,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleRedirect = async () => {
    if (link && firestore) {
       const reelsCollection = collection(firestore, 'reels');
       const q = query(reelsCollection, where('productUrl', '==', link));
       
       getDocs(q).then(async (querySnapshot) => {
         if (!querySnapshot.empty) {
            const reelDoc = querySnapshot.docs[0];
            const analyticsCollection = collection(firestore, `reels/${reelDoc.id}/analytics_events`);
            const eventData = {
                eventType: 'click_through',
                eventTimestamp: Timestamp.now(),
            };
            addDoc(analyticsCollection, eventData).catch(e => {
                const contextualError = new FirestorePermissionError({ operation: 'create', path: analyticsCollection.path, requestResourceData: eventData });
                errorEmitter.emit('permission-error', contextualError);
            });
        }
       }).catch(e => {
            // This might fail if listing reels is not allowed, but we still proceed with redirection.
            console.warn("Could not log click event due to query permission error.");
       });

      window.open(link, '_blank');
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
      <div className="z-10 flex flex-col items-center w-full">
        <Image
          src="/logo.png"
          alt="143 Look Logo"
          width={128}
          height={128}
          className="mb-4"
        />
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 text-foreground">
          Find Your Look.
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-sm mb-6 px-4">
          जिस रील में आपने प्रोडक्ट देखा है, उस रील का नंबर यहाँ डालें और प्रोडक्ट का सीधा लिंक पाएं।
        </p>

        <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Enter Reel Code..."
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-10 text-sm md:text-base border-border focus:ring-primary text-center"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSearch}
            className="h-10 w-10 flex-shrink-0 bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          </Button>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {link && (
          <Card className="w-full max-w-sm mt-4 bg-card border-border/50 shadow-lg">
             {imageUrl && (
              <div className="aspect-square relative w-full overflow-hidden rounded-t-lg">
                <Image
                  src={imageUrl}
                  alt="Product Image"
                  layout="fill"
                  objectFit="cover"
                  sizes="(max-width: 640px) 100vw, 384px"
                />
              </div>
            )}
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
  );
}
