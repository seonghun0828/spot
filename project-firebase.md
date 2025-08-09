# Spot Firebase 백엔드 연동 가이드

## 1) 백엔드 연동이 필요한 페이지 요약

- 홈(`/`)
  - 기능: 반경 1km 내 활성 포스트 목록 조회(거리 표시 포함), 실시간 갱신(선택)
  - Firebase: Firestore(포스트 조회), Geohash 기반 범위 쿼리
- 포스트 상세(`/posts/[id]`)
  - 기능: 포스트 상세 조회, 남은 시간 표시, '관심 있어요' 카운트, 작성자/프로필 표시
  - Firebase: Firestore(문서/카운트), 실시간 리스너
- 포스트 생성(`/posts/create`)
  - 기능: 포스트 생성, 이미지 1장 업로드, 만료 시각 설정(1시간), 위치 저장
  - Firebase: Firestore(포스트), Storage(이미지), Cloud Functions(만료 처리)
- 로그인/회원가입(`/auth`, `/login`)
  - 기능: 소셜 로그인(카카오), 로그인 후 리다이렉트
  - Firebase: Auth(커스텀 토큰), Cloud Functions(Kakao → Firebase Custom Token)
  - 주의: Firebase Auth는 카카오를 기본 제공하지 않음. Kakao JS SDK 로그인 → Cloud Functions에서 커스텀 토큰 발급 필요
- 프로필(`/profile`)
  - 기능: 내 프로필 조회(닉네임, 태그, 나이/성별, 통계)
  - Firebase: Firestore(유저 문서 집계), Storage(프로필 이미지)
- 프로필 수정(`/profile/modify`)
  - 기능: 닉네임/태그/나이/성별 수정, 프로필 사진 업로드, 중복 닉네임 검사
  - Firebase: Firestore(유저), Storage(이미지)
- 내 활동(`/my-activity`)
  - 기능: 내가 만든 포스트/관심 표현한 포스트 목록, 상태 표시
  - Firebase: Firestore(사용자별 쿼리/인덱스)
- 채팅 목록(`/chat`)
  - 기능: 내가 속한 채팅방 목록, 마지막 메시지/미읽음 표시
  - Firebase: Firestore(채팅방/메시지), 실시간 리스너
- 채팅방(`/chat/[id]`)
  - 기능: 실시간 송수신, 방장 삭제/멤버 나가기
  - Firebase: Firestore(메시지 실시간), Cloud Functions(정리 로직 옵션)
- 알림(인앱/푸시)
  - 기능: '관심 있어요' 이벤트, 새 메시지 배지/푸시
  - Firebase: Cloud Messaging(푸시), Firestore(뱃지 카운트), Functions(트리거)

결론: Firebase로 전부 구현 가능. 단, 카카오 로그인은 Firebase Auth 기본 제공이 아니라 “커스텀 토큰 흐름”이 필요하며, 위치 반경 쿼리는 Geohash 전략이 필요.

---

## 2) 추천 구현 순서(프론트 완성 가정)

1. 프로젝트/환경 설정

   - Firebase 프로젝트 생성, 웹 앱 등록
   - 콘솔에서 Auth/Firestore/Storage/Functions/Cloud Messaging 활성화
   - Vercel 환경변수 등록(FIREBASE*\*, KAKAO*\* 등)

2. SDK 초기화

   - `lib/firebase.ts`에 App/Auth/Firestore/Storage 초기화
   - 클라이언트/서버 모듈 분리(필요 시)

3. 인증(최우선)

   - Kakao JS SDK로 로그인 → Cloud Functions(HTTP)에서 Kakao 토큰 검증 → Firebase Custom Token 발급 → `signInWithCustomToken`
   - 로그인 상태 전역 훅/프로바이더 구성

4. 데이터 모델/보안 규칙

   - 컬렉션 설계(`users`, `posts`, `postInterests`, `rooms`, `messages`)
   - Firestore 인덱스/규칙 초안 작성(아래 참고)

5. 프로필

   - `users/{uid}` CRUD, Storage 업로드, 닉네임 중복 검사 인덱스 구축

6. 포스트

   - 생성(이미지 업로드/만료시각 설정/Geohash 저장)
   - 홈 목록(Geohash 범위 쿼리 + 거리 계산)
   - 상세/카운터

7. '관심 있어요'

   - `postInterests` 단건 토글, 집계 카운트 필드 업데이트
   - Functions 트리거로 작성자 알림(푸시/배지)

