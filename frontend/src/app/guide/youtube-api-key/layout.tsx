import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Get YouTube API Key - Step-by-Step Guide',
  description: 'Complete step-by-step guide to getting your YouTube Data API v3 key from Google Cloud Platform. Learn how to create a project, enable the API, and secure your credentials.',
  keywords: [
    'youtube api key',
    'google cloud console',
    'youtube data api v3',
    'api key tutorial',
    'youtube api tutorial',
    'google cloud platform',
    'youtube api credentials',
    'api key guide',
  ],
  openGraph: {
    title: 'How to Get YouTube API Key - Complete Guide',
    description: 'Step-by-step instructions to obtain your YouTube Data API v3 key from Google Cloud Platform. Includes security best practices and troubleshooting tips.',
    type: 'article',
    images: [
      {
        url: '/og-guide.png',
        width: 1200,
        height: 630,
        alt: 'YouTube API Key Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Get YouTube API Key - Step-by-Step Guide',
    description: 'Complete guide to obtaining your YouTube Data API v3 key from Google Cloud Platform.',
    images: ['/og-guide.png'],
  },
  alternates: {
    canonical: '/guide/youtube-api-key',
  },
};

interface GuideLayoutProps {
  children: React.ReactNode;
}

export default function GuideLayout({ children }: GuideLayoutProps): React.JSX.Element {
  return <>{children}</>;
}
