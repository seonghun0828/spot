import { Timestamp } from 'firebase/firestore';

// 알림 타입 enum
export enum NotificationType {
  INTEREST = 'interest', // 관심 표시
  CHAT_MESSAGE = 'chat_message', // 새로운 채팅 메시지
  CHAT_ROOM_CREATED = 'chat_room_created', // 채팅방 생성
  POST_STATUS_CHANGED = 'post_status_changed', // 포스트 상태 변경
}

// 알림 데이터 인터페이스
export interface NotificationData {
  id: string;
  userId: string; // 알림을 받을 사용자 ID
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;

  // 연관 데이터 (선택적)
  postId?: string; // 관련 포스트 ID
  chatRoomId?: string; // 관련 채팅방 ID
  senderId?: string; // 알림을 보낸 사용자 ID (메시지 등)
  senderName?: string; // 보낸 사용자 이름

  // 추가 메타데이터
  metadata?: {
    postTitle?: string;
    chatRoomName?: string;
    [key: string]: unknown;
  };
}

// 알림 생성용 타입 (id, createdAt 제외)
export type NotificationCreateData = Omit<NotificationData, 'id' | 'createdAt'>;

// 알림 업데이트용 타입
export type NotificationUpdateData = Partial<Pick<NotificationData, 'isRead'>>;

// 알림 통계 인터페이스
export interface NotificationStats {
  total: number;
  unread: number;
}
