import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';
const ToastProvider = dynamic(() => import('@/components/ui/ToastProvider'), { ssr: false });
import Script from 'next/script';
// Removed ThemeToggle from landing layout per usability feedback

const inter = Inter({ subsets: ['latin'] });

/**
 * SEO Metadata Configuration
 * 
 * Comprehensive metadata for search engine optimization including
 * Open Graph tags, Twitter cards, and structured data.
 */
export const metadata: Metadata = {
  title: 'TypeB Family App - Turn Chores into Adventures',
  description: 'Transform everyday tasks into exciting family challenges. Build responsibility, earn rewards, and strengthen family bonds with TypeB - the smart family task management app.',
  keywords: 'family task management, chore app, kids rewards, family organization, parenting app, children responsibility, task tracker, family bonding',
  authors: [{ name: 'TypeB Team' }],
  creator: 'TypeB',
  publisher: 'TypeB',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://typebapp.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TypeB Family App - Turn Chores into Adventures',
    description: 'Transform everyday tasks into exciting family challenges. Build responsibility, earn rewards, and strengthen family bonds.',
    url: 'https://typebapp.com',
    siteName: 'TypeB Family App',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TypeB Family App - Smart Task Management for Families',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TypeB Family App - Turn Chores into Adventures',
    description: 'Transform everyday tasks into exciting family challenges. Build responsibility and strengthen family bonds.',
    creator: '@typebapp',
    images: ['/twitter-image.png'],
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
  icons: {
    icon: [
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
      { url: '/type_b_logo.png', type: 'image/png', sizes: 'any' },
    ],
    shortcut: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon.png',
    },
  },
  manifest: '/manifest.json',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'TypeB Family App',
              url: 'https://typebapp.com',
              logo: 'https://typebapp.com/type_b_logo.png',
              description: 'Smart family task management app that turns chores into adventures',
              sameAs: [
                'https://twitter.com/typebapp',
                'https://facebook.com/typebapp',
                'https://instagram.com/typebapp',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+1-555-123-4567',
                contactType: 'customer service',
                areaServed: 'US',
                availableLanguage: ['English'],
              },
            }),
          }}
        />
        
        {/* Structured Data for WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'TypeB Family App',
              url: 'https://typebapp.com',
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'iOS, Android, Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: '14-day free trial',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '527',
                bestRating: '5',
                worstRating: '1',
              },
            }),
          }}
        />

        {/* Structured Data for FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How does TypeB help families manage tasks?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'TypeB transforms everyday chores into exciting challenges with a point-based reward system, photo validation, and family bonding activities.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is TypeB suitable for children of all ages?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! TypeB offers age-appropriate tasks and rewards that can be customized for children from ages 4 to 18.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How much does TypeB cost?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'TypeB offers a 14-day free trial. After that, plans start at $9.99/month for the whole family.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        {/* ThemeToggle removed */}
        <ToastProvider>
          {children}
        </ToastProvider>
        
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        
        {/* Facebook Pixel */}
        {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
