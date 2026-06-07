import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={montserrat.className}>{children}</div>;
}
