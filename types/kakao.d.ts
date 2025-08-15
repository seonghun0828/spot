// 카카오 SDK 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (apiKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (settings: {
          objectType: 'feed';
          content: {
            title: string;
            description: string;
            imageUrl?: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
          buttons?: Array<{
            title: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          }>;
        }) => void;
      };
    };
  }
}

export {};
