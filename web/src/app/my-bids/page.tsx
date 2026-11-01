'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatTimeRemaining } from '@/lib/utils'

interface BidItem {
  lotId: string
  title: string
  imageUrl: string
  artist: string | null
  currentPrice: number
  myHighestBid: number
  status: string
  endTime: string
  isLeading: boolean
  hasWon: boolean
  receiptCode: string | null
}

export default function MyBidsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'WON' | 'ALL'>('ACTIVE')
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [data, setData] = useState<{
    activeParticipations: BidItem[]
    wonLots: BidItem[]
    historicalParticipations: BidItem[]
  }>({
    activeParticipations: [],
    wonLots: [],
    historicalParticipations: [],
  })

  const fetchMyBids = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const res = await apiRequest<{
        activeParticipations: BidItem[]
        wonLots: BidItem[]
        historicalParticipations: BidItem[]
      }>('/me/bids')
      setData(res)
    } catch {
      // Falha silenciosa ou vazio
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMyBids()
    const interval = setInterval(fetchMyBids, 8000)
    return () => clearInterval(interval)
  }, [user])

  const copyShareLink = (receiptCode: string) => {
    const url = `${window.location.origin}/receipts/${receiptCode}`
    navigator.clipboard.writeText(url)
    setCopiedCode(receiptCode)
    setTimeout(() => setCopiedCode(null), 3000)
  }

  if (!user) {
    return (
      <div className="w-full pt-32 pb-20 px-6 max-w-xl mx-auto text-center font-mono">
        <span className="material-symbols-outlined text-4xl text-[#f2ca50] mb-3">
          account_circle
        </span>
        <h2 className="text-xl font-serif text-[#e2e2ea]">Acesso Restrito</h2>
        <p className="mt-2 text-xs text-[#99907c]">
          Faça login como licitante para acompanhar seus lances e arremates.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded bg-[#1d2025] border border-[#d4af37]/40 px-5 py-2.5 text-xs text-[#f2ca50] hover:bg-[#282a30] transition uppercase"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          <span>Ir para a Página Inicial</span>
        </Link>
      </div>
    )
  }

  const displayedList =
    activeTab === 'ACTIVE'
      ? data.activeParticipations
      : activeTab === 'WON'
        ? data.wonLots
        : [...data.activeParticipations, ...data.wonLots, ...data.historicalParticipations]

  return (
    <div className="w-full pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* Header Banner */}
      <section className="w-full px-6 lg:px-12 py-8 bg-[#0c0e13] border-b border-[#282a30]">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#f2ca50] text-sm">
                verified_user
              </span>
              <span className="font-mono text-xs text-[#f2ca50] tracking-widest uppercase">
                PORTFÓLIO DE PARTICIPAÇÃO • {user.publicCode}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-semibold text-[#e2e2ea] tracking-tight">
              Meus Arremates & Lances
            </h1>
            <p className="mt-1 text-xs text-[#99907c] font-mono">
              Acompanhamento de posições em tempo real, disputas ativas e comprovantes oficiais.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/wallet"
              className="px-4 py-2 rounded-lg bg-[#14161b] border border-[#d4af37]/30 text-xs font-mono text-[#f2ca50] hover:bg-[#1d2025] transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              <span>Minha Carteira</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-[#f2ca50] text-[#07090E] text-xs font-mono font-bold tracking-wider uppercase hover:bg-[#e6bd3f] transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">gavel</span>
              <span>Explorar Vitrine</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#282a30] pb-4 mb-8">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-[#f2ca50] text-[#07090E] font-bold shadow-lg shadow-[#f2ca50]/10'
                : 'bg-[#14161b] text-[#99907c] hover:text-[#e2e2ea] border border-[#282a30]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">sensors</span>
            <span>Disputas Ativas ({data.activeParticipations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('WON')}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 ${
              activeTab === 'WON'
                ? 'bg-[#4edea3] text-[#07090E] font-bold shadow-lg shadow-[#4edea3]/10'
                : 'bg-[#14161b] text-[#99907c] hover:text-[#e2e2ea] border border-[#282a30]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">trophy</span>
            <span>Lotes Arrematados ({data.wonLots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 ${
              activeTab === 'ALL'
                ? 'bg-[#e2e2ea] text-[#07090E] font-bold'
                : 'bg-[#14161b] text-[#99907c] hover:text-[#e2e2ea] border border-[#282a30]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">history</span>
            <span>Histórico Completo</span>
          </button>
        </div>

        {/* Content List */}
        {isLoading && displayedList.length === 0 ? (
          <div className="py-20 text-center font-mono text-[#99907c]">
            <div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
            <span className="text-xs">Sincronizando suas posições com o livro de ofertas...</span>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="py-20 text-center font-mono border border-dashed border-[#282a30] rounded-2xl bg-[#0c0e13]/50">
            <span className="material-symbols-outlined text-4xl text-[#99907c] mb-3">
              receipt_long
            </span>
            <h3 className="text-sm font-medium text-[#e2e2ea]">Nenhum lote nesta categoria</h3>
            <p className="mt-1 text-xs text-[#99907c] max-w-sm mx-auto">
              Você ainda não possui lances registrados sob este critério. Visite o catálogo para participar dos pregões ao vivo.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded bg-[#14161b] border border-[#d4af37]/30 text-xs text-[#f2ca50] hover:bg-[#1d2025] transition"
            >
              <span>Ver Lotes Disponíveis</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedList.map((item) => (
              <div
                key={item.lotId}
                className="rounded-2xl bg-[#0e1015] border border-[#282a30] overflow-hidden flex flex-col justify-between hover:border-[#d4af37]/40 transition group"
              >
                <div>
                  {/* Artwork Image & Status Header */}
                  <div className="relative aspect-[16/10] w-full bg-[#14161b] overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = '/lot-preview.png'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e1015] via-transparent to-black/40" />

                    {/* Position Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      {item.hasWon ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#4edea3] text-[#07090E] font-mono text-[10px] font-bold tracking-wider uppercase shadow-lg">
                          <span className="material-symbols-outlined text-xs">trophy</span>
                          <span>ARREMATADO</span>
                        </div>
                      ) : item.isLeading ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#4edea3]/20 border border-[#4edea3]/50 text-[#4edea3] font-mono text-[10px] font-bold tracking-wider uppercase shadow-lg backdrop-blur-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                          <span>VOCÊ ESTÁ GANHANDO</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 font-mono text-[10px] font-bold tracking-wider uppercase shadow-lg backdrop-blur-md">
                          <span className="material-symbols-outlined text-xs">warning</span>
                          <span>LANCE SUPERADO</span>
                        </div>
                      )}

                      <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 font-mono text-[10px] text-[#e2e2ea]">
                        {item.status === 'LIVE' ? 'AO VIVO' : item.status === 'ENDED' ? 'ENCERRADO' : 'AGENDADO'}
                      </span>
                    </div>
                  </div>

                  {/* Artwork Details */}
                  <div className="p-5">
                    <p className="font-mono text-[11px] text-[#99907c] uppercase tracking-wider truncate">
                      {item.artist || 'Mestre da Pintura'}
                    </p>
                    <h3 className="font-serif text-base font-semibold text-[#e2e2ea] mt-1 line-clamp-1">
                      {item.title}
                    </h3>

                    {/* Financial Summary */}
                    <div className="mt-4 pt-4 border-t border-[#1d2025] grid grid-cols-2 gap-3">
                      <div>
                        <span className="block font-mono text-[10px] text-[#99907c] uppercase">
                          Lance Atual
                        </span>
                        <span className="font-mono text-sm text-[#e2e2ea] font-medium">
                          {formatCurrency(item.currentPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="block font-mono text-[10px] text-[#99907c] uppercase">
                          Minha Oferta
                        </span>
                        <span
                          className={`font-mono text-sm font-semibold ${
                            item.isLeading ? 'text-[#4edea3]' : 'text-[#f2ca50]'
                          }`}
                        >
                          {formatCurrency(item.myHighestBid)}
                        </span>
                      </div>
                    </div>

                    {/* Receipt code if won */}
                    {item.receiptCode && (
                      <div className="mt-4 p-3 rounded-lg bg-[#14161b] border border-[#d4af37]/30 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="font-mono text-[9px] text-[#99907c] uppercase tracking-wider">
                            Código do Certificado
                          </span>
                          <span className="font-mono text-xs text-[#f2ca50] font-bold">
                            {item.receiptCode}
                          </span>
                        </div>
                        <button
                          onClick={() => copyShareLink(item.receiptCode!)}
                          className="px-2.5 py-1 rounded bg-[#282a30] hover:bg-[#343740] text-[10px] font-mono text-[#e2e2ea] transition flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">
                            {copiedCode === item.receiptCode ? 'check' : 'share'}
                          </span>
                          <span>{copiedCode === item.receiptCode ? 'Copiado!' : 'Compartilhar'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-5 pt-0">
                  {item.hasWon && item.receiptCode ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/receipts/${item.receiptCode}`}
                        className="flex-1 py-2.5 rounded-lg bg-[#4edea3] text-[#07090E] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#43c490] transition text-center flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>Ver Comprovante Oficial</span>
                      </Link>
                    </div>
                  ) : item.status === 'LIVE' ? (
                    <Link
                      href={`/lots/${item.lotId}`}
                      className="w-full py-2.5 rounded-lg bg-[#14161b] border border-[#d4af37]/40 text-[#f2ca50] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#1d2025] transition text-center flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">gavel</span>
                      <span>{item.isLeading ? 'Acompanhar Pregão' : 'Cobrir Lance Imediatamente'}</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/audit/${item.lotId}`}
                      className="w-full py-2.5 rounded-lg bg-[#14161b] border border-[#282a30] text-[#99907c] font-mono text-xs uppercase tracking-wider hover:text-[#e2e2ea] transition text-center flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">history_edu</span>
                      <span>Auditoria do Lote</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
