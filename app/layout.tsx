import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Trung tâm điều hành Đoàn phường Tân Hưng',
    template: '%s',
  },
  description:
    'Trung tâm điều hành Đoàn phường Tân Hưng, nơi kết nối các cơ sở Đoàn trong phường và tổ chức các cuộc họp trực tuyến hiệu quả.',
  twitter: {
    creator: '@livekitted',
    site: '@livekitted',
    card: 'summary_large_image',
  },
  openGraph: {
    url: 'https://tanhung-meeting.vercel.app/',
    images: [
      {
        url: 'https://tanhung-meeting.vercel.app/images/doantanhung-graph.jpg',
        width: 2000,
        height: 1000,
        type: 'image/png',
      },
    ],
    siteName: 'Trung tâm điều hành Đoàn phường Tân Hưng',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.ico',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/livekit-apple-touch.png',
        sizes: '180x180',
      },
      { rel: 'mask-icon', url: '/images/livekit-safari-pinned-tab.svg', color: '#070707' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#070707',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-lk-theme="default">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
