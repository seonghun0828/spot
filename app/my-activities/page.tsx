'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Heart, FileText } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';

interface PostItem {
  id: string;
  title: string;
  createdAt: string; // ISO
  status: 'open' | 'closed' | 'expired';
  image?: string;
  interestCount?: number;
  author?: string;
}

const mockCreatedPosts: PostItem[] = [
  {
    id: '1',
    title: '오늘 직관 끝나고 치맥하실 분?',
    createdAt: '2024-01-15T18:20:00Z',
    status: 'open',
    image: '/images/mockup-home.png',
    interestCount: 4,
  },
];

const mockInterestedPosts: PostItem[] = [
  {
    id: '2',
    title: '잠실 야구장 1루 쪽에서 함께 응원해요',
    createdAt: '2024-01-15T17:10:00Z',
    status: 'open',
    author: '야구팬',
  },
  {
    id: '3',
    title: '강남 카페 스터디 인원 모아요',
    createdAt: '2024-01-15T12:30:00Z',
    status: 'expired',
    author: '스터디러',
  },
];

function formatRelative(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}일 전`;
}

function StatusBadge({ status }: { status: PostItem['status'] }) {
  const style =
    status === 'open'
      ? 'bg-green-50 text-green-700'
      : status === 'closed'
      ? 'bg-blue-50 text-blue-700'
      : 'bg-gray-100 text-gray-600';
  const label =
    status === 'open' ? '대기 중' : status === 'closed' ? '매칭 완료' : '만료';
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${style}`}>{label}</span>
  );
}

function CreatedPostCard({
  post,
  onClick,
}: {
  post: PostItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
          {post.image ? (
            <Image src={post.image} alt="Post" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
              {post.title}
            </h3>
            <StatusBadge status={post.status} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelative(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Heart className="w-3.5 h-3.5" />
              <span>{post.interestCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function InterestedPostCard({
  post,
  onClick,
}: {
  post: PostItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
              {post.title}
            </h3>
            <StatusBadge status={post.status} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelative(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function MyActivitiesPage() {
  const router = useRouter();
  const [createdPosts] = useState<PostItem[]>(mockCreatedPosts);
  const [interestedPosts] = useState<PostItem[]>(mockInterestedPosts);

  const onBack = () => router.back();
  const goPostDetail = (postId: string) => router.push(`/posts/${postId}`);

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
          <h1 className="text-lg font-semibold text-gray-900">내 활동</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* 내가 만든 포스트 목록 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              내가 만든 포스트
            </h2>
            {/* 항목이 많아지면 자체 스크롤 */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {createdPosts.length > 0 ? (
                createdPosts.map((post) => (
                  <CreatedPostCard
                    key={post.id}
                    post={post}
                    onClick={() => goPostDetail(post.id)}
                  />
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                  <div className="w-14 h-14 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm">
                    아직 만든 포스트가 없어요
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 관심 있어요 누른 목록 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              관심 있어요 누른 포스트
            </h2>
            {/* 항목이 많아지면 자체 스크롤 */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {interestedPosts.length > 0 ? (
                interestedPosts.map((post) => (
                  <InterestedPostCard
                    key={post.id}
                    post={post}
                    onClick={() => goPostDetail(post.id)}
                  />
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                  <div className="w-14 h-14 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm">
                    아직 관심 표시한 포스트가 없어요
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-16" />

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab="activity" isLoggedIn={true} />
    </div>
  );
}
