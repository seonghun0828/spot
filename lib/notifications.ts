import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import {
  NotificationData,
  NotificationCreateData,
  NotificationStats,
  NotificationType,
} from '@/types/notification';

// 알림 생성
export const createNotification = async (
  notificationData: NotificationCreateData
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      createdAt: Timestamp.now(),
    });

    console.log('알림이 생성되었습니다:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('알림 생성 오류:', error);
    throw error;
  }
};

// 사용자의 알림 목록 조회
export const getUserNotifications = async (
  userId: string,
  limitCount: number = 20
): Promise<NotificationData[]> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(notificationsQuery);
    const notifications: NotificationData[] = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      } as NotificationData);
    });

    return notifications;
  } catch (error) {
    console.error('알림 목록 조회 오류:', error);
    return [];
  }
};

// 알림 읽음 상태 업데이트
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
    });

    console.log('알림을 읽음 처리했습니다:', notificationId);
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    throw error;
  }
};

// 모든 알림 읽음 처리
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(unreadQuery);

    const updatePromises = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
    console.log('모든 알림을 읽음 처리했습니다.');
  } catch (error) {
    console.error('모든 알림 읽음 처리 오류:', error);
    throw error;
  }
};

// 알림 삭제
export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    console.log('알림이 삭제되었습니다:', notificationId);
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    throw error;
  }
};

// 사용자 알림 통계 조회
export const getNotificationStats = async (
  userId: string
): Promise<NotificationStats> => {
  try {
    const allQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const [allSnapshot, unreadSnapshot] = await Promise.all([
      getDocs(allQuery),
      getDocs(unreadQuery),
    ]);

    return {
      total: allSnapshot.size,
      unread: unreadSnapshot.size,
    };
  } catch (error) {
    console.error('알림 통계 조회 오류:', error);
    return { total: 0, unread: 0 };
  }
};

// 실시간 알림 구독
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: NotificationData[]) => void
): (() => void) => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifications: NotificationData[] = [];
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as NotificationData);
      });
      callback(notifications);
    });

    return unsubscribe;
  } catch (error) {
    console.error('알림 구독 오류:', error);
    return () => {}; // 빈 함수 반환
  }
};

// 실시간 알림 통계 구독
export const subscribeToNotificationStats = (
  userId: string,
  callback: (stats: NotificationStats) => void
): (() => void) => {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      callback({
        total: 0, // 전체 개수는 필요할 때 별도로 조회
        unread: snapshot.size,
      });
    });

    return unsubscribe;
  } catch (error) {
    console.error('알림 통계 구독 오류:', error);
    return () => {}; // 빈 함수 반환
  }
};

// === 특정 알림 생성 헬퍼 함수들 ===

// 관심 표시 알림
export const createInterestNotification = async (
  postAuthorId: string,
  postId: string,
  postTitle: string,
  interestedUserId: string,
  interestedUserName: string
): Promise<void> => {
  if (postAuthorId === interestedUserId) return; // 자기 자신에게는 알림 안 보냄

  await createNotification({
    userId: postAuthorId,
    type: NotificationType.INTEREST,
    title: '새로운 관심 표시',
    message: `${interestedUserName}님이 회원님의 포스트에 관심을 표시했습니다.`,
    isRead: false,
    postId,
    senderId: interestedUserId,
    senderName: interestedUserName,
    metadata: {
      postTitle,
    },
  });
};

// 채팅 메시지 알림
export const createChatMessageNotification = async (
  memberIds: string[],
  chatRoomId: string,
  chatRoomName: string,
  senderId: string,
  senderName: string,
  messageContent: string
): Promise<void> => {
  // 메시지 보낸 사람 제외한 모든 멤버에게 알림
  const recipientIds = memberIds.filter((id) => id !== senderId);

  const notifications = recipientIds.map((userId) =>
    createNotification({
      userId,
      type: NotificationType.CHAT_MESSAGE,
      title: chatRoomName,
      message: `${senderName}: ${
        messageContent.length > 30
          ? messageContent.substring(0, 30) + '...'
          : messageContent
      }`,
      isRead: false,
      chatRoomId,
      senderId,
      senderName,
      metadata: {
        chatRoomName,
      },
    })
  );

  await Promise.all(notifications);
};

// 채팅방 생성 알림
export const createChatRoomCreatedNotification = async (
  memberIds: string[],
  chatRoomId: string,
  chatRoomName: string,
  creatorId: string,
  creatorName: string
): Promise<void> => {
  // 생성자 제외한 모든 멤버에게 알림
  const recipientIds = memberIds.filter((id) => id !== creatorId);

  const notifications = recipientIds.map((userId) =>
    createNotification({
      userId,
      type: NotificationType.CHAT_ROOM_CREATED,
      title: '새로운 채팅방',
      message: `${creatorName}님이 회원님을 채팅방에 초대했습니다.`,
      isRead: false,
      chatRoomId,
      senderId: creatorId,
      senderName: creatorName,
      metadata: {
        chatRoomName,
      },
    })
  );

  await Promise.all(notifications);
};