8. 채팅

   - 방 생성(호스트가 관심자 선택), 권한 체크
   - 메시지 실시간 송수신, 미읽음 카운트 전략
   - 방장 삭제/멤버 나가기 로직

9. 알림/만료/정리

   - FCM 웹 푸시(권한/토큰 관리)
   - 만료 포스트 정리(스케줄드 Functions)
   - 데이터 정합성 점검 Functions

10. 비용/성능/로그

- 실시간 구독 최적화, 캐시, 페이지네이션, 로깅

---

## 3) 간단 데이터 모델(권장)

- users/{uid}
  - nickname, profileImageUrl, interests[], age, gender, createdAt, updatedAt, fcmTokens[]
- posts/{postId}
  - title, content, authorId, imageUrl?, maxParticipants?
  - location: { lat, lng, geohash }
  - expiresAt, createdAt, interestCount
  - status: 'open' | 'closed' | 'expired'
- postInterests/{postId}\_{uid}
  - postId, uid, createdAt
- rooms/{roomId}
  - postId, hostId, memberIds[], lastMessage, lastMessageAt, unreadCountMap
- messages/{roomId}/{messageId}
  - roomId, senderId, text, createdAt, readBy[]

---

## 4) 보안 규칙 초안(요지)

- 인증 필요 쓰기: `request.auth != null`
- `users`: 본인 문서만 쓰기, 읽기는 제한(필요 필드만 공개 컬렉션 분리 고려)
- `posts`: 생성은 로그인 사용자. 수정/삭제는 작성자/관리자
- `postInterests`: 본인만 생성/삭제. 중복 방지(문서 키 고정)
- `rooms`/`messages`: 참여자만 읽기/쓰기
- 서버 유지가 필요한 필드(interestCount 등)는 Functions에서만 수정 가능하도록 규칙 분리

---

## 5) Cloud Functions(요지)

- Kakao → Firebase Custom Token 발급(HTTP)
- `postInterests` onCreate → 작성자 푸시/뱃지 업데이트
- `messages` onCreate → 참여자 푸시/미읽음 카운트 업데이트
- 스케줄드 만료 처리: 매 1분/5분 간격으로 `expiresAt < now` → `status = 'expired'` 및 정리

---

## 6) 위치 기반 쿼리 전략

- 저장 시: `{ lat, lng, geohash }` 저장
- 조회 시: 현재 위치/반경으로 Geohash 박스 계산 → Firestore 범위 쿼리 → 클라이언트에서 최종 거리 필터링/정렬
- 참고: 작은 반경(1km)은 박스 수가 적어 효율적. 다만 문서 수 증가 시 인덱스/분할 고려

---

## 7) 체크리스트

- 인프라
  - [ ] Firebase 프로젝트/앱 생성, 서비스 활성화
  - [ ] Vercel 환경변수 설정
- 인증
  - [ ] Kakao SDK 로그인
  - [ ] Functions 커스텀 토큰 발급/검증
  - [ ] 세션 유지/가드 처리
- 데이터/규칙
  - [ ] 컬렉션/인덱스 설계
  - [ ] Firestore 규칙
- 기능
  - [ ] 프로필 CRUD/이미지
  - [ ] 포스트 생성/목록/상세/만료
  - [ ] 관심 있어요(토글/카운트/알림)
  - [ ] 채팅(방/메시지/미읽음/나가기/삭제)
  - [ ] 푸시 알림
- 품질
  - [ ] 로딩/에러 UI
  - [ ] 실시간 구독 해제/최적화
  - [ ] 비용 모니터링/로그

---

## 8) 운영/비용/성능 팁

- 실시간 리스너는 필요한 컬렉션/필드만 구독, 페이지 이동 시 반드시 해제
- 목록은 페이지네이션(`limit/startAfter`) + 경량 필드만 조회
- 이미지 업로드는 리사이즈/압축 후 Storage 저장
- `interestCount`/`lastMessage` 등 집계 필드는 Functions에서 원천 관리
- 홈 피드는 캐시/사전 로드 고려로 체감 속도 개선

---

## 9) 코드 스니펫(요약)

```ts
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  /* env에서 주입 */
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

```ts
// Kakao → Firebase 커스텀 토큰(Functions, 개략)
export const createFirebaseToken = onRequest(async (req, res) => {
  const kakaoAccessToken = req.body.token;
  // Kakao API로 사용자 검증 → uid 결정
  // admin.auth().createCustomToken(uid)
  // 반환
});
```
