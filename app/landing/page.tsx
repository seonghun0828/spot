'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Users, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [locationPermission, setLocationPermission] = useState<
    'granted' | 'denied' | 'prompt'
  >('prompt');

  useEffect(() => {
    // 위치 권한 상태 확인
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
      });
    }
  }, []);

  const handleGetStarted = async () => {
    if (locationPermission === 'granted') {
      router.push('/');
    } else {
      try {
        await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        setLocationPermission('granted');
        router.push('/');
      } catch {
        setLocationPermission('denied');
        alert(
          '위치 권한이 필요합니다. 브라우저 설정에서 위치 권한을 허용해주세요.'
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="px-6 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Spot</h1>
          <p className="text-lg text-gray-600">
            지금 바로 주위 사람들이 뭘 하고 있는지 확인해보세요!
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="px-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* 메인 이미지/그래픽 */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                근처 사람들과 연결될 수 있어요
              </h2>
              <p className="text-gray-600 text-sm">
                야구장, 카페, 컨퍼런스 등 같은 공간에 있는 사람들과 쉽게
                소통하고 만남을 시작하세요
              </p>
            </div>
          </div>

          {/* 위치 권한 설명 */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  위치 기반 서비스
                </h3>
                <p className="text-sm text-gray-600">
                  안전하고 정확한 소통을 위해 현재 위치 주변 1km 이내의 포스트만
                  표시됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 작동 방식 설명 */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">
              어떻게 작동하나요?
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <p className="text-sm text-gray-600">주변 포스트 탐색</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <p className="text-sm text-gray-600">
                  관심 있는 포스트에 &apos;관심 있어요&apos; 표현
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <p className="text-sm text-gray-600">
                  매칭되면 채팅으로 소통 시작
                </p>
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <button
            onClick={handleGetStarted}
            className="w-full cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>내 주변 포스트 바로 보기</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* 부가 설명 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              로그인 없이 포스트를 둘러볼 수 있어요.
              <br />
              포스트 작성이나 관심 표현 시에만 로그인이 필요합니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
