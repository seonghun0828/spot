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
} from 'firebase/firestore';
import { PostData, PostCreateData, PostUpdateData } from '@/types/user';
import {
  getGeohashQueryBounds,
  isWithinRadius,
  generateGeohash,
} from './geolocation';

// 포스트 생성
export const createPost = async (postData: PostCreateData): Promise<string> => {
  try {
    // geohash 생성
    const geohash = generateGeohash(
      postData.location.latitude,
      postData.location.longitude
    );

    const docRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      location: {
        ...postData.location,
        geohash,
      },
      currentParticipants: 1, // 작성자 포함
      participantIds: [postData.authorId], // 작성자 포함
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
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
