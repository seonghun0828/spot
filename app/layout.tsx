import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GoogleTagManager } from '@next/third-parties/google';
import FirebaseProvider from './providers/FirebaseProvider';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import StructuredData from '@/app/components/StructuredData';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Spot - 지금 바로 주위 사람들과 연결하세요',
  description:
    '지금 바로(1시간 이내에) 근처에 있는 사람들과 소통하여 오프라인 만남을 시작하는 위치 기반 근거리 소통 웹 앱',
  keywords:
    '소통, 만남, 위치기반, 근거리, 채팅, 포스트, 야구장, 컨퍼런스, 카페, 네트워킹',
  authors: [{ name: 'Spot Team' }],
  creator: 'Spot Team',
  publisher: 'Spot',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://spot-app.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Spot - 지금 바로 주위 사람들과 연결하세요',
    description:
      '지금 바로(1시간 이내에) 근처에 있는 사람들과 소통하여 오프라인 만남을 시작하는 위치 기반 근거리 소통 웹 앱',
    url: 'https://spot-app.vercel.app',
    siteName: 'Spot',
    images: [
      {
        url: 'https://github.com/seonghun0828/spot/blob/main/public/images/Spot-main-image.png?raw=true',
        width: 800,
        height: 600,
        alt: 'Spot - 위치 기반 소통 앱',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spot - 지금 바로 주위 사람들과 연결하세요',
    description:
      '지금 바로(1시간 이내에) 근처에 있는 사람들과 소통하여 오프라인 만남을 시작하는 위치 기반 근거리 소통 웹 앱',
    images: [
      'https://github.com/seonghun0828/spot/blob/main/public/images/Spot-main-image.png?raw=true',
    ],
    creator: '@spot_app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 카카오 SDK */}
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
          crossOrigin="anonymous"
          async
        />
        <StructuredData />
      </head>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FirebaseProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
