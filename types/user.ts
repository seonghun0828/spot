import { Timestamp } from 'firebase/firestore';

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
