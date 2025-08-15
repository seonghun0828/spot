'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { uploadProfileImage, deleteOldProfileImages } from '@/lib/storage';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { updateProfile } from 'firebase/auth';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate?: (newImageUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

export default function ProfileImageUpload({
  currentImageUrl,
  onImageUpdate,
  size = 'lg',
  showUploadButton = true,
}: ProfileImageUploadProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    currentImageUrl || user?.photoURL || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 크기별 스타일
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);

      const file = event.target.files?.[0];
      if (!file || !user) {
        return;
      }

      // 기존 이미지들 정리 (선택사항)
      if (imageUrl && imageUrl.includes('supabase')) {
        try {
          await deleteOldProfileImages(user.uid);
        } catch (cleanupError) {
          console.warn('기존 이미지 정리 실패:', cleanupError);
          // 정리 실패해도 업로드는 계속 진행
        }
      }

      // 새 이미지 업로드
      const publicUrl = await uploadProfileImage(file, user.uid);

      // Firebase Auth 프로필 업데이트
      await updateProfile(user, { photoURL: publicUrl });

      // 상태 업데이트
      setImageUrl(publicUrl);
      onImageUpdate?.(publicUrl);

      success('프로필 이미지가 업데이트되었습니다!');
    } catch (uploadError) {
      console.error('업로드 오류:', uploadError);
      const errorMessage =
        uploadError instanceof Error
          ? uploadError.message
          : '이미지 업로드에 실패했습니다.';
      error(errorMessage);
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 프로필 이미지 */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="프로필 이미지"
              className="w-full h-full object-cover"
              onError={() => {
                // 이미지 로드 실패 시 기본 이미지로 대체
                setImageUrl('');
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Camera className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* 로딩 오버레이 */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* 카메라 아이콘 (작은 크기일 때) */}
        {size === 'sm' && (
          <button
            onClick={handleUploadClick}
            disabled={uploading || !user}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Camera className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 업로드 버튼 (중간/큰 크기일 때) */}
      {showUploadButton && size !== 'sm' && (
        <button
          onClick={handleUploadClick}
          disabled={uploading || !user}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>업로드 중...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>이미지 변경</span>
            </>
          )}
        </button>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={uploading || !user}
        className="hidden"
      />

      {/* 안내 텍스트 */}
      {showUploadButton && size !== 'sm' && (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          JPG, PNG 파일만 가능하며, 최대 5MB까지 업로드할 수 있습니다.
          <br />
          이미지는 자동으로 최적화됩니다.
        </p>
      )}
    </div>
  );
}
