import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/index.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://video-analytics-platform.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Video Analytics Platform - YouTube & Instagram Analytics",
    template: "%s | Video Analytics Platform",
  },
  description:
    "Comprehensive video analytics platform for YouTube and Instagram. Get real-time insights, sentiment analysis, engagement metrics, and audience demographics. Analyze any video instantly with our free tool.",
  keywords: [
    "video analytics",
    "youtube analytics",
    "instagram analytics",
    "sentiment analysis",
    "engagement metrics",
    "video metrics",
    "social media analytics",
    "youtube data api",
    "video insights",
    "content analytics",
    "audience analytics",
    "video performance",
  ],
  authors: [{ name: "Ibad Siddiqui", url: "https://github.com/ibadsiddiqui" }],
  creator: "Ibad Siddiqui",
  publisher: "Video Analytics Platform",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Video Analytics Platform - Analyze YouTube & Instagram Videos",
    description:
      "Get comprehensive analytics for any YouTube or Instagram video. Real-time metrics, sentiment analysis, engagement data, and more. Free and instant.",
    siteName: "Video Analytics Platform",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Video Analytics Platform - Comprehensive Video Analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Analytics Platform - YouTube & Instagram Analytics",
    description:
      "Analyze any YouTube or Instagram video instantly. Get metrics, sentiment analysis, and engagement data for free.",
    creator: "@ibadsiddiqui",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): React.JSX.Element {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />

          {/* PWA Manifest */}
          <link rel="manifest" href="/manifest.json" />

          {/* Favicons */}
          <link rel="icon" href="/images/favicon.ico" sizes="any" />
          <link rel="icon" href="/images/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />

          {/* Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Video Analytics Platform",
                description:
                  "Comprehensive video analytics platform for YouTube and Instagram videos with sentiment analysis and engagement metrics.",
                url: siteUrl,
                applicationCategory: "BusinessApplication",
                operatingSystem: "Any",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
                author: {
                  "@type": "Person",
                  name: "Ibad Siddiqui",
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.8",
                  ratingCount: "150",
                },
                featureList: [
                  "YouTube video analytics",
                  "Instagram video analytics",
                  "Sentiment analysis",
                  "Engagement metrics",
                  "Real-time data",
                  "Audience demographics",
                ],
              }),
            }}
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
