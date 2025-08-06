'use client';

import { useRouter } from 'next/navigation';
import { MapPin, MessageSquare, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab?: 'home' | 'chat' | 'activity';
}

export default function BottomNavigation({
  activeTab = 'home',
}: BottomNavigationProps) {
  const router = useRouter();

  const handleTabClick = (tab: string) => {
    switch (tab) {
      case 'home':
        router.push('/');
        break;
      case 'chat':
        router.push('/chat');
        break;
      case 'activity':
        router.push('/my-activity');
        break;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around max-w-md mx-auto">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'home'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-xs font-medium">홈</span>
        </button>
        <button
          onClick={() => handleTabClick('chat')}
          className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'chat'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs font-medium">채팅방</span>
        </button>
        <button
          onClick={() => handleTabClick('activity')}
          className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'activity'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">내 활동</span>
        </button>
      </div>
    </div>
  );
}
