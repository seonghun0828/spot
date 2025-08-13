import { Timestamp } from 'firebase/firestore';

// 채팅방 데이터 타입
export interface ChatRoom {
  id: string;
  name: string; // 채팅방 이름 (포스트 제목 기반)
  postId: string; // 연관된 포스트 ID
  postTitle: string; // 포스트 제목
  hostId: string; // 방장 (포스트 작성자) ID
  memberIds: string[]; // 참여자 UID 목록
  memberCount: number; // 참여자 수
  lastMessage?: string; // 마지막 메시지
  lastMessageAt?: Timestamp; // 마지막 메시지 시간
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

// 채팅방 생성용 타입
export type ChatRoomCreateData = Omit<
  ChatRoom,
  'id' | 'createdAt' | 'updatedAt' | 'lastMessage' | 'lastMessageAt'
>;

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderNickname: string;
  senderProfileImage: string;
  content: string;
  type: 'text' | 'system'; // 일반 메시지 or 시스템 메시지
  createdAt: Timestamp;
}

// 채팅 메시지 생성용 타입
export type ChatMessageCreateData = Omit<ChatMessage, 'id' | 'createdAt'>;

// 선택 가능한 사용자 정보 타입 (관심 있어요 누른 사람들)
export interface SelectableUser {
  uid: string;
  nickname: string;
  profileImageUrl: string;
  age: number | null;
  gender: '남성' | '여성' | '선택안함' | null;
  interests: string[]; // 태그 역할
  interestedAt: Timestamp; // 관심 표시한 시간
}
