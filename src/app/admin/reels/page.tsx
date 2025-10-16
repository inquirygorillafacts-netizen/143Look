'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
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
  DialogClose
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
  
  const handleDelete = async (reelId: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this reel?')) {
      const docRef = doc(firestore, 'reels', reelId);
      await deleteDoc(docRef);
      toast({ title: 'Reel Deleted', description: 'The reel has been successfully deleted.' });
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
    
    // Check for duplicate reelNumber unless we are editing the same reel
    const isEditing = !!currentReel?.id;
    const q = query(reelsCollection, where('reelNumber', '==', reelNumber));
    const querySnapshot = await getDocs(q);

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
       // For new reels, create a new doc reference
       docRef = doc(collection(firestore, 'reels'));
       newReelId = docRef.id;
    }

    try {
        await setDoc(docRef, { id: newReelId, reelNumber, productUrl }, { merge: true });
        toast({ title: 'Success', description: `Reel ${isEditing ? 'updated' : 'created'} successfully.` });
        setIsDialogOpen(false);
    } catch(e) {
        console.error("Error saving reel: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save reel.' });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Reels</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" /> Add New Reel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentReel ? 'Edit Reel' : 'Add New Reel'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Reel Number"
                value={reelNumber}
                onChange={(e) => setReelNumber(e.target.value)}
                disabled={isSaving || !!currentReel} // Disable if saving or editing
              />
              <Input
                placeholder="Product URL"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <DialogFooter>
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reel Number</TableHead>
                <TableHead>Product URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReels?.map((reel) => (
                <TableRow key={reel.id}>
                  <TableCell>{reel.reelNumber}</TableCell>
                  <TableCell>
                    <a href={reel.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-xs">
                      {reel.productUrl}
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(reel)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(reel.id)}>
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
