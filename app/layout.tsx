import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AppProviders } from '@/components/providers/AppProviders';
import { cn } from '@/lib/utils';

// Configure fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Application metadata
export const metadata: Metadata = {
  title: {
    default: 'Solugarde Admin - Daycare Staff Management',
    template: '%s | Solugarde Admin',
  },
  description: 'Professional daycare staff management and scheduling platform. Streamline your childcare operations with Solugarde.',
  keywords: [
    'daycare management',
    'staff scheduling',
    'childcare',
    'substitute teachers',
    'educational administration',
    'workforce management',
  ],
  authors: [
    {
      name: 'Solugarde Team',
      url: 'https://solugarde.com',
    },
  ],
  creator: 'Solugarde',
  publisher: 'Solugarde',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Solugarde Admin - Daycare Staff Management',
    description: 'Professional daycare staff management and scheduling platform.',
    siteName: 'Solugarde Admin',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Solugarde Admin Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solugarde Admin - Daycare Staff Management',
    description: 'Professional daycare staff management and scheduling platform.',
    images: ['/og-image.png'],
    creator: '@solugarde',
  },
  robots: {
    index: false, // Admin panel should not be indexed
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/safari-pinned-tab.svg', rel: 'mask-icon' },
    ],
  },
  verification: {
    // Add verification codes for search engines if needed
    // google: 'verification-code',
    // yandex: 'verification-code',
    // yahoo: 'verification-code',
  },
  category: 'technology',
  classification: 'Business Application',
  referrer: 'origin-when-cross-origin',
  generator: 'Next.js',
  applicationName: 'Solugarde Admin',
  appleWebApp: {
    capable: true,
    title: 'Solugarde Admin',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
};

// Root layout component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={cn(
        inter.variable, 
        jetbrainsMono.variable,
        'scroll-smooth antialiased'
      )}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://solugarde-dev-production.up.railway.app" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
      </head>
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased"
          // Removed the opacity and animation classes that cause hydration issues
        )}
        suppressHydrationWarning
      >
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Skip to main content
        </a>

        {/* Application Providers */}
        <AppProviders>
          <div id="main-content" role="main">
            {children}
          </div>
        </AppProviders>

        {/* Development helpers */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-2 left-2 z-50 text-xs text-muted-foreground bg-muted px-2 py-1 rounded opacity-50 hover:opacity-100 transition-opacity">
            <div>Env: {process.env.NODE_ENV}</div>
            <div>API: {process.env.NEXT_PUBLIC_API_BASE_URL?.replace('https://', '')}</div>
          </div>
        )}

        {/* Analytics and monitoring scripts */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}