import type {Metadata, Viewport} from 'next';
import Script from 'next/script';
import './globals.css'; // Global styles
import { TelegramMiniAppProvider } from '@/components/providers/TelegramMiniAppProvider';

export const metadata: Metadata = {
  title: 'SALEX',
  description: 'Multi-marketplace automation platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F7F8FC',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="az" className="font-sans">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning className="bg-[#F7F8FC] text-[#111827]">
        <TelegramMiniAppProvider>{children}</TelegramMiniAppProvider>
      </body>
    </html>
  );
}
