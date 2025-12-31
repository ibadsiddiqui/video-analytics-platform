import '../styles/index.css';

export const metadata = {
  title: 'Video Analytics Platform',
  description: 'A production-ready, full-stack application that pulls comprehensive analytics for YouTube and Instagram videos',
  keywords: ['video analytics', 'youtube analytics', 'instagram analytics', 'sentiment analysis'],
  authors: [{ name: 'Ibad Siddiqui' }],
  openGraph: {
    title: 'Video Analytics Platform',
    description: 'Comprehensive analytics for YouTube and Instagram videos',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
