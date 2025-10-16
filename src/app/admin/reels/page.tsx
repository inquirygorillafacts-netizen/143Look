
'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash, Loader, Upload } from 'lucide-react';

interface Reel {
  id: string;
  reelNumber: string;
  productUrl: string;
  productImageUrl: string;
}

const IMGBB_API_KEY = '43d1267c74925ed8af33485644bfaa6b';

export default function ReelsPage() {
  const firestore = useFirestore();
  const reelsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reels') : null, [firestore]);
  
  const { data: reels, isLoading } = useCollection<Reel>(reelsCollection);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentReel, setCurrentReel] = useState<Partial<Reel> | null>(null);
  const [reelNumber, setReelNumber] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  const sortedReels = useMemo(() => {
    if (!reels) return [];
    // Sort reels numerically by reelNumber
    return [...reels].sort((a, b) => parseInt(a.reelNumber, 10) - parseInt(b.reelNumber, 10));
  }, [reels]);

  const getNextReelNumber = useCallback(() => {
    if (!sortedReels || sortedReels.length === 0) {
      return '1';
    }
    const highestReelNumber = Math.max(...sortedReels.map(r => parseInt(r.reelNumber, 10) || 0));
    return (highestReelNumber + 1).toString();
  }, [sortedReels]);


  const handleEdit = (reel: Reel) => {
    setCurrentReel(reel);
    setReelNumber(reel.reelNumber);
    setProductUrl(reel.productUrl);
    setProductImageUrl(reel.productImageUrl || '');
    setImageFile(null); // Reset image file on edit
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentReel(null);
    setReelNumber(getNextReelNumber());
    setProductUrl('');
    setProductImageUrl('');
    setImageFile(null); // Reset image file on add new
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (reelId: string, reelNum: string) => {
    if (!firestore) return;
    if (confirm(`Are you sure you want to delete reel ${reelNum}? This will also delete its analytics data.`)) {
      const reelDocRef = doc(firestore, 'reels', reelId);
      
      deleteDoc(reelDocRef).then(async () => {
          const analyticsSubcollection = collection(firestore, 'reels', reelId, 'analytics_events');
          const analyticsSnapshot = await getDocs(analyticsSubcollection);
          const batch = writeBatch(firestore);
          analyticsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          
          toast({ title: 'Reel Deleted', description: `Reel ${reelNum} and its analytics have been deleted.` });
      }).catch(error => {
          const contextualError = new FirestorePermissionError({ operation: 'delete', path: reelDocRef.path });
          errorEmitter.emit('permission-error', contextualError);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not delete reel. Check permissions.' });
      });
    }
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    // Create a local URL for preview
    const previewUrl = URL.createObjectURL(file);
    setProductImageUrl(previewUrl);
  };


  const handleSave = async () => {
    if (!firestore || !reelsCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not ready.' });
      return;
    }
    if (!reelNumber || !productUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in reel number and product URL.' });
      return;
    }
     if (!productImageUrl && !imageFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an image.' });
      return;
    }
    
    try {
        new URL(productUrl);
    } catch (_) {
        toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid product URL.' });
        return;
    }
    
    setIsSaving(true);
    let finalImageUrl = currentReel?.productImageUrl || '';

    // If a new image file was selected, upload it
    if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                finalImageUrl = result.data.url;
            } else {
                throw new Error(result.error?.message || 'Failed to upload image.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Error', description: error.message || 'An unknown error occurred.' });
            setIsSaving(false);
            return;
        }
    }
    
    if (!finalImageUrl) {
        toast({ variant: 'destructive', title: 'Image Error', description: 'Product image is required.' });
        setIsSaving(false);
        return;
    }


    const isEditing = !!currentReel?.id;
    const q = query(reelsCollection, where('reelNumber', '==', reelNumber));
    
    const querySnapshot = await getDocs(q).catch(e => {
        const contextualError = new FirestorePermissionError({ operation: 'list', path: 'reels'});
        errorEmitter.emit('permission-error', contextualError);
        return null;
    });

    if (!querySnapshot) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not verify reel number. Check permissions.' });
        setIsSaving(false);
        return;
    }

    if (!querySnapshot.empty) {
        const isSameDoc = isEditing && querySnapshot.docs[0].id === currentReel.id;
        if (!isSameDoc) {
            toast({ variant: 'destructive', title: 'Error', description: `Reel number ${reelNumber} already exists.` });
            setIsSaving(false);
            return;
        }
    }

    let docRef;
    let newReelId;
    if (isEditing) {
       docRef = doc(firestore, 'reels', currentReel!.id!);
       newReelId = currentReel!.id!;
    } else {
       docRef = doc(collection(firestore, 'reels'));
       newReelId = docRef.id;
    }

    const reelData = { id: newReelId, reelNumber, productUrl, productImageUrl: finalImageUrl };

    setDoc(docRef, reelData, { merge: true }).then(() => {
        toast({ title: 'Success', description: `Reel ${isEditing ? 'updated' : 'created'} successfully.` });
        setIsDialogOpen(false);
    }).catch(error => {
        const contextualError = new FirestorePermissionError({ 
            operation: isEditing ? 'update' : 'create', 
            path: docRef.path,
            requestResourceData: reelData
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save reel. Check permissions.' });
    }).finally(() => {
        setIsSaving(false);
    });
  };


  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Manage Reels</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} disabled={isLoading} size="sm" className="text-xs sm:text-sm">
              <Plus className="mr-2 h-4 w-4" /> Add New Reel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{currentReel ? `Edit Reel ${currentReel.reelNumber}` : 'Add New Reel'}</DialogTitle>
               <DialogDescription>
                Add or edit a reel number and its corresponding product URL and image.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Reel Number"
                value={reelNumber}
                onChange={(e) => setReelNumber(e.target.value)}
                disabled={isSaving || !!currentReel} 
                className="text-base"
              />
              <Input
                placeholder="Product URL"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                disabled={isSaving}
                className="text-base"
              />
               <div className="space-y-2">
                <Button asChild variant="outline" className="w-full" disabled={isSaving}>
                  <label htmlFor="image-upload" className="cursor-pointer">
                     <Upload className="mr-2 h-4 w-4" />
                     Upload Image
                  </label>
                </Button>
                <Input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageSelection} disabled={isSaving}/>
                {productImageUrl && (
                  <div className="relative w-[150px] h-[150px] mx-auto border rounded-md overflow-hidden">
                     <Image src={productImageUrl} alt="Product Preview" layout="fill" objectFit="cover"/>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="sm:justify-end flex-row space-x-2">
               <DialogClose asChild>
                <Button variant="outline" disabled={isSaving}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={isSaving}>
                {(isSaving) && <Loader className="mr-2 h-4 w-4 animate-spin"/>}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin"/>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reel No.</TableHead>
                <TableHead>Product URL</TableHead>
                <TableHead>Image</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReels?.map((reel) => (
                <TableRow key={reel.id}>
                  <TableCell>{reel.reelNumber}</TableCell>
                  <TableCell>
                    <a href={reel.productUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[150px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                      {reel.productUrl}
                    </a>
                  </TableCell>
                   <TableCell>
                    {reel.productImageUrl && (
                       <Image src={reel.productImageUrl} alt={`Reel ${reel.reelNumber}`} width={40} height={40} className="rounded-md object-cover"/>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(reel)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(reel.id, reel.reelNumber)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
