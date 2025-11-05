import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ch?n dung hoa d? qu? - Agentic',
  description: 'T?o ch?n dung ngo?i tr?i gi? nguy?n danh t?nh t? ?nh tham chi?u',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
