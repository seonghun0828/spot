'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, MessageCircle, User } from 'lucide-react';

interface BottomNavigationProps {
  isLoggedIn: boolean;
}

export default function BottomNavigation({
  isLoggedIn,
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      name: '홈',
      path: '/',
      icon: Home,
      requiresAuth: false,
    },
    {
      name: '채팅방',
      path: '/chat',
      icon: MessageCircle,
      requiresAuth: true,
    },
    {
      name: '내 활동',
      path: '/my-activity',
      icon: User,
      requiresAuth: true,
    },
  ];

  const handleNavigation = (item: (typeof navigationItems)[0]) => {
    if (item.requiresAuth && !isLoggedIn) {
      // 로그인이 필요한 페이지인 경우 로그인 페이지로 이동
      router.push('/auth');
      return;
    }
    router.push(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const isDisabled = item.requiresAuth && !isLoggedIn;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item)}
              disabled={isDisabled}
              className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
