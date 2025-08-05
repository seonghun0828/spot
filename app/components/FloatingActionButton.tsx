'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  isLoggedIn: boolean;
}

export default function FloatingActionButton({
  isLoggedIn,
}: FloatingActionButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (isLoggedIn) {
      router.push('/posts/create');
    } else {
      router.push('/auth');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-10"
      aria-label="포스트 만들기"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
