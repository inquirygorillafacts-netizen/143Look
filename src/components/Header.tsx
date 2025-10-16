'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/LoginDialog';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';

const Header = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const ownerDocRef =
    user && firestore ? doc(firestore, 'owners', user.uid) : null;
  
  // This is a simplified check. In a real app, memoize the ref.
  if (ownerDocRef) {
    (ownerDocRef as any).__memo = true;
  }
  const { data: owner } = useDoc(ownerDocRef);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  return (
    <header className="w-full py-4 px-4 md:px-6 z-10 bg-background/80 backdrop-blur-sm sticky top-0 border-b border-border/20">
      <nav className="max-w-6xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <div className="text-2xl font-black tracking-tighter">
            <span className="font-poppins font-thin text-primary">1</span>
            <span className="font-poppins font-black text-primary text-3xl mx-[-0.15rem]">
              4
            </span>
            <span className="font-poppins font-normal italic text-primary text-xl">
              3
            </span>
            <span className="text-foreground">look</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {user && owner && (
             <Link href="/admin" passHref>
                <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          )}
          {isUserLoading ? (
            <Button variant="ghost" size="sm" disabled>
              ...
            </Button>
          ) : user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <LoginDialog />
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
