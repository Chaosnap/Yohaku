'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Yohaku has no accounts. In a Yohaku build the layouts of Readest's account
 * pages (sign-in, profile, device linking, Send to Readest) render this in
 * place of the page, so even a deep link to one lands back in the library.
 */
export default function BackToLibrary() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/library');
  }, [router]);
  return null;
}
