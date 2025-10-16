'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const ownerDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'owners', user.uid) : null),
    [user, firestore]
  );
  
  const { data: owner, isLoading: isOwnerLoading } = useDoc(ownerDocRef);

  useEffect(() => {
    // If user loading is finished and there's no user, or if owner loading is finished and there's no owner document
    if ((!isUserLoading && !user) || (!isOwnerLoading && !owner)) {
      router.push('/'); // Redirect to home page
    }
  }, [user, isUserLoading, owner, isOwnerLoading, router]);

  const isLoading = isUserLoading || isOwnerLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  if (!owner) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
        <nav className="flex flex-col gap-2">
          <h3 className="font-semibold tracking-tight mb-2">Admin Menu</h3>
          <Link href="/admin/analytics" passHref>
             <Button variant="ghost" className="w-full justify-start">Analytics</Button>
          </Link>
          <Link href="/admin/reels" passHref>
             <Button variant="ghost" className="w-full justify-start">Manage Reels</Button>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
