import fs from 'node:fs'
import path from 'node:path'

console.log('--- Deep Responsive Overhaul for Auctioneer Cockpit ---')

const auctioneerPath = path.resolve('belmont/src/app/auctioneer/page.tsx')
let file = fs.readFileSync(auctioneerPath, 'utf8')

// 1. Sub-Header license badge & status
file = file.replace(
  '<div className="flex items-center gap-2 px-3 py-1 bg-[#282a30] rounded border border-[#4d4635]/40">',
  '<div className="flex items-center gap-2 px-3 py-1 bg-[#282a30] rounded border border-[#4d4635]/40 max-w-full">'
)

file = file.replace(
  '<span className="font-mono text-xs text-[#d0c5af]">LEILOEIRO OFICIAL MATRICULADO (JUCESP #894)</span>',
  '<span className="font-mono text-xs text-[#d0c5af] truncate">LEILOEIRO OFICIAL MATRICULADO (JUCESP #894)</span>'
)

file = file.replace(
  '<span className="font-mono text-xs text-[#d0c5af]">\r\n                LEILOEIRO OFICIAL MATRICULADO (JUCESP #894)\r\n              </span>',
  '<span className="font-mono text-xs text-[#d0c5af] truncate">\r\n                LEILOEIRO OFICIAL MATRICULADO (JUCESP #894)\r\n              </span>'
)
if (!file.includes('truncate">LEILOEIRO OFICIAL MATRICULADO')) {
  file = file.replace(
    /<span className="font-mono text-xs text-\[#d0c5af\]">\s*LEILOEIRO OFICIAL MATRICULADO \(JUCESP #894\)\s*<\/span>/,
    '<span className="font-mono text-xs text-[#d0c5af] truncate">LEILOEIRO OFICIAL MATRICULADO (JUCESP #894)</span>'
  )
}

file = file.replace(
  '<div className="flex items-center gap-2 px-3 py-1 bg-[#4edea3]/10 border border-[#4edea3]/30 rounded">',
  '<div className="flex items-center gap-2 px-3 py-1 bg-[#4edea3]/10 border border-[#4edea3]/30 rounded max-w-full">'
)

file = file.replace(
  '<span className="font-mono text-[10px] uppercase tracking-widest text-[#4edea3] font-bold">',
  '<span className="font-mono text-[10px] uppercase tracking-widest text-[#4edea3] font-bold truncate">'
)

file = file.replace(
  '<div className="flex items-center gap-6 font-mono text-xs">',
  '<div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-xs">'
)

// 2. Active Live Lot Card title and action buttons
file = file.replace(
  '<span className="font-mono text-xs text-[#f2ca50]">',
  '<span className="font-mono text-xs text-[#f2ca50] line-clamp-1">'
)

file = file.replace(
  '<div className="flex flex-wrap items-center gap-2">\r\n                        <button\r\n                          type="button"\r\n                          onClick={() => setConfirmAction(\'hammer\')}',
  '<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">\r\n                        <button\r\n                          type="button"\r\n                          onClick={() => setConfirmAction(\'hammer\')}'
)
if (!file.includes('flex flex-col sm:flex-row items-stretch sm:items-center gap-2')) {
  file = file.replace(
    /<div className="flex flex-wrap items-center gap-2">\s*<button\s+type="button"\s+onClick=\{\(\) => setConfirmAction\('hammer'\)\}/,
    '<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">\n                        <button\n                          type="button"\n                          onClick={() => setConfirmAction(\'hammer\')}'
  )
}

file = file.replace(
  'className="flex-1 py-3 px-4 bg-[#4edea3] text-[#07090e] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-400 shadow-lg cursor-pointer disabled:opacity-50"',
  'className="flex-1 py-3 px-4 min-h-[48px] bg-[#4edea3] text-[#07090e] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-400 shadow-lg cursor-pointer disabled:opacity-50"'
)

file = file.replace(
  'className="py-3 px-4 bg-rose-600/20 text-rose-300 border border-rose-500/40 font-mono text-xs uppercase tracking-wider font-bold rounded-lg hover:bg-rose-600/30 transition cursor-pointer disabled:opacity-50"',
  'className="py-3 px-4 min-h-[48px] bg-rose-600/20 text-rose-300 border border-rose-500/40 font-mono text-xs uppercase tracking-wider font-bold rounded-lg hover:bg-rose-600/30 transition flex items-center justify-center cursor-pointer disabled:opacity-50"'
)

// 3. Scheduled queue action buttons
file = file.replace(
  '<div className="flex items-center gap-2 shrink-0">\r\n                          <Button',
  '<div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 shrink-0 w-full sm:w-auto">\r\n                          <Button'
)
if (!file.includes('grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 shrink-0 w-full sm:w-auto')) {
  file = file.replace(
    /<div className="flex items-center gap-2 shrink-0">\s*<Button\s+type="button"\s+variant="secondary"\s+size="sm"/,
    '<div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 shrink-0 w-full sm:w-auto">\n                          <Button type="button" variant="secondary" size="sm"'
  )
}

// 4. Ingestion Card in Left Column
file = file.replace(
  'className="p-3 bg-[#1d2025] rounded-xl border border-[#282a30] hover:border-[#d4af37]/40 flex flex-col md:flex-row gap-4 shadow-md transition-colors"',
  'className="p-3 bg-[#1d2025] rounded-xl border border-[#282a30] hover:border-[#d4af37]/40 flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-md transition-colors"'
)

file = file.replace(
  'className="w-full md:w-36 h-28 shrink-0 overflow-hidden rounded-lg bg-[#0c0e13] relative group"',
  'className="w-full sm:w-36 h-36 sm:h-28 shrink-0 overflow-hidden rounded-lg bg-[#0c0e13] relative group"'
)

file = file.replace(
  'className="px-3 py-1.5 bg-[#d4af37] text-[#1c1400] font-mono text-[10px] rounded uppercase font-bold flex items-center gap-1 shadow-sm hover:bg-[#f2ca50] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d4af37]"',
  'className="px-3 py-2 min-h-[40px] bg-[#d4af37] text-[#1c1400] font-mono text-[11px] rounded uppercase font-bold flex items-center gap-1 shadow-sm hover:bg-[#f2ca50] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d4af37]"'
)

// 5. Lot configuration form inputs & buttons
file = file.replace(
  'className="bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs px-3 py-2 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"',
  'className="bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs px-3 py-2.5 min-h-[44px] rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"'
)

file = file.replace(
  'className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-xs font-bold pl-10 pr-3 py-2.5 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"',
  'className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-xs font-bold pl-10 pr-3 py-2.5 min-h-[44px] rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"'
)

// Mode toggle buttons (Imediato vs Programado)
file = file.replace(
  'className={`py-3 px-4 rounded-lg border flex items-center justify-between transition cursor-pointer ${',
  'className={`py-3 px-4 min-h-[48px] rounded-lg border flex items-center justify-between transition cursor-pointer ${'
)

// Preset buttons grid
file = file.replace(
  '<div className="flex items-center gap-1.5">\r\n                            {[\r\n                              { label: \'+5 min\', mins: 5 },\r\n                              { label: \'+15 min\', mins: 15 },\r\n                              { label: \'+1 hora\', mins: 60 },\r\n                              { label: \'+24h\', mins: 1440 },\r\n                            ].map((preset) => (\r\n                              <button\r\n                                key={preset.mins}\r\n                                type="button"\r\n                                onClick={() => applySchedulePresetMinutes(preset.mins)}\r\n                                className="px-3 py-2.5 rounded-lg bg-[#0c0e13] hover:bg-[#1d2025] border border-[#282a30] hover:border-[#d4af37]/50 text-[#e2e2ea] text-[11px] font-bold transition cursor-pointer tabular-nums"\r\n                              >\r\n                                {preset.label}\r\n                              </button>\r\n                            ))}\r\n                          </div>',
  `<div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
                            {[
                              { label: '+5 min', mins: 5 },
                              { label: '+15 min', mins: 15 },
                              { label: '+1h', mins: 60 },
                              { label: '+24h', mins: 1440 },
                            ].map((preset) => (
                              <button
                                key={preset.mins}
                                type="button"
                                onClick={() => applySchedulePresetMinutes(preset.mins)}
                                className="px-1 sm:px-3 py-2 min-h-[40px] flex items-center justify-center rounded-lg bg-[#0c0e13] hover:bg-[#1d2025] border border-[#282a30] hover:border-[#d4af37]/50 text-[#e2e2ea] text-[10px] sm:text-[11px] font-bold transition cursor-pointer tabular-nums text-center"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>`
)
if (!file.includes('grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2')) {
  file = file.replace(
    /<div className="flex items-center gap-1\.5">[\s\S]*?\{\s*label:\s*'\+5 min',\s*mins:\s*5\s*\}[\s\S]*?<\/div>/,
    `<div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
                            {[
                              { label: '+5 min', mins: 5 },
                              { label: '+15 min', mins: 15 },
                              { label: '+1h', mins: 60 },
                              { label: '+24h', mins: 1440 },
                            ].map((preset) => (
                              <button
                                key={preset.mins}
                                type="button"
                                onClick={() => applySchedulePresetMinutes(preset.mins)}
                                className="px-1 sm:px-3 py-2 min-h-[40px] flex items-center justify-center rounded-lg bg-[#0c0e13] hover:bg-[#1d2025] border border-[#282a30] hover:border-[#d4af37]/50 text-[#e2e2ea] text-[10px] sm:text-[11px] font-bold transition cursor-pointer tabular-nums text-center"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>`
  )
}

// Master submit button
file = file.replace(
  'className="w-full py-4 px-6 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#f2ca50] shadow-xl transition-all cursor-pointer disabled:opacity-50"',
  'className="w-full py-3.5 sm:py-4 px-4 sm:px-6 min-h-[50px] bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#f2ca50] shadow-xl transition-all cursor-pointer disabled:opacity-50 text-center leading-snug"'
)

// Footer under submit button
file = file.replace(
  '<div className="flex items-center justify-between px-1 text-[#99907c] font-mono text-[10px]">',
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 px-1 text-[#99907c] font-mono text-[10px]">'
)

// Bottom table header & container
file = file.replace(
  'className="bg-[#0c0e13] rounded-xl p-6 border border-[#282a30] shadow-xl flex flex-col gap-6"',
  'className="bg-[#0c0e13] rounded-xl p-4 sm:p-6 border border-[#282a30] shadow-xl flex flex-col gap-4 sm:gap-6"'
)

file = file.replace(
  '<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#282a30]">',
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#282a30]">'
)

file = file.replace(
  '<Table>',
  '<Table className="whitespace-nowrap">'
)

fs.writeFileSync(auctioneerPath, file, 'utf8')
console.log('✓ Auctioneer cockpit responsive overhaul applied successfully!')
