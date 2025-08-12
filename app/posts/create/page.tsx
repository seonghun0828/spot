'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, X, Upload } from 'lucide-react';
import BottomNavigation from '../../components/BottomNavigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createPost } from '@/lib/posts';
import { getUserData } from '@/lib/auth';
import { PostCreateData } from '@/types/user';
import { Timestamp } from 'firebase/firestore';

interface PostFormData {
  title: string;
  content: string;
  // MVP: 이미지 업로드 기능 비활성화
  // image?: File;
  maxParticipants: string;
  tags: string[];
  meetingDate: string;
  meetingTime: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  // MVP: 이미지 업로드 기능 비활성화
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    maxParticipants: '2~3명',
    tags: [],
    meetingDate: '',
    meetingTime: '',
  });

  const [newTag, setNewTag] = useState('');
  // MVP: 이미지 업로드 기능 비활성화
  // const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);

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

  const handleBack = () => {
    router.back();
  };

  const handleInputChange = (field: keyof PostFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: undefined,
    }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      alert('상세 설명을 입력해주세요.');
      return;
    }

    if (formData.title.length >= 50) {
      alert('제목은 50자 이하여야 합니다.');
      return;
    }

    if (formData.content.length >= 1000) {
      alert('상세 설명은 1000자 이하여야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user || !userData) {
        alert('로그인 정보를 확인할 수 없습니다.');
        return;
      }

      // 현재 시간에서 1시간 후를 기본 모임 시간으로 설정 (임시)
      const defaultMeetingTime = new Date();
      defaultMeetingTime.setHours(defaultMeetingTime.getHours() + 1);

      // 최대 참가자 수 숫자로 변환
      const maxParticipants =
        parseInt(formData.maxParticipants.replace(/[^0-9]/g, '')) || 2;

      const postData: PostCreateData = {
        authorId: user.uid,
        authorNickname: userData.nickname || user.displayName || '사용자',
        authorProfileImageUrl: userData.profileImageUrl || user.photoURL || '',
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags || [],
        location: {
          // TODO: 실제 위치 정보 구현 필요
          latitude: 37.5665,
          longitude: 126.978,
          address: '서울시 중구 명동',
        },
        maxParticipants,
        meetingTime: Timestamp.fromDate(defaultMeetingTime),
        isActive: true,
      };

      console.log('포스트 생성 데이터:', postData);
      const postId = await createPost(postData);

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
                placeholder="어떤 만남을 원하시나요?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                placeholder="만남에 대한 자세한 설명을 작성해주세요.&#10;예: 시간, 장소, 목적, 원하는 인원 등"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                        : 'border-gray-300 hover:border-gray-400'
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
