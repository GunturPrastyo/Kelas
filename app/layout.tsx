import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "./providers";
import GlobalStreakAlert from "@/components/GlobalStreakAlert";


// Registrasi font dari Google
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gagalin = localFont({
  src: "./fonts/Gagalin-Regular.ttf",
  variable: "--font-gagalin",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'KELAS - Kartini E-learning Apps',
  description: 'Platform e-learning inovatif untuk siswa SMK Ibu Kartini Semarang. Akses materi, tugas, dan ujian secara online.',
  keywords: ['e-learning SMK', 'SMK Ibu Kartini', 'belajar online', 'KELAS apps'],
  authors: [{ name: 'Guntur Prastyo' }],
  verification: {
    google: 'googlef6e3ac674118baa3', 
  },
  openGraph: {
    title: 'KELAS - Platform Belajar Digital SMK',
    description: 'Tingkatkan kualitas belajar dengan sistem manajemen pembelajaran yang terintegrasi.',
    url: 'https://kelas-edu.vercel.app',
    siteName: 'KELAS',

    images: [
      {
        url: '/logo.webp',
        alt: 'KELAS Logo',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  icons: {
    icon: '/logo.webp',
    apple: '/logo.webp',
  },
};



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${poppins.variable} ${gagalin.variable} bg-gray-50 dark:bg-gray-900 scroll-smooth`}
    >

      <body suppressHydrationWarning className="font-poppins text-gray-900 dark:text-gray-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "KELAS",
              "alternateName": ["Kartini E-learning Apps", "KELAS SMK"],
              "url": "https://kelas-edu.vercel.app",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "KELAS",
              "url": "https://kelas-edu.vercel.app",
              "logo": "https://kelas-edu.vercel.app/logo.webp",
              "sameAs": [
                "https://instagram.com/kartinielearning",
                "https://youtube.com/@kartinielearning"
              ]
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GlobalStreakAlert />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
