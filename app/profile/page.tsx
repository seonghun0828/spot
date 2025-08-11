'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '@/lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트 (useEffect 사용)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 로딩 중이거나 로그인되지 않은 경우 로딩 화면 표시
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
            {loading ? '로그인 상태 확인 중...' : '로그인이 필요합니다'}
          </h2>
          <p className="text-gray-600">
            {loading ? '잠시만 기다려주세요' : '로그인 페이지로 이동합니다'}
          </p>
        </div>
      </div>
    );
  }

  // 임시 사용자 데이터 (백엔드 연동 전까지 플레이스홀더)
  const mockUser = {
    nickname: user.displayName || '사용자',
    profileImageUrl: user.photoURL || '',
    interests: ['야구', '카페', '네트워킹'],
    age: 28,
    gender: '남성',
  };

  const handleBack = () => router.back();
  const handleEdit = () => router.push('/profile/modify');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOutUser();
      setShowLogoutConfirm(false);
      // 로그아웃 후 홈 페이지로 리다이렉트
      router.push('/');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">프로필</h1>
          <button
            onClick={handleEdit}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Edit3 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* 본문 컨테이너 시작 */}
      <div className="px-4">
        <div className="max-w-md mx-auto">
          {/* 프로필 정보 */}
          <section className="bg-white px-6 py-6">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleEdit}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"
              >
                {mockUser.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mockUser.profileImageUrl}
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white bg-gradient-to-br from-blue-500 to-purple-500 w-full h-full flex items-center justify-center">
                    {mockUser.nickname.charAt(0)}
                  </span>
                )}
              </button>

              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">
                  {mockUser.nickname}
                </p>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              </div>

              {mockUser.interests?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {mockUser.interests.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600">
                {mockUser.age ? <span>{mockUser.age}세</span> : null}
                {mockUser.gender ? <span>{mockUser.gender}</span> : null}
              </div>
            </div>
          </section>

          {/* 목록 바로가기 섹션 - 스펙 변경으로 제거됨 (내 활동 페이지로 이동) */}

          {/* 설정 섹션 */}
          <section className="mt-3 bg-white">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoggingOut}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-red-500 font-medium">
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </span>
              </div>
            </button>
          </section>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              로그아웃
            </h3>
            <p className="text-gray-600 mb-6">정말 로그아웃하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoggingOut ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    로그아웃 중...
                  </>
                ) : (
                  '로그아웃'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}
