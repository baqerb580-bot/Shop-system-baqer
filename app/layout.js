import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'مركز الغزلان ERP | Smart ISP & Enterprise Platform',
  description: 'منصة ERP + NOC + POS + AI متكاملة لإدارة شركات الإنترنت والمبيعات والصيانة',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="antialiased">
        {children}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
