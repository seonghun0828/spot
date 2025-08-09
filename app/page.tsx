'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, RefreshCw, Navigation, Bell, User } from 'lucide-react';
import BottomNavigation from './components/BottomNavigation';

// 임시 데이터 타입 정의
interface Post {
  id: string;
  title: string;
  author: {
    nickname: string;
    profileImage?: string;
  };
  distance: number;
  image?: string;
  createdAt: string;
}

// 임시 데이터 (나중에 API로 교체)
const mockPosts: Post[] = [
  {
    id: '1',
    title: '야구 직관 같이 보실 분!',
    author: {
      nickname: '야구팬',
      profileImage: '/images/mockup-home.png',
    },
    distance: 150,
    image: '/images/mockup-home.png',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: '카페에서 같이 공부하실 분',
    author: {
      nickname: '공부러',
    },
    distance: 300,
    createdAt: '2024-01-15T09:30:00Z',
  },
  {
    id: '3',
    title: '점심 같이 먹을 분 구해요',
    author: {
      nickname: '점심러',
    },
    distance: 500,
    createdAt: '2024-01-15T09:00:00Z',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [posts] = useState<Post[]>(mockPosts);
  const [isLoggedIn] = useState(false); // 임시 로그인 상태
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');

  // 위도경도를 주소로 변환하는 함수
  const reverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<string | undefined> => {
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
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
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
          const distance = calculateDistance(
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
  };

  // 두 지점 간의 거리 계산 (미터 단위)
  const calculateDistance = (
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

  console.log('🏠 홈페이지 렌더링 시작');

  const handlePostClick = (postId: string) => {
    console.log('포스트 클릭:', postId);
    router.push(`/posts/${postId}`);
  };

  const handleRefresh = async () => {
    console.log('새로고침 버튼 클릭');
    await getCurrentLocation();
    // 실제로는 API 호출로 새로운 포스트 가져오기
  };

  const handleCreatePost = () => {
    console.log('포스트 만들기 버튼 클릭');
    router.push('/posts/create');
    // if (isLoggedIn) {
    //   router.push('/posts/create');
    // } else {
    //   router.push('/login');
    // }
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
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen((v) => !v)}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  aria-label="알림"
                >
                  <Bell className="w-5 h-5" />
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="px-3 py-2 border-b text-xs text-gray-500">
                      최근 알림
                    </div>
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        // 알림 클릭 예시: 내 포스트 관심 알림 → 상세로 이동
                        router.push(`/posts/${mockPosts[0]?.id ?? '1'}`);
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-gray-50"
                    >
                      <div className="text-sm text-gray-900">
                        내 포스트에 '관심 있어요'가 달렸어요
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">2분 전</div>
                    </button>
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        // 알림 클릭 예시: 채팅방 생성 알림 → 채팅 목록 또는 특정 방
                        router.push(`/chat`);
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-gray-50 border-t"
                    >
                      <div className="text-sm text-gray-900">
                        새 채팅방이 생성되었어요
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        10분 전
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push('/profile')}
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
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex space-x-4">
                  {/* 포스트 이미지 */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt="Post Image"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">
                          이미지 없음
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
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-gray-300 rounded-full" />
                        <span className="text-xs text-gray-600">
                          {post.author.nickname}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {post.distance < 100
                            ? `${Math.round(post.distance)}m`
                            : `${(post.distance / 1000).toFixed(1)}km`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                주변에 포스트가 없어요
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                첫 번째 포스트를 작성해보세요!
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
      <BottomNavigation activeTab="home" isLoggedIn={isLoggedIn} />
    </div>
  );
}
