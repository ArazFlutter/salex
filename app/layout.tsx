import type {Metadata, Viewport} from 'next';
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
      <body suppressHydrationWarning className="bg-[#F7F8FC] text-[#111827]">
        <TelegramMiniAppProvider>{children}</TelegramMiniAppProvider>
      </body>
    </html>
  );
}
