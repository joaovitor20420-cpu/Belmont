'use client'

import React, { useState, useEffect, use, useRef } from 'react'
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
  Lock,
  Wallet,
  Sparkles,
  Award,
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
  externalApiId: number | null
  startPrice: number
  currentPrice: number
  minIncrement: number
  status: 'OPEN' | 'SCHEDULED' | 'CLOSED'
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

  // Atualiza relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 1. Busca dados iniciais do lote
  const fetchLot = async () => {
    try {
      setIsLoading(true)
      const data = await apiRequest<{ lot: LotDetails }>(`/lots/${id}`)
      setLot(data.lot)
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

      eventSource.addEventListener('connected', (e) => {
        console.log('[SSE] Conectado à sala de pregão do lote:', e.data)
      })

      eventSource.addEventListener('update', (e) => {
        try {
          const payload = JSON.parse(e.data)
          console.log('[SSE] Atualização em tempo real recebida:', payload)

          if (payload.type === 'NEW_BID') {
            setLot((prev) => {
              if (!prev) return prev

              if (payload.antiSnipingExtended) {
                setAntiSnipingAlert(true)
                setTimeout(() => setAntiSnipingAlert(false), 8000)
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
                bids: [newBidRecord, ...prev.bids],
              }
            })

            // Atualiza saldos da carteira do usuário
            refreshUser()
          }

          if (payload.type === 'LOT_SETTLED') {
            setLot((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                status: 'CLOSED',
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
          console.error('[SSE] Erro ao processar payload do evento:', err)
        }
      })

      eventSource.onerror = (err) => {
        console.warn('[SSE] Conexão com a sala oscilou, tentando reconectar...', err)
      }
    } catch (err) {
      console.error('[SSE] Falha ao instanciar EventSource:', err)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [id, refreshUser])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Conectando à sala de pregão oficial...
      </div>
    )
  }

  if (error || !lot) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Não foi possível acessar este pregão</h2>
        <p className="mt-2 text-sm text-slate-400">{error || 'Lote inexistente.'}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a Vitrine
        </Link>
      </div>
    )
  }

  const remainingMs = new Date(lot.endTime).getTime() - now
  const isExpired = remainingMs <= 0
  const isClosingSoon = remainingMs > 0 && remainingMs <= 120000

  // Cálculo do lance mínimo aceito
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
        message: 'Leiloeiros não podem dar lances em lotes.',
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
        message: `Lance de ${formatCurrency(amountInCents)} registrado com sucesso!`,
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
    if (!confirm('Deseja liquidar este lote agora? Isso debitará o arrematante e emitirá o comprovante oficial.')) {
      return
    }

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
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Barra de Topo com Navegação */}
      <div className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Vitrine</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/audit/${lot.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Ver Trilha de Auditoria</span>
            </Link>

            {lot.status === 'CLOSED' && lot.receipt?.publicCode && (
              <Link
                href={`/receipts/${lot.receipt.publicCode}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition"
              >
                <Award className="h-4 w-4" />
                <span>Comprovante Oficial</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Anti-Sniping Disparado */}
      {antiSnipingAlert && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-700 py-2.5 px-4 text-center text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg animate-pulse">
          <Flame className="h-4 w-4 text-amber-300" />
          <span>MECANISMO ANTI-SNIPING ATIVADO! Lance efetuado na reta final estendeu o leilão em +120 segundos.</span>
        </div>
      )}

      {/* Grid Principal da Sala */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Imagem e Dados da Obra (7 Colunas) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Moldura da Obra */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
              <img
                src={lot.imageUrl}
                alt={lot.title}
                className="w-full max-h-[500px] object-contain bg-black/60"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop'
                }}
              />

              {/* Badges sobrepostos na imagem */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  LOTE #{lot.id.slice(0, 8).toUpperCase()}
                </span>
                {lot.externalApiId && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/80 text-slate-300 border border-slate-700 backdrop-blur-md">
                    Art Institute #{lot.externalApiId}
                  </span>
                )}
              </div>
            </div>

            {/* Informações Artísticas */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
              <div className="text-xs uppercase font-bold tracking-wider text-amber-400">
                {lot.artist || 'Artista Renomado'}
              </div>
              <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-extrabold text-white">
                {lot.title}
              </h1>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {lot.description}
              </p>

              <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Lance Inicial</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(lot.startPrice)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Incremento Mín.</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(lot.minIncrement)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Início</span>
                  <span className="text-white font-semibold">
                    {new Date(lot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Encerramento</span>
                  <span className="text-white font-semibold">
                    {new Date(lot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Pregão Ao Vivo & Painel de Lances (5 Colunas) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Card de Status do Pregão */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {lot.status === 'OPEN' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        lot.status === 'OPEN'
                          ? 'bg-emerald-500'
                          : lot.status === 'SCHEDULED'
                          ? 'bg-blue-500'
                          : 'bg-slate-500'
                      }`}
                    ></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {lot.status === 'OPEN'
                      ? 'Sala do Pregão Ao Vivo'
                      : lot.status === 'SCHEDULED'
                      ? 'Pregão Agendado'
                      : 'Pregão Encerrado'}
                  </span>
                </div>

                {/* Tempo Restante */}
                {lot.status === 'OPEN' && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
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
              <div className="py-6 text-center">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  {lot.status === 'CLOSED' ? 'Preço Final de Arremate' : 'Lance Atual'}
                </span>
                <div className="font-serif text-4xl sm:text-5xl font-black text-white mt-1">
                  {formatCurrency(lot.currentPrice || lot.startPrice)}
                </div>

                {/* Líder Atual com LGPD */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  {lot.currentWinner ? (
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                        isUserWinning
                          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-slate-400">Líder:</span>
                      <span className="font-bold">{lot.currentWinner.maskedName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono">
                        {lot.currentWinner.publicCode}
                      </span>
                      {isUserWinning && (
                        <span className="text-emerald-400 font-bold ml-1">• Seu Lance!</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Nenhum lance ofertado ainda.</span>
                  )}
                </div>
              </div>

              {/* Seção de Dar Lance (se aberto) */}
              {lot.status === 'OPEN' && !isExpired && (
                <div className="mt-2 pt-6 border-t border-slate-800 space-y-4">
                  {bidFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
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

                  {/* Botão Rápido: Próximo Lance Mínimo */}
                  <button
                    disabled={isBidding}
                    onClick={() => handlePlaceBid(minAllowedBid)}
                    className="w-full flex items-center justify-between rounded-xl bg-amber-500 hover:bg-amber-400 py-3.5 px-5 text-sm font-bold text-slate-950 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Gavel className="h-4 w-4" />
                      <span>Cobrir Lance Mínimo</span>
                    </div>
                    <span className="font-mono text-base font-extrabold">
                      {formatCurrency(minAllowedBid)}
                    </span>
                  </button>

                  {/* Incrementos Rápidos */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      disabled={isBidding}
                      onClick={() => handlePlaceBid(minAllowedBid + 10000)}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                    >
                      +{formatCurrency(10000)}
                    </button>
                    <button
                      disabled={isBidding}
                      onClick={() => handlePlaceBid(minAllowedBid + 50000)}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                    >
                      +{formatCurrency(50000)}
                    </button>
                    <button
                      disabled={isBidding}
                      onClick={() => handlePlaceBid(minAllowedBid + 100000)}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                    >
                      +{formatCurrency(100000)}
                    </button>
                  </div>

                  {/* Input de Lance Personalizado */}
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">
                          R$
                        </span>
                        <input
                          type="number"
                          value={customBidAmount}
                          onChange={(e) => setCustomBidAmount(e.target.value)}
                          placeholder={`Mínimo ${(minAllowedBid / 100).toFixed(2)}`}
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <button
                        disabled={isBidding || !customBidAmount}
                        onClick={() => handlePlaceBid(Math.round(parseFloat(customBidAmount) * 100))}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-40"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Liquidação para Leiloeiro se expirou */}
              {user?.role === 'AUCTIONEER' && lot.status === 'OPEN' && isExpired && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <button
                    disabled={isSettling}
                    onClick={handleSettleLot}
                    className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-3 text-xs font-bold text-white transition shadow-lg shadow-purple-600/20"
                  >
                    {isSettling ? 'Liquidando...' : '⚖️ Liquidar Lote & Emitir Comprovante'}
                  </button>
                </div>
              )}

              {/* Se o lote foi encerrado */}
              {lot.status === 'CLOSED' && (
                <div className="mt-4 pt-6 border-t border-slate-800 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-amber-400 font-semibold">
                    <Award className="h-4 w-4" />
                    <span>Lote Arrematado Oficialmente</span>
                  </div>
                  {lot.receipt?.publicCode && (
                    <div>
                      <Link
                        href={`/receipts/${lot.receipt.publicCode}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition"
                      >
                        <span>Acessar Comprovante Oficial</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Histórico de Lances em Tempo Real */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Histórico do Pregão
                </span>
                <span className="text-xs font-mono font-semibold text-amber-400">
                  {lot.bids.length} lances
                </span>
              </div>

              {lot.bids.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhum lance ofertado ainda. Seja o primeiro a disputar!
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {lot.bids.map((bid, index) => (
                    <div
                      key={bid.id || index}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                        index === 0
                          ? 'bg-slate-900/90 border-amber-500/40 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {index === 0 ? (
                          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                        )}
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>{bid.bidder.maskedName}</span>
                            <span className="text-[10px] font-mono text-slate-400 px-1 rounded bg-slate-900 border border-slate-800">
                              {bid.bidder.publicCode}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
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
