'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MessageSquareText, Users } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getUserChatRooms } from '@/lib/chat';
import { getUserData } from '@/lib/auth';
import { Timestamp } from 'firebase/firestore';

interface ChatRoomDisplay {
  id: string;
  postTitle: string;
  participantNames: string[]; // 나 제외한 다른 참여자들의 닉네임
  participantCount: number; // 총 인원 수
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadCount?: number; // TODO: 실제 읽지 않은 메시지 수 구현
}

function formatRelative(timestamp?: Timestamp): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}일 전`;

  // 일주일 이상 지난 경우 날짜 표시
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
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
  const { user, loading: authLoading } = useAuth();
  const { error } = useToast();

  const [rooms, setRooms] = useState<ChatRoomDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  // 채팅방 목록 로드
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // 사용자가 참여한 채팅방 목록 조회
        const chatRooms = await getUserChatRooms(user.uid);

        // 채팅방 표시용 데이터로 변환
        const displayRooms: ChatRoomDisplay[] = await Promise.all(
          chatRooms.map(async (room) => {
            // 나를 제외한 다른 참여자들의 닉네임 조회
            const otherMemberIds = room.memberIds.filter(
              (id) => id !== user.uid
            );
            const participantNames: string[] = [];

            for (const memberId of otherMemberIds.slice(0, 3)) {
              // 최대 3명까지만 표시
              try {
                const userData = await getUserData(memberId);
                participantNames.push(userData?.nickname || '사용자');
              } catch (err) {
                console.warn(`사용자 ${memberId} 정보 조회 실패:`, err);
                participantNames.push('사용자');
              }
            }

            return {
              id: room.id,
              postTitle: room.postTitle,
              participantNames,
              participantCount: room.memberCount,
              lastMessage: room.lastMessage,
              lastMessageAt: room.lastMessageAt,
              unreadCount: 0, // TODO: 실제 읽지 않은 메시지 수 구현
            };
          })
        );

        setRooms(displayRooms);
      } catch (err) {
        console.error('채팅방 목록 로드 오류:', err);
        error('채팅방 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      loadChatRooms();
    } else if (!authLoading && !user) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      router.push('/login');
    }
  }, [user, authLoading, router, error]);

  const onBack = () => router.back();
  const goRoom = (roomId: string) => router.push(`/chat/${roomId}`);

  // 로딩 상태
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
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

        <div className="px-4 py-4">
          <div className="max-w-md mx-auto space-y-3">
            {/* 로딩 스켈레톤 */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomNavigation activeTab="chat" />
      </div>
    );
  }

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
              <p className="text-gray-600 text-sm mb-4">
                관심 있는 포스트에서 채팅방을 만들어보세요!
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                포스트 둘러보기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab="chat" />
    </div>
  );
}
