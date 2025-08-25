'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, RefreshCw, Navigation, Bell, User } from 'lucide-react';
import BottomNavigation from './components/BottomNavigation';
import { useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import {
  getActivePosts,
  getNearbyPosts,
  // updateExpiredPosts, // 만료 기능 제거
} from '@/lib/posts';
import { PostData } from '@/types/user';
import { Timestamp } from 'firebase/firestore';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  subscribeToNotificationStats,
} from '@/lib/notifications';
import { NotificationData, NotificationType } from '@/types/notification';
import { Heart, MessageCircle, Users } from 'lucide-react';

// 거리 계산 헬퍼 함수
const calculateDistance = (
  post: PostData,
  currentLocation: { latitude: number; longitude: number } | null
): number => {
  if (!currentLocation) {
    return -1; // 위치 정보가 없으면 -1 표시
  }

  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (currentLocation.latitude * Math.PI) / 180;
  const φ2 = (post.location.latitude * Math.PI) / 180;
  const Δφ =
    ((post.location.latitude - currentLocation.latitude) * Math.PI) / 180;
  const Δλ =
    ((post.location.longitude - currentLocation.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // 미터 단위로 반환
};

// 시간 포맷팅 헬퍼 함수
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

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  // 로그인 페이지에서 돌아온 경우를 추적
  const [isFromLogin, setIsFromLogin] = useState(false);

  useEffect(() => {
    // 로그인 페이지에서 돌아온 경우 플래그 설정
    const fromLogin = sessionStorage.getItem('fromLogin');
    if (fromLogin === 'true') {
      setIsFromLogin(true);
      sessionStorage.removeItem('fromLogin');
      // 5초 후 플래그 해제 (충분한 시간 제공)
      setTimeout(() => setIsFromLogin(false), 5000);
    }
  }, []);

  // 로그인 페이지에서 돌아온 경우 불필요한 리다이렉트 방지
  useEffect(() => {
    if (isFromLogin) {
      // 로그인 페이지에서 돌아온 경우에는 리다이렉트하지 않음
      return;
    }

    // 일반적인 로그인 체크 로직은 여기에 추가 가능
    // 현재 홈 페이지는 로그인이 필요하지 않으므로 비워둘
  }, [user, isFromLogin]);

  // Firestore 포스트 데이터 상태
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  // 알림 관련 상태
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 위도경도를 주소로 변환하는 함수
  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string | undefined> => {
      try {
        // 카카오 지도 API를 사용한 역지오코딩
        const response = await fetch(
          `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
          {
            headers: {
              Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          console.warn('카카오 API 호출 실패, 기본 좌표만 사용');
          return undefined;
        }

        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
          const address = data.documents[0].address;
          if (address && address.address_name) {
            return address.address_name;
          }
        }
        return undefined;
      } catch (error) {
        console.warn('주소 변환 실패:', error);
        return undefined;
      }
    },
    []
  );

  const getCurrentLocation = useCallback(async () => {
    setLocationStatus('loading');
    try {
      // 로컬 스토리지에서 기존 위치 정보 확인
      const storedLocationData = localStorage.getItem('spot_location_data');

      if (storedLocationData) {
        try {
          const stored = JSON.parse(storedLocationData);
          const now = Date.now();
          const timeDiff = now - stored.timestamp;

          // 30분 이내의 데이터이고 주소가 있으면 사용
          if (timeDiff < 30 * 60 * 1000 && stored.address) {
            console.log('📦 로컬 스토리지의 위치 정보 사용:', stored);
            setCurrentLocation({
              latitude: stored.lat,
              longitude: stored.lng,
              accuracy: 50, // 저장된 데이터는 정확도 정보가 없으므로 기본값
              address: stored.address,
            });
            setLocationStatus('success');
            return;
          }
        } catch (error) {
          console.warn('로컬 스토리지 데이터 파싱 실패:', error);
        }
      }

      // 새로운 위치 정보 가져오기
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log('📍 현재 위치 획득:', {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              });
              resolve(pos);
            },
            (error) => {
              console.error('❌ 위치 정보 가져오기 실패:', error);
              reject(error);
            },
            {
              timeout: 10000,
              enableHighAccuracy: false,
              maximumAge: 60000,
            }
          );
        }
      );

      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;

      // 저장된 위치와 비교해서 변화가 크지 않으면 기존 주소 사용
      if (storedLocationData) {
        try {
          const stored = JSON.parse(storedLocationData);
          const distance = calculateLocationDistance(
            stored.lat,
            stored.lng,
            newLat,
            newLng
          );

          // 100m 이내면 기존 주소 사용 (API 호출 최소화)
          if (distance < 100 && stored.address) {
            console.log(
              '📍 위치 변화가 작음 (100m 이내), 기존 주소 사용:',
              stored.address
            );
            setCurrentLocation({
              latitude: newLat,
              longitude: newLng,
              accuracy: position.coords.accuracy,
              address: stored.address,
            });
            setLocationStatus('success');
            return;
          }
        } catch (error) {
          console.warn('저장된 위치 데이터 비교 실패:', error);
        }
      }

      // 위치 변화가 크거나 저장된 데이터가 없으면 새로운 주소 가져오기
      console.log('🔄 위치 변화가 큼, 새로운 주소 가져오기');
      const address = await reverseGeocode(newLat, newLng);

      setCurrentLocation({
        latitude: newLat,
        longitude: newLng,
        accuracy: position.coords.accuracy,
        address,
      });
      setLocationStatus('success');
    } catch (error) {
      console.error('위치 정보 오류:', error);
      setLocationStatus('error');
    }
  }, [reverseGeocode]);

  // 포스트 데이터 로드
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 먼저 만료된 포스트들을 자동으로 업데이트
        // await updateExpiredPosts(); // 만료 기능 제거

        let fetchedPosts: PostData[];

        // 현재 위치가 있으면 1km 반경 필터링, 없으면 전체 조회
        if (currentLocation) {
          fetchedPosts = await getNearbyPosts(
            currentLocation.latitude,
            currentLocation.longitude,
            1000, // 1km
            20
          );
          console.log('1km 반경 내 포스트 로드:', fetchedPosts);
        } else {
          fetchedPosts = await getActivePosts(20);
          console.log('전체 포스트 로드:', fetchedPosts);
        }

        setPosts(fetchedPosts);
      } catch (loadError) {
        console.error('포스트 로드 오류:', loadError);
        setError('포스트를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [currentLocation]); // currentLocation 의존성 추가

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // 알림 실시간 구독
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 알림 목록 구독
    const unsubscribeNotifications = subscribeToNotifications(
      user.uid,
      (newNotifications) => {
        // 최근 5개만 드롭다운에 표시
        setNotifications(newNotifications.slice(0, 5));
      }
    );

    // 읽지 않은 알림 개수 구독
    const unsubscribeStats = subscribeToNotificationStats(user.uid, (stats) => {
      setUnreadCount(stats.unread);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeStats();
    };
  }, [user]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isNotifOpen) {
        const target = event.target as Element;
        if (!target.closest('.notification-dropdown')) {
          setIsNotifOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  // 두 지점 간의 거리 계산 (미터 단위) - 위치 좌표용
  const calculateLocationDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatLocation = (lat: number, lng: number, address?: string) => {
    if (address) {
      return address;
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // 알림 시간 포맷팅
  const formatNotificationTime = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}시간 전`;

    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}일 전`;

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INTEREST:
        return <Heart className="w-4 h-4 text-red-500" />;
      case NotificationType.CHAT_MESSAGE:
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case NotificationType.CHAT_ROOM_CREATED:
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: NotificationData) => {
    try {
      // 읽지 않은 알림이면 읽음 처리
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
      }

      // 드롭다운 닫기
      setIsNotifOpen(false);

      // 알림 타입에 따라 해당 페이지로 이동
      switch (notification.type) {
        case NotificationType.INTEREST:
        case NotificationType.POST_STATUS_CHANGED:
          if (notification.postId) {
            router.push(`/posts/${notification.postId}`);
          }
          break;
        case NotificationType.CHAT_MESSAGE:
        case NotificationType.CHAT_ROOM_CREATED:
          if (notification.chatRoomId) {
            router.push(`/chat/${notification.chatRoomId}`);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('알림 처리 오류:', err);
    }
  };

  console.log('🏠 홈페이지 렌더링 시작');

  const handlePostClick = (postId: string) => {
    console.log('포스트 클릭:', postId);
    router.push(`/posts/${postId}`);
  };

  const handleRefresh = async () => {
    console.log('새로고침 버튼 클릭');

    try {
      setIsLoading(true);
      setError(null);

      // 먼저 만료된 포스트들을 자동으로 업데이트
      // await updateExpiredPosts(); // 만료 기능 제거

      // 위치 정보 새로고침
      await getCurrentLocation();

      // 현재 위치 기준으로 포스트 새로고침
      let fetchedPosts: PostData[];
      if (currentLocation) {
        fetchedPosts = await getNearbyPosts(
          currentLocation.latitude,
          currentLocation.longitude,
          1000,
          20
        );
      } else {
        fetchedPosts = await getActivePosts(20);
      }

      setPosts(fetchedPosts);
      console.log('새로고침된 포스트:', fetchedPosts);
    } catch (refreshError) {
      console.error('새로고침 오류:', refreshError);
      setError('새로고침에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = () => {
    if (user) {
      router.push('/posts/create');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 relative">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h1 className="text-lg font-semibold text-gray-900">
                주변 포스트
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                aria-label="새로고침"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setIsNotifOpen((v) => !v)}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors relative"
                  aria-label="알림"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500">최근 알림</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => {
                            setIsNotifOpen(false);
                            router.push('/notifications');
                          }}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          모두 보기
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-3 py-6 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          새로운 알림이 없습니다
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notification, index) => (
                          <button
                            key={notification.id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors ${
                              index > 0 ? 'border-t border-gray-100' : ''
                            } ${!notification.isRead ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p
                                      className={`text-sm font-medium ${
                                        !notification.isRead
                                          ? 'text-gray-900'
                                          : 'text-gray-700'
                                      }`}
                                    >
                                      {notification.title}
                                    </p>
                                    <p
                                      className={`text-xs mt-1 line-clamp-2 ${
                                        !notification.isRead
                                          ? 'text-gray-700'
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatNotificationTime(
                                        notification.createdAt
                                      )}
                                    </p>
                                  </div>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (user) {
                    router.push('/profile');
                  } else {
                    // 로그인 페이지로 이동 시 플래그 설정
                    sessionStorage.setItem('fromLogin', 'true');
                    router.push(
                      '/login?returnUrl=' + encodeURIComponent('/profile')
                    );
                  }
                }}
                className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                aria-label="프로필"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 현재 위치 표시 */}
          <div className="flex items-center space-x-2 text-sm">
            <Navigation className="w-4 h-4 text-gray-400" />
            {locationStatus === 'loading' && (
              <span className="text-gray-500">위치 확인 중...</span>
            )}
            {locationStatus === 'success' && currentLocation && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">
                  현재 위치:{' '}
                  {formatLocation(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    currentLocation.address
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  (정확도: ±{Math.round(currentLocation.accuracy)}m)
                </span>
              </div>
            )}
            {locationStatus === 'error' && (
              <span className="text-red-500">
                위치 정보를 가져올 수 없습니다
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 포스트 목록 */}
      <main className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* 에러 상태 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-red-500 text-xs underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex space-x-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex space-x-4">
                    {/* MVP: 포스트 이미지 비활성화 (Storage 미사용)
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {post.images?.[0] ? (
                      <Image src={post.images[0]} alt="Post Image" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">이미지 없음</span>
                      </div>
                    )}
                  </div>
                  */}

                    {/* 작성자 프로필 이미지 */}
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

                    {/* 포스트 정보 */}
                    <div className="flex-1 min-w-0">
                      {/* 제목 */}
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-1">
                        {post.title}
                      </h3>

                      {/* 작성자 정보와 거리 */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-gray-600">
                          {post.authorNickname}
                        </span>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {(() => {
                              const distance = calculateDistance(
                                post,
                                currentLocation
                              );
                              if (distance === -1) return '위치 확인 중';
                              return distance < 1000
                                ? `${Math.round(distance)}m`
                                : `${(distance / 1000).toFixed(1)}km`;
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* 내용 미리보기 */}
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {post.content}
                      </p>

                      {/* 시간 및 관심 수 */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>관심 {post.interestedCount}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                주변에 모집 중인 포스트가 없어요
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                새로운 만남을 위해 포스트를 작성해보세요!
              </p>
              <button
                onClick={handleCreatePost}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                포스트 작성하기
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 플로팅 액션 버튼 */}
      <button
        onClick={handleCreatePost}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-10"
        aria-label="포스트 만들기"
      >
        <span className="text-2xl">+</span>
      </button>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  );
}
