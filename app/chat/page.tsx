'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MessageSquareText, Users } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';

interface ChatRoomItem {
  id: string;
  postTitle: string;
  participantNames: string[]; // 나 제외 표시용
  participantCount: number; // 총 인원 수
  lastMessage?: string;
  lastMessageAt?: string; // ISO
  unreadCount?: number;
}

const mockRooms: ChatRoomItem[] = [
  {
    id: 'c1',
    postTitle: '오늘 잠실야구장 직관 같이 보실 분',
    participantNames: ['야구팬', '스팟러버'],
    participantCount: 3,
    lastMessage: '어디서 만날까요?',
    lastMessageAt: '2024-01-15T12:10:00Z',
    unreadCount: 2,
  },
  {
    id: 'c2',
    postTitle: '강남 러닝 5km 저녁 모임',
    participantNames: ['러너1'],
    participantCount: 2,
    lastMessage: '내일도 가능해요',
    lastMessageAt: '2024-01-14T21:05:00Z',
    unreadCount: 0,
  },
];

function formatRelative(dateIso?: string): string {
  if (!dateIso) return '';
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}일 전`;
}

function UnreadBadge({ count = 0 }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function ChatListPage() {
  const router = useRouter();
  const [rooms] = useState<ChatRoomItem[]>(mockRooms);

  const onBack = () => router.back();
  const goRoom = (roomId: string) => router.push(`/chat/${roomId}`);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">채팅방</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* 목록 */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-3">
          {rooms.length > 0 ? (
            rooms.map((room) => {
              const extraCount = Math.max(
                0,
                room.participantCount - room.participantNames.length - 1
              ); // 나 제외
              const namesPreview = room.participantNames.slice(0, 3).join(', ');
              return (
                <button
                  key={room.id}
                  onClick={() => goRoom(room.id)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {room.postTitle}
                      </h3>

                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        <span className="truncate">
                          {namesPreview}
                          {extraCount > 0 ? ` 외 ${extraCount}명` : ''}
                        </span>
                      </div>

                      {room.lastMessage && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 min-w-0">
                          <MessageSquareText className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{room.lastMessage}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        <Clock className="inline-block align-[-2px] w-3.5 h-3.5 mr-1" />
                        {formatRelative(room.lastMessageAt)}
                      </span>
                      <UnreadBadge count={room.unreadCount} />
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageSquareText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                참여한 채팅방이 없어요
              </h3>
              <p className="text-gray-600 text-sm">
                마음에 드는 포스트에서 &apos;관심 있어요&apos;를 눌러보세요!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab="chat" isLoggedIn={true} />
    </div>
  );
}
