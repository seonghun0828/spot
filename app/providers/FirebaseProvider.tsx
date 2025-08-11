'use client';

import { useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase';

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export default function FirebaseProvider({ children }: FirebaseProviderProps) {
  useEffect(() => {
    // Firebase 초기화 확인
    console.log('Firebase initialized:', { auth, db, storage });
  }, []);

  return <>{children}</>;
}
