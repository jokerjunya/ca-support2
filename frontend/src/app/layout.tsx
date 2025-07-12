import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gmail Assistant',
  description: 'ローカルLLM搭載のGmailラッパーアプリケーション',
  keywords: ['Gmail', 'Email', 'AI', 'LLM', 'Assistant', 'Automation'],
  authors: [{ name: 'Gmail Assistant Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#1ed760',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-spotify-black text-spotify-white`}>
        <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-dark-gray to-spotify-dark">
          {children}
        </div>
      </body>
    </html>
  );
} 