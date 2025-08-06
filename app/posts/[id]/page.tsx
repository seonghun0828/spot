'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Clock, Share2, MoreHorizontal } from 'lucide-react';
import BottomNavigation from '../../components/BottomNavigation';

// 포스트 상세 데이터 타입 정의
interface PostDetail {
  id: string;
  title: string;
  content: string;
  author: {
    nickname: string;
    profileImage?: string;
  };
  distance: number;
  image?: string;
  createdAt: string;
  category: string;
  tags: string[];
}

// 임시 상세 데이터 (나중에 API로 교체)
const mockPostDetails: Record<string, PostDetail> = {
  '1': {
    id: '1',
    title: '야구 직관 같이 보실 분!',
    content: `안녕하세요! 이번 주말에 야구 직관 같이 가실 분 구합니다.

📅 일시: 이번 주 토요일 오후 2시
🏟️ 장소: 잠실야구장
💰 비용: 티켓 비용은 각자 부담 (약 3만원 정도)
👥 인원: 2-3명 정도

야구를 좋아하시는 분들이라면 누구든 환영합니다! 
경기 전에 맛집도 같이 가고, 경기 후에는 술 한 잔도 같이 하면 좋을 것 같아요.

관심 있으신 분들은 댓글이나 채팅으로 연락주세요! 😊`,
    author: {
      nickname: '야구팬',
      profileImage: '/images/mockup-home.png',
    },
    distance: 150,
    image: '/images/mockup-home.png',
    createdAt: '2024-01-15T10:00:00Z',
    category: '스포츠',
    tags: ['야구', '직관', '스포츠', '친목'],
  },
  '2': {
    id: '2',
    title: '카페에서 같이 공부하실 분',
    content: `안녕하세요! 카페에서 같이 공부하실 분 구합니다.

📚 공부 내용: 프론트엔드 개발 (React, TypeScript)
☕ 장소: 강남역 근처 조용한 카페
⏰ 시간: 평일 저녁 7시부터 10시까지
👥 인원: 1-2명

같이 공부하면서 서로 모르는 부분 질문하고 답변해주고 싶어요.
개발자 분들이라면 더욱 환영합니다!

연락주세요! 📱`,
    author: {
      nickname: '공부러',
    },
    distance: 300,
    createdAt: '2024-01-15T09:30:00Z',
    category: '공부',
    tags: ['공부', '개발', '카페', '스터디'],
  },
  '3': {
    id: '3',
    title: '점심 같이 먹을 분 구해요',
    content: `안녕하세요! 점심 같이 먹을 분 구합니다.

🍽️ 음식: 회사 근처 맛집 탐방
⏰ 시간: 평일 점심시간 (12시-1시)
👥 인원: 1-2명

혼자 먹기 심심해서 같이 먹을 분 구해요.
회사 근처 맛집들도 같이 탐방해보고 싶어요!

연락주세요! 😊`,
    author: {
      nickname: '점심러',
    },
    distance: 500,
    createdAt: '2024-01-15T09:00:00Z',
    category: '식사',
    tags: ['점심', '맛집', '친목'],
  },
};

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);

  useEffect(() => {
    // 포스트 데이터 가져오기 (실제로는 API 호출)
    const postData = mockPostDetails[postId];
    if (postData) {
      setPost(postData);
    } else {
      // 포스트가 없으면 홈으로 리다이렉트
      router.push('/');
    }
  }, [postId, router]);

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.content.substring(0, 100) + '...',
        url: window.location.href,
      });
    } else {
      // 폴백: URL 복사
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    }
  };

  const handleInterest = () => {
    // 관심있어요 버튼 클릭 시 처리
    console.log('관심있어요 클릭:', post?.id);
    alert('관심을 표시했습니다! 작성자에게 연락이 갈 예정입니다.');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">포스트를 불러오는 중...</p>
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
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="더보기"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 포스트 내용 */}
      <main className="px-4 py-4">
        <div className="max-w-md mx-auto">
          {/* 포스트 이미지 */}
          {post.image && (
            <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden mb-4 relative">
              <Image
                src={post.image}
                alt="Post Image"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* 포스트 헤더 */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                  {post.author.profileImage && (
                    <Image
                      src={post.author.profileImage}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {post.author.nickname}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(post.createdAt)}</span>
                    <MapPin className="w-3 h-3" />
                    <span>
                      {post.distance < 100
                        ? `${Math.round(post.distance)}m`
                        : `${(post.distance / 1000).toFixed(1)}km`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 제목과 공유 버튼 */}
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900 flex-1 mr-4">
                {post.title}
              </h1>
              <button
                onClick={handleShare}
                className="flex cursor-pointer items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* 카테고리와 태그 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {post.category}
              </span>
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* 내용 */}
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* 관심있어요 CTA 버튼 */}
          <button
            onClick={handleInterest}
            className="w-full cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 mb-4"
          >
            <span className="text-2xl">🙌</span>
            <span>관심있어요!</span>
          </button>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab="home" />
    </div>
  );
}
