import fs from 'node:fs'
import path from 'node:path'

console.log('--- Solving Mobile Navigation Overlap & Implementing Bottom App Nav ---')

// 1. Update Navbar.tsx
const navbarPath = path.resolve('belmont/src/components/Navbar.tsx')
let navbar = fs.readFileSync(navbarPath, 'utf8')

// Update navLinks with icons and mobileLabels
const oldNavLinks = `  // Construção estrita dos links de navegação baseada no papel (RBAC)
  const navLinks: Array<{ label: string; path: string }> = [
    { label: 'Catálogo', path: '/' },
  ]

  if (firstLotId) {
    navLinks.push({
      label: 'Sala de Pregão',
      path: \`/lots/\${firstLotId}\`,
    })
  }

  navLinks.push({
    label: 'Auditoria Pública',
    path: '/audit',
  })

  if (user?.role === 'BIDDER') {
    // Usuário licitante vê Meus Arremates e Carteira Digital (NUNCA vê Painel do Leiloeiro)
    navLinks.push({ label: 'Meus Arremates', path: '/my-bids' })
    navLinks.push({ label: 'Carteira Digital', path: '/wallet' })
  } else if (user?.role === 'AUCTIONEER') {
    // Leiloeiro Oficial vê Painel do Leiloeiro e Recebimentos (NUNCA vê Meus Arremates)
    navLinks.push({ label: 'Painel do Leiloeiro', path: '/auctioneer' })
    navLinks.push({ label: 'Recebimentos & Caixa', path: '/wallet' })
  }`

const newNavLinks = `  // Construção estrita dos links de navegação baseada no papel (RBAC)
  const navLinks: Array<{ label: string; mobileLabel: string; path: string; icon: string }> = [
    { label: 'Catálogo', mobileLabel: 'Catálogo', path: '/', icon: 'storefront' },
  ]

  if (firstLotId) {
    navLinks.push({
      label: 'Sala de Pregão',
      mobileLabel: 'Ao Vivo',
      path: \`/lots/\${firstLotId}\`,
      icon: 'sensors',
    })
  }

  navLinks.push({
    label: 'Auditoria Pública',
    mobileLabel: 'Auditoria',
    path: '/audit',
    icon: 'verified_user',
  })

  if (user?.role === 'BIDDER') {
    // Usuário licitante vê Meus Arremates e Carteira Digital (NUNCA vê Painel do Leiloeiro)
    navLinks.push({ label: 'Meus Arremates', mobileLabel: 'Arremates', path: '/my-bids', icon: 'trophy' })
    navLinks.push({ label: 'Carteira Digital', mobileLabel: 'Carteira', path: '/wallet', icon: 'account_balance_wallet' })
  } else if (user?.role === 'AUCTIONEER') {
    // Leiloeiro Oficial vê Painel do Leiloeiro e Recebimentos (NUNCA vê Meus Arremates)
    navLinks.push({ label: 'Painel do Leiloeiro', mobileLabel: 'Painel', path: '/auctioneer', icon: 'gavel' })
    navLinks.push({ label: 'Recebimentos & Caixa', mobileLabel: 'Caixa', path: '/wallet', icon: 'payments' })
  }`

navbar = navbar.replace(oldNavLinks, newNavLinks)

// Make header slim on mobile (h-16 md:h-20)
navbar = navbar.replace(
  '<header className="fixed top-0 left-0 right-0 z-50 bg-[#07090E]/90 backdrop-blur-xl border-b border-[#d4af37]/20">\r\n        <div className="h-20 w-full max-w-[1600px]',
  '<header className="fixed top-0 left-0 right-0 z-40 bg-[#07090E]/95 backdrop-blur-xl border-b border-[#d4af37]/20">\r\n        <div className="h-16 md:h-20 w-full max-w-[1600px]'
)
if (!navbar.includes('h-16 md:h-20')) {
  navbar = navbar.replace(
    /<header className="fixed top-0 left-0 right-0 z-50 bg-\[#07090E\]\/90 backdrop-blur-xl border-b border-\[#d4af37\]\/20">\s*<div className="h-20 w-full max-w-\[1600px\]/,
    '<header className="fixed top-0 left-0 right-0 z-40 bg-[#07090E]/95 backdrop-blur-xl border-b border-[#d4af37]/20">\n        <div className="h-16 md:h-20 w-full max-w-[1600px]'
  )
}

