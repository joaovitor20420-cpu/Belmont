'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatTimeRemaining } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

  if (user.role === 'AUCTIONEER') {
    return (
      <div className="w-full pt-32 pb-20 px-6 max-w-xl mx-auto text-center font-mono">
        <div className="w-16 h-16 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center mx-auto mb-4 text-[#f2ca50]">
          <span className="material-symbols-outlined text-3xl">gavel</span>
        </div>
        <h2 className="text-2xl font-serif text-[#e2e2ea]">
          Perfil de Leiloeiro Oficial ({user.publicCode})
        </h2>
        <p className="mt-2 text-xs text-[#99907c] leading-relaxed">
          O Leiloeiro Oficial não realiza lances nem arremata obras. Sua função exclusiva é pesquisar o acervo da API pública, publicar pregões e receber a receita das liquidações.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/auctioneer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#f2ca50] px-5 py-2.5 text-xs text-[#07090E] font-bold hover:bg-[#e6bd3f] transition uppercase"
          >
            <span className="material-symbols-outlined text-sm">gavel</span>
            <span>Ir para o Painel do Leiloeiro</span>
          </Link>
        </div>
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
    <div className="w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* Header Banner */}
      <section className="w-full px-6 lg:px-12 py-8 bg-[#0c0e13] border-b border-[#282a30]">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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

          <div className="flex flex-wrap items-center gap-3">
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
      <main className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#282a30] pb-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 shrink-0 ${
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
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 shrink-0 ${
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
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-[#d4af37] text-[#1c1400] font-bold shadow-lg shadow-[#d4af37]/10'
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
                        <Badge variant="secondary" className="px-3 py-1 shadow-lg">
                          <span className="material-symbols-outlined text-xs">trophy</span>
                          <span>ARREMATADO</span>
                        </Badge>
                      ) : item.isLeading ? (
                        <Badge
                          variant="outline"
                          className="px-3 py-1 bg-[#4edea3]/20 border-[#4edea3]/50 text-[#4edea3] shadow-lg backdrop-blur-md"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                          <span>VOCÊ ESTÁ GANHANDO</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="px-3 py-1 bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-lg backdrop-blur-md"
                        >
                          <span className="material-symbols-outlined text-xs">warning</span>
                          <span>LANCE SUPERADO</span>
                        </Badge>
                      )}

                      <Badge
                        variant="outline"
                        className="px-2.5 py-1 bg-[#0c0e13]/85 border-[#282a30] text-[#e2e2ea] tabular-nums"
                      >
                        {item.status === 'LIVE'
                          ? `AO VIVO • ${formatTimeRemaining(item.endTime)}`
                          : item.status === 'ENDED'
                          ? 'ENCERRADO'
                          : 'AGENDADO'}
                      </Badge>
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
                    <div className="mt-4 pt-4 border-t border-[#1d2025] grid grid-cols-2 gap-3 tabular-nums">
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

                    {/* Receipt code if won (Hairline-divided instead of nested card) */}
                    {item.receiptCode && (
                      <div className="mt-4 pt-3 border-t border-[#1d2025] flex items-center justify-between gap-2">
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
                          className="px-2.5 py-1.5 rounded bg-[#282a30] hover:bg-[#343740] text-[10px] font-mono text-[#e2e2ea] transition flex items-center gap-1"
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
                <div className="p-5 pt-0 space-y-2">
                  {item.hasWon ? (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={`/audit/${item.lotId}`}>
                          <span className="material-symbols-outlined text-sm">verified_user</span>
                          <span>Acessar Certificado & Auditoria</span>
                        </Link>
                      </Button>
                      {item.receiptCode && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full border-[#d4af37]/40 text-[#f2ca50]"
                        >
                          <Link href={`/receipts/${item.receiptCode}`}>
                            <span className="material-symbols-outlined text-xs">receipt_long</span>
                            <span>Comprovante Compartilhável ({item.receiptCode})</span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : item.status === 'LIVE' ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-[#d4af37]/40 text-[#f2ca50]"
                    >
                      <Link href={`/lots/${item.lotId}`}>
                        <span className="material-symbols-outlined text-sm">gavel</span>
                        <span>{item.isLeading ? 'Acompanhar Pregão' : 'Cobrir Lance Imediatamente'}</span>
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full text-[#99907c]">
                      <Link href={`/lots/${item.lotId}`}>
                        <span className="material-symbols-outlined text-sm">gavel</span>
                        <span>Pregão Encerrado (Superado)</span>
                      </Link>
                    </Button>
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
