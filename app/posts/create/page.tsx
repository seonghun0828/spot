'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BottomNavigation from '../../components/BottomNavigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createPost } from '@/lib/posts';
import { getUserData } from '@/lib/auth';
import { PostCreateData, PartialUserData } from '@/types/user';
import { Timestamp } from 'firebase/firestore';

interface PostFormData {
  title: string;
  content: string;
  maxParticipants: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    maxParticipants: '2~3명',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<PartialUserData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  // 로그인 체크 및 사용자 데이터 로드
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const loadUserData = async () => {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
        } catch (err) {
          console.error('사용자 데이터 로드 오류:', err);
        }
      };
      loadUserData();
    }
  }, [user, loading, router]);

  // 현재 위치 정보 가져오기
  useEffect(() => {
    const getCurrentLocation = async () => {
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
              setCurrentLocation({
                latitude: stored.lat,
                longitude: stored.lng,
                address: stored.address,
              });
              return;
            }
          } catch (error) {
            console.warn('로컬 스토리지 데이터 파싱 실패:', error);
          }
        }

        // 새로운 위치 정보 가져오기
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: false,
              maximumAge: 60000,
            });
          }
        );

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 카카오 지도 API로 주소 변환
        const response = await fetch(
          `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
          {
            headers: {
              Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_API_KEY}`,
            },
          }
        );

        let address = '위치 정보 없음';
        if (response.ok) {
          const data = await response.json();
          if (data.documents && data.documents.length > 0) {
            address =
              data.documents[0].address?.address_name || '위치 정보 없음';
          }
        }

        setCurrentLocation({
          latitude: lat,
          longitude: lng,
          address,
        });

        // 로컬 스토리지에 저장
        localStorage.setItem(
          'spot_location_data',
          JSON.stringify({
            lat,
            lng,
            address,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error('위치 정보 가져오기 실패:', error);
        // 기본값으로 설정
        setCurrentLocation({
          latitude: 37.5665,
          longitude: 126.978,
          address: '위치를 가져올 수 없습니다',
        });
      }
    };

    getCurrentLocation();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleInputChange = (field: keyof PostFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.title.trim()) {
      error('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      error('상세 설명을 입력해주세요.');
      return;
    }

    if (formData.title.length >= 50) {
      error('제목은 50자 이하여야 합니다.');
      return;
    }

    if (formData.content.length >= 1000) {
      error('상세 설명은 1000자 이하여야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user || !userData) {
        error('로그인 정보를 확인할 수 없습니다.');
        setIsSubmitting(false);
        return;
      }

      // 현재 시간에서 1시간 후를 기본 모임 시간으로 설정 (임시)
      const defaultMeetingTime = new Date();
      defaultMeetingTime.setHours(defaultMeetingTime.getHours() + 1);

      // 희망 인원은 문자열 그대로 저장
      const maxParticipants = formData.maxParticipants;

      const postData: PostCreateData = {
        authorId: user.uid,
        authorNickname: userData.nickname || user.displayName || '사용자',
        authorProfileImageUrl: userData.profileImageUrl || user.photoURL || '',
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: [],
        location: currentLocation || {
          latitude: 37.5665,
          longitude: 126.978,
          address: '위치 정보 없음',
        },
        maxParticipants,
        meetingTime: Timestamp.fromDate(defaultMeetingTime),
        isActive: true,
      };

      console.log('포스트 생성 데이터:', postData);
      await createPost(postData);

      success('포스트가 성공적으로 생성되었습니다! 🎉');
      router.push('/');
    } catch (submitError) {
      console.error('포스트 생성 실패:', submitError);
      error('포스트 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const participantOptions = [
    { value: '1:1', label: '1:1' },
    { value: '2~3명', label: '2~3명' },
    { value: '4~5명', label: '4~5명' },
    { value: '제한 없음', label: '제한 없음' },
  ];

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
            <h1 className="text-lg font-semibold text-gray-900">
              포스트 만들기
            </h1>
            <div className="w-10"></div> {/* 균형을 위한 빈 공간 */}
          </div>
        </div>
      </header>

      {/* 폼 */}
      <main className="px-4 py-4">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 제목 입력 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                제목 *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="어떤 활동을 함께 하고 싶으신가요?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                maxLength={50}
                required
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.title.length}/50
              </div>
            </div>

            {/* 상세 설명 */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                상세 설명 *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="사람들과 함께하고 싶은 활동에 대한 자세한 설명을 작성해주세요.&#10;예: 시간, 장소, 목적, 참여 조건 등"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900"
                maxLength={1000}
                required
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.content.length}/1000
              </div>
            </div>

            {/* MVP: 사진 업로드 기능 비활성화
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사진 (선택)
              </label>

              {imagePreview ? (
                <div className="relative">
                  <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="이미지 제거"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">사진을 업로드하세요</p>
                  <p className="text-xs text-gray-400 mt-1">
                    최대 5MB, 1장만 가능
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            */}

            {/* 희망 인원 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                희망 인원 (선택)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {participantOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.maxParticipants === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 bg-white text-gray-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="maxParticipants"
                      value={option.value}
                      checked={formData.maxParticipants === option.value}
                      onChange={(e) =>
                        handleInputChange('maxParticipants', e.target.value)
                      }
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 포스트 생성 버튼 */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.title.trim() ||
                !formData.content.trim()
              }
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>생성 중...</span>
                </div>
              ) : (
                '포스트 생성하기'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab={undefined} />
    </div>
  );
}
