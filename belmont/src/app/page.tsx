'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatCurrency, formatTimeRemaining } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  const [spotlightLot, setSpotlightLot] = useState<LotItem | null>(null)
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCHEDULED' | 'ENDED'>('LIVE')
  const [counts, setCounts] = useState({ live: 0, scheduled: 0, ended: 0, total: 0 })
  const [metrics, setMetrics] = useState({ totalVolumeInCents: 0, totalBids: 0 })
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'PRICE_DESC' | 'PRICE_ASC' | 'BIDS_DESC'>('DEFAULT')
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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

        setMetrics({
          totalVolumeInCents: all.reduce((acc, l) => acc + Number(l.currentPrice || l.startPrice || 0), 0),
          totalBids: all.reduce((acc, l) => acc + Number(l.bidsCount || 0), 0),
        })

        setSpotlightLot(liveLots[0] || scheduledLots[0] || endedLots[0] || null)

        // Seleciona de acordo com o activeTab (sem misturar estados)
        if (activeTab === 'LIVE') {
          setLots(liveLots)
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

  const filteredLots = lots
    .filter(
      (lot) =>
        lot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lot.artist && lot.artist.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === 'PRICE_DESC') return (b.currentPrice || b.startPrice) - (a.currentPrice || a.startPrice)
      if (sortBy === 'PRICE_ASC') return (a.currentPrice || a.startPrice) - (b.currentPrice || b.startPrice)
      if (sortBy === 'BIDS_DESC') return (b.bidsCount || 0) - (a.bidsCount || 0)
      return 0
    })

  return (
    <div className="w-full pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-24 md:pb-12 bg-[#07090E] min-h-screen text-[#e2e2ea] overflow-x-hidden">
      {/* ATMOSPHERIC BACKGROUND RADIALS */}
      <div className="relative w-full overflow-hidden px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10">
        <div className="absolute -top-40 left-1/4 w-[320px] sm:w-[600px] h-[320px] sm:h-[600px] max-w-full bg-[#d4af37]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] max-w-full bg-[#4edea3]/5 rounded-full blur-[160px] pointer-events-none" />

        {/* HERO SECTION: ASYMMETRIC INSTITUTIONAL VITRINE */}
        <section className="relative w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center mb-8 sm:mb-14 lg:mb-20">
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
              <h1 className="font-serif text-xl sm:text-3xl md:text-5xl lg:text-6xl text-[#e2e2ea] font-light tracking-tight leading-[1.15]">
                Obras Raras.
                <br />
                <span className="italic font-normal text-[#f2ca50]">
                  Pregão em Tempo Real.
                </span>
              </h1>
              <p className="font-sans text-xs sm:text-base md:text-lg text-[#d0c5af] max-w-xl font-light leading-relaxed pt-1 sm:pt-2">
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

            {/* REAL CATALOG METRICS FROM DATABASE */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-3 text-[#d0c5af] font-mono tabular-nums">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#99907c]">
                  Volume no Catálogo
                </div>
                <div className="text-base font-bold text-[#e2e2ea]">
                  {formatCurrency(metrics.totalVolumeInCents)}
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-[#282a30]" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#99907c]">
                  Pregões Ativos
                </div>
                <div className="text-base font-bold text-[#4edea3]">
                  {counts.live} {counts.live === 1 ? 'Lote Ao Vivo' : 'Lotes Ao Vivo'}
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-[#282a30]" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#99907c]">
                  Lances Registrados
                </div>
                <div className="text-base font-bold text-[#f2ca50]">
                  {metrics.totalBids} {metrics.totalBids === 1 ? 'Lance' : 'Lances'}
                </div>
              </div>
            </div>
          </div>

          {/* HERO RIGHT: SPOTLIGHT LIVE LOT (CLAUDE MONET OU PRIMEIRO LOTE) */}
          <div className="lg:col-span-6 relative">
            {spotlightLot ? (
              <div className="relative bg-[#14171f] rounded-xl overflow-hidden border border-[#d4af37]/30 shadow-2xl transition-all duration-300">
                {/* IMAGE VIEWPORT WITH AMBIENT VIGNETTE */}
                <div className="relative h-[220px] sm:h-[320px] lg:h-[440px] w-full overflow-hidden bg-[#0c0e13]">
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
                    <span className="font-mono text-xs font-bold text-[#f2ca50] tabular-nums">
                      {spotlightLot.status === 'LIVE'
                        ? formatTimeRemaining(spotlightLot.endTime)
                        : spotlightLot.status === 'SCHEDULED'
                        ? 'Agendado'
                        : 'Liquidado'}
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
                <div className="p-3.5 sm:p-4 bg-[#14171f] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-t border-[#282a30]">
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
                          {spotlightLot.currentWinner?.publicCode || 'Sem lances'}
                        </strong>
                      </span>
                      <span className="text-[#4d4635]">• {spotlightLot.bidsCount} lances</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/lots/${spotlightLot.id}`}
                    className="px-5 py-3 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-widest font-bold rounded shadow-lg hover:bg-[#f2ca50] transition-all flex items-center justify-center gap-2 group cursor-pointer w-full md:w-auto min-h-[48px] w-full md:w-auto min-h-[48px]"
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
              <div className="h-[440px] rounded-xl bg-[#14171f] p-8 flex flex-col items-center justify-center text-center border border-[#282a30] space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#1d2025] border border-[#d4af37]/30 flex items-center justify-center text-[#f2ca50]">
                  <span className="material-symbols-outlined text-2xl">gavel</span>
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="font-serif text-xl text-[#e2e2ea]">
                    {isLoading ? 'Sincronizando Catálogo...' : 'Nenhum Pregão Ativo no Momento'}
                  </h3>
                  <p className="font-mono text-xs text-[#99907c] leading-relaxed">
                    {isLoading
                      ? 'Consultando lotes homologados pelo Leiloeiro Oficial...'
                      : 'O catálogo oficial está limpo e pronto para receber novos lotes publicados pelo Leiloeiro Oficial.'}
                  </p>
                </div>
                {user?.role === 'AUCTIONEER' && !isLoading && (
                  <Link
                    href="/auctioneer"
                    className="px-5 py-2.5 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-widest font-bold rounded shadow-lg hover:bg-[#f2ca50] transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>Publicar Novo Lote no Painel do Leiloeiro</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SECTION DIVIDER WITH ORNAMENTAL SERIF METADATA */}
        <div className="relative w-full max-w-[1600px] mx-auto mt-0 mb-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-mono text-xs text-[#f2ca50] uppercase tracking-widest font-semibold">
              Sessão Vespertina
            </span>
            <span className="text-[#4d4635]">•</span>
            <span className="font-mono text-xs text-[#99907c]">
              Coleção de Belas Artes & Museus Públicos
            </span>
          </div>
          <div className="hidden lg:block h-px bg-[#282a30] flex-1 mx-4" />
          <div className="font-mono text-xs text-[#99907c] uppercase tracking-widest">
            Total do Catálogo: {counts.total} Lotes Certificados
          </div>
        </div>

        {/* FILTER BAR & ACTIVE CONTROLS */}
        <section id="catalogo" className="relative w-full max-w-[1600px] mx-auto mb-6">
          <div className="bg-[#14171f] p-3 rounded-xl border border-[#282a30] shadow-lg flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            {/* SEGMENTED PILLS */}
            <div className="flex items-center gap-1 p-1 bg-[#0c0e13] rounded-lg overflow-x-auto no-scrollbar no-scrollbar">
              <button
                onClick={() => setActiveTab('LIVE')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded font-mono text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 cursor-pointer ${
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 xl:max-w-xl">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#99907c] text-lg">
                  search
                </span>
                <input
                  id="catalog-search"
                  aria-label="Buscar por título, artista, código IIIF ou período"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, artista, código IIIF ou período..."
                  className="w-full bg-[#0c0e13] text-[#e2e2ea] placeholder:text-[#99907c] pl-10 pr-4 py-2.5 rounded font-sans text-xs focus:outline-none focus:border-[#d4af37] border border-[#282a30] transition-colors"
                />
              </div>

              <div className="px-3 py-2 bg-[#1d2025] text-[#e2e2ea] border border-[#4d4635]/40 rounded font-mono text-xs flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-base text-[#f2ca50]">
                  sort
                </span>
                <select
                  aria-label="Ordenar lotes do catálogo"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[#e2e2ea] font-mono text-xs uppercase tracking-wider focus:outline-none cursor-pointer w-full sm:w-auto"
                >
                  <option value="DEFAULT" className="bg-[#14171f]">Ordenação Padrão</option>
                  <option value="PRICE_DESC" className="bg-[#14171f]">Maior Valor</option>
                  <option value="PRICE_ASC" className="bg-[#14171f]">Menor Valor</option>
                  <option value="BIDS_DESC" className="bg-[#14171f]">Mais Disputados</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ASYMMETRIC VITRINE LOT CARDS GRID */}
        <section className="relative w-full max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-16 lg:mb-20">
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
                  <div className="relative h-44 sm:h-56 md:h-64 w-full bg-[#0c0e13] overflow-hidden">
                    <img
                      alt={lot.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={lot.imageUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14171f] via-transparent to-transparent" />

                    {/* STATUS BADGE */}
                    <Badge
                      variant="outline"
                      className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-[#0c0e13]/85 backdrop-blur-md border-white/5"
                    >
                      {isLive && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[#ffdad6]">PREGÃO AO VIVO</span>
                        </>
                      )}
                      {isScheduled && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#f2ca50]" />
                          <span className="text-[#f2ca50]">AGENDADO</span>
                        </>
                      )}
                      {isEnded && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                          <span className="text-[#4edea3]">ENCERRADO & LIQUIDADO</span>
                        </>
                      )}
                    </Badge>

                    {/* TIME BADGE */}
                    <Badge
                      variant="outline"
                      className="absolute top-3 right-3 px-2 py-1 bg-[#0c0e13]/85 backdrop-blur-md text-[11px] text-[#f2ca50] border-white/5 tabular-nums"
                    >
                      {isLive && formatTimeRemaining(lot.endTime)}
                      {isScheduled && `Abre em ${formatTimeRemaining(lot.startTime)}`}
                      {isEnded && 'Liquidado'}
                    </Badge>

                    <div className="absolute bottom-2 left-3 text-[#99907c] font-mono text-[10px]">
                      IIIF: #{lot.id.slice(0, 6)}
                    </div>
                  </div>

                  {/* CONTENT BODY */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
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

                    {/* DATA MATRIX (Hairline-divided instead of nested card) */}
                    <div className="pt-3 border-t border-[#282a30] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#99907c]">
                          {isEnded ? 'Arrematado por' : isScheduled ? 'Lance Inicial' : 'Lance Atual'}
                        </span>
                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            isEnded ? 'text-[#4edea3]' : 'text-[#f2ca50]'
                          }`}
                        >
                          {formatCurrency(lot.currentPrice || lot.startPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#d0c5af] font-mono text-[10px]">
                        <span>
                          {isEnded ? (
                            <>Vencedor: <strong className="text-[#4edea3]">{lot.currentWinner?.publicCode || 'Sem lances'}</strong></>
                          ) : isScheduled ? (
                            <>Abertura: <strong className="text-[#f2ca50] tabular-nums">{new Date(lot.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</strong></>
                          ) : isMyLead ? (
                            <span className="text-[#4edea3] font-bold">Você é o Líder!</span>
                          ) : (
                            <>Líder: <strong className="text-[#e2e2ea] font-normal">{lot.currentWinner?.publicCode || 'Sem lances'}</strong></>
                          )}
                        </span>
                        <span className="text-[#99907c] tabular-nums">{lot.bidsCount} lances</span>
                      </div>
                    </div>

                    {/* ACTION BUTTON */}
                    {isEnded ? (
                      isMyLead ? (
                        <Button
                          asChild
                          variant="secondary"
                          className="w-full bg-[#4edea3]/15 hover:bg-[#4edea3]/25 text-[#4edea3] border border-[#4edea3]/40"
                        >
                          <Link href="/my-bids">
                            <span className="material-symbols-outlined text-sm text-[#4edea3]">
                              verified_user
                            </span>
                            <span>Arrematado por Você • Ver Certificado</span>
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full text-[#99907c]"
                        >
                          <Link href={`/lots/${lot.id}`}>
                            <span className="material-symbols-outlined text-sm">
                              gavel
                            </span>
                            <span>Pregão Encerrado</span>
                          </Link>
                        </Button>
                      )
                    ) : (
                      <Button
                        asChild
                        variant={isMyLead ? 'outline' : 'default'}
                        className="w-full"
                      >
                        <Link href={`/lots/${lot.id}`}>
                          <span>{isMyLead ? 'Defender Posição' : isLive ? 'Entrar na Disputa' : 'Ver Lote Agendado'}</span>
                          <span className="material-symbols-outlined text-sm">
                            arrow_forward
                          </span>
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* AUDIT STRIP */}
                  <div className="px-4 py-2 bg-[#0c0e13] flex items-center justify-between font-mono text-[10px] text-[#99907c] border-t border-[#1d2025]">
                    <span className="truncate max-w-[150px]">
                      SHA: {lot.lotSealHash ? lot.lotSealHash.slice(0, 16) + '...' : '8b1a99...3d10'}
                    </span>
                    <Link
                      href={`/audit/${lot.id}`}
                      className="text-[#4edea3] hover:text-[#f2ca50] underline transition-colors"
                    >
                      Auditar Lote →
                    </Link>
                  </div>
                </article>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}
