'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, LogOut, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO
}

const mockMessages: ChatMessage[] = [
  {
    id: 'm1',
    senderId: 'me',
    text: '안녕하세요!',
    createdAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'm2',
    senderId: 'other',
    text: '반가워요!',
    createdAt: '2024-01-15T12:01:00Z',
  },
  {
    id: 'm3',
    senderId: 'me',
    text: '잠실역 7번 출구 근처 어떠세요?',
    createdAt: '2024-01-15T12:02:00Z',
  },
];

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const onBack = () => router.back();
  const onLeave = () => {
    // TODO: 방장/멤버 권한에 따라 삭제/나가기 분기
    if (confirm('채팅방에서 나가시겠습니까?')) {
      router.push('/chat');
    }
  };

  const onSend = () => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        senderId: 'me',
        text: text.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setText('');
  };

  useEffect(() => {
    // 스크롤 맨 아래로
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글/일본어 IME 조합 중 Enter 입력은 무시 (중복 전송 방지)
    const nativeEvt = e.nativeEvent as unknown as { isComposing?: boolean };
    if (e.key === 'Enter' && !nativeEvt.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

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
          <h1 className="text-lg font-semibold text-gray-900">
            채팅방 #{params.id}
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
        <div
          ref={listRef}
          className="max-w-md mx-auto h-[60vh] overflow-y-auto py-4 space-y-2"
        >
          {messages.map((m) => {
            const isMe = m.senderId === 'me';
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 입력 바 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="메시지를 입력하세요"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
          />
          <button
            onClick={onSend}
            className="px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
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
