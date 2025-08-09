'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  ChevronRight,
  MessageSquare,
  FileText,
  LogOut,
} from 'lucide-react';

// 임시 사용자 데이터 (백엔드 연동 전까지 플레이스홀더)
const mockUser = {
  nickname: '스팟러버',
  profileImageUrl: '',
  interests: ['야구', '카페', '네트워킹'],
  age: 28,
  gender: '남성',
};

export default function ProfilePage() {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleBack = () => router.back();
  const handleEdit = () => router.push('/profile/modify');
  const goMyPosts = () => router.push('/profile/posts');
  const goMyChats = () => router.push('/profile/chats');

  const handleLogout = () => {
    // TODO: 백엔드 연동 후 실제 로그아웃 처리
    setShowLogoutConfirm(false);
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

          {/* 목록 바로가기 섹션 */}
          <section className="mt-3 bg-white divide-y divide-gray-100">
            <button
              onClick={goMyPosts}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-700" />
                <p className="text-gray-900 font-medium">내가 만든 포스트</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={goMyChats}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <p className="text-gray-900 font-medium">참여한 채팅방</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </section>

          {/* 설정 섹션 */}
          <section className="mt-3 bg-white">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-red-500 font-medium">로그아웃</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
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
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                로그아웃
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
