import type { Metadata } from 'next'
import { Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'
import { SmoothScroll } from '@/components/SmoothScroll'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Belmont Fine Art Auctions — Catálogo Institucional & Vitrine',
  description:
    'Belmont Auctions Est. 1894. Custódia fiduciária auditada e licitações concorrentes em microssegundos com tecnologia SSE e trilha criptográfica HMAC-SHA256.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} dark antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-[#07090E] text-[#e2e2ea] font-sans min-h-screen flex flex-col selection:bg-[#d4af37] selection:text-[#07090e]">
        <SmoothScroll>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <footer className="w-full bg-[#0c0e13] border-t border-[#d4af37]/20 mt-12 py-8">
              <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1 text-left">
                  <div className="font-serif text-lg tracking-wide text-[#e2e2ea]">
                    BELMONT AUCTIONS
                  </div>
                  <div className="text-xs text-[#99907c]">
                    © 1894–2026 Belmont Fine Art Institutional Trust. Todos os direitos reservados.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#d0c5af] border border-[#4d4635]/40 px-3 py-1.5 rounded bg-[#14171f]">
                  <span className="material-symbols-outlined text-sm text-[#f2ca50]">museum</span>
                  <span>Cleveland Museum of Art & IIIF Standard v3.0</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#99907c]">
                  <span className="material-symbols-outlined text-sm text-[#4edea3]">lock</span>
                  <span className="text-[#d0c5af] font-mono">HMAC-SHA256: 7f83b165...9d2e4a8c</span>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
