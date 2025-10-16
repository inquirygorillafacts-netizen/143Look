'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { Plus, Edit, Trash, Loader } from 'lucide-react';

interface Reel {
  id: string;
  reelNumber: string;
  productUrl: string;
}

export default function ReelsPage() {
  const firestore = useFirestore();
  const reelsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reels') : null, [firestore]);
  
  const { data: reels, isLoading } = useCollection<Reel>(reelsCollection);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentReel, setCurrentReel] = useState<Partial<Reel> | null>(null);
  const [reelNumber, setReelNumber] = useState('');
  const [productUrl, setProductUrl] = useState('');
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
    const highestReelNumber = Math.max(...sortedReels.map(r => parseInt(r.reelNumber, 10)));
    return (highestReelNumber + 1).toString();
  }, [sortedReels]);


  const handleEdit = (reel: Reel) => {
    setCurrentReel(reel);
    setReelNumber(reel.reelNumber);
    setProductUrl(reel.productUrl);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentReel(null);
    setReelNumber(getNextReelNumber());
    setProductUrl('');
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (reelId: string, reelNum: string) => {
    if (!firestore) return;
    if (confirm(`Are you sure you want to delete reel #${reelNum}? This will also delete its analytics data.`)) {
      const reelDocRef = doc(firestore, 'reels', reelId);
      
      deleteDoc(reelDocRef).then(async () => {
          const analyticsSubcollection = collection(firestore, 'reels', reelId, 'analytics_events');
          const analyticsSnapshot = await getDocs(analyticsSubcollection);
          const batch = writeBatch(firestore);
          analyticsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          
          toast({ title: 'Reel Deleted', description: `Reel #${reelNum} and its analytics have been deleted.` });
      }).catch(error => {
          const contextualError = new FirestorePermissionError({ operation: 'delete', path: reelDocRef.path });
          errorEmitter.emit('permission-error', contextualError);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not delete reel. Check permissions.' });
      });
    }
  };

  const handleSave = async () => {
    if (!firestore || !reelsCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not ready.' });
      return;
    }
    if (!reelNumber || !productUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all fields.' });
      return;
    }
    
    try {
        new URL(productUrl);
    } catch (_) {
        toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid product URL.' });
        return;
    }

    setIsSaving(true);
    
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

    const reelData = { id: newReelId, reelNumber, productUrl };

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
              <DialogTitle>{currentReel ? `Edit Reel #${currentReel.reelNumber}` : 'Add New Reel'}</DialogTitle>
               <DialogDescription>
                Add or edit a reel number and its corresponding product URL.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Reel Number"
                value={reelNumber}
                onChange={(e) => setReelNumber(e.target.value)}
                disabled={isSaving || !!currentReel} 
              />
              <Input
                placeholder="Product URL"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <DialogFooter className="flex-row justify-end space-x-2">
               <DialogClose asChild>
                <Button variant="outline" disabled={isSaving}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : null}
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
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReels?.map((reel) => (
                <TableRow key={reel.id}>
                  <TableCell>#{reel.reelNumber}</TableCell>
                  <TableCell>
                    <a href={reel.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                      {reel.productUrl}
                    </a>
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
