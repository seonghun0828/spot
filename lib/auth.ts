import { auth } from './firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserUpdateData } from '@/types/user';

// 구글 로그인 후 사용자 정보 저장
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Firestore에 사용자 정보 저장
    const userRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // 새 사용자인 경우 정보 저장
      await setDoc(userRef, {
        uid: result.user.uid,
        email: result.user.email,
        nickname: result.user.displayName || '사용자',
        profileImageUrl: result.user.photoURL || '',
        interests: [], // 빈 배열로 시작
        age: null,
        gender: null,
        location: null,
        fcmTokens: [], // 푸시 알림 토큰 배열
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      });

      console.log(
        '새 사용자 정보가 Firestore에 저장되었습니다:',
        result.user.uid
      );
    } else {
      // 기존 사용자인 경우 로그인 시간 + 구글 프로필 이미지 동기화
      await updateDoc(userRef, {
        profileImageUrl: result.user.photoURL || '', // 구글 이미지 동기화
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(
        '기존 사용자 로그인 시간 및 프로필 이미지가 업데이트되었습니다:',
        result.user.uid
      );
    }

    return result.user;
  } catch (error: unknown) {
    console.error('구글 로그인 오류:', error);

    // 팝업이 사용자에 의해 닫힌 경우는 정상적인 동작이므로 에러를 던지지 않음
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'auth/popup-closed-by-user'
    ) {
      console.log('사용자가 로그인 팝업을 닫았습니다.');
      return null;
    }

    // 다른 에러는 그대로 던짐
    throw error;
  }
};

// 로그아웃 함수
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
};

// 인증 상태 변경 리스너
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 사용자 정보 가져오기
export const getUserData = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return null;
  }
};

// 사용자 정보 업데이트
export const updateUserData = async (uid: string, data: UserUpdateData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date(),
    });

    console.log('사용자 정보가 업데이트되었습니다:', uid);
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error);
    throw error;
  }
};
