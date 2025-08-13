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
  Timestamp,
} from 'firebase/firestore';
import { ChatRoom, ChatRoomCreateData, SelectableUser } from '@/types/chat';
import { getUserData } from './auth';

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
