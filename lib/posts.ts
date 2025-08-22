import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { createInterestNotification } from './notifications';
import {
  PostData,
  PostCreateData,
  PostUpdateData,
  InterestedUser,
} from '@/types/user';
import {
  getGeohashQueryBounds,
  isWithinRadius,
  generateGeohash,
} from './geolocation';

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

// 포스트 생성
export const createPost = async (postData: PostCreateData): Promise<string> => {
  try {
    // geohash 생성
    const geohash = generateGeohash(
      postData.location.latitude,
      postData.location.longitude
    );

    const now = Timestamp.now();
    const expiresAt = Timestamp.fromDate(
      new Date(now.toDate().getTime() + 60 * 60 * 1000) // 1시간 후
    );

    const docRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      location: {
        ...postData.location,
        geohash,
      },
      interestedCount: 0, // 관심 있어요 초기값
      interestedUserIds: [], // 관심 있어요 사용자 목록 초기값
      status: 'open', // 포스트 상태 초기값
      expiresAt, // 만료 시간 (1시간 후)
      createdAt: now,
      updatedAt: now,
    });

    console.log('포스트가 생성되었습니다:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('포스트 생성 오류:', error);
    throw error;
  }
};

// 포스트 조회
export const getPost = async (postId: string): Promise<PostData | null> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      return {
        id: postDoc.id,
        ...postDoc.data(),
      } as PostData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('포스트 조회 오류:', error);
    return null;
  }
};

// 포스트 업데이트
export const updatePost = async (
  postId: string,
  updateData: PostUpdateData
): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });

    console.log('포스트가 업데이트되었습니다:', postId);
  } catch (error) {
    console.error('포스트 업데이트 오류:', error);
    throw error;
  }
};

// 포스트 삭제
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);

    console.log('포스트가 삭제되었습니다:', postId);
  } catch (error) {
    console.error('포스트 삭제 오류:', error);
    throw error;
  }
};

// 관심 있어요 표시
export const toggleInterest = async (
  postId: string,
  userId: string,
  isInterested: boolean,
  userNickname?: string
): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);

    if (isInterested) {
      // 포스트 정보 조회 (알림용)
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data() as PostData;

      // 관심 표시 추가
      await updateDoc(postRef, {
        interestedUserIds: arrayUnion(userId),
        interestedCount: increment(1),
        updatedAt: Timestamp.now(),
      });

      // 관심 표시 이벤트 전송
      sendGTMEvent('interest_added', {
        post_id: postId,
        post_author: postData?.authorId || '',
        page_location:
          typeof window !== 'undefined' ? window.location.href : '',
      });

      // 알림 생성 (포스트 작성자에게)
      if (postData && userNickname) {
        try {
          await createInterestNotification(
            postData.authorId,
            postId,
            postData.title,
            userId,
            userNickname
          );
        } catch (notifError) {
          console.error('관심 표시 알림 생성 오류:', notifError);
          // 알림 생성 실패해도 관심 표시는 유지
        }
      }

      console.log('관심 표시 추가:', postId, userId);
    } else {
      // 관심 표시 제거
      await updateDoc(postRef, {
        interestedUserIds: arrayRemove(userId),
        interestedCount: increment(-1),
        updatedAt: Timestamp.now(),
      });

      // 관심 표시 제거 이벤트 전송
      sendGTMEvent('interest_removed', {
        post_id: postId,
        page_location:
          typeof window !== 'undefined' ? window.location.href : '',
      });

      console.log('관심 표시 제거:', postId, userId);
    }
  } catch (error) {
    console.error('관심 표시 처리 오류:', error);
    throw error;
  }
};

// 포스트에 관심 있어요 표시한 사용자 목록 조회
export const getInterestedUsers = async (
  postId: string
): Promise<InterestedUser[]> => {
  try {
    const postData = await getPost(postId);
    if (!postData || !postData.interestedUserIds.length) {
      return [];
    }

    // TODO: 사용자 정보를 가져오는 로직 구현
    // 현재는 기본 정보만 반환
    const interestedUsers: InterestedUser[] = postData.interestedUserIds.map(
      (uid) => ({
        uid,
        nickname: '사용자', // TODO: 실제 사용자 정보 조회
        profileImageUrl: '', // TODO: 실제 사용자 정보 조회
        interestedAt: Timestamp.now(), // TODO: 실제 관심 표시 시간 저장
      })
    );

    return interestedUsers;
  } catch (error) {
    console.error('관심 사용자 목록 조회 오류:', error);
    return [];
  }
};

// 활성 포스트 목록 조회 (최신순)
export const getActivePosts = async (
  limitCount: number = 20
): Promise<PostData[]> => {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts: PostData[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      } as PostData);
    });

    return posts;
  } catch (error) {
    console.error('활성 포스트 목록 조회 오류:', error);
    return [];
  }
};

