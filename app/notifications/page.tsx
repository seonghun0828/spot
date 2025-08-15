'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  Trash2,
  MessageCircle,
  Heart,
  Users,
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
} from '@/lib/notifications';
import { NotificationData, NotificationType } from '@/types/notification';
import { Timestamp } from 'firebase/firestore';

// 알림 시간 포맷팅 함수
function formatNotificationTime(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 알림 타입별 아이콘 반환
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.INTEREST:
      return <Heart className="w-5 h-5 text-red-500" />;
    case NotificationType.CHAT_MESSAGE:
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    case NotificationType.CHAT_ROOM_CREATED:
      return <Users className="w-5 h-5 text-green-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { success, error } = useToast();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 알림 목록 로드 및 실시간 구독
  useEffect(() => {
    if (!user || authLoading) return;

    const unsubscribe = subscribeToNotifications(
      user.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, authLoading]);

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: NotificationData) => {
    try {
      // 읽지 않은 알림이면 읽음 처리
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
      }

      // 알림 타입에 따라 해당 페이지로 이동
      switch (notification.type) {
        case NotificationType.INTEREST:
        case NotificationType.POST_STATUS_CHANGED:
          if (notification.postId) {
            router.push(`/posts/${notification.postId}`);
          }
          break;
        case NotificationType.CHAT_MESSAGE:
        case NotificationType.CHAT_ROOM_CREATED:
          if (notification.chatRoomId) {
            router.push(`/chat/${notification.chatRoomId}`);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('알림 처리 오류:', err);
      error('알림 처리에 실패했습니다.');
    }
  };

  // 알림 삭제
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 버블링 방지

    try {
      setActionLoading(notificationId);
      await deleteNotification(notificationId);
      success('알림이 삭제되었습니다.');
    } catch (err) {
      console.error('알림 삭제 오류:', err);
      error('알림 삭제에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      setActionLoading('markAll');
      await markAllNotificationsAsRead(user.uid);
      success('모든 알림을 읽음 처리했습니다.');
    } catch (err) {
      console.error('모든 알림 읽음 처리 오류:', err);
      error('알림 읽음 처리에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 로딩 상태
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">알림</h1>
            <div className="w-9 h-9"></div>
          </div>
        </header>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">알림을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === 'markAll'}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              title="모두 읽음 처리"
            >
              <Check className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </header>

      {/* 알림 목록 */}
      <div className="max-w-md mx-auto pb-20">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              알림이 없습니다
            </h3>
            <p className="text-gray-600 text-sm">
              새로운 알림이 있으면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* 알림 아이콘 */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* 알림 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            !notification.isRead
                              ? 'text-gray-900'
                              : 'text-gray-700'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p
                          className={`text-sm mt-1 ${
                            !notification.isRead
                              ? 'text-gray-700'
                              : 'text-gray-500'
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* 읽지 않음 표시 & 삭제 버튼 */}
                      <div className="flex items-center space-x-2 ml-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          disabled={actionLoading === notification.id}
                          className="p-1 rounded-full hover:bg-gray-200 transition-opacity disabled:opacity-50"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
