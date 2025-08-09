'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Heart, FileText } from 'lucide-react';

interface MyPostItem {
  id: string;
  title: string;
  createdAt: string; // ISO
  status: 'open' | 'closed' | 'expired';
  image?: string;
  interestCount: number;
}

const mockMyPosts: MyPostItem[] = [
  {
    id: '101',
    title: '오늘 잠실야구장 직관 같이 보실 분',
    createdAt: '2024-01-15T09:40:00Z',
    status: 'open',
    image: '/images/mockup-home.png',
    interestCount: 3,
  },
  {
    id: '102',
    title: '퇴근 후 러닝 5km 같이 하실 분 구해요',
    createdAt: '2024-01-14T20:10:00Z',
    status: 'expired',
    interestCount: 0,
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

function StatusBadge({ status }: { status: MyPostItem['status'] }) {
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

export default function MyPostsPage() {
  const router = useRouter();
  const [items] = useState<MyPostItem[]>(mockMyPosts);

  const onBack = () => router.back();
  const goDetail = (postId: string) => router.push(`/posts/${postId}`);

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
            내가 만든 포스트
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          {items.length > 0 ? (
            items.map((post) => (
              <button
                key={post.id}
                onClick={() => goDetail(post.id)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* 이미지 */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt="Post"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* 내용 */}
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
                        <span>{post.interestCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                아직 만든 포스트가 없어요
              </h3>
              <p className="text-gray-600 text-sm">
                홈에서 첫 포스트를 만들어보세요!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}
