import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GoogleTagManager } from '@next/third-parties/google';
import FirebaseProvider from './providers/FirebaseProvider';
import { AuthProvider } from './contexts/AuthContext';

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
  keywords: '소통, 만남, 위치기반, 근거리, 채팅, 포스트',
  authors: [{ name: 'Spot Team' }],
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
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FirebaseProvider>
          <AuthProvider>{children}</AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
