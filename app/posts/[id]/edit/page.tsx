'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BottomNavigation from '../../../components/BottomNavigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getPost, updatePost } from '@/lib/posts';
import { PostData, PostUpdateData } from '@/types/user';
import { Timestamp } from 'firebase/firestore';

interface PostFormData {
  title: string;
  content: string;
  maxParticipants: string;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const { success, error } = useToast();
  const postId = params.id as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    maxParticipants: '2~3명',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 포스트 데이터 로드
  useEffect(() => {
    const loadPost = async () => {
      try {
        setIsLoading(true);
        const postData = await getPost(postId);

        if (postData) {
          // 작성자 확인
          if (user && postData.authorId !== user.uid) {
            error('수정 권한이 없습니다.');
            router.push(`/posts/${postId}`);
            return;
          }

          setPost(postData);
          setFormData({
            title: postData.title,
            content: postData.content,
            maxParticipants: postData.maxParticipants,
          });
        } else {
          error('포스트를 찾을 수 없습니다.');
          router.push('/');
        }
      } catch (err) {
        console.error('포스트 로드 오류:', err);
        error('포스트를 불러오는데 실패했습니다.');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && postId) {
      loadPost();
    }
  }, [user, loading, postId, router, error]);

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
      if (!post) {
        error('포스트 정보를 찾을 수 없습니다.');
        setIsSubmitting(false);
        return;
      }

      const updateData: PostUpdateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        maxParticipants: formData.maxParticipants,
        updatedAt: Timestamp.now(),
      };

      await updatePost(post.id, updateData);

      success('포스트가 성공적으로 수정되었습니다! ✏️');
      router.push(`/posts/${post.id}`);
    } catch (submitError) {
      console.error('포스트 수정 실패:', submitError);
      error('포스트 수정에 실패했습니다. 다시 시도해주세요.');
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

  if (isLoading) {
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
            <h1 className="text-lg font-semibold text-gray-900">포스트 수정</h1>
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

            {/* 수정 완료 버튼 */}
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
                  <span>수정 중...</span>
                </div>
              ) : (
                '수정 완료'
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
