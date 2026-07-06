import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Giáo Sư',
  description: 'Nền tảng kiểm tra online cho giáo viên và học sinh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
