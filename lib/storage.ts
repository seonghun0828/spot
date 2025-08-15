import { supabase } from './supabase';

/**
 * 이미지 파일을 리사이즈하는 함수
 */
export function resizeImage(
  file: File,
  maxWidth: 400,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context를 생성할 수 없습니다.'));
      return;
    }

    img.onload = () => {
      // 비율을 유지하면서 리사이즈
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('이미지 변환에 실패했습니다.'));
            return;
          }

          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다.'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 프로필 이미지를 Supabase Storage에 업로드
 */
export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<string> {
  try {
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('파일 크기는 5MB 이하여야 합니다.');
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다.');
    }

    // 이미지 리사이즈 (400px 최대 크기로)
    const resizedFile = await resizeImage(file, 400);

    // 파일명 생성 (중복 방지)
    const fileExt = 'jpg'; // 리사이즈 후 항상 JPEG
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    // 기존 프로필 이미지 삭제 (선택사항)
    // await deleteOldProfileImage(userId);

    // 파일 업로드
    const { error } = await supabase.storage
      .from('profile-images')
      .upload(filePath, resizedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase 업로드 오류:', error);
      throw new Error(`업로드 실패: ${error.message}`);
    }

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from('profile-images').getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
}

/**
 * 프로필 이미지 삭제
 */
export async function deleteProfileImage(filePath: string): Promise<void> {
  try {
    // URL에서 파일 경로 추출
    const pathMatch = filePath.match(/profiles\/(.+)$/);
    if (!pathMatch) {
      throw new Error('잘못된 파일 경로입니다.');
    }

    const fullPath = pathMatch[0]; // 'profiles/filename.jpg'

    const { error } = await supabase.storage
      .from('profile-images')
      .remove([fullPath]);

    if (error) {
      console.error('Supabase 삭제 오류:', error);
      throw new Error(`삭제 실패: ${error.message}`);
    }
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    throw error;
  }
}

/**
 * 사용자의 기존 프로필 이미지들을 모두 삭제 (정리용)
 */
export async function deleteOldProfileImages(userId: string): Promise<void> {
  try {
    // 해당 사용자의 모든 프로필 이미지 조회
    const { data: files, error } = await supabase.storage
      .from('profile-images')
      .list('profiles', {
        search: userId,
      });

    if (error) {
      console.error('파일 목록 조회 오류:', error);
      return;
    }

    if (files && files.length > 0) {
      // 파일 경로 배열 생성
      const filePaths = files.map((file) => `profiles/${file.name}`);

      // 모든 파일 삭제
      const { error: deleteError } = await supabase.storage
        .from('profile-images')
        .remove(filePaths);

      if (deleteError) {
        console.error('기존 파일 삭제 오류:', deleteError);
      }
    }
  } catch (error) {
    console.error('기존 이미지 정리 오류:', error);
  }
}
