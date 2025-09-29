import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MCP-BD Explorer - Bangladeshi Domain Monitor',
  description: 'Comprehensive monitoring and analysis of Bangladeshi domains with automated crawling, WHOIS lookup, and SSL certificate tracking.',
  keywords: ['Bangladesh', 'domains', 'monitoring', 'crawling', 'WHOIS', 'SSL', 'certificates'],
  authors: [{ name: 'MCP-BD Explorer Team' }],
  openGraph: {
    title: 'MCP-BD Explorer',
    description: 'Monitor and analyze Bangladeshi domains',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}