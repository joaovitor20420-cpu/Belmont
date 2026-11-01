import fs from 'node:fs'
import path from 'node:path'

console.log('--- Starting Mobile UI/UX Pro Max Optimization ---')

// 1. Update Navbar.tsx
const navbarPath = path.resolve('belmont/src/components/Navbar.tsx')
let navbar = fs.readFileSync(navbarPath, 'utf8')

navbar = navbar.replace(
  'h-20 w-full max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-4',
  'h-20 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-12 flex items-center justify-between gap-2 sm:gap-4'
)

navbar = navbar.replace(
  'gap-3.5 shrink-0 group',
  'gap-2.5 sm:gap-3.5 shrink-0 group'
)

navbar = navbar.replace(
  'font-serif text-lg tracking-wider text-[#e2e2ea] font-medium leading-tight',
  'font-serif text-base sm:text-lg tracking-wider text-[#e2e2ea] font-medium leading-tight'
)

navbar = navbar.replace(
  /<span className="font-mono text-\[10px\] tracking-widest uppercase text-\[#99907c\]">[\s\r\n]*EST\. 1894 • CHICAGO & GENEVA[\s\r\n]*<\/span>/,
  '<span className="hidden sm:inline font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-[#99907c]">EST. 1894 • CHICAGO & GENEVA</span>'
)

navbar = navbar.replace(
  'min-h-[40px] rounded border border-[#282a30]',
  'min-h-[44px] min-w-[44px] justify-center rounded border border-[#282a30]'
)

navbar = navbar.replace(
  'p-1 pr-3 rounded border border-[#4d4635]/60',
  'p-1 pr-2 sm:pr-3 min-h-[44px] rounded border border-[#4d4635]/60'
)

navbar = navbar.replace(
  'mt-2 w-72 rounded-xl bg-[#14171f]',
  'mt-2 w-[calc(100vw-1.75rem)] max-w-xs sm:w-72 rounded-xl bg-[#14171f]'
)

navbar = navbar.replace(
  /<Button[\s\S]*?onClick=\{\(\) => \{[\s\S]*?setAuthTab\('LOGIN'\)[\s\S]*?setShowLoginModal\(true\)[\s\S]*?\}\}[\s\S]*?>[\s\S]*?Entrar \/ Cadastrar[\s\S]*?<\/Button>/,
  `<Button
                  type="button"
                  className="min-h-[44px] px-3 sm:px-4 text-xs font-semibold"
                  onClick={() => {
                    setAuthTab('LOGIN')
                    setShowLoginModal(true)
                  }}
                >
                  <span>Entrar</span>
                  <span className="hidden sm:inline"> / Cadastrar</span>
                </Button>`
)

navbar = navbar.replace(
  '<nav className="flex md:hidden items-center gap-1.5 px-4 py-2 bg-[#0c0e13] border-t border-[#282a30] overflow-x-auto">',
  '<nav className="flex md:hidden items-center gap-1.5 px-3 py-2 bg-[#0c0e13] border-t border-[#282a30] overflow-x-auto no-scrollbar scroll-smooth">'
)

navbar = navbar.replace(
  'className={`px-4 py-2.5 min-h-[44px] flex items-center font-mono text-xs uppercase tracking-wider',
  'className={`px-3 py-2 min-h-[44px] flex items-center font-mono text-[11px] sm:text-xs uppercase tracking-wider'
)

fs.writeFileSync(navbarPath, navbar, 'utf8')
console.log('✓ Navbar.tsx optimized for mobile')

// 2. Update page.tsx (Home / Vitrine)
const pagePath = path.resolve('belmont/src/app/page.tsx')
let page = fs.readFileSync(pagePath, 'utf8')

page = page.replace(
  'w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]',
  'w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]'
)

page = page.replace(
  'relative w-full overflow-hidden px-6 lg:px-12 py-10',
  'relative w-full overflow-hidden px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10'
)

page = page.replace(
  'font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#e2e2ea] font-light tracking-tight leading-[1.12]',
  'font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-[#e2e2ea] font-light tracking-tight leading-[1.15]'
)

page = page.replace(
  'font-sans text-lg text-[#d0c5af] max-w-xl font-light leading-relaxed pt-2',
  'font-sans text-sm sm:text-lg text-[#d0c5af] max-w-xl font-light leading-relaxed pt-2'
)

page = page.replace(
  'relative h-[440px] w-full overflow-hidden bg-[#0c0e13]',
  'relative h-[260px] sm:h-[360px] lg:h-[440px] w-full overflow-hidden bg-[#0c0e13]'
)

