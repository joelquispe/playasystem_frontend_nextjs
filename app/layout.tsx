import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryProvider } from '@/providers/QueryProvider';
import { AntdProvider } from '@/providers/AntdProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Playa ROSE',
  description: 'Sistema de gestión de estacionamiento',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ margin: 0, padding: 0, background: '#0f0f0f' }}>
        <AntdRegistry>
          <QueryProvider>
            <AntdProvider>
              <AuthProvider>{children}</AuthProvider>
            </AntdProvider>
          </QueryProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
