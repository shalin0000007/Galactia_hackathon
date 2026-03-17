import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentPay — AI-Powered Autonomous Agent Payment System',
  description: 'Watch AI agents autonomously research, execute tasks, and pay each other in USDT on-chain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
