'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export function LoginDialog() {
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'Login Successful',
        description: 'Welcome!',
      });
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Login
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Login or sign up to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8S111.8 11.6 244 11.6c67.8 0 120.4 26.2 165.6 68.5l-63.1 61.9c-35.4-33.8-82-61.9-102.5-61.9-88.4 0-160.2 71.8-160.2 160.2s71.8 160.2 160.2 160.2c94.2 0 135.3-65.1 141.9-98.6H244v-73.6h244c2.6 13.7 4.1 29.5 4.1 46.4z"
              ></path>
            </svg>
            Continue with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
