import { auth } from './firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
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