// 현재 위치 기준 1km 반경 내 활성 포스트 조회
export const getNearbyPosts = async (
  userLatitude: number,
  userLongitude: number,
  radiusInMeters: number = 1000, // 기본 1km
  limitCount: number = 20
): Promise<PostData[]> => {
  try {
    // geohash 쿼리 범위 계산
    const bounds = getGeohashQueryBounds(
      [userLatitude, userLongitude],
      radiusInMeters
    );
    const promises = [];

    // 각 geohash 범위에 대해 쿼리 실행
    for (const bound of bounds) {
      const q = query(
        collection(db, 'posts'),
        where('isActive', '==', true),
        where('location.geohash', '>=', bound[0]),
        where('location.geohash', '<=', bound[1]),
        orderBy('location.geohash'),
        orderBy('createdAt', 'desc')
      );
      promises.push(getDocs(q));
    }

    // 모든 쿼리 결과 병합
    const snapshots = await Promise.all(promises);
    const allPosts: PostData[] = [];

    snapshots.forEach((snapshot) => {
      snapshot.forEach((doc) => {
        const postData = {
          id: doc.id,
          ...doc.data(),
        } as PostData;

        // 정확한 거리 확인 (geohash는 근사치이므로)
        if (
          isWithinRadius(
            userLatitude,
            userLongitude,
            postData.location.latitude,
            postData.location.longitude,
            radiusInMeters
          )
        ) {
          allPosts.push(postData);
        }
      });
    });

    // 중복 제거 및 최신순 정렬
    const uniquePosts = allPosts
      .filter(
        (post, index, self) => index === self.findIndex((p) => p.id === post.id)
      )
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, limitCount);

    return uniquePosts;
  } catch (error) {
    console.error('주변 포스트 조회 오류:', error);
    return [];
  }
};

// 사용자가 작성한 포스트 목록 조회
export const getUserPosts = async (userId: string): Promise<PostData[]> => {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts: PostData[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      } as PostData);
    });

    return posts;
  } catch (error) {
    console.error('사용자 포스트 목록 조회 오류:', error);
    return [];
  }
};

// 사용자가 관심 있어요 누른 포스트 목록 조회
export const getUserInterestedPosts = async (
  userId: string
): Promise<PostData[]> => {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('interestedUserIds', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts: PostData[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      } as PostData);
    });

    return posts;
  } catch (error) {
    console.error('관심 포스트 목록 조회 오류:', error);
    return [];
  }
};

// 포스트 상태 업데이트 (채팅방 생성 시 사용)
export const updatePostStatus = async (
  postId: string,
  status: 'open' | 'closed' | 'expired'
): Promise<void> => {
  try {
    console.log(`포스트 ${postId} 상태를 '${status}'로 업데이트 시도 중...`);
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      status,
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ 포스트 ${postId} 상태가 '${status}'로 변경되었습니다.`);
  } catch (error) {
    console.error('❌ 포스트 상태 업데이트 오류:', error);
    throw error;
  }
};

// 포스트 만료 여부 체크
export const isPostExpired = (post: PostData): boolean => {
  const now = new Date();
  const expiresAt = post.expiresAt.toDate();
  return now > expiresAt;
};

// 만료된 포스트들을 자동으로 expired 상태로 업데이트
export const updateExpiredPosts = async (): Promise<void> => {
  try {
    const now = Timestamp.now();

    // 만료 시간이 지났지만 아직 expired 상태가 아닌 포스트들 조회
    const expiredQuery = query(
      collection(db, 'posts'),
      where('expiresAt', '<=', now),
      where('status', '!=', 'expired'),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(expiredQuery);

    if (querySnapshot.empty) {
      console.log('만료된 포스트가 없습니다.');
      return;
    }

    // 배치 업데이트
    const updatePromises = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        status: 'expired',
        updatedAt: now,
      })
    );

    await Promise.all(updatePromises);

    console.log(`${querySnapshot.size}개의 포스트가 만료 처리되었습니다.`);
  } catch (error) {
    console.error('만료된 포스트 업데이트 오류:', error);
    throw error;
  }
};

// 특정 포스트의 만료 상태 체크 및 업데이트
export const checkAndUpdatePostExpiry = async (
  postId: string
): Promise<PostData | null> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      return null;
    }

    const postData = { id: postDoc.id, ...postDoc.data() } as PostData;

    // 만료 체크
    if (isPostExpired(postData) && postData.status !== 'expired') {
      // 만료 상태로 업데이트
      await updateDoc(postRef, {
        status: 'expired',
        updatedAt: Timestamp.now(),
      });

      // 업데이트된 데이터 반환
      return {
        ...postData,
        status: 'expired',
        updatedAt: Timestamp.now(),
      };
    }

    return postData;
  } catch (error) {
    console.error('포스트 만료 체크 오류:', error);
    throw error;
  }
};
