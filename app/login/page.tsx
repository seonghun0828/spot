'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/auth';
import { useAuth } from '@/app/contexts/AuthContext';

export default function LoginPage() {
  // const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  // 이미 로그인된 경우 홈으로 리다이렉트 (useEffect 사용)
  useEffect(() => {
    console.log('user', user);
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  // 로딩 중이거나 이미 로그인된 경우 로딩 화면 표시
  if (loading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-500 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {loading ? '로그인 상태 확인 중...' : '리다이렉트 중...'}
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  // const handleKakaoLogin = async () => {
  //   setIsLoading(true);

  //   try {
  //     // 카카오 로그인 페이지로 리다이렉트
  //     const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${
  //       process.env.NEXT_PUBLIC_KAKAO_API_KEY
  //     }&redirect_uri=${encodeURIComponent(
  //       window.location.origin + '/auth/kakao/callback'
  //     )}&response_type=code`;

  //     window.location.href = kakaoAuthUrl;
  //   } catch (error) {
  //     setIsLoading(false);
  //     console.error('카카오 로그인 오류:', error);
  //     alert('로그인 중 오류가 발생했습니다.');
  //   }
  // };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      const user = await signInWithGoogle();

      if (user) {
        // 로그인 성공 - useEffect에서 홈으로 리다이렉트됨
        console.log('로그인 성공:', user.email);
      } else {
        // 사용자가 팝업을 닫은 경우
        console.log('로그인이 취소되었습니다.');
      }
    } catch (error: unknown) {
      console.error('구글 로그인 오류:', error);

      // 팝업이 닫힌 경우는 에러 메시지를 표시하지 않음
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code !== 'auth/popup-closed-by-user'
      ) {
        alert('구글 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Spot</h1>
          </Link>
          <p className="text-gray-600">지금 바로 주위 사람들과 연결하세요</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
            <p className="text-gray-600 mt-2">
              안전한 소통과 활동 관리를 위해 로그인이 필요합니다
            </p>
          </div>

          {/* 로그인 버튼들 */}
          <div className="space-y-4">
            {/* 구글 로그인 버튼 */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {googleLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  로그인 중...
                </div>
              ) : (
                <>
                  <svg
                    className="w-6 h-6 mr-3"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google로 로그인
                </>
              )}
            </button>

            {/* 구분선 */}
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div> */}

            {/* 카카오 로그인 버튼 */}
            {/* <button
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 rounded-lg text-gray-700 bg-yellow-400 hover:bg-yellow-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  로그인 중...
                </div>
              ) : (
                <>
                  <svg
                    className="w-6 h-6 mr-3"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
                  </svg>
                  카카오로 로그인
                </>
              )}
            </button> */}
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center text-sm text-gray-500">
          <p>
            로그인 시 Spot의{' '}
            <Link href="/terms" className="underline hover:text-gray-700">
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy" className="underline hover:text-gray-700">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
