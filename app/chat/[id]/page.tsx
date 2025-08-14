'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, LogOut, Send } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getChatRoom, subscribeToMessages, sendMessage } from '@/lib/chat';
import { ChatRoom, ChatMessage } from '@/types/chat';
import { Timestamp } from 'firebase/firestore';

// 시간 포맷팅 함수
function formatMessageTime(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;

  // 하루 이상 지난 경우 시간 표시
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { error } = useToast();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRoomId = params.id;

  // 채팅방 정보 로드 및 메시지 구독
  useEffect(() => {
    const loadChatRoom = async () => {
      if (!chatRoomId || !user) return;

      try {
        setLoading(true);

        // 채팅방 정보 조회
        const roomData = await getChatRoom(chatRoomId);
        if (!roomData) {
          error('채팅방을 찾을 수 없습니다.');
          router.push('/chat');
          return;
        }

        // 사용자가 채팅방 멤버인지 확인
        if (!roomData.memberIds.includes(user.uid)) {
          error('접근 권한이 없습니다.');
          router.push('/chat');
          return;
        }

        setChatRoom(roomData);

        // 실시간 메시지 구독
        const unsubscribe = subscribeToMessages(chatRoomId, (newMessages) => {
          setMessages(newMessages);
        });

        setLoading(false);

        // 클린업 함수 반환
        return unsubscribe;
      } catch (err) {
        console.error('채팅방 로드 오류:', err);
        error('채팅방을 불러오는데 실패했습니다.');
        router.push('/chat');
      }
    };

    if (!authLoading && user && chatRoomId) {
      const unsubscribe = loadChatRoom();
      return () => {
        if (unsubscribe) {
          Promise.resolve(unsubscribe).then((fn) => fn && fn());
        }
      };
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [chatRoomId, user, authLoading, router, error]);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const onBack = () => router.back();
  const onLeave = () => {
    // TODO: 방장/멤버 권한에 따라 삭제/나가기 분기
    if (confirm('채팅방에서 나가시겠습니까?')) {
      router.push('/chat');
    }
  };

  const onSend = async () => {
    if (!newMessage.trim() || !user || !chatRoom || sending) return;

    try {
      setSending(true);

      await sendMessage(chatRoomId, {
        chatRoomId,
        senderId: user.uid,
        senderNickname: user.displayName || user.email || '사용자',
        senderProfileImage: user.photoURL || '',
        content: newMessage.trim(),
        type: 'text',
      });

      setNewMessage('');
    } catch (err) {
      console.error('메시지 전송 오류:', err);
      error('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 사용하지 않는 useEffect 제거 (messagesEndRef로 대체)

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글/일본어 IME 조합 중 Enter 입력은 무시 (중복 전송 방지)
    const nativeEvt = e.nativeEvent as unknown as { isComposing?: boolean };
    if (e.key === 'Enter' && !nativeEvt.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  // 로딩 상태
  if (authLoading || loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white border-b p-4 flex items-center gap-3">
          <button onClick={onBack} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">채팅방을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white border-b p-4 flex items-center gap-3">
          <button onClick={onBack} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-medium">채팅방</h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">채팅방을 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {chatRoom.name}
          </h1>
          <button
            onClick={onLeave}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="나가기"
          >
            <LogOut className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* 메시지 리스트 */}
      <div className="px-4">
        <div className="max-w-md mx-auto h-[60vh] overflow-y-auto py-4 space-y-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-2">
                  채팅방에 오신 것을 환영합니다!
                </p>
                <p className="text-gray-400 text-sm">
                  첫 메시지를 보내보세요 💬
                </p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.uid;
              return (
                <div
                  key={m.id}
                  className={`flex ${
                    isMe ? 'justify-end' : 'justify-start'
                  } mb-2`}
                >
                  <div
                    className={`flex flex-col ${
                      isMe ? 'items-end' : 'items-start'
                    } max-w-[75%]`}
                  >
                    {!isMe && (
                      <div className="text-xs text-gray-500 mb-1 px-1">
                        {m.senderNickname}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        isMe
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {m.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 px-1">
                      {formatMessageTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 바 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="메시지를 입력하세요"
            disabled={sending}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 disabled:opacity-50"
          />
          <button
            onClick={onSend}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="보내기"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}
