import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  ChatRoom,
  ChatRoomCreateData,
  SelectableUser,
  ChatMessage,
  ChatMessageCreateData,
} from '@/types/chat';
import { getUserData } from './auth';
import { updatePostStatus } from './posts';
import {
  createChatMessageNotification,
  createChatRoomCreatedNotification,
} from './notifications';

// GTM 이벤트 전송 함수
const sendGTMEvent = (
  eventName: string,
  parameters: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    });
  }
};

// 채팅방 생성
export const createChatRoom = async (
  chatRoomData: ChatRoomCreateData
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'chatRooms'), {
      ...chatRoomData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 포스트 상태를 'closed'로 업데이트
    await updatePostStatus(chatRoomData.postId, 'closed');

    // 채팅방 생성 이벤트 전송
    sendGTMEvent('chat_room_created', {
      chat_room_id: docRef.id,
      post_id: chatRoomData.postId,
      member_count: chatRoomData.memberCount,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
    });

    // 채팅방 생성 알림 (멤버들에게)
    try {
      await createChatRoomCreatedNotification(
        chatRoomData.memberIds,
        docRef.id,
        chatRoomData.name,
        chatRoomData.createdBy,
        chatRoomData.createdByName
      );
    } catch (notifError) {
      console.error('채팅방 생성 알림 오류:', notifError);
      // 알림 실패해도 채팅방 생성은 유지
    }

    console.log('채팅방이 생성되었습니다:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('채팅방 생성 오류:', error);
    throw error;
  }
};

// 채팅방 조회
export const getChatRoom = async (
  chatRoomId: string
): Promise<ChatRoom | null> => {
  try {
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    const chatRoomDoc = await getDoc(chatRoomRef);

    if (chatRoomDoc.exists()) {
      return {
        id: chatRoomDoc.id,
        ...chatRoomDoc.data(),
      } as ChatRoom;
    } else {
      return null;
    }
  } catch (error) {
    console.error('채팅방 조회 오류:', error);
    return null;
  }
};

