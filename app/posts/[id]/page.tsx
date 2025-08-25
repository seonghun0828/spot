import { Metadata } from 'next';
import { getPost } from '@/lib/posts'; // 일반 포스트 조회로 변경
import PostDetailClient from './PostDetailClient';

// Firestore Timestamp를 일반 객체로 변환하는 함수
function convertFirestoreData(data: unknown): unknown {
  if (!data) return data;

  if (
    data &&
    typeof data === 'object' &&
    'toDate' in data &&
    typeof (data as { toDate: () => Date }).toDate === 'function'
  ) {
    // Timestamp 객체인 경우 - 순수 데이터만 반환
    const timestamp = data as {
      toDate: () => Date;
      seconds: number;
      nanoseconds: number;
    };
    return {
      seconds: timestamp.seconds,
      nanoseconds: timestamp.nanoseconds,
    };
  }

  if (Array.isArray(data)) {
    return data.map(convertFirestoreData);
  }

  if (typeof data === 'object' && data !== null) {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertFirestoreData(value);
    }
    return converted;
  }

  return data;
}

// 동적 메타데이터 생성 함수
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const postData = await getPost(id);

    if (!postData) {
      return {
        title: '포스트를 찾을 수 없습니다 - Spot',
        description: '요청하신 포스트를 찾을 수 없습니다.',
      };
    }

    return {
      title: `${postData.title} - Spot`,
      description: `${postData.content.substring(
        0,
        150
      )}... 지금 바로 주위 사람들과 연결하세요.`,
      keywords: [
        '소통',
        '만남',
        '위치기반',
        '근거리',
        '채팅',
        '포스트',
        postData.title,
      ],
      openGraph: {
        title: `${postData.title} - Spot`,
        description: `${postData.content.substring(0, 150)}...`,
        type: 'website',
        url: `https://spot-app.vercel.app/posts/${id}`,
        images: [
          {
            url: 'https://github.com/seonghun0828/spot/blob/main/public/images/Spot-main-image.png?raw=true',
            width: 800,
            height: 600,
            alt: 'Spot - 위치 기반 소통 앱',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${postData.title} - Spot`,
        description: `${postData.content.substring(0, 150)}...`,
        images: [
          'https://github.com/seonghun0828/spot/blob/main/public/images/Spot-main-image.png?raw=true',
        ],
      },
    };
  } catch {
    return {
      title: '포스트 - Spot',
      description: '지금 바로 주위 사람들과 연결하세요.',
    };
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 서버에서 포스트 데이터 미리 로드
  let initialPost = null;
  let postId = '';

  try {
    const { id } = await params;
    postId = id;
    const postData = await getPost(id);

    // Firestore 데이터를 클라이언트 컴포넌트용으로 변환
    if (postData) {
      initialPost = convertFirestoreData(postData) as typeof postData;
    }
  } catch (error) {
    console.error('서버에서 포스트 로드 실패:', error);
    // 에러가 발생해도 클라이언트에서 다시 시도할 수 있도록 null로 설정
  }

  return <PostDetailClient initialPost={initialPost} postId={postId} />;
}
