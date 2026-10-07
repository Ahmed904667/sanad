import type { Metadata } from "next";
import { cookies } from 'next/headers';
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "منصة سَنَد | Sanad Platform - تعليم القرآن الكريم أونلاين",
  description: "منصة سَنَد تتيح لك تعلم القرآن الكريم وحفظه وتلاوته مع معلمين مجازين بالسند المتصل عبر حصص افتراضية وتفاعلية.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const languageCookie = (await cookies()).get('sanad_language')?.value;
  const initialLanguage = languageCookie === 'en' ? 'en' : 'ar';

  return (
    <html lang={initialLanguage} dir={initialLanguage === 'ar' ? 'rtl' : 'ltr'} className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-slate-900 font-sans">
        <AppProvider initialLanguage={initialLanguage}>
          <Header />
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