// 사용자의 채팅방 목록 조회
export const getUserChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  try {
    const chatRoomsQuery = query(
      collection(db, 'chatRooms'),
      where('memberIds', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(chatRoomsQuery);
    const chatRooms: ChatRoom[] = [];

    querySnapshot.forEach((doc) => {
      chatRooms.push({
        id: doc.id,
        ...doc.data(),
      } as ChatRoom);
    });

    return chatRooms;
  } catch (error) {
    console.error('사용자 채팅방 목록 조회 오류:', error);
    return [];
  }
};

// 포스트에 관심 있어요 누른 사용자들의 상세 정보 조회
export const getInterestedUsersWithDetails = async (
  userIds: string[]
): Promise<SelectableUser[]> => {
  try {
    if (userIds.length === 0) return [];

    const users: SelectableUser[] = [];

    // 각 사용자의 상세 정보를 조회
    for (const uid of userIds) {
      try {
        const userData = await getUserData(uid);
        if (userData) {
          users.push({
            uid,
            nickname: userData.nickname || '사용자',
            profileImageUrl: userData.profileImageUrl || '',
            age: userData.age,
            gender: userData.gender,
            interests: userData.interests || [],
            interestedAt: Timestamp.now(), // TODO: 실제 관심 표시 시간 저장 후 사용
          });
        }
      } catch (err) {
        console.warn(`사용자 ${uid} 정보 조회 실패:`, err);
        // 실패한 사용자는 기본 정보로 추가
        users.push({
          uid,
          nickname: '사용자',
          profileImageUrl: '',
          age: null,
          gender: null,
          interests: [],
          interestedAt: Timestamp.now(),
        });
      }
    }

    return users;
  } catch (error) {
    console.error('관심 사용자 상세 정보 조회 오류:', error);
    return [];
  }
};

// 동일한 멤버 구성의 채팅방이 이미 존재하는지 확인
export const findExistingChatRoom = async (
  postId: string,
  memberIds: string[]
): Promise<ChatRoom | null> => {
  try {
    // 포스트 기반으로 채팅방 조회
    const chatRoomsQuery = query(
      collection(db, 'chatRooms'),
      where('postId', '==', postId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(chatRoomsQuery);

    // 멤버 구성이 동일한 방이 있는지 확인
    for (const doc of querySnapshot.docs) {
      const chatRoom = { id: doc.id, ...doc.data() } as ChatRoom;

      // 멤버 수와 구성이 동일한지 확인
      if (
        chatRoom.memberIds.length === memberIds.length &&
        chatRoom.memberIds.every((id) => memberIds.includes(id))
      ) {
        return chatRoom;
      }
    }

    return null;
  } catch (error) {
    console.error('기존 채팅방 조회 오류:', error);
    return null;
  }
};

// 채팅 메시지 전송
export const sendMessage = async (
  chatRoomId: string,
  messageData: ChatMessageCreateData
): Promise<string> => {
  try {
    // 메시지 추가
    const messageRef = await addDoc(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      {
        ...messageData,
        createdAt: Timestamp.now(),
      }
    );

    // 채팅방 마지막 메시지 업데이트
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    await updateDoc(chatRoomRef, {
      lastMessage: messageData.content,
      lastMessageAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 채팅방 정보 조회 (알림용)
    const chatRoomDoc = await getDoc(chatRoomRef);
    const chatRoomData = chatRoomDoc.data() as ChatRoom;

    // 채팅 메시지 알림 (다른 멤버들에게)
    if (chatRoomData) {
      try {
        await createChatMessageNotification(
          chatRoomData.memberIds,
          chatRoomId,
          chatRoomData.name,
          messageData.senderId,
          messageData.senderNickname,
          messageData.content
        );
      } catch (notifError) {
        console.error('채팅 메시지 알림 오류:', notifError);
        // 알림 실패해도 메시지 전송은 유지
      }
    }

    console.log('메시지가 전송되었습니다:', messageRef.id);
    return messageRef.id;
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    throw error;
  }
};

// 채팅 메시지 실시간 구독
export const subscribeToMessages = (
  chatRoomId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  try {
    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100) // 최근 100개 메시지만
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        } as ChatMessage);
      });
      callback(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.error('메시지 구독 오류:', error);
    return () => {}; // 빈 함수 반환
  }
};

// 채팅 메시지 목록 조회 (일회성)
export const getChatMessages = async (
  chatRoomId: string,
  limitCount: number = 50
): Promise<ChatMessage[]> => {
  try {
    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(messagesQuery);
    const messages: ChatMessage[] = [];

    querySnapshot.forEach((doc) => {
      messages.unshift({
        // unshift로 시간순 정렬
        id: doc.id,
        ...doc.data(),
      } as ChatMessage);
    });

    return messages;
  } catch (error) {
    console.error('채팅 메시지 조회 오류:', error);
    return [];
  }
};

// 채팅방 나가기
export const leaveChatRoom = async (
  chatRoomId: string,
  userId: string,
  userNickname: string
): Promise<void> => {
  try {
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    const chatRoomDoc = await getDoc(chatRoomRef);

    if (!chatRoomDoc.exists()) {
      throw new Error('채팅방을 찾을 수 없습니다.');
    }

    const chatRoomData = chatRoomDoc.data() as ChatRoom;

    // 사용자가 채팅방 멤버인지 확인
    if (!chatRoomData.memberIds.includes(userId)) {
      throw new Error('채팅방의 멤버가 아닙니다.');
    }

    // 멤버 목록에서 사용자 제거
    const updatedMemberIds = chatRoomData.memberIds.filter(
      (id) => id !== userId
    );
    const updatedMemberCount = updatedMemberIds.length;

    // 채팅방 업데이트
    await updateDoc(chatRoomRef, {
      memberIds: updatedMemberIds,
      memberCount: updatedMemberCount,
      updatedAt: Timestamp.now(),
    });

    // 시스템 메시지 추가 (나가기 알림)
    await addDoc(collection(db, 'chatRooms', chatRoomId, 'messages'), {
      chatRoomId,
      senderId: 'system',
      senderNickname: 'System',
      senderProfileImage: '',
      content: `${userNickname}님이 채팅방을 나갔습니다.`,
      type: 'system',
      createdAt: Timestamp.now(),
    });

    // 채팅방 마지막 메시지 업데이트
    await updateDoc(chatRoomRef, {
      lastMessage: `${userNickname}님이 채팅방을 나갔습니다.`,
      lastMessageAt: Timestamp.now(),
    });

    console.log('채팅방에서 나갔습니다:', chatRoomId, userId);
  } catch (error) {
    console.error('채팅방 나가기 오류:', error);
    throw error;
  }
};