page = page.replace(
  'p-4 bg-[#14171f] flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-[#282a30]',
  'p-3.5 sm:p-4 bg-[#14171f] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-t border-[#282a30]'
)

page = page.replace(
  'px-5 py-3 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-widest font-bold rounded shadow-lg hover:bg-[#f2ca50] transition-all flex items-center justify-center gap-2 group cursor-pointer',
  'px-5 py-3 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-widest font-bold rounded shadow-lg hover:bg-[#f2ca50] transition-all flex items-center justify-center gap-2 group cursor-pointer w-full md:w-auto min-h-[48px]'
)

page = page.replace(
  'flex items-center gap-1 p-1 bg-[#0c0e13] rounded-lg overflow-x-auto',
  'flex items-center gap-1 p-1 bg-[#0c0e13] rounded-lg overflow-x-auto no-scrollbar'
)

page = page.replace(
  'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16 lg:mb-20',
  'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 lg:mb-20'
)

page = page.replace(
  'relative h-64 w-full bg-[#0c0e13] overflow-hidden',
  'relative h-52 sm:h-64 w-full bg-[#0c0e13] overflow-hidden'
)

page = page.replace(
  'p-4 flex flex-col flex-1 justify-between space-y-4',
  'p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-3'
)

fs.writeFileSync(pagePath, page, 'utf8')
console.log('✓ page.tsx optimized for mobile')

// 3. Update lots/[id]/page.tsx (Sala de Pregão Ao Vivo)
const lotRoomPath = path.resolve('belmont/src/app/lots/[id]/page.tsx')
let lotRoom = fs.readFileSync(lotRoomPath, 'utf8')

lotRoom = lotRoom.replace(
  'w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]',
  'w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]'
)

lotRoom = lotRoom.replace(
  'w-full bg-[#0c0e13] px-6 lg:px-12 py-3 border-b border-[#282a30]',
  'w-full bg-[#0c0e13] px-3.5 sm:px-6 lg:px-12 py-2.5 sm:py-3 border-b border-[#282a30]'
)

lotRoom = lotRoom.replace(
  'w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-8',
  'w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 py-4 sm:py-8'
)

lotRoom = lotRoom.replace(
  'aspect-[4/3] max-h-[460px] bg-[#0c0e13]',
  'aspect-[4/3] max-h-[280px] sm:max-h-[380px] lg:max-h-[460px] bg-[#0c0e13]'
)

lotRoom = lotRoom.replace(
  'absolute bottom-4 left-4 bg-[#0c0e13]/85 backdrop-blur-md px-4 py-2 rounded shadow-lg flex items-center gap-3 border border-white/5',
  'absolute bottom-3 left-3 sm:bottom-4 sm:left-4 max-w-[calc(100%-1.5rem)] bg-[#0c0e13]/85 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded shadow-lg flex items-center gap-2 sm:gap-3 border border-white/5'
)

lotRoom = lotRoom.replace(
  'p-6 bg-[#1d2025] border-t border-[#282a30]',
  'p-4 sm:p-6 bg-[#1d2025] border-t border-[#282a30]'
)

lotRoom = lotRoom.replace(
  'font-serif text-3xl text-[#e2e2ea] tracking-tight leading-none',
  'font-serif text-2xl sm:text-3xl text-[#e2e2ea] tracking-tight leading-none'
)

lotRoom = lotRoom.replace(
  'rounded-xl bg-[#14171f] p-6 border border-[#282a30] shadow-xl relative overflow-hidden',
  'rounded-xl bg-[#14171f] p-4 sm:p-6 border border-[#282a30] shadow-xl relative overflow-hidden'
)

lotRoom = lotRoom.replace(
  'flex items-baseline gap-2 bg-[#0c0e13] px-4 py-2 rounded-lg border border-[#282a30] shadow-inner font-mono tabular-nums',
  'flex items-baseline gap-1.5 sm:gap-2 bg-[#0c0e13] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-[#282a30] shadow-inner font-mono tabular-nums'
)

lotRoom = lotRoom.replaceAll(
  'text-3xl text-[#f2ca50] font-bold tracking-tight',
  'text-2xl sm:text-3xl text-[#f2ca50] font-bold tracking-tight'
)

lotRoom = lotRoom.replace(
  'p-6 flex flex-col gap-5',
  'p-4 sm:p-6 flex flex-col gap-4 sm:gap-5'
)

lotRoom = lotRoom.replace(
  'font-mono text-[10px] text-[#99907c] select-all',
  'font-mono text-[9px] sm:text-[10px] text-[#99907c] select-all break-all sm:break-normal'
)

