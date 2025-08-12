'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const initialPosts = [
  {
    id: 1,
    user: {
      name: '김스팟',
      desc: '야구 덕후',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    msg: '같이 응원할 분! 치맥도 환영!',
    distance: '120m',
    time: 45, // 남은 분
    liked: false,
  },
  {
    id: 2,
    user: {
      name: '이응원',
      desc: '롯데팬',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    },
    msg: '경기 끝나고 치킨 드실 분?',
    distance: '300m',
    time: 10,
    liked: true,
  },
];

export default function SpotPostPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLike = (idx: number) => {
    setPosts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, liked: !p.liked } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setPosts([
      {
        id: Date.now(),
        user: {
          name: '나',
          desc: '스팟 유저',
          avatar: 'https://randomuser.me/api/portraits/men/99.jpg',
        },
        msg,
        distance: '0m',
        time: 60,
        liked: false,
      },
      ...posts,
    ]);
    setMsg('');
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-pretendard text-[#222]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 bg-white border-b border-[#E5E7EB] px-5">
        <span className="font-bold text-lg tracking-tight">Spot</span>
        <span className="flex items-center gap-1 text-sm text-[#888]">
          <svg
            width={18}
            height={18}
            fill="none"
            stroke="#FF6B00"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="9" r="7" />
            <circle cx="9" cy="9" r="2.5" />
          </svg>
          서울 잠실야구장
        </span>
      </header>

      {/* Feed */}
      <main className="max-w-[480px] mx-auto px-0 pt-5 pb-28 flex flex-col gap-5">
        {posts.map((post, idx) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl shadow-sm border border-[#F1F3F5] px-5 py-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <Image
                src={post.user.avatar}
                alt="프로필"
                className="w-11 h-11 rounded-full object-cover border border-[#E5E7EB]"
              />
              <div className="flex flex-col">
                <span className="font-medium text-base">{post.user.name}</span>
                <span className="text-xs text-[#888]">{post.user.desc}</span>
              </div>
            </div>
            <div className="text-[1.08rem] font-medium break-words">
              {post.msg}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#888]">
              <span>{post.distance} 거리</span>
              <span className="w-1 h-1 bg-[#E5E7EB] rounded-full inline-block" />
              <span>{post.time > 0 ? `${post.time}분 남음` : '방금 전'}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium text-sm transition
                  ${
                    post.liked
                      ? 'bg-[#FF6B00] text-white'
                      : 'bg-[#FFF3E6] text-[#FF6B00] hover:bg-[#FFE0C2]'
                  }`}
                onClick={() => handleLike(idx)}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill={post.liked ? 'currentColor' : 'none'}
                  stroke={post.liked ? 'white' : '#FF6B00'}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21C12 21 4 13.36 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.36 16 21 16 21H12Z" />
                </svg>
                흥미 있어요
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Floating Action Button */}
      <button
        className="fixed right-6 bottom-10 z-20 bg-[#FF6B00] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl border-none active:bg-[#e65a00] transition"
        onClick={() => setModalOpen(true)}
        aria-label="새 게시글 작성"
      >
        <svg
          width={28}
          height={28}
          fill="none"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="14" y1="6" x2="14" y2="22" />
          <line x1="6" y1="14" x2="22" y2="14" />
        </svg>
      </button>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/20"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <form
            className="bg-white rounded-t-2xl shadow-xl w-full max-w-[480px] px-5 pt-7 pb-5 flex flex-col gap-5 animate-[modalUp_0.2s]"
            style={{ animationName: 'modalUp' }}
            onSubmit={handleSubmit}
          >
            <div className="font-semibold text-base">새 게시글 작성</div>
            <textarea
              className="w-full bg-[#F1F3F5] rounded-xl p-4 text-base text-[#222] resize-none outline-none"
              maxLength={60}
              rows={3}
              placeholder="예: 같이 응원할 분!"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              autoFocus
            />
            <div className="text-xs text-[#888]">
              게시글은 1시간 후 자동 만료됩니다.
            </div>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                className="flex-1 py-3 rounded-xl bg-[#F1F3F5] text-[#888] font-medium"
                onClick={() => setModalOpen(false)}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#FF6B00] text-white font-medium"
              >
                게시
              </button>
            </div>
          </form>
          <style>{`
            @keyframes modalUp {
              from { transform: translateY(100%);}
              to { transform: translateY(0);}
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
