import { Timestamp } from 'firebase/firestore';
import { PostStatus } from '@/constants/postStatus';

// 사용자 데이터 타입
export interface UserData {
  uid: string;
  email: string;
  nickname: string;
  profileImageUrl: string;
  interests: string[];
  age: number | null;
  gender: '남성' | '여성' | '선택안함' | null;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  fcmTokens: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}

// 선택적 필드가 포함된 사용자 데이터 (Firestore에서 가져올 때)
export type PartialUserData = Partial<UserData>;

// 사용자 업데이트용 타입 (uid, createdAt 제외)
export type UserUpdateData = Omit<Partial<UserData>, 'uid' | 'createdAt'>;

// 프로필 표시용 타입
export interface DisplayUser {
  nickname: string;
  profileImageUrl: string;
  interests: string[];
  age: number | null;
  gender: string | null;
  email: string;
}

// 포스트 데이터 타입
export interface PostData {
  id: string;
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string;
  title: string;
  content: string;
  tags: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
    geohash?: string; // 위치 기반 쿼리용
  };
  maxParticipants: string; // "2~3명", "제한 없음" 등
  interestedCount: number; // 관심 있어요 누른 사람 수
  interestedUserIds: string[]; // 관심 있어요 누른 사람들의 UID 목록
  meetingTime: Timestamp;
  status?: PostStatus; // 포스트 상태 (선택적)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  // MVP: 이미지 관련 필드 주석 처리
  // images?: string[];
}

// 포스트 생성용 타입 (id, timestamps, interested 관련 제외)
export type PostCreateData = Omit<
  PostData,
  'id' | 'createdAt' | 'updatedAt' | 'interestedCount' | 'interestedUserIds'
>;

// 포스트 업데이트용 타입
export type PostUpdateData = Partial<
  Omit<PostData, 'id' | 'authorId' | 'createdAt'>
>;

// 관심 있어요 표시한 사용자 정보
export interface InterestedUser {
  uid: string;
  nickname: string;
  profileImageUrl: string;
  interestedAt: Timestamp; // 관심 표시한 시간
}