lotRoom = lotRoom.replace(
  'relative rounded-xl bg-[#14171f] p-6 border border-[#d4af37]/40 shadow-2xl overflow-hidden',
  'relative rounded-xl bg-[#14171f] p-4 sm:p-6 border border-[#d4af37]/40 shadow-2xl overflow-hidden'
)

lotRoom = lotRoom.replace(
  'font-serif text-3xl sm:text-4xl lg:text-5xl text-[#f2ca50] font-bold tracking-tight select-all tabular-nums',
  'font-serif text-2xl sm:text-4xl lg:text-5xl text-[#f2ca50] font-bold tracking-tight select-all tabular-nums'
)

lotRoom = lotRoom.replace(
  'grid grid-cols-1 sm:grid-cols-3 gap-2',
  'grid grid-cols-3 gap-1.5 sm:gap-2'
)

lotRoom = lotRoom.replace(
  'py-2.5 px-2 rounded-lg bg-[#1d2025] hover:bg-[#282a30]',
  'py-2 sm:py-2.5 px-1 sm:px-2 min-h-[44px] rounded-lg bg-[#1d2025] hover:bg-[#282a30]'
)

lotRoom = lotRoom.replace(
  '<div className="flex gap-2">',
  '<div className="flex flex-col sm:flex-row gap-2">'
)

lotRoom = lotRoom.replace(
  'className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-xs pl-10 pr-3 py-2.5 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"',
  'className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-xs pl-10 pr-3 py-2.5 min-h-[44px] rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"'
)

lotRoom = lotRoom.replace(
  'className="px-4 py-2.5 bg-[#282a30] hover:bg-[#d4af37] hover:text-[#1c1400] text-[#f2ca50] font-mono text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"',
  'className="px-4 py-2.5 min-h-[44px] flex items-center justify-center bg-[#282a30] hover:bg-[#d4af37] hover:text-[#1c1400] text-[#f2ca50] font-mono text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"'
)

fs.writeFileSync(lotRoomPath, lotRoom, 'utf8')
console.log('✓ lots/[id]/page.tsx optimized for mobile')

// 4. Update wallet/page.tsx (Carteira Digital)
const walletPath = path.resolve('belmont/src/app/wallet/page.tsx')
let wallet = fs.readFileSync(walletPath, 'utf8')

wallet = wallet.replace(
  'w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]',
  'w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]'
)

wallet = wallet.replace(
  'w-full px-6 lg:px-12 py-10 bg-[#0c0e13] border-b border-[#282a30]',
  'w-full px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10 bg-[#0c0e13] border-b border-[#282a30]'
)

wallet = wallet.replace(
  'w-full px-6 lg:px-12 py-10 max-w-[1600px] mx-auto flex flex-col gap-5',
  'w-full px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10 max-w-[1600px] mx-auto flex flex-col gap-4 sm:gap-5'
)

wallet = wallet.replaceAll(
  'p-6 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col justify-between shadow-sm relative overflow-hidden group',
  'p-4 sm:p-6 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col justify-between shadow-sm relative overflow-hidden group'
)

wallet = wallet.replaceAll(
  'font-serif text-3xl font-bold',
  'font-serif text-2xl sm:text-3xl font-bold'
)

wallet = wallet.replaceAll(
  'pt-2 bg-[#0c0e13]/80 -mx-6 -mb-6 px-6 py-2',
  'pt-2 bg-[#0c0e13]/80 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 py-2'
)

wallet = wallet.replace(
  'p-6 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col gap-4 shadow-sm',
  'p-4 sm:p-6 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col gap-4 shadow-sm'
)

wallet = wallet.replace(
  'p-6 rounded-xl bg-[#14171f] border border-[#282a30] shadow-sm flex flex-col gap-4',
  'p-4 sm:p-6 rounded-xl bg-[#14171f] border border-[#282a30] shadow-sm flex flex-col gap-4'
)

wallet = wallet.replace(
  'px-3 py-2 rounded-lg font-mono text-xs text-center transition-colors cursor-pointer border',
  'px-3 py-2 min-h-[44px] flex items-center justify-center rounded-lg font-mono text-xs text-center transition-colors cursor-pointer border'
)

wallet = wallet.replace(
  'flex items-center gap-2 overflow-x-auto pb-1 font-mono text-[10px]',
  'flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 font-mono text-[10px]'
)

wallet = wallet.replace(
  '<div className="overflow-x-auto -mx-6 px-6">',
  '<div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">'
)

wallet = wallet.replace(
  '<table className="w-full text-left font-sans text-xs">',
  '<table className="w-full text-left font-sans text-xs whitespace-nowrap">'
)

