'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiRequest, API_BASE_URL } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatTimeRemaining } from '@/lib/utils'
import {
  Gavel,
  ShieldCheck,
  Flame,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Award,
  Radio,
  UserCheck,
  TrendingUp,
} from 'lucide-react'

interface BidRecord {
  id: string
  amount: number
  bidHash: string
  prevHash: string
  createdAt: string
  bidder: {
    publicCode: string
    maskedName: string
  }
}

interface LotDetails {
  id: string
  title: string
  description: string
  imageUrl: string
  artist: string | null
  externalApiId: string | null
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
  bids: BidRecord[]
  receipt?: {
    publicCode: string
  } | null
}

export default function LotAuctionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user, refreshUser } = useAuth()

  const [lot, setLot] = useState<LotDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [sseConnected, setSseConnected] = useState(false)

  // Estado para lances
  const [customBidAmount, setCustomBidAmount] = useState('')
  const [isBidding, setIsBidding] = useState(false)
  const [bidFeedback, setBidFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Anti-sniping flash alert
  const [antiSnipingAlert, setAntiSnipingAlert] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  // Relógio com atualização a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 1. Busca dados iniciais do lote
  const fetchLot = async () => {
    try {
      setIsLoading(true)
      const data = await apiRequest<{ lot: LotDetails }>(`/lots/${id}`)
      setLot({
        ...data.lot,
        bids: data.lot.bids || [],
      })
    } catch (err: any) {
      setError(err.message || 'Lote não encontrado.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLot()
  }, [id])

  // 2. Conexão Server-Sent Events (SSE) para tempo real
  useEffect(() => {
    if (!id) return

    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource(`${API_BASE_URL}/lots/${id}/live`)

      eventSource.addEventListener('connected', () => {
        setSseConnected(true)
      })

      eventSource.addEventListener('update', (e) => {
        try {
          const payload = JSON.parse(e.data)

          if (payload.type === 'NEW_BID') {
            setLot((prev) => {
              if (!prev) return prev

              if (payload.antiSnipingExtended) {
                setAntiSnipingAlert(true)
                setTimeout(() => setAntiSnipingAlert(false), 9000)
              }

              const newBidRecord: BidRecord = {
                id: `bid_${Date.now()}`,
                amount: payload.currentPrice,
                bidHash: 'sse-live',
                prevHash: '',
                createdAt: new Date().toISOString(),
                bidder: {
                  publicCode: payload.leaderPublicCode,
                  maskedName: payload.leaderMaskedName,
                },
              }

              return {
                ...prev,
                currentPrice: payload.currentPrice,
                bidsCount: payload.bidsCount,
                endTime: payload.newEndTime || prev.endTime,
                currentWinner: {
                  publicCode: payload.leaderPublicCode,
                  maskedName: payload.leaderMaskedName,
                },
                bids: [newBidRecord, ...(prev.bids || [])],
              }
            })

            refreshUser()
          }

          if (payload.type === 'LOT_SETTLED') {
            setLot((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                status: 'ENDED',
                currentPrice: payload.finalPrice,
                lotSealHash: payload.rootSealHash || prev.lotSealHash,
                receipt: { publicCode: payload.receiptCode },
                currentWinner: {
                  publicCode: payload.winnerPublicCode,
                  maskedName: payload.winnerMaskedName,
                },
              }
            })
            refreshUser()
          }
        } catch (err) {
          console.error('[SSE] Erro ao processar payload:', err)
        }
      })

      eventSource.onerror = () => {
        setSseConnected(false)
      }
    } catch (err) {
      console.error('[SSE] Falha de conexão:', err)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [id, refreshUser])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <span className="text-xs tracking-wider">Conectando à sala de pregão oficial...</span>
      </div>
    )
  }

  if (error || !lot) {
    return (
      <div className="mx-auto max-w-xl py-24 px-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4 stroke-[1.5]" />
        <h2 className="text-xl font-serif font-bold text-white">Lote Indisponível</h2>
        <p className="mt-2 text-xs text-slate-400">{error || 'O pregão solicitado não foi localizado.'}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retornar para o Catálogo</span>
        </Link>
      </div>
    )
  }

  const remainingMs = new Date(lot.endTime).getTime() - now
  const isExpired = remainingMs <= 0
  const isClosingSoon = remainingMs > 0 && remainingMs <= 120000

  // Lance mínimo aceitável
  const minAllowedBid =
    lot.bidsCount === 0 ? lot.startPrice : lot.currentPrice + lot.minIncrement

  // Submissão de Lance
  const handlePlaceBid = async (amountInCents: number) => {
    if (!user) {
      setBidFeedback({
        type: 'error',
        message: 'Você precisa entrar na plataforma para submeter um lance.',
      })
      return
    }

    if (user.role === 'AUCTIONEER') {
      setBidFeedback({
        type: 'error',
        message: 'Usuários com papel de leiloeiro não podem dar lances.',
      })
      return
    }

    setIsBidding(true)
    setBidFeedback(null)

    try {
      await apiRequest(`/lots/${lot.id}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amountInCents }),
      })
      setBidFeedback({
        type: 'success',
        message: `Lance de ${formatCurrency(amountInCents)} computado com sucesso!`,
      })
      setCustomBidAmount('')
      await refreshUser()
    } catch (err: any) {
      setBidFeedback({
        type: 'error',
        message: err.message || 'Falha ao registrar o lance.',
      })
    } finally {
      setIsBidding(false)
    }
  }

  // Liquidação de Lote (Leiloeiro)
  const handleSettleLot = async () => {
    if (!confirm('Deseja liquidar este lote oficialmente agora?')) return

    setIsSettling(true)
    try {
      await apiRequest(`/lots/${lot.id}/settle`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      fetchLot()
    } catch (err: any) {
      alert(err.message || 'Erro ao liquidar lote.')
    } finally {
      setIsSettling(false)
    }
  }

  const isUserWinning =
    user && lot.currentWinner && user.publicCode === lot.currentWinner.publicCode

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Sub-Header da Sala */}
      <div className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Vitrine</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Status da Conexão SSE */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{sseConnected ? 'Canal SSE Conectado' : 'Reconectando canal...'}</span>
            </div>

            <Link
              href={`/audit/${lot.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Trilha de Auditoria</span>
            </Link>

            {lot.status === 'ENDED' && lot.receipt?.publicCode && (
              <Link
                href={`/receipts/${lot.receipt.publicCode}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>Comprovante Oficial</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Banner de Alerta de Anti-Sniping */}
      {antiSnipingAlert && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-700 py-3 px-4 text-center text-xs font-bold text-white flex items-center justify-center gap-2 shadow-2xl animate-pulse">
          <Flame className="h-4 w-4 text-amber-300 shrink-0" />
          <span>MECANISMO ANTI-SNIPING ATIVADO: Lance na reta final estendeu o encerramento em +120 segundos!</span>
        </div>
      )}

      {/* Grid Principal da Sala */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Obra e Metadados (7 Colunas) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Moldura da Obra com Fundo de Galeria */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/90 shadow-2xl">
              <div className="relative max-h-[520px] w-full flex items-center justify-center bg-black/70 p-4">
                <img
                  src={lot.imageUrl}
                  alt={lot.title}
                  className="max-h-[480px] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop'
                  }}
                />
              </div>

              {/* Badges sobrepostos na Moldura */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-950/90 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-lg">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>LOTE #{lot.id.slice(0, 8).toUpperCase()}</span>
                </span>
                {lot.externalApiId && (
                  <span className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-slate-900/90 text-slate-300 border border-slate-700 backdrop-blur-md shadow-lg">
                    Art Institute Chicago #{lot.externalApiId}
                  </span>
                )}
              </div>
            </div>

            {/* Ficha Técnica da Obra */}
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 shadow-xl">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-1">
                {lot.artist || 'Mestre Renomado'}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {lot.title}
              </h1>
              <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {lot.description}
              </p>

              <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Lance Base</span>
                  <span className="font-mono text-white font-bold text-sm">{formatCurrency(lot.startPrice)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Incremento Mín.</span>
                  <span className="font-mono text-white font-bold text-sm">{formatCurrency(lot.minIncrement)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Abertura</span>
                  <span className="text-white font-semibold">
                    {new Date(lot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Término Previsto</span>
                  <span className="text-white font-semibold">
                    {new Date(lot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Pregão Ao Vivo & Keypad de Lances (5 Colunas) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Card Principal do Pregão */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 shadow-2xl relative overflow-hidden">
              {/* Header do Card */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    {lot.status === 'LIVE' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        lot.status === 'LIVE'
                          ? 'bg-emerald-500'
                          : lot.status === 'SCHEDULED'
                          ? 'bg-blue-500'
                          : 'bg-slate-500'
                      }`}
                    />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {lot.status === 'LIVE'
                      ? 'Sala de Pregão Ao Vivo'
                      : lot.status === 'SCHEDULED'
                      ? 'Pregão Agendado'
                      : 'Pregão Encerrado'}
                  </span>
                </div>

                {/* Contador de Tempo Restante */}
                {lot.status === 'LIVE' && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-inner ${
                      isClosingSoon
                        ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                        : 'bg-slate-950 text-amber-300 border border-slate-800'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTimeRemaining(remainingMs)}</span>
                  </div>
                )}
              </div>

              {/* Preço Atual e Líder */}
              <div className="py-8 text-center">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-widest block">
                  {lot.status === 'ENDED' ? 'Valor Final Arrematado' : 'Lance Atual'}
                </span>
                <div className="font-serif text-5xl sm:text-6xl font-black text-white mt-2 tracking-tight">
                  {formatCurrency(lot.currentPrice || lot.startPrice)}
                </div>

                {/* Líder Atual com LGPD */}
                <div className="mt-4 flex items-center justify-center">
                  {lot.currentWinner ? (
                    <div
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border ${
                        isUserWinning
                          ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-slate-400">Líder:</span>
                      <span className="font-bold">{lot.currentWinner.maskedName}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono">
                        {lot.currentWinner.publicCode}
                      </span>
                      {isUserWinning && (
                        <span className="text-emerald-400 font-bold ml-1">• Você!</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Nenhum lance registrado até o momento.</span>
                  )}
                </div>
              </div>

              {/* Seção de Lance (se ao vivo) */}
              {lot.status === 'LIVE' && !isExpired && (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  {bidFeedback && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
                        bidFeedback.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                          : 'bg-rose-950/80 border border-rose-800 text-rose-200'
                      }`}
                    >
                      {bidFeedback.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <span>{bidFeedback.message}</span>
                    </div>
                  )}

                  {/* Botão de Cobrir Lance Mínimo */}
                  <button
                    disabled={isBidding}
                    onClick={() => handlePlaceBid(minAllowedBid)}
                    className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-4 px-6 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Gavel className="h-5 w-5 stroke-[2]" />
                      <span>Cobrir Lance Mínimo</span>
                    </div>
                    <span className="font-mono text-lg font-black">
                      {formatCurrency(minAllowedBid)}
                    </span>
                  </button>

                  {/* Chips de Incremento Rápido */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      disabled={isBidding}
                      onClick={() => handlePlaceBid(minAllowedBid + 10000)}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition active:scale-95 cursor-pointer"
                    >
                      +{formatCurrency(10000)}
                    </button>
                    <button
                      disabled={isBidding}
                      onClick={() => handlePlaceBid(minAllowedBid + 50000)}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition active:scale-95 cursor-pointer"
                    >
                      +{formatCurrency(50000)}
                    </button>
                    <button
                      disabled={isBidding}
                      onClick={() => handlePlaceBid(minAllowedBid + 100000)}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition active:scale-95 cursor-pointer"
                    >
                      +{formatCurrency(100000)}
                    </button>
                  </div>

                  {/* Lance Personalizado */}
                  <div className="pt-2">
                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">
                          R$
                        </span>
                        <input
                          type="number"
                          value={customBidAmount}
                          onChange={(e) => setCustomBidAmount(e.target.value)}
                          placeholder={`Mínimo ${(minAllowedBid / 100).toFixed(2)}`}
                          className="w-full rounded-2xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <button
                        disabled={isBidding || !customBidAmount}
                        onClick={() => handlePlaceBid(Math.round(parseFloat(customBidAmount) * 100))}
                        className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-40 cursor-pointer"
                      >
                        Enviar Lance
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Liquidação Oficial para Leiloeiro */}
              {user?.role === 'AUCTIONEER' && lot.status === 'LIVE' && isExpired && (
                <div className="mt-5 pt-5 border-t border-slate-800">
                  <button
                    disabled={isSettling}
                    onClick={handleSettleLot}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-500 py-3.5 text-xs font-bold text-white transition shadow-lg shadow-purple-600/25 cursor-pointer"
                  >
                    <Gavel className="h-4 w-4" />
                    <span>{isSettling ? 'Liquidando...' : 'Liquidar Lote & Emitir Certificado Oficial'}</span>
                  </button>
                </div>
              )}

              {/* Lote Encerrado com Sucesso */}
              {lot.status === 'ENDED' && (
                <div className="mt-5 pt-6 border-t border-slate-800 text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-amber-300 font-bold">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>Lote Arrematado Oficialmente</span>
                  </div>

                  {lot.receipt?.publicCode && (
                    <div>
                      <Link
                        href={`/receipts/${lot.receipt.publicCode}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-xs font-bold text-slate-950 transition cursor-pointer"
                      >
                        <span>Acessar Certificado Oficial</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Histórico do Pregão */}
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col flex-1 shadow-xl">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Histórico de Lances do Pregão
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {(lot.bids || []).length} computados
                </span>
              </div>

              {(lot.bids || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhum lance ofertado ainda.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {(lot.bids || []).map((bid, index) => (
                    <div
                      key={bid.id || index}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs transition-colors ${
                        index === 0
                          ? 'bg-slate-900/90 border-amber-500/50 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {index === 0 ? (
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                        )}
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            <span>{bid.bidder.maskedName}</span>
                            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800">
                              {bid.bidder.publicCode}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(bid.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-sm text-right text-white">
                        {formatCurrency(bid.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
