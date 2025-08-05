'use client';

import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';

interface LocationPermissionProps {
  onPermissionGranted: (location: {
    lat: number;
    lng: number;
    address?: string;
  }) => void;
  onPermissionDenied: () => void;
}

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export default function LocationPermission({
  onPermissionGranted,
  onPermissionDenied,
}: LocationPermissionProps) {
  const [permissionStatus, setPermissionStatus] = useState<
    'checking' | 'granted' | 'denied' | 'prompt'
  >('checking');
  const [isRetrying, setIsRetrying] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // 위도경도를 주소로 변환하는 함수
  const reverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<string | undefined> => {
    console.log('🔍 reverseGeocode 함수 시작:', { lat, lng });
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

      console.log('📡 카카오 API 응답 상태:', response.status);

      if (!response.ok) {
        console.warn('카카오 API 호출 실패, 기본 좌표만 사용');
        return undefined;
      }

      const data = await response.json();
      console.log('📋 카카오 API 응답 데이터:', data);

      if (data.documents && data.documents.length > 0) {
        const address = data.documents[0].address;
        console.log('📍 주소 정보:', address);
        if (address && address.address_name) {
          // 동 이름만 추출 (예: "서울특별시 강남구 역삼동" -> "역삼동")
          console.log('🏘️ 추출된 동 이름:', address.address_name);
          return address.address_name;
        }
      }
      console.log('❌ 주소 변환 실패: documents가 없거나 address가 없음');
      return undefined;
    } catch (error) {
      console.warn('주소 변환 실패:', error);
      return undefined;
    }
  };

  const checkPermissionStatus = async () => {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({
          name: 'geolocation',
        });
        setPermissionStatus(result.state);

        // 권한이 이미 허용된 경우 즉시 위치 정보 가져오기
        if (result.state === 'granted') {
          console.log('🔍 이미 권한이 허용됨, 위치 정보 가져오기 시작');
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude: lat, longitude: lng } = position.coords;
              console.log('✅ 기존 권한으로 위치 정보 획득:', { lat, lng });
              const address = await reverseGeocode(lat, lng);
              const locationInfo = { lat, lng, address };
              setLocationData(locationInfo);
              onPermissionGranted(locationInfo);
            },
            (error) => {
              console.error('❌ 기존 권한으로 위치 정보 가져오기 실패:', error);
              onPermissionGranted({ lat: 0, lng: 0 });
            }
          );
        }

        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
          if (result.state === 'granted') {
            // 권한이 새로 허용된 경우 위치 정보를 가져와서 전달
            console.log('🆕 권한이 새로 허용됨, 위치 정보 가져오기 시작');
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                const address = await reverseGeocode(lat, lng);
                const locationInfo = { lat, lng, address };
                setLocationData(locationInfo);
                onPermissionGranted(locationInfo);
              },
              () => {
                // 위치 정보 가져오기 실패 시 기본값으로 호출
                onPermissionGranted({ lat: 0, lng: 0 });
              }
            );
          } else if (result.state === 'denied') {
            onPermissionDenied();
          }
        });
      } else {
        // permissions API를 지원하지 않는 브라우저
        setPermissionStatus('prompt');
      }
    } catch (error) {
      console.error('권한 상태 확인 실패:', error);
      setPermissionStatus('prompt');
    }
  };

  const requestLocationPermission = async () => {
    console.log('🚀 위치 권한 요청 시작');
    setIsRetrying(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false,
          });
        }
      );

      const { latitude: lat, longitude: lng } = position.coords;
      console.log('✅ 위치 권한 획득 성공:', { lat, lng });

      // 주소 변환 시도
      console.log('🔄 주소 변환 시작...');
      const address = await reverseGeocode(lat, lng);
      console.log('📍 주소 변환 결과:', address);

      const locationInfo = { lat, lng, address };
      console.log('📊 최종 위치 정보:', locationInfo);
      setLocationData(locationInfo);
      setPermissionStatus('granted');
      onPermissionGranted(locationInfo);
    } catch (error) {
      console.error('❌ 위치 권한 요청 실패:', error);
      setPermissionStatus('denied');
      onPermissionDenied();
    } finally {
      setIsRetrying(false);
    }
  };

  if (permissionStatus === 'checking') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">위치 권한 확인 중...</span>
      </div>
    );
  }

  if (permissionStatus === 'granted') {
    return (
      <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <div className="flex-1">
          <span className="text-green-700 text-sm">
            위치 권한이 허용되었습니다
          </span>
          {locationData && (
            <div className="text-green-600 text-xs mt-1">
              {locationData.address ? (
                <span>현재 위치: {locationData.address}</span>
              ) : (
                <span>
                  좌표: {locationData.lat.toFixed(6)},{' '}
                  {locationData.lng.toFixed(6)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-800 font-medium text-sm mb-1">
              위치 권한이 거부되었습니다
            </h3>
            <p className="text-red-700 text-xs mb-3">
              주변 포스트를 보려면 위치 권한이 필요합니다. 브라우저 설정에서
              위치 권한을 허용해주세요.
            </p>
            <button
              onClick={requestLocationPermission}
              disabled={isRetrying}
              className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
            >
              {isRetrying ? '요청 중...' : '다시 시도'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <div className="flex items-start space-x-3">
        <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-blue-800 font-medium text-sm mb-1">
            위치 권한이 필요합니다
          </h3>
          <p className="text-blue-700 text-xs mb-3">
            주변 포스트를 보려면 위치 정보 접근 권한을 허용해주세요.
          </p>
          <button
            onClick={requestLocationPermission}
            disabled={isRetrying}
            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
          >
            {isRetrying ? '요청 중...' : '위치 권한 허용'}
          </button>
        </div>
      </div>
    </div>
  );
}
