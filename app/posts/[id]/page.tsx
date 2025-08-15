'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Share2,
  Users,
  MoreHorizontal,
  X,
} from 'lucide-react';
import BottomNavigation from '../../components/BottomNavigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  toggleInterest,
  getInterestedUsers,
  deletePost,
  checkAndUpdatePostExpiry,
} from '@/lib/posts';
import {
  getInterestedUsersWithDetails,
  createChatRoom,
  findExistingChatRoom,
} from '@/lib/chat';
import { PostData, InterestedUser } from '@/types/user';
import { SelectableUser } from '@/types/chat';
import { Timestamp } from 'firebase/firestore';
import { POST_STATUS, getPostStatusLabel } from '@/constants/postStatus';

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
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 채팅 관련 상태
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectableUsers, setSelectableUsers] = useState<SelectableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // 현재 위치 (거리 계산용)
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const postData = await checkAndUpdatePostExpiry(postId);

        if (postData) {
          setPost(postData);
          console.log('포스트 상태 확인:', postData.status); // 디버깅용
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
      await toggleInterest(
        post.id,
        user.uid,
        newInterestState,
        user.displayName || user.email || '사용자'
      );

      // UI 상태 업데이트
      setIsInterested(newInterestState);

      // 포스트 데이터 업데이트
      setPost((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          interestedCount: newInterestState
            ? prev.interestedCount + 1
            : prev.interestedCount - 1,
          interestedUserIds: newInterestState
            ? [...prev.interestedUserIds, user.uid]
            : prev.interestedUserIds.filter((id) => id !== user.uid),
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

  const handleStartChat = async () => {
    if (!user) {
      error('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (!post) return;

    if (post.interestedCount === 0) {
      error('아직 관심을 표시한 사람이 없습니다.');
      return;
    }

    try {
      setIsLoadingUsers(true);
      setShowChatModal(true);

      // 관심 있어요 누른 사용자들의 상세 정보 조회
      const users = await getInterestedUsersWithDetails(post.interestedUserIds);
      setSelectableUsers(users);
    } catch (err) {
      console.error('사용자 정보 로드 오류:', err);
      error('사용자 정보를 불러오는데 실패했습니다.');
      setShowChatModal(false);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateChatRoom = async () => {
    if (!user || !post) return;

    if (selectedUserIds.length === 0) {
      error('최소 1명 이상 선택해주세요.');
      return;
    }

    try {
      setIsCreatingChat(true);

      // 선택된 사용자들 + 포스트 작성자로 멤버 구성
      const memberIds = [user.uid, ...selectedUserIds];

      // 동일한 멤버 구성의 채팅방이 이미 있는지 확인
      const existingRoom = await findExistingChatRoom(post.id, memberIds);

      if (existingRoom) {
        success('이미 생성된 채팅방이 있습니다! 🎉');
        router.push(`/chat/${existingRoom.id}`);
        return;
      }

      // 새 채팅방 생성
      const chatRoomId = await createChatRoom({
        name: `${post.title} - 채팅방`,
        postId: post.id,
        postTitle: post.title,
        hostId: user.uid,
        memberIds,
        memberCount: memberIds.length,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || '사용자',
        isActive: true,
      });

      success('채팅방이 생성되었습니다! 💬');
      router.push(`/chat/${chatRoomId}`);
    } catch (err) {
      console.error('채팅방 생성 오류:', err);
      error('채팅방 생성에 실패했습니다.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleEditPost = () => {
    if (!post) return;

    setShowManageMenu(false);
    router.push(`/posts/${post.id}/edit`);
  };

  const handleDeletePost = async () => {
    if (!post) return;

    const confirmDelete = confirm(`정말로 포스트를 삭제하시겠습니까?`);

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      setShowManageMenu(false);

      await deletePost(post.id);

      success('포스트가 성공적으로 삭제되었습니다! 🗑️');
      router.push('/'); // 홈으로 이동
    } catch (err) {
      console.error('포스트 삭제 오류:', err);
      error('포스트 삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
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

  // 삭제 중일 때 로딩 오버레이
  if (isDeleting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">포스트를 삭제하는 중...</p>
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
            <div className="w-10"></div> {/* 균형을 위한 빈 공간 */}
          </div>
        </div>
      </header>

      {/* 포스트 내용 */}
      <main className="px-4 py-4">
        <div className="max-w-md mx-auto">
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

              {/* 프로필 우측 버튼들 */}
              <div className="flex items-center space-x-2 relative">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="공유하기"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* 내가 작성한 포스트일 때만 관리 메뉴 표시 */}
                {isMyPost && (
                  <div className="relative">
                    <button
                      onClick={() => setShowManageMenu(!showManageMenu)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="포스트 관리"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* 관리 메뉴 드롭다운 */}
                    {showManageMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <button
                          onClick={handleEditPost}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <span>✏️</span>
                          <span>포스트 수정</span>
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-100"
                        >
                          <span>🗑️</span>
                          <span>포스트 삭제</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
            {/* 내가 작성한 포스트가 아닐 때 */}
            {!isMyPost && (
              <>
                {post.status === POST_STATUS.CLOSED ? (
                  // 모집 완료된 경우
                  <div className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-gray-100 text-gray-500 flex items-center justify-center space-x-2 cursor-not-allowed">
                    <span className="text-2xl">🚫</span>
                    <span>{getPostStatusLabel(POST_STATUS.CLOSED)}</span>
                  </div>
                ) : (
                  // 아직 모집 중인 경우
                  <button
                    onClick={handleInterest}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                      isInterested
                        ? 'bg-gray-200 text-gray-700 border border-gray-300'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    }`}
                  >
                    <span className="text-2xl">
                      {isInterested ? '✅' : '🙌'}
                    </span>
                    <span>{isInterested ? '관심 표시됨' : '관심있어요!'}</span>
                  </button>
                )}
              </>
            )}

            {/* 내가 작성한 포스트일 때: 채팅하기 버튼 또는 채팅방 생성 완료 표시 */}
            {isMyPost && (
              <>
                {post.status === POST_STATUS.CLOSED ? (
                  // 이미 채팅방이 생성된 경우
                  <div className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-green-100 text-green-700 flex items-center justify-center space-x-2">
                    <span className="text-2xl">🎉</span>
                    <span>채팅방이 생성되었습니다</span>
                  </div>
                ) : (
                  // 아직 채팅방이 생성되지 않은 경우
                  <button
                    onClick={handleStartChat}
                    disabled={post.interestedCount === 0}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                      post.interestedCount > 0
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl">💬</span>
                    <span>
                      {post.interestedCount > 0
                        ? '관심 있는 분들과 채팅하기'
                        : '관심 있는 분이 없어요'}
                    </span>
                  </button>
                )}
              </>
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
                        <div
                          key={user.uid}
                          className="flex items-center space-x-3"
                        >
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
                            <p className="font-medium text-gray-900">
                              {user.nickname}
                            </p>
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

          {/* 채팅 사용자 선택 모달 */}
          {showChatModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-md w-full max-h-[600px] overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      채팅할 사람 선택
                    </h3>
                    <button
                      onClick={() => {
                        setShowChatModal(false);
                        setSelectedUserIds([]);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    최소 1명 이상 선택해주세요
                  </p>
                </div>

                <div className="p-4 overflow-y-auto max-h-80">
                  {isLoadingUsers ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-3 animate-pulse"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectableUsers.length > 0 ? (
                    <div className="space-y-3">
                      {selectableUsers.map((user) => (
                        <label
                          key={user.uid}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedUserIds.includes(user.uid)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.uid)}
                            onChange={() => handleUserSelect(user.uid)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 relative">
                            {user.profileImageUrl ? (
                              <Image
                                src={user.profileImageUrl}
                                alt={`${user.nickname} 프로필`}
                                fill
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
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">
                              {user.nickname}
                            </p>
                            <div className="text-xs text-gray-600 space-y-1">
                              {user.age && user.gender && (
                                <p>
                                  {user.age}세, {user.gender}
                                </p>
                              )}
                              {user.interests.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {user.interests
                                    .slice(0, 3)
                                    .map((interest, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
                                      >
                                        #{interest}
                                      </span>
                                    ))}
                                  {user.interests.length > 3 && (
                                    <span className="text-gray-500">
                                      +{user.interests.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      관심을 표시한 사람이 없습니다.
                    </p>
                  )}
                </div>

                {/* 채팅방 생성 버튼 */}
                {selectableUsers.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={handleCreateChatRoom}
                      disabled={selectedUserIds.length === 0 || isCreatingChat}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                        selectedUserIds.length > 0 && !isCreatingChat
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isCreatingChat ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>채팅방 생성 중...</span>
                        </div>
                      ) : (
                        `채팅방 생성 (${selectedUserIds.length}명 선택)`
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 관리 메뉴 클릭 시 배경 클릭으로 닫기 */}
          {showManageMenu && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowManageMenu(false)}
            />
          )}
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab={undefined} />
    </div>
  );
}