fs.writeFileSync(walletPath, wallet, 'utf8')
console.log('✓ wallet/page.tsx optimized for mobile')

// 5. Update auctioneer/page.tsx (Painel do Leiloeiro)
const auctioneerPath = path.resolve('belmont/src/app/auctioneer/page.tsx')
let auctioneer = fs.readFileSync(auctioneerPath, 'utf8')

auctioneer = auctioneer.replace(
  'w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]',
  'w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]'
)

auctioneer = auctioneer.replace(
  'w-full px-6 lg:px-12 py-3 bg-[#0c0e13] border-b border-[#282a30]',
  'w-full px-3.5 sm:px-6 lg:px-12 py-2.5 sm:py-3 bg-[#0c0e13] border-b border-[#282a30]'
)

auctioneer = auctioneer.replace(
  'w-full max-w-[1600px] mx-auto px-6 lg:px-12 pt-6',
  'w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 pt-4 sm:pt-6'
)

auctioneer = auctioneer.replace(
  'bg-[#0c0e13] rounded-xl p-6 border border-[#d4af37]/40 shadow-2xl flex flex-col gap-5',
  'bg-[#0c0e13] rounded-xl p-4 sm:p-6 border border-[#d4af37]/40 shadow-2xl flex flex-col gap-4 sm:gap-5'
)

auctioneer = auctioneer.replace(
  'w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-8',
  'w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 py-4 sm:py-8'
)

auctioneer = auctioneer.replaceAll(
  'bg-[#14171f] rounded-xl p-6 border border-[#282a30] shadow-xl flex flex-col gap-4',
  'bg-[#14171f] rounded-xl p-4 sm:p-6 border border-[#282a30] shadow-xl flex flex-col gap-4'
)

auctioneer = auctioneer.replace(
  'w-full max-w-[1600px] mx-auto px-6 lg:px-12 pb-8',
  'w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 pb-8'
)

auctioneer = auctioneer.replace(
  '<Table>\r\n              <TableHeader className="bg-[#14171f]">',
  '<div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">\r\n            <Table>\r\n              <TableHeader className="bg-[#14171f]">'
)
if (!auctioneer.includes('<div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">')) {
  auctioneer = auctioneer.replace(
    /<Table>\s*<TableHeader className="bg-\[#14171f\]">/,
    '<div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">\n            <Table>\n              <TableHeader className="bg-[#14171f]">'
  )
  auctioneer = auctioneer.replace(
    /<\/Table>\s*<\/div>\s*<\/section>/,
    '</Table>\n            </div>\n          </div>\n        </section>'
  )
} else {
  auctioneer = auctioneer.replace(
    '</Table>\r\n          )}',
    '</Table>\r\n            </div>\r\n          )}'
  )
}

fs.writeFileSync(auctioneerPath, auctioneer, 'utf8')
console.log('✓ auctioneer/page.tsx optimized for mobile')

// 6. Update my-bids/page.tsx
const myBidsPath = path.resolve('belmont/src/app/my-bids/page.tsx')
let myBids = fs.readFileSync(myBidsPath, 'utf8')

myBids = myBids.replace(
  'w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]',
  'w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]'
)

myBids = myBids.replace(
  'w-full px-6 lg:px-12 py-8 bg-[#0c0e13] border-b border-[#282a30]',
  'w-full px-3.5 sm:px-6 lg:px-12 py-6 sm:py-8 bg-[#0c0e13] border-b border-[#282a30]'
)

myBids = myBids.replace(
  'w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-8',
  'w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 py-6 sm:py-8'
)

myBids = myBids.replace(
  'flex items-center gap-3 border-b border-[#282a30] pb-4 mb-8 overflow-x-auto',
  'flex items-center gap-2 sm:gap-3 border-b border-[#282a30] pb-3 sm:pb-4 mb-6 sm:mb-8 overflow-x-auto no-scrollbar'
)

myBids = myBids.replaceAll(
  'px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 shrink-0',
  'px-3.5 sm:px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 shrink-0'
)

myBids = myBids.replace(
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
)

myBids = myBids.replace(
  '<div className="p-5">',
  '<div className="p-4 sm:p-5">'
)

fs.writeFileSync(myBidsPath, myBids, 'utf8')
console.log('✓ my-bids/page.tsx optimized for mobile')

// 7. Update audit/page.tsx
const auditPath = path.resolve('belmont/src/app/audit/page.tsx')
let audit = fs.readFileSync(auditPath, 'utf8')

audit = audit.replace(
  'w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]',
  'w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]'
)

