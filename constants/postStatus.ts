// 포스트 상태 상수 정의
export const POST_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  EXPIRED: 'expired',
} as const;

// 포스트 상태 타입
export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

// 포스트 상태 한국어 매핑
export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  [POST_STATUS.OPEN]: '대기 중',
  [POST_STATUS.CLOSED]: '모집 완료',
  [POST_STATUS.EXPIRED]: '만료됨',
};

// 포스트 상태 이모지 매핑
export const POST_STATUS_EMOJIS: Record<PostStatus, string> = {
  [POST_STATUS.OPEN]: '🔍',
  [POST_STATUS.CLOSED]: '✅',
  [POST_STATUS.EXPIRED]: '⏰',
};

// 포스트 상태 스타일 매핑
export const POST_STATUS_STYLES: Record<PostStatus, string> = {
  [POST_STATUS.OPEN]: 'bg-blue-100 text-blue-700',
  [POST_STATUS.CLOSED]: 'bg-green-100 text-green-700',
  [POST_STATUS.EXPIRED]: 'bg-gray-100 text-gray-500',
};

// 유틸리티 함수들
export const getPostStatusLabel = (status: PostStatus | undefined): string => {
  if (!status) return POST_STATUS_LABELS[POST_STATUS.OPEN]; // 기본값: 대기 중
  return POST_STATUS_LABELS[status] || POST_STATUS_LABELS[POST_STATUS.OPEN];
};

export const getPostStatusEmoji = (status: PostStatus | undefined): string => {
  if (!status) return POST_STATUS_EMOJIS[POST_STATUS.OPEN];
  return POST_STATUS_EMOJIS[status] || POST_STATUS_EMOJIS[POST_STATUS.OPEN];
};

export const getPostStatusStyle = (status: PostStatus | undefined): string => {
  if (!status) return POST_STATUS_STYLES[POST_STATUS.OPEN];
  return POST_STATUS_STYLES[status] || POST_STATUS_STYLES[POST_STATUS.OPEN];
};
