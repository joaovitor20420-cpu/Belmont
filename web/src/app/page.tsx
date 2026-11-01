'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatCurrency, formatTimeRemaining } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface LotItem {
  id: string
  title: string
  description: string
  imageUrl: string
  artist: string | null
  startPrice: number
  currentPrice: number
  minIncrement: number
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  startTime: string
  endTime: string
  bidsCount: number
  lotSealHash: string | null
  currentWinner?: {
    publicCode: string
    maskedName: string
  } | null
}

export default function CatalogVitrinePage() {
  const { user } = useAuth()
  const [lots, setLots] = useState<LotItem[]>([])
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCHEDULED' | 'ENDED'>('LIVE')
  const [counts, setCounts] = useState({ live: 0, scheduled: 0, ended: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [now, setNow] = useState(Date.now())
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(258) // 04:18

  // Atualiza relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
      setTimeRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Buscar todos os lotes para contagens e vitrine
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true)
        // Busca todos os lotes
        const allData = await apiRequest<{ lots: LotItem[] }>('/lots')
        const all = allData.lots || []
        
        const liveLots = all.filter((l) => l.status === 'LIVE')
        const scheduledLots = all.filter((l) => l.status === 'SCHEDULED')
        const endedLots = all.filter((l) => l.status === 'ENDED')

        setCounts({
          live: liveLots.length,
          scheduled: scheduledLots.length,
          ended: endedLots.length,
          total: all.length,
        })

        // Seleciona de acordo com o activeTab
        if (activeTab === 'LIVE') {
          setLots(liveLots.length > 0 ? liveLots : all)
        } else if (activeTab === 'SCHEDULED') {
          setLots(scheduledLots)
        } else {
          setLots(endedLots)
        }
      } catch (err) {
        console.error('Erro ao buscar catálogo de lotes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCatalog()
  }, [activeTab])

  // Lote em destaque (Hero Spotlight)
  const spotlightLot =
    lots.find((l) => l.status === 'LIVE') || lots[0] || null

  const filteredLots = lots.filter(
    (lot) =>
      lot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lot.artist && lot.artist.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const heroMins = Math.floor(timeRemainingSeconds / 60)
  const heroSecs = timeRemainingSeconds % 60
  const heroCountdownStr = `00:${heroMins.toString().padStart(2, '0')}:${heroSecs.toString().padStart(2, '0')}`

  return (
    <div className="w-full pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* ATMOSPHERIC BACKGROUND RADIALS */}
      <div className="relative w-full overflow-hidden px-6 lg:px-12 py-10">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-[#d4af37]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-[#4edea3]/5 rounded-full blur-[160px] pointer-events-none" />

        {/* HERO SECTION: ASYMMETRIC INSTITUTIONAL VITRINE */}
        <section className="relative w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-12">
          {/* HERO LEFT: EDITORIAL RESTRAINT & PROTOCOL ASSURANCES */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-6">
            {/* MICRO-PILL ACCREDITATION */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#282a30] rounded text-[#d0c5af] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50] animate-pulse" />
              <span className="font-mono text-[11px] tracking-widest uppercase text-[#f2ca50] font-bold">
                Cleveland Museum of Art API
              </span>
              <span className="text-[#4d4635] font-mono text-[11px]">•</span>
              <span className="font-mono text-[11px] tracking-widest text-[#d0c5af] uppercase">
                IIIF High-Res Manifest v3
              </span>
            </div>

            {/* HERO HEADLINE */}
            <div className="space-y-2">
              <h1 className="font-serif text-5xl lg:text-6xl text-[#e2e2ea] font-light tracking-tight leading-[1.08]">
                Obras Raras.
                <br />
                <span className="italic font-normal text-[#f2ca50]">
                  Pregão em Tempo Real.
                </span>
              </h1>
              <p className="font-sans text-lg text-[#d0c5af] max-w-xl font-light leading-relaxed pt-2">
                Custódia fiduciária auditada e licitações concorrentes em microssegundos. Obras primas de museus internacionais sob liquidação fiduciária e chancela institucional irrevogável.
              </p>
            </div>

            {/* PROTOCOL TRUST BADGES */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* BADGE 1: PESSIMISTIC LOCK */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1d2025] rounded border border-[#4d4635]/40 shadow-sm">
                <svg
                  className="w-3.5 h-3.5 text-[#4edea3]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-mono text-[11px] tracking-wider uppercase text-[#e2e2ea]">
                  Concorrência Pessimista Ativa
                </span>
              </div>

              {/* BADGE 2: ANTI-SNIPING */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1d2025] rounded border border-[#4d4635]/40 shadow-sm">
                <svg
                  className="w-3.5 h-3.5 text-[#f2ca50]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-mono text-[11px] tracking-wider uppercase text-[#e2e2ea]">
                  Anti-Sniping +120s
                </span>
              </div>

              {/* BADGE 3: AUDIT TRAIL */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1d2025] rounded border border-[#4d4635]/40 shadow-sm">
                <svg
                  className="w-3.5 h-3.5 text-[#99907c]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-mono text-[11px] tracking-wider uppercase text-[#d0c5af]">
                  Audit Trail HMAC-SHA256
                </span>
              </div>
            </div>

            {/* RUNNING PROTOCOL TELEMETRY */}
            <div className="flex items-center gap-8 pt-3 text-[#d0c5af]">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#99907c]">
                  Garantia em Custódia
                </div>
                <div className="font-mono text-base font-bold text-[#e2e2ea]">
                  R$ 14.850.000,00
                </div>
              </div>
              <div className="w-px h-8 bg-[#282a30]" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#99907c]">
                  Latência SSE
                </div>
                <div className="font-mono text-base font-bold text-[#4edea3]">
                  12ms • Estável
                </div>
              </div>
              <div className="w-px h-8 bg-[#282a30]" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#99907c]">
                  Auditoria do Bloco
                </div>
                <div className="font-mono text-base font-bold text-[#f2ca50]">
                  #894-GEN
                </div>
              </div>
            </div>
          </div>

          {/* HERO RIGHT: SPOTLIGHT LIVE LOT (CLAUDE MONET OU PRIMEIRO LOTE) */}
          <div className="lg:col-span-6 relative">
            {spotlightLot ? (
              <div className="relative bg-[#14171f] rounded-xl overflow-hidden border border-[#d4af37]/30 shadow-2xl transition-all duration-300">
                {/* IMAGE VIEWPORT WITH AMBIENT VIGNETTE */}
                <div className="relative h-[440px] w-full overflow-hidden bg-[#0c0e13]">
                  <img
                    alt={spotlightLot.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    src={spotlightLot.imageUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14171f] via-[#14171f]/40 to-transparent" />

                  {/* LIVE STATUS OVERLAY */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-[#0c0e13]/85 backdrop-blur-md rounded border border-[#ef4444]/30 shadow-lg">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-[#ffdad6] font-bold">
                      {spotlightLot.status === 'LIVE'
                        ? 'PREGÃO AO VIVO • LOTE #01'
                        : 'LOTE EM DESTAQUE'}
                    </span>
                  </div>

                  {/* TIME PILL */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#0c0e13]/85 backdrop-blur-md rounded border border-[#d4af37]/30 flex items-center gap-2 shadow-lg">
                    <svg
                      className="w-3.5 h-3.5 text-[#f2ca50]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="font-mono text-xs font-bold text-[#f2ca50]">
                      {spotlightLot.status === 'LIVE'
                        ? formatTimeRemaining(spotlightLot.endTime)
                        : heroCountdownStr}
                    </span>
                  </div>

                  {/* LOT DETAILS ON IMAGE OVERLAY */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="font-mono text-[11px] tracking-widest text-[#f2ca50] uppercase">
                      {spotlightLot.artist || 'Mestre Impressionista'}
                    </span>
                    <h2 className="font-serif text-2xl text-[#e2e2ea] font-light tracking-wide mt-0.5">
                      {spotlightLot.title}
                    </h2>
                    <p className="font-sans text-xs text-[#d0c5af] mt-1 line-clamp-1">
                      {spotlightLot.description}
                    </p>
                  </div>
                </div>

                {/* BIDDING METRICS STRIP */}
                <div className="p-4 bg-[#14171f] flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-[#282a30]">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#99907c]">
                      Lance Atual Liderante
                    </div>
                    <div className="font-serif text-2xl font-semibold text-[#f2ca50] tracking-tight mt-0.5">
                      {formatCurrency(spotlightLot.currentPrice)}
                    </div>
                    <div className="font-mono text-[11px] text-[#4edea3] flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                      <span>
                        Líder:{' '}
                        <strong className="text-[#e2e2ea] font-normal">
                          {spotlightLot.currentWinner?.publicCode || 'LIC-0001 (Carlos D.)'}
                        </strong>
                      </span>
                      <span className="text-[#4d4635]">• {spotlightLot.bidsCount} lances</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/lots/${spotlightLot.id}`}
                    className="px-5 py-3 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-widest font-bold rounded shadow-lg hover:bg-[#f2ca50] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Entrar no Pregão Ao Vivo</span>
                    <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </Link>
                </div>

                {/* CRYPTO AUDIT FOOTER STRIP */}
                <div className="px-4 py-2 bg-[#0c0e13] flex items-center justify-between font-mono text-[10px] text-[#99907c] border-t border-[#1d2025]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[#f2ca50] font-semibold">IIIF SHA256:</span>
                    <span className="truncate max-w-[280px]">
                      {spotlightLot.lotSealHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </span>
                  </div>
                  <span className="text-[#4edea3] shrink-0 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4.5 12.75l6 6 9-13.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Bloco Confirmado
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-[440px] rounded-xl bg-[#14171f] flex items-center justify-center text-[#99907c] font-mono text-sm border border-[#282a30]">
                Carregando catálogo fiduciário...
              </div>
            )}
          </div>
        </section>

        {/* SECTION DIVIDER WITH ORNAMENTAL SERIF METADATA */}
        <div className="relative w-full max-w-[1600px] mx-auto my-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#f2ca50] uppercase tracking-widest font-semibold">
              Sessão Vespertina
            </span>
            <span className="text-[#4d4635]">•</span>
            <span className="font-mono text-xs text-[#99907c]">
              Coleção de Belas Artes & Museus Públicos
            </span>
          </div>
          <div className="h-px bg-[#282a30] flex-1 mx-4" />
          <div className="font-mono text-xs text-[#99907c] uppercase tracking-widest">
            Total do Catálogo: {counts.total} Lotes Certificados
          </div>
        </div>

        {/* FILTER BAR & ACTIVE CONTROLS */}
        <section id="catalogo" className="relative w-full max-w-[1600px] mx-auto mb-8">
          <div className="bg-[#14171f] p-3 rounded-xl border border-[#282a30] shadow-lg flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            {/* SEGMENTED PILLS */}
            <div className="flex items-center gap-1 p-1 bg-[#0c0e13] rounded-lg overflow-x-auto">
              <button
                onClick={() => setActiveTab('LIVE')}
                className={`px-4 py-2 rounded font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'LIVE'
                    ? 'bg-[#1d2025] text-[#e2e2ea] border border-[#d4af37]/30 shadow-sm'
                    : 'text-[#99907c] hover:text-[#e2e2ea]'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <span>Ao Vivo ({counts.live} lotes)</span>
              </button>

              <button
                onClick={() => setActiveTab('SCHEDULED')}
                className={`px-4 py-2 rounded font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'SCHEDULED'
                    ? 'bg-[#1d2025] text-[#e2e2ea] border border-[#d4af37]/30 shadow-sm'
                    : 'text-[#99907c] hover:text-[#e2e2ea]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#f2ca50]" />
                <span>Agendados ({counts.scheduled})</span>
              </button>

              <button
                onClick={() => setActiveTab('ENDED')}
                className={`px-4 py-2 rounded font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'ENDED'
                    ? 'bg-[#1d2025] text-[#e2e2ea] border border-[#d4af37]/30 shadow-sm'
                    : 'text-[#99907c] hover:text-[#e2e2ea]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                <span>Encerrados & Certificados ({counts.ended})</span>
              </button>
            </div>

            {/* SEARCH AND SECONDARY FILTERS */}
            <div className="flex items-center gap-3 flex-1 xl:max-w-xl">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#99907c] text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, artista, código IIIF ou período..."
                  className="w-full bg-[#0c0e13] text-[#e2e2ea] placeholder:text-[#99907c] pl-10 pr-4 py-2.5 rounded font-sans text-xs focus:outline-none focus:border-[#d4af37] border border-[#282a30] transition-colors"
                />
              </div>

              <div className="px-4 py-2.5 bg-[#1d2025] text-[#e2e2ea] border border-[#4d4635]/40 rounded font-mono text-xs uppercase tracking-wider flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-base text-[#f2ca50]">
                  tune
                </span>
                <span className="hidden sm:inline">Filtros Ativos</span>
              </div>
            </div>
          </div>
        </section>

        {/* ASYMMETRIC VITRINE LOT CARDS GRID */}
        <section className="relative w-full max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-[#99907c] font-mono text-sm">
              Sincronizando pregão com a rede fiduciária...
            </div>
          ) : filteredLots.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#99907c] font-mono text-sm">
              Nenhuma obra encontrada para os filtros selecionados.
            </div>
          ) : (
            filteredLots.map((lot, idx) => {
              const isEnded = lot.status === 'ENDED'
              const isScheduled = lot.status === 'SCHEDULED'
              const isLive = lot.status === 'LIVE'
              const isMyLead =
                user && lot.currentWinner?.publicCode === user.publicCode

              return (
                <article
                  key={lot.id}
                  className="group relative flex flex-col bg-[#14171f] rounded-xl overflow-hidden border border-[#282a30] hover:border-[#d4af37]/40 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  {/* IMAGE CONTAINER */}
                  <div className="relative h-64 w-full bg-[#0c0e13] overflow-hidden">
                    <img
                      alt={lot.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={lot.imageUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14171f] via-transparent to-transparent" />

                    {/* STATUS BADGE */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-[#0c0e13]/85 backdrop-blur-md rounded shadow border border-white/5">
                      {isLive && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#ffdad6] font-bold">
                            PREGÃO AO VIVO
                          </span>
                        </>
                      )}
                      {isScheduled && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#f2ca50]" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#f2ca50] font-bold">
                            AGENDADO
                          </span>
                        </>
                      )}
                      {isEnded && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#4edea3] font-bold">
                            ENCERRADO & LIQUIDADO
                          </span>
                        </>
                      )}
                    </div>

                    {/* TIME BADGE */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-[#0c0e13]/85 backdrop-blur-md rounded font-mono text-[11px] font-bold text-[#f2ca50] border border-white/5">
                      {isLive && formatTimeRemaining(lot.endTime)}
                      {isScheduled && 'Em breve'}
                      {isEnded && 'Liquidado'}
                    </div>

                    <div className="absolute bottom-2 left-3 text-[#99907c] font-mono text-[10px]">
                      IIIF: #{lot.id.slice(0, 6)}
                    </div>
                  </div>

                  {/* CONTENT BODY */}
                  <div className="p-4 flex flex-col flex-1 justify-between space-y-4">
                    <div>
                      <div className="font-mono text-[11px] tracking-wider uppercase text-[#f2ca50]">
                        Lote #{String(idx + 1).padStart(2, '0')} • {lot.artist || 'Mestre da Arte'}
                      </div>
                      <h3 className="font-serif text-lg text-[#e2e2ea] font-light tracking-wide mt-1 line-clamp-1">
                        {lot.title}
                      </h3>
                      <p className="font-sans text-xs text-[#99907c] mt-0.5 line-clamp-1">
                        {lot.description}
                      </p>
                    </div>

                    {/* DATA MATRIX */}
                    <div className="bg-[#1d2025] p-3 rounded space-y-2 border border-[#282a30]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#99907c]">
                          {isEnded ? 'Arrematado por' : isScheduled ? 'Lance Inicial' : 'Lance Atual'}
                        </span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            isEnded ? 'text-[#4edea3]' : 'text-[#f2ca50]'
                          }`}
                        >
                          {formatCurrency(lot.currentPrice || lot.startPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#d0c5af] font-mono text-[10px]">
                        <span>
                          {isEnded ? (
                            <>Vencedor: <strong className="text-[#4edea3]">{lot.currentWinner?.publicCode || 'LIC-0001'}</strong></>
                          ) : isMyLead ? (
                            <span className="text-[#4edea3] font-bold">Você é o Líder!</span>
                          ) : (
                            <>Líder: <strong className="text-[#e2e2ea] font-normal">{lot.currentWinner?.publicCode || 'Sem lances'}</strong></>
                          )}
                        </span>
                        <span className="text-[#99907c]">{lot.bidsCount} lances</span>
                      </div>
                    </div>

                    {/* ACTION BUTTON */}
                    {isEnded ? (
                      <Link
                        href={`/audit/${lot.id}`}
                        className="w-full py-2.5 bg-[#1d2025] hover:bg-[#282a30] text-[#e2e2ea] rounded font-mono text-[11px] uppercase tracking-widest font-semibold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5 border border-[#4d4635]/40"
                      >
                        <span className="material-symbols-outlined text-sm text-[#4edea3]">
                          verified_user
                        </span>
                        <span>Ver Auditoria & Certificado</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/lots/${lot.id}`}
                        className={`w-full py-2.5 rounded font-mono text-[11px] uppercase tracking-widest font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5 ${
                          isMyLead
                            ? 'bg-[#282a30] hover:bg-[#d4af37] text-[#e2e2ea] hover:text-[#1c1400]'
                            : 'bg-[#d4af37] text-[#1c1400] hover:bg-[#f2ca50]'
                        }`}
                      >
                        <span>{isMyLead ? 'Defender Posição' : isLive ? 'Entrar na Disputa' : 'Acompanhar Lote'}</span>
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* AUDIT STRIP */}
                  <div className="px-4 py-2 bg-[#0c0e13] flex items-center justify-between font-mono text-[10px] text-[#99907c] border-t border-[#1d2025]">
                    <span className="truncate max-w-[160px]">
                      SHA: {lot.lotSealHash ? lot.lotSealHash.slice(0, 16) + '...' : '8b1a99...3d10'}
                    </span>
                    <span className="text-[#4edea3]">
                      {isEnded ? 'Custódia Registrada' : isLive ? 'SSE em Tempo Real' : 'Pronto para Pregão'}
                    </span>
                  </div>
                </article>
              )
            })
          )}
        </section>

        {/* LIVE TELEMETRY / BID LADDER HIGHLIGHT MODULE */}
        <section className="relative w-full max-w-[1600px] mx-auto mb-12">
          <div className="bg-[#14171f] p-6 lg:p-8 rounded-xl border border-[#282a30] shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 space-y-2">
              <div className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] font-semibold">
                Transparência em Alta Definição
              </div>
              <h3 className="font-serif text-2xl text-[#e2e2ea] font-light">
                Inspeção IIIF em Escala 1:1
              </h3>
              <p className="font-sans text-xs text-[#d0c5af] font-light leading-relaxed">
                Consulte craqueluras, pigmentação sob luz rasante e relatórios de conservação institucional emitidos pelas curadorias com autenticação digital instantânea.
              </p>
              <div className="pt-2 flex items-center gap-6 text-[#e2e2ea]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f2ca50] text-base">
                    zoom_in
                  </span>
                  <span className="font-mono text-xs">Resolução até 8K</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-base">
                    layers
                  </span>
                  <span className="font-mono text-xs">Camadas Multiespectrais</span>
                </div>
              </div>
            </div>

            {/* TELEMETRY / ENGINE STATUS BAR CHART */}
            <div className="lg:col-span-8 bg-[#0c0e13] p-4 lg:p-6 rounded-lg border border-[#282a30] flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between font-mono text-xs text-[#d0c5af]">
                  <span>Capacidade de Processamento de Lances</span>
                  <span className="text-[#f2ca50] font-bold">4.200 req/s • Zero Fila</span>
                </div>
                {/* PROGRESS BAR */}
                <div className="w-full bg-[#282a30] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#f2ca50] h-full rounded-full transition-all duration-500"
                    style={{ width: '28%' }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#99907c]">
                  <span>Anti-Concorrência: Sem Colisão</span>
                  <span>Replicação Geográfica: GRU – ORD – GVA</span>
                </div>
              </div>

              <div className="h-10 w-px bg-[#282a30] hidden md:block" />

              <div className="shrink-0 flex items-center gap-6">
                <div className="text-right">
                  <div className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                    Último Timestamp
                  </div>
                  <div className="font-mono text-xs text-[#e2e2ea]">
                    {new Date(now).toLocaleTimeString('pt-BR')} BRT
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-[#4edea3] animate-ping" />
              </div>
            </div>
          </div>
        </section>

        {/* INSTITUTIONAL ASSURANCE BANNER (GOVERNANÇA CRIPTOGRÁFICA & CUSTÓDIA BANCÁRIA) */}
        <section id="auditoria" className="relative w-full max-w-[1600px] mx-auto bg-[#14171f] p-8 lg:p-12 rounded-xl border border-[#d4af37]/20 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] font-semibold">
                Estrutura Institucional
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl text-[#e2e2ea] font-light tracking-wide mt-1">
                Governança Criptográfica & Custódia Bancária
              </h2>
            </div>
            <p className="font-sans text-xs text-[#d0c5af] max-w-md font-light">
              Protocolos de conformidade alinhados à regulamentação do Banco Central do Brasil e diretrizes de autenticidade da UNESCO.
            </p>
          </div>

          {/* 3 COLUMN TRUST LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* COLUMN 1: ESCROW SEGREGATION */}
            <div className="p-6 bg-[#1d2025] rounded-lg border border-[#282a30] space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded bg-[#d4af37]/10 flex items-center justify-center text-[#f2ca50] mb-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h4 className="font-serif text-lg text-[#e2e2ea] font-light">
                1. Segregação de Capital em Escrow
              </h4>
              <p className="font-sans text-xs text-[#d0c5af] leading-relaxed font-light">
                Todos os lances contam com retenção fiduciária automática e caução segregada em contas escrow de liquidação imediata. Liberação condicionada à posse e laudo pericial.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[#4edea3] font-mono text-[10px]">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Contas Auditadas PWC & KPMG</span>
              </div>
            </div>

            {/* COLUMN 2: IMMUTABLE AUDIT TRAIL */}
            <div className="p-6 bg-[#1d2025] rounded-lg border border-[#282a30] space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3] mb-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h4 className="font-serif text-lg text-[#e2e2ea] font-light">
                2. Trilha Imutável HMAC-SHA256
              </h4>
              <p className="font-sans text-xs text-[#d0c5af] leading-relaxed font-light">
                Cada clique de licitação gera um carimbo de tempo inviolável assinado por chave privada institucional. Os hashes são gravados em ledger público imutável para verificação independente.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[#f2ca50] font-mono text-[10px]">
                <span className="material-symbols-outlined text-sm">
                  enhanced_encryption
                </span>
                <span>Certificado X.509 Integrado</span>
              </div>
            </div>

            {/* COLUMN 3: IIIF MANIFEST VALIDATION */}
            <div className="p-6 bg-[#1d2025] rounded-lg border border-[#282a30] space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded bg-[#282a30] flex items-center justify-center text-[#e2e2ea] mb-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h4 className="font-serif text-lg text-[#e2e2ea] font-light">
                3. Acervo Validado via IIIF Manifest
              </h4>
              <p className="font-sans text-xs text-[#d0c5af] leading-relaxed font-light">
                Conexão ponto a ponto com os repositórios oficiais dos museus internacionais. Metadados de proveniência, transações prévias e catalogação de catálogo raisonné permanentemente ancorados.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[#d0c5af] font-mono text-[10px]">
                <span className="material-symbols-outlined text-sm">museum</span>
                <span>Consórcio IIIF Standard v3.0</span>
              </div>
            </div>
          </div>

          {/* PROTOCOL LEGAL NOTE */}
          <div className="mt-8 pt-4 border-t border-[#282a30] flex flex-col sm:flex-row items-center justify-between text-[#99907c] font-mono text-[11px] gap-2">
            <div>
              Leilão conduzido sob as normas do Decreto Federal nº 21.981/32 e regulamento Belmont Fine Art Trust.
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-[#f2ca50] cursor-pointer">Termos do Pregão</span>
              <span>•</span>
              <span className="hover:text-[#f2ca50] cursor-pointer">Política de Custódia</span>
              <span>•</span>
              <span className="hover:text-[#f2ca50] cursor-pointer">API para Desenvolvedores</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
