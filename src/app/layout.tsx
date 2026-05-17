import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GulfFlow Escrow',
  description: 'USDC escrow and SME trade-finance workflow on Circle Gateway and Arc.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
