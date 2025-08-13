'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Heart, FileText } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getUserPosts, getUserInterestedPosts } from '@/lib/posts';
import { PostData } from '@/types/user';
import { Timestamp } from 'firebase/firestore';

// 포스트 상태 타입
type PostStatus = 'open' | 'closed' | 'expired';

// 포스트 상태 결정 함수
function getPostStatus(post: PostData): PostStatus {
  if (!post.isActive) return 'expired';

  // TODO: 실제 매칭 완료 로직 구현 시 수정
  // 현재는 단순히 활성 상태만 확인
  return 'open';
}

// 시간 포맷팅 함수
function formatTimeAgo(timestamp: Timestamp): string {
  const now = new Date();
  const postTime = timestamp.toDate();
  const diffInMinutes = Math.floor(
    (now.getTime() - postTime.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}일 전`;
}

function StatusBadge({ status }: { status: PostStatus }) {
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
  post: PostData;
  onClick: () => void;
}) {
  const status = getPostStatus(post);

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {/* MVP: 포스트 이미지 비활성화 (Storage 미사용) */}
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
            <StatusBadge status={status} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Heart className="w-3.5 h-3.5" />
              <span>{post.interestedCount}</span>
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
  post: PostData;
  onClick: () => void;
}) {
  const status = getPostStatus(post);

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {/* 작성자 프로필 이미지 */}
        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
          {post.authorProfileImageUrl ? (
            <Image
              src={post.authorProfileImageUrl}
              alt={`${post.authorNickname} 프로필`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {post.authorNickname.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
              {post.title}
            </h3>
            <StatusBadge status={status} />
          </div>
          <div className="mt-1 text-xs text-gray-600">
            by {post.authorNickname}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Heart className="w-3.5 h-3.5" />
              <span>{post.interestedCount}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function MyActivitiesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { error } = useToast();

  const [createdPosts, setCreatedPosts] = useState<PostData[]>([]);
  const [interestedPosts, setInterestedPosts] = useState<PostData[]>([]);
  const [isLoadingCreated, setIsLoadingCreated] = useState(true);
  const [isLoadingInterested, setIsLoadingInterested] = useState(true);

  // 로그인 체크
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 내가 작성한 포스트 로드
  useEffect(() => {
    const loadCreatedPosts = async () => {
      if (!user) return;

      try {
        setIsLoadingCreated(true);
        const posts = await getUserPosts(user.uid);
        setCreatedPosts(posts);
      } catch (err) {
        console.error('내가 작성한 포스트 로드 오류:', err);
        error('내가 작성한 포스트를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingCreated(false);
      }
    };

    if (user) {
      loadCreatedPosts();
    }
  }, [user, error]);

  // 관심 있어요 누른 포스트 로드
  useEffect(() => {
    const loadInterestedPosts = async () => {
      if (!user) return;

      try {
        setIsLoadingInterested(true);
        const posts = await getUserInterestedPosts(user.uid);
        setInterestedPosts(posts);
      } catch (err) {
        console.error('관심 있어요 포스트 로드 오류:', err);
        error('관심 있어요 누른 포스트를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingInterested(false);
      }
    };

    if (user) {
      loadInterestedPosts();
    }
  }, [user, error]);

  const onBack = () => router.back();
  const goPostDetail = (postId: string) => router.push(`/posts/${postId}`);

  // 로딩 중이거나 로그인하지 않은 경우
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
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

            {isLoadingCreated ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex gap-4 animate-pulse">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                    <button
                      onClick={() => router.push('/posts/create')}
                      className="mt-3 text-blue-500 text-sm font-medium hover:text-blue-600"
                    >
                      첫 포스트 만들기
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 관심 있어요 누른 목록 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              관심 있어요 누른 포스트
            </h2>

            {isLoadingInterested ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex gap-4 animate-pulse">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                      <Heart className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">
                      아직 관심 표시한 포스트가 없어요
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className="mt-3 text-blue-500 text-sm font-medium hover:text-blue-600"
                    >
                      포스트 둘러보기
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-16" />

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab="activity" />
    </div>
  );
}
