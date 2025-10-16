'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
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
  const [currentReel, setCurrentReel] = useState<Partial<Reel> | null>(null);
  const [reelNumber, setReelNumber] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const { toast } = useToast();


  const handleEdit = (reel: Reel) => {
    setCurrentReel(reel);
    setReelNumber(reel.reelNumber);
    setProductUrl(reel.productUrl);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentReel(null);
    setReelNumber('');
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
    if (!firestore || !reelNumber || !productUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all fields.' });
      return;
    }
    
    let docRef;
    if (currentReel?.id) {
       docRef = doc(firestore, 'reels', currentReel.id);
    } else {
       // For new reels, we can use the reelNumber as the ID if it's unique
       docRef = doc(collection(firestore, 'reels'));
    }

    try {
        await setDoc(docRef, { reelNumber, productUrl }, { merge: true });
        toast({ title: 'Success', description: `Reel ${currentReel?.id ? 'updated' : 'created'} successfully.` });
        setIsDialogOpen(false);
    } catch(e) {
        console.error("Error saving reel: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save reel.' });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Reels</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
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
              />
              <Input
                placeholder="Product URL"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
              />
            </div>
            <DialogFooter>
               <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave}>Save</Button>
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
              {reels?.map((reel) => (
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
