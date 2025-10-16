'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page just redirects to the analytics page.
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/analytics');
  }, [router]);

  return null; 
}