// Remove the old mobile nav from inside <header> and close </header> right after the top bar </div>
const oldMobileNavInHeader = `        </div>

        {/* Barra de Navegação Mobile (< 768px) */}
        <nav className="flex md:hidden items-center gap-1.5 px-3 py-2 bg-[#0c0e13] border-t border-[#282a30] overflow-x-auto no-scrollbar scroll-smooth">
          {navLinks.map((item) => {
            const isActive =
              item.path === '/'
                ? pathname === '/'
                : pathname.startsWith(item.path.split('?')[0])
            return (
              <Link
                key={item.label}
                href={item.path}
                className={\`px-3 py-2 min-h-[44px] flex items-center font-mono text-[11px] sm:text-xs uppercase tracking-wider transition-colors rounded shrink-0 active:scale-95 \${
                  isActive
                    ? 'bg-[#d4af37] text-[#1c1400] font-bold'
                    : 'text-[#d0c5af] hover:text-[#e2e2ea]'
                }\`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>`

const newHeaderAndBottomNav = `        </div>
      </header>

      {/* Barra de Navegação Mobile (Fixada no rodapé da tela, estilo App Nativo) */}
      <nav
        aria-label="Navegação Principal Mobile"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0c0e13]/95 backdrop-blur-xl border-t border-[#282a30] px-2 py-1.5 flex items-center justify-around shadow-[0_-8px_25px_rgba(0,0,0,0.5)]"
      >
        {navLinks.map((item) => {
          const isActive =
            item.path === '/'
              ? pathname === '/'
              : pathname.startsWith(item.path.split('?')[0])
          return (
            <Link
              key={item.label}
              href={item.path}
              className={\`flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[48px] rounded-lg transition-all active:scale-95 \${
                isActive
                  ? 'text-[#f2ca50] font-bold'
                  : 'text-[#99907c] hover:text-[#e2e2ea]'
              }\`}
            >
              <span className={\`material-symbols-outlined text-xl transition-transform \${isActive ? 'scale-110' : ''}\`}>
                {item.icon}
              </span>
              <span className={\`text-[10px] tracking-tight font-sans mt-0.5 leading-none \${isActive ? 'font-semibold' : ''}\`}>
                {item.mobileLabel || item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50] mt-1 shadow-sm" />
              )}
            </Link>
          )
        })}
      </nav>`

navbar = navbar.replace(oldMobileNavInHeader, newHeaderAndBottomNav)
if (!navbar.includes('aria-label="Navegação Principal Mobile"')) {
  navbar = navbar.replace(
    /\s*\{\/\* Barra de Navegação Mobile \(< 768px\) \*\/\}[\s\S]*?<\/nav>\s*<\/header>/,
    `\n        </div>\n      </header>\n${newHeaderAndBottomNav.split('</header>')[1]}`
  )
}

fs.writeFileSync(navbarPath, navbar, 'utf8')
console.log('✓ Navbar.tsx converted to slim 64px header + bottom native app tab bar')

// 2. Update layout.tsx footer with mb-16 md:mb-0
const layoutPath = path.resolve('belmont/src/app/layout.tsx')
let layout = fs.readFileSync(layoutPath, 'utf8')
layout = layout.replace(
  'footer className="w-full bg-[#0c0e13] border-t border-[#d4af37]/20 mt-12 py-8"',
  'footer className="w-full bg-[#0c0e13] border-t border-[#d4af37]/20 mt-12 py-8 mb-16 md:mb-0"'
)
fs.writeFileSync(layoutPath, layout, 'utf8')
console.log('✓ layout.tsx footer given bottom margin on mobile')

// 3. Update padding on all pages: pt-20 md:pt-24 pb-24 md:pb-12
const pagesToUpdate = [
  'belmont/src/app/page.tsx',
  'belmont/src/app/lots/[id]/page.tsx',
  'belmont/src/app/wallet/page.tsx',
  'belmont/src/app/auctioneer/page.tsx',
  'belmont/src/app/my-bids/page.tsx',
  'belmont/src/app/audit/page.tsx',
  'belmont/src/app/audit/[lotId]/page.tsx',
  'belmont/src/app/receipts/[code]/page.tsx',
]

for (const p of pagesToUpdate) {
  const fullPath = path.resolve(p)
  let content = fs.readFileSync(fullPath, 'utf8')
  content = content.replace(
    /className="w-full pt-(?:28|32)[\s\S]*?bg-\[#07090E\] min-h-\[calc\(100vh-80px\)\] text-\[#e2e2ea\](?:\s+overflow-x-hidden)?"/,
    'className="w-full pt-20 md:pt-24 pb-24 md:pb-12 bg-[#07090E] min-h-[calc(100vh-64px)] text-[#e2e2ea] overflow-x-hidden"'
  )
  fs.writeFileSync(fullPath, content, 'utf8')
  console.log(`✓ ${p} updated with pt-20 pb-24 padding`)
}

console.log('--- Completed mobile navigation overlap resolution! ---')
