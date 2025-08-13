'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Clock, Share2, Users } from 'lucide-react';
import BottomNavigation from '../../components/BottomNavigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getPost, toggleInterest, getInterestedUsers } from '@/lib/posts';
import { PostData, InterestedUser } from '@/types/user';
import { Timestamp } from 'firebase/firestore';

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();
  const postId = params.id as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInterested, setIsInterested] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [showInterestedList, setShowInterestedList] = useState(false);

  // 현재 위치 (거리 계산용)
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const postData = await getPost(postId);

        if (postData) {
          setPost(postData);
          // 현재 사용자가 이미 관심 표시했는지 확인
          if (user && postData.interestedUserIds.includes(user.uid)) {
            setIsInterested(true);
          }
        } else {
          error('포스트를 찾을 수 없습니다.');
          router.push('/');
        }
      } catch (err) {
        console.error('포스트 로드 오류:', err);
        error('포스트를 불러오는데 실패했습니다.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId, user, router, error]);

  // 현재 위치 가져오기 (거리 계산용)
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('위치 정보를 가져올 수 없습니다:', error);
          }
        );
      }
    };

    getCurrentLocation();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    const shareData = {
      title: post?.title,
      text: `${post?.title}\n${post?.content.substring(0, 100)}...`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        success('링크가 복사되었습니다! 📋');
      }
    } catch (err) {
      console.error('공유 실패:', err);
      error('공유에 실패했습니다.');
    }
  };

  const handleInterest = async () => {
    if (!user) {
      error('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (!post) return;

    try {
      const newInterestState = !isInterested;
      
      // Firestore에 관심 표시 업데이트
      await toggleInterest(post.id, user.uid, newInterestState);
      
      // UI 상태 업데이트
      setIsInterested(newInterestState);
      
      // 포스트 데이터 업데이트
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          interestedCount: newInterestState 
            ? prev.interestedCount + 1 
            : prev.interestedCount - 1,
          interestedUserIds: newInterestState
            ? [...prev.interestedUserIds, user.uid]
            : prev.interestedUserIds.filter(id => id !== user.uid)
        };
      });

      if (newInterestState) {
        success('관심을 표시했습니다! 🙌');
      } else {
        success('관심 표시를 취소했습니다.');
      }
    } catch (err) {
      console.error('관심 표시 오류:', err);
      error('관심 표시에 실패했습니다.');
    }
  };

  const handleStartChat = () => {
    if (!user) {
      error('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (!post) return;

    // TODO: 채팅방 생성 로직 구현
    success('채팅 기능은 곧 추가될 예정입니다! 💬');
  };

  const handleManagePost = () => {
    if (!post) return;
    
    // TODO: 포스트 관리 기능 (수정/삭제) 구현
    success('포스트 관리 기능은 곧 추가될 예정입니다! ⚙️');
  };

  const handleShowInterestedUsers = async () => {
    if (!post) return;

    try {
      const users = await getInterestedUsers(post.id);
      setInterestedUsers(users);
      setShowInterestedList(true);
    } catch (err) {
      console.error('관심 사용자 목록 조회 오류:', err);
      error('관심 사용자 목록을 불러오는데 실패했습니다.');
    }
  };

  // 거리 계산 함수
  const calculateDistance = (postLocation: {
    latitude: number;
    longitude: number;
  }): string => {
    if (!currentLocation) return '위치 확인 중';

    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (currentLocation.latitude * Math.PI) / 180;
    const φ2 = (postLocation.latitude * Math.PI) / 180;
    const Δφ =
      ((postLocation.latitude - currentLocation.latitude) * Math.PI) / 180;
    const Δλ =
      ((postLocation.longitude - currentLocation.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = Math.round(R * c); // 미터 단위

    return distance < 1000
      ? `${distance}m`
      : `${(distance / 1000).toFixed(1)}km`;
  };

  // 시간 포맷팅 함수
  const formatTimeAgo = (timestamp: Timestamp): string => {
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
  };

  // 내가 작성한 포스트인지 확인
  const isMyPost = user?.uid === post?.authorId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">포스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">포스트를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 mx-4">
              포스트
            </h1>
            <button
              onClick={handleShare}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="공유하기"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 포스트 내용 */}
      <main className="px-4 py-4">
        <div className="max-w-md mx-auto">
          {/* MVP: 포스트 이미지 비활성화 (Storage 미사용)
          {post.images?.[0] && (
            <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden mb-4 relative">
              <Image
                src={post.images[0]}
                alt="Post Image"
                fill
                className="object-cover"
              />
            </div>
          )}
          */}

          {/* 포스트 헤더 */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 relative">
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
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {post.authorNickname}
                    {isMyPost && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        내 포스트
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(post.createdAt)}</span>
                    <MapPin className="w-3 h-3" />
                    <span>{calculateDistance(post.location)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 제목 */}
            <h1 className="text-xl font-bold text-gray-900 mb-3">
              {post.title}
            </h1>

            {/* 위치 정보 */}
            <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{post.location.address}</span>
            </div>

            {/* 희망 인원 및 관심 수 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>희망 인원: {post.maxParticipants}</span>
              </div>
              
              {/* 관심 있어요 수 (작성자만 클릭 가능) */}
              {isMyPost ? (
                <button
                  onClick={handleShowInterestedUsers}
                  className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors"
                >
                  관심 {post.interestedCount}명 👀
                </button>
              ) : (
                <span className="text-blue-600 font-medium text-sm">
                  관심 {post.interestedCount}명
                </span>
              )}
            </div>

            {/* 내용 */}
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            {/* 내가 작성한 포스트가 아닐 때: 관심있어요 버튼 표시 */}
            {!isMyPost && (
              <button
                onClick={handleInterest}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isInterested
                    ? 'bg-gray-200 text-gray-700 border border-gray-300'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                }`}
              >
                <span className="text-2xl">{isInterested ? '✅' : '🙌'}</span>
                <span>{isInterested ? '관심 표시됨' : '관심있어요!'}</span>
              </button>
            )}

            {/* 내가 작성한 포스트일 때: 채팅하기 버튼 표시 */}
            {isMyPost && (
              <button
                onClick={handleStartChat}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span className="text-2xl">💬</span>
                <span>관심 있는 분들과 채팅하기</span>
              </button>
            )}

            {/* 내가 작성한 포스트일 때: 포스트 관리 버튼 표시 */}
            {isMyPost && (
              <button
                onClick={handleManagePost}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span className="text-2xl">⚙️</span>
                <span>포스트 관리</span>
              </button>
            )}
          </div>

          {/* 관심 있어요 사용자 목록 모달 */}
          {showInterestedList && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-md w-full max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      관심 있어요 ({post.interestedCount}명)
                    </h3>
                    <button
                      onClick={() => setShowInterestedList(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-64">
                  {interestedUsers.length > 0 ? (
                    <div className="space-y-3">
                      {interestedUsers.map((user) => (
                        <div key={user.uid} className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                            {user.profileImageUrl ? (
                              <Image
                                src={user.profileImageUrl}
                                alt={`${user.nickname} 프로필`}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {user.nickname.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.nickname}</p>
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(user.interestedAt)}에 관심 표시
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      아직 관심을 표시한 사람이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab={undefined} />
    </div>
  );
}