audit = audit.replace(
  'w-full px-6 lg:px-12 py-10 bg-[#0c0e13] border-b border-[#282a30]',
  'w-full px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10 bg-[#0c0e13] border-b border-[#282a30]'
)

audit = audit.replace(
  'w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-10',
  'w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10'
)

audit = audit.replace(
  'bg-[#14171f] rounded-xl p-6 border border-[#282a30] shadow-xl flex flex-col gap-6',
  'bg-[#14171f] rounded-xl p-4 sm:p-6 border border-[#282a30] shadow-xl flex flex-col gap-4 sm:gap-6'
)

audit = audit.replace(
  '<Table>\r\n              <TableHeader className="bg-[#0c0e13]">',
  '<div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">\r\n            <Table>\r\n              <TableHeader className="bg-[#0c0e13]">'
)
if (!audit.includes('<div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">')) {
  audit = audit.replace(
    /<Table>\s*<TableHeader className="bg-\[#0c0e13\]">/,
    '<div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">\n            <Table>\n              <TableHeader className="bg-[#0c0e13]">'
  )
  audit = audit.replace(
    /<\/Table>\s*<\/div>\s*<\/main>/,
    '</Table>\n            </div>\n          </div>\n        </main>'
  )
} else {
  audit = audit.replace(
    '</Table>\r\n          )}',
    '</Table>\r\n            </div>\r\n          )}'
  )
}

fs.writeFileSync(auditPath, audit, 'utf8')
console.log('✓ audit/page.tsx optimized for mobile')

// 8. Update audit/[lotId]/page.tsx
const auditDetailPath = path.resolve('belmont/src/app/audit/[lotId]/page.tsx')
let auditDetail = fs.readFileSync(auditDetailPath, 'utf8')

auditDetail = auditDetail.replace(
  'w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]',
  'w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]'
)

auditDetail = auditDetail.replace(
  'w-full bg-[#0c0e13] px-6 lg:px-12 py-3 border-b border-[#282a30]',
  'w-full bg-[#0c0e13] px-3.5 sm:px-6 lg:px-12 py-2.5 sm:py-3 border-b border-[#282a30]'
)

auditDetail = auditDetail.replace(
  'w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-10',
  'w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10'
)

auditDetail = auditDetail.replace(
  'relative bg-[#0c0e13] p-4 sm:p-8 md:p-12 rounded-2xl shadow-2xl overflow-hidden border border-[#d4af37]/40',
  'relative bg-[#0c0e13] p-3 sm:p-8 md:p-12 rounded-2xl shadow-2xl overflow-hidden border border-[#d4af37]/40'
)

auditDetail = auditDetail.replace(
  'relative bg-[#14171f]/90 backdrop-blur-md p-6 sm:p-10 rounded-xl flex flex-col gap-8 shadow-xl border border-[#4d4635]/40',
  'relative bg-[#14171f]/90 backdrop-blur-md p-3.5 sm:p-8 md:p-10 rounded-xl flex flex-col gap-6 sm:gap-8 shadow-xl border border-[#4d4635]/40'
)

auditDetail = auditDetail.replace(
  'font-serif text-3xl lg:text-4xl text-[#e2e2ea] leading-tight',
  'font-serif text-xl sm:text-3xl lg:text-4xl text-[#e2e2ea] leading-tight'
)

fs.writeFileSync(auditDetailPath, auditDetail, 'utf8')
console.log('✓ audit/[lotId]/page.tsx optimized for mobile')

// 9. Update receipts/[code]/page.tsx
const receiptPath = path.resolve('belmont/src/app/receipts/[code]/page.tsx')
let receipt = fs.readFileSync(receiptPath, 'utf8')

receipt = receipt.replace(
  'w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]',
  'w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]'
)

receipt = receipt.replace(
  'w-full px-6 md:px-12 max-w-5xl mx-auto py-10 flex flex-col gap-6',
  'w-full px-3.5 sm:px-6 md:px-12 max-w-5xl mx-auto py-6 sm:py-10 flex flex-col gap-4 sm:gap-6'
)

receipt = receipt.replace(
  'relative bg-[#0c0e13] p-4 sm:p-10 rounded-2xl shadow-2xl overflow-hidden border border-[#d4af37]/40',
  'relative bg-[#0c0e13] p-3 sm:p-8 md:p-10 rounded-2xl shadow-2xl overflow-hidden border border-[#d4af37]/40'
)

fs.writeFileSync(receiptPath, receipt, 'utf8')
console.log('✓ receipts/[code]/page.tsx optimized for mobile')
console.log('--- All pages processed successfully ---')
