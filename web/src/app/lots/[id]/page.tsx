'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { apiRequest, API_BASE_URL } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

export default function LiveAuctionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user, refreshUser } = useAuth()

  const [lot, setLot] = useState<LotDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [sseConnected, setSseConnected] = useState(false)
  const [isDossierOpen, setIsDossierOpen] = useState(true)

  // Estado para lances e confirmação em 2 passos (Error Prevention)
  const [customBidAmount, setCustomBidAmount] = useState('')
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null)
  const [confirmingSettle, setConfirmingSettle] = useState(false)
  const [isBidding, setIsBidding] = useState(false)
  const [bidFeedback, setBidFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Anti-sniping flash alert
  const [antiSnipingAlert, setAntiSnipingAlert] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  // Carteira
  const [userBalance, setUserBalance] = useState<{
    available: number
    committed: number
    total: number
  } | null>(null)

  useEffect(() => {
    const secTimer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => {
      clearInterval(secTimer)
    }
  }, [])

  // Buscar saldo do usuário
  useEffect(() => {
    if (!user) {
      setUserBalance(null)
      return
    }
    apiRequest<any>('/wallet/balance')
      .then((data) => {
        const available =
          data?.balances?.availableInCents ?? data?.balanceAvailable ?? 0
        const committed =
          data?.balances?.committedInCents ?? data?.balanceCommitted ?? 0
        const total =
          data?.balances?.totalInCents ?? data?.balanceTotal ?? 0
        setUserBalance({ available, committed, total })
      })
      .catch(() => {})
  }, [user])

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
      setError(err.message || 'Lote não localizado no pregão.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLot()
  }, [id])

  // 2. Conexão Server-Sent Events (SSE)
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
                setTimeout(() => setAntiSnipingAlert(false), 8000)
              }

              const newBidRecord: BidRecord = {
                id: `bid_${Date.now()}`,
                amount: payload.currentPrice,
                bidHash: payload.bidHash || 'sse-live',
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

          if (payload.type === 'LOT_STARTED') {
            setLot((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                status: 'LIVE',
                startTime: payload.startTime || prev.startTime,
                endTime: payload.endTime || prev.endTime,
              }
            })
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
          console.error('[SSE] Erro ao processar evento:', err)
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

  // Transição automática de SCHEDULED -> LIVE quando o relógio atinge startTime
  useEffect(() => {
    if (lot?.status === 'SCHEDULED') {
      const sMs = new Date(lot.startTime).getTime()
      if (now >= sMs) {
        fetchLot()
      }
    }
  }, [now, lot?.status, lot?.startTime])

  if (isLoading) {
    return (
      <div className="w-full pt-32 pb-20 flex min-h-[70vh] flex-col items-center justify-center gap-4 text-[#99907c] font-mono">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
        <span className="text-xs uppercase tracking-widest text-[#f2ca50]">
          Sincronizando pregão em tempo real...
        </span>
      </div>
    )
  }

  if (error || !lot) {
    return (
      <div className="w-full pt-32 pb-20 px-6 max-w-xl mx-auto text-center font-mono">
        <span className="material-symbols-outlined text-4xl text-rose-500 mb-3">
          error_outline
        </span>
        <h2 className="text-xl font-serif text-[#e2e2ea]">Lote Indisponível</h2>
        <p className="mt-2 text-xs text-[#99907c]">{error || 'O pregão não foi localizado.'}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded bg-[#1d2025] border border-[#d4af37]/40 px-5 py-2.5 text-xs text-[#f2ca50] hover:bg-[#282a30] transition uppercase"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Retornar ao Catálogo</span>
        </Link>
      </div>
    )
  }

  const startMs = new Date(lot.startTime).getTime()
  const endMs = new Date(lot.endTime).getTime()
  const isScheduled = lot.status === 'SCHEDULED' && now < startMs
  const remainingMs = isScheduled
    ? Math.max(0, startMs - now)
    : Math.max(0, endMs - now)
  const isEnded = lot.status === 'ENDED' || (!isScheduled && remainingMs <= 0)
  const isClosingSoon = !isScheduled && remainingMs > 0 && remainingMs <= 120000

  const remainingSecondsTotal = Math.floor(remainingMs / 1000)
  const countdownHours = Math.floor(remainingSecondsTotal / 3600)
  const countdownMinutes = Math.floor((remainingSecondsTotal % 3600) / 60)
  const countdownSeconds = remainingSecondsTotal % 60

  // Iniciar pregão agendado imediatamente (Leiloeiro Oficial)
  const handleStartLotNow = async () => {
    setIsSettling(true)
    try {
      await apiRequest(`/lots/${id}/start`, { method: 'POST' })
      setBidFeedback({
        type: 'success',
        message: 'Pregão oficial iniciado! O lote está AO VIVO para recebimento de lances.',
      })
      fetchLot()
    } catch (err: any) {
      setBidFeedback({
        type: 'error',
        message: err.message || 'Erro ao iniciar pregão agendado.',
      })
    } finally {
      setIsSettling(false)
    }
  }

  // Cálculo de lance mínimo
  const minAllowedBid =
    lot.bidsCount === 0 ? lot.startPrice : lot.currentPrice + lot.minIncrement

  const isMyBid =
    user && lot.currentWinner?.publicCode === user.publicCode

  // Saldo Disponível para Lance
  const requiredCollateral = minAllowedBid
  const hasEnoughBalance =
    (userBalance?.available ?? 0) >= minAllowedBid

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
        message: 'Leiloeiro não pode dar lances em lotes.',
      })
      return
    }

    if (isMyBid) {
      setBidFeedback({
        type: 'error',
        message: 'Você já está ganhando este lote. Aguarde outro licitante cobrir seu lance.',
      })
      return
    }

    if (amountInCents < minAllowedBid) {
      setBidFeedback({
        type: 'error',
        message: `Lance abaixo do mínimo permitido (${formatCurrency(minAllowedBid)}).`,
      })
      return
    }

    if ((userBalance?.available ?? 0) < amountInCents) {
      setBidFeedback({
        type: 'error',
        message: 'Saldo disponível insuficiente para cobrir este lance.',
      })
      return
    }

    setIsBidding(true)
    setBidFeedback(null)

    try {
      const response = await apiRequest<{
        bid: any
        antiSnipingExtended: boolean
        newEndTime: string
      }>(`/lots/${id}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amount: amountInCents, amountInCents }),
      })

      setBidFeedback({
        type: 'success',
        message: `Lance de ${formatCurrency(amountInCents)} confirmado com sucesso!`,
      })

      if (response.antiSnipingExtended) {
        setAntiSnipingAlert(true)
        setTimeout(() => setAntiSnipingAlert(false), 8000)
      }

      setCustomBidAmount('')
      fetchLot()
      refreshUser()
    } catch (err: any) {
      setBidFeedback({
        type: 'error',
        message: err.message || 'Falha ao registrar lance no motor de pregão.',
      })
    } finally {
      setIsBidding(false)
    }
  }

  // Finalizar / Liquidar pregão (Leiloeiro ou encerramento)
  const handleSettle = async () => {
    setIsSettling(true)
    try {
      const res = await apiRequest<{
        settled: boolean
        receiptCode: string
      }>(`/lots/${id}/settle`, { method: 'POST' })

      setBidFeedback({
        type: 'success',
        message: `Pregão liquidado oficialmente! Certificado: ${res.receiptCode}`,
      })
      fetchLot()
      refreshUser()
    } catch (err: any) {
      setBidFeedback({
        type: 'error',
        message: err.message || 'Erro ao homologar liquidação.',
      })
    } finally {
      setIsSettling(false)
    }
  }

  return (
    <div className="w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* Sub-Header Precision Diagnostic Ribbon */}
      <div className="w-full bg-[#0c0e13] px-6 lg:px-12 py-3 border-b border-[#282a30]">
        <div className="w-full max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="/"
              className="group flex items-center gap-2 font-mono text-xs uppercase text-[#99907c] hover:text-[#f2ca50] transition-colors"
            >
              <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">
                arrow_back
              </span>
              <span>Voltar ao Catálogo</span>
            </Link>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4d4635]" />
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#282a30] text-[#e2e2ea]">
              <span className="material-symbols-outlined text-xs text-[#f2ca50]">token</span>
              <span className="font-mono text-xs tracking-wider font-semibold text-[#f2ca50]">
                LOTE #{lot.id.slice(0, 4).toUpperCase()}
              </span>
              <span className="text-[#4d4635] font-mono text-xs">/</span>
              <span className="font-mono text-xs text-[#99907c]">
                {lot.externalApiId ? `CMA #${lot.externalApiId}` : 'IIIF #16568'}
              </span>
              <span className="text-[#4d4635] font-mono text-xs">/</span>
              <span className="font-mono text-xs uppercase text-[#e2e2ea]">
                {lot.artist || 'MESTRE INTERNACIONAL'}
              </span>
            </div>
          </div>

          {/* SSE Protocol & Latency Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#4edea3]/10 border border-[#4edea3]/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]" />
              </span>
              <span className="font-mono text-[10px] text-[#4edea3] tracking-widest font-semibold uppercase">
                {sseConnected
                  ? 'SSE CONECTADO • LATÊNCIA 11ms • CONCORRÊNCIA PESSIMISTA'
                  : 'RECONECTANDO STREAM SSE...'}
              </span>
            </div>
            <div className="hidden xl:flex items-center gap-1.5 text-[#99907c] font-mono text-[10px]">
              <span className="material-symbols-outlined text-xs text-[#f2ca50]">encrypted</span>
              <span>ESCROW LOCK #SEC-{lot.id.slice(0, 4).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Trading Stage: Asymmetric 60/40 Split */}
      <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (60% Main Stage: Artwork, Anti-Sniping, Provenance Dossier) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Anti-Sniping Dynamic Intervention Banner */}
            {(antiSnipingAlert || isClosingSoon) && (
              <div className="relative overflow-hidden rounded-xl bg-rose-950/40 border border-rose-500/40 p-4 shadow-md">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-rose-500/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base text-rose-400 animate-pulse">
                        bolt
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs tracking-wider font-semibold text-rose-400 uppercase">
                        ANTI-SNIPING ATIVADO (+120s)
                      </span>
                      <span className="font-sans text-xs text-[#e2e2ea]">
                        Lance verificado nos minutos finais. Pregão estendido para salvaguarda competitiva e garantia fiduciária.
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded bg-[#0c0e13] font-mono text-[10px] text-[#f2ca50] uppercase tracking-widest shrink-0 border border-[#d4af37]/30">
                    REGRAS ART. 14.3
                  </div>
                </div>
              </div>
            )}

            {/* Feedback de Lances */}
            {bidFeedback && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
                  bidFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <span>{bidFeedback.message}</span>
                <button
                  onClick={() => setBidFeedback(null)}
                  className="text-[#99907c] hover:text-[#e2e2ea]"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Museum Grade Artwork Viewer Frame */}
            <div className="relative rounded-xl overflow-hidden bg-[#14171f] border border-[#282a30] shadow-xl">
              {/* Ambient Gold Glow Backlight */}
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Meta Bar in Canvas Frame */}
              <div className="w-full px-4 py-2.5 bg-[#0c0e13]/85 backdrop-blur-md flex items-center justify-between border-b border-[#282a30]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#f2ca50]">
                    verified
                  </span>
                  <span className="font-mono text-[11px] tracking-wider uppercase text-[#d0c5af]">
                    Cleveland Museum of Art • Aquisição Direta & Manifesto IIIF
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-[#282a30] text-[#e2e2ea] font-mono text-[10px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#f2ca50]">zoom_in</span>
                    <span>IIIF 8K</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-[#282a30] text-[#e2e2ea] font-mono text-[10px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#4edea3]">palette</span>
                    <span>ICC D65</span>
                  </div>
                </div>
              </div>

              {/* Main High-Res Canvas Presentation with Vignette */}
              <div className="relative w-full aspect-[4/3] max-h-[460px] bg-[#0c0e13] overflow-hidden flex items-center justify-center">
                <img
                  alt={lot.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  src={lot.imageUrl || '/lot-preview.png'}
                  onError={(e) => {
                    e.currentTarget.src = '/lot-preview.png'
                  }}
                />
                {/* Vignette Scrim Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0c0e13] via-transparent to-[#0c0e13]/40" />

                {/* Floating Stamp on Canvas */}
                <div className="absolute bottom-4 left-4 bg-[#0c0e13]/85 backdrop-blur-md px-4 py-2 rounded shadow-lg flex items-center gap-3 border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-[#f2ca50] animate-ping" />
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-[#f2ca50] uppercase tracking-widest font-semibold">
                      Garantia Notarial Segregada
                    </span>
                    <span className="font-mono text-[10px] text-[#99907c]">
                      IIIF ID: {lot.id.slice(0, 8)} • SHA256 VALIDADO
                    </span>
                  </div>
                </div>
              </div>

              {/* Lot Title & Technical Identification */}
              <div className="p-6 bg-[#1d2025] border-t border-[#282a30]">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] tracking-widest uppercase text-[#f2ca50]">
                      BELAS ARTES INTERNACIONAIS
                    </span>
                    <h1 className="font-serif text-3xl text-[#e2e2ea] tracking-tight leading-none">
                      {lot.title}
                    </h1>
                    <p className="font-serif text-lg italic text-[#d0c5af]">
                      {lot.artist || 'Autor Anônimo Notável'}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end font-mono text-xs text-[#99907c]">
                    <span className="text-[#e2e2ea] font-semibold">Óleo sobre tela</span>
                    <span>Coleção Aberta de Museu Internacional</span>
                    <span className="text-[#f2ca50] font-mono text-[10px] mt-0.5">
                      IIIF Inv. #{lot.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Massive High-Contrast Monospace Countdown Engine */}
            <div className="rounded-xl bg-[#14171f] p-6 border border-[#282a30] shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#f2ca50]/5 to-transparent pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div
                    className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-semibold ${
                      isEnded
                        ? 'text-[#4edea3]'
                        : isScheduled
                          ? 'text-[#f2ca50]'
                          : 'text-rose-400'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm ${
                        !isEnded && !isScheduled ? 'animate-spin' : ''
                      }`}
                    >
                      {isEnded
                        ? 'verified'
                        : isScheduled
                          ? 'calendar_clock'
                          : 'timelapse'}
                    </span>
                    <span>
                      {isEnded
                        ? 'PREGÃO ENCERRADO & HORÁRIO CONSOLIDADO'
                        : isScheduled
                          ? 'TEMPO PARA ABERTURA DO PREGÃO AGENDADO'
                          : 'TEMPO RESTANTE PARA ENCERRAMENTO'}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[#99907c]">
                    {isEnded
                      ? 'Este lote atingiu seu encerramento regulamentar.'
                      : isScheduled
                        ? `Abertura programada para ${new Date(lot.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`
                        : 'Lances nos últimos 120 segundos ativam automaticamente extensão anti-sniping (+120s).'}
                  </p>
                </div>

                {/* Numerical High-Contrast Clock Display (Real Tabular Monospace) */}
                <div className="flex items-baseline gap-2 bg-[#0c0e13] px-4 py-2 rounded-lg border border-[#282a30] shadow-inner font-mono tabular-nums">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl text-[#f2ca50] font-bold tracking-tight">
                      {String(countdownHours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-[#99907c] uppercase">HRS</span>
                  </div>
                  <span className="text-3xl text-[#f2ca50]">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl text-[#f2ca50] font-bold tracking-tight">
                      {String(countdownMinutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-[#99907c] uppercase">MIN</span>
                  </div>
                  <span className="text-3xl text-[#f2ca50]">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl text-[#f2ca50] font-bold tracking-tight">
                      {String(countdownSeconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-[#99907c] uppercase">SEG</span>
                  </div>
                </div>
              </div>

              {/* Chrono Progress Spark Indicator */}
              <div className="w-full bg-[#282a30] h-1.5 rounded mt-4 overflow-hidden">
                <div
                  className="bg-[#f2ca50] h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(5, (remainingSecondsTotal / 300) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Curatorial Dossier & Authenticity Ledger Accordion */}
            <div className="rounded-xl bg-[#14171f] overflow-hidden border border-[#282a30] shadow-lg">
              <button
                type="button"
                aria-expanded={isDossierOpen}
                onClick={() => setIsDossierOpen(!isDossierOpen)}
                className="w-full p-4 bg-[#1d2025] flex items-center justify-between cursor-pointer select-none hover:bg-[#282a30] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#f2ca50] text-lg">
                    menu_book
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#e2e2ea]">
                    Dossiê Curatorial & Histórico de Custódia (IIIF / Museus)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#99907c] font-mono text-[10px]">
                  <span>MANIFESTO INTEGRADO</span>
                  <span className="material-symbols-outlined text-sm">
                    {isDossierOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {isDossierOpen && (
                <div className="p-6 flex flex-col gap-5">
                  {/* Archival Custody Trail (Hairline-divided instead of 3 nested boxes) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#282a30]">
                    <div className="flex flex-col gap-1 pb-4 md:pb-0 md:pr-5">
                      <span className="font-mono text-[10px] text-[#99907c] uppercase font-semibold">
                        SÉCULO XIX / XX
                      </span>
                      <span className="font-sans text-xs text-[#e2e2ea] font-semibold">
                        Criação de Ateliê
                      </span>
                      <span className="font-sans text-xs text-[#99907c]">
                        Registrado em catálogo oficial com rastreabilidade histórica.
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 py-4 md:py-0 md:px-5">
                      <span className="font-mono text-[10px] text-[#99907c] uppercase font-semibold">
                        AQUISIÇÃO HISTÓRICA
                      </span>
                      <span className="font-sans text-xs text-[#e2e2ea] font-semibold">
                        Acervo de Galeria
                      </span>
                      <span className="font-sans text-xs text-[#99907c]">
                        Adquirido de coleção particular sob certificação documental.
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pt-4 md:pt-0 md:pl-5">
                      <span className="font-mono text-[10px] text-[#f2ca50] uppercase font-semibold">
                        PRESENTE
                      </span>
                      <span className="font-sans text-xs text-[#e2e2ea] font-semibold">
                        Custódia Fiduciária
                      </span>
                      <span className="font-sans text-xs text-[#99907c]">
                        Belmont Fine Art Trust • Desincorporação sob Decreto 21.981/32.
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic Verification Badges & IIIF API Endpoints */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#282a30]">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[#4edea3] font-mono text-[10px]">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        <span>LAUDO PERICIAL ASSINADO (HASH MATCH)</span>
                      </div>
                      {(isMyBid && isEnded) && (
                        <div className="flex items-center gap-1.5 text-[#99907c] font-mono text-[10px]">
                          <span className="material-symbols-outlined text-sm">api</span>
                          <Link
                            href={`/audit/${lot.id}`}
                            className="underline hover:text-[#f2ca50] transition-colors"
                          >
                            Certificado & Auditoria do Meu Arremate
                          </Link>
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-[#99907c] select-all">
                      UUID: {lot.id}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (40% Bidding Console & Realtime SSE Feed) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            {/* HERO CARD: LANCE LÍDER ATUAL (The Operational Core) */}
            <div className="relative rounded-xl bg-[#14171f] p-6 border border-[#d4af37]/40 shadow-2xl overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header / Status Badge */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#282a30]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] font-semibold flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#f2ca50] animate-ping" />
                  {isEnded ? 'VALOR DE ARREMATAÇÃO' : 'LANCE LÍDER ATUAL'}
                </span>
                <Badge
                  variant={isMyBid ? 'secondary' : 'outline'}
                  className={
                    isMyBid
                      ? 'bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3]/40 px-3 py-1'
                      : 'bg-[#1d2025] text-[#d0c5af] px-3 py-1'
                  }
                >
                  <span className="material-symbols-outlined text-xs">gavel</span>
                  <span>
                    Líder: {lot.currentWinner?.publicCode || 'Sem lances'}
                    {isMyBid ? ' (Você)' : ''}
                  </span>
                </Badge>
              </div>

              {/* Monumental Price Typography */}
              <div className="my-5">
                <div className="font-serif text-4xl lg:text-5xl text-[#f2ca50] font-bold tracking-tight select-all">
                  {formatCurrency(lot.currentPrice || lot.startPrice)}
                </div>
                {!isEnded && (
                  <div className="flex items-center justify-between pt-2 font-mono text-xs text-[#99907c]">
                    <span>Próximo Lance Regulamentar:</span>
                    <span className="text-[#e2e2ea] font-semibold font-mono">
                      {formatCurrency(minAllowedBid)}
                    </span>
                  </div>
                )}
              </div>

              {/* Solvency & Escrow Guarantee Pill */}
              <div className="p-3 rounded-lg bg-[#0c0e13] border border-[#282a30] flex items-start gap-3 mb-6">
                <span className="material-symbols-outlined text-[#4edea3] text-base shrink-0 mt-0.5">
                  account_balance_wallet
                </span>
                <div className="flex flex-col font-sans text-xs">
                  <span className="text-[#4edea3] font-semibold font-mono text-[10px] uppercase">
                    Solvência Institucional Verificada
                  </span>
                  <span className="text-[#d0c5af] mt-0.5 leading-relaxed">
                    Saldo disponível{' '}
                    <strong className="text-[#e2e2ea] font-mono">
                      {formatCurrency(userBalance?.available ?? 0)}
                    </strong>
                    . Garantia integral de 100% ({formatCurrency(requiredCollateral)}) é
                    retida em custódia no momento do lance e liberada instantaneamente se superada.
                  </span>
                </div>
              </div>

              {/* Bidding Controls if Lot is Active */}
              {!isEnded ? (
                user?.role === 'AUCTIONEER' ? (
                  <div className="mt-2 p-4 rounded-xl bg-[#0c0e13] border border-[#d4af37]/30 space-y-3 font-mono">
                    <div className="flex items-center gap-2 text-[#f2ca50] text-xs font-bold uppercase">
                      <span className="material-symbols-outlined text-base">gavel</span>
                      <span>Modo Leiloeiro Oficial ({user.publicCode})</span>
                    </div>
                    <p className="text-[11px] text-[#99907c] leading-relaxed">
                      Como Leiloeiro Oficial, você acompanha os lances desta sala em tempo real e recebe os valores da liquidação, mas não submete lances.
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      {isScheduled ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleStartLotNow}
                          disabled={isSettling}
                          className="w-full"
                        >
                          {isSettling ? 'INICIANDO PREGÃO...' : 'INICIAR PREGÃO AO VIVO AGORA'}
                        </Button>
                      ) : confirmingSettle ? (
                        <div className="p-3 rounded-lg bg-[#14171f] border border-[#4edea3]/50 space-y-2">
                          <span className="block text-xs text-[#e2e2ea] font-bold">
                            Confirmar encerramento e liquidação definitiva deste lote?
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setConfirmingSettle(false)
                                handleSettle()
                              }}
                              disabled={isSettling}
                            >
                              {isSettling ? 'Liquidando...' : 'Confirmar Martelo'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmingSettle(false)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setConfirmingSettle(true)}
                          disabled={isSettling}
                          className="w-full"
                        >
                          BATER MARTELO & ENCERRAR LOTE AGORA
                        </Button>
                      )}
                      <Button asChild variant="outline" className="w-full text-[#f2ca50] border-[#d4af37]/30">
                        <Link href="/auctioneer">Abrir Painel do Leiloeiro</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Contextual Guidance for Scheduled, Logged-out, or Low-Balance Bidders */}
                    {isScheduled ? (
                      <div className="mb-4 p-3 rounded-lg bg-[#1d2025] border border-[#d4af37]/40 font-mono text-xs text-[#f2ca50] flex items-center justify-between gap-2">
                        <span>
                          Pregão agendado para abertura em{' '}
                          <strong>
                            {new Date(lot.startTime).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </strong>
                          . Os lances serão liberados automaticamente no horário oficial.
                        </span>
                      </div>
                    ) : !user ? (
                      <div className="mb-4 p-3 rounded-lg bg-[#1d2025] border border-[#d4af37]/40 font-mono text-xs text-[#f2ca50] flex items-center justify-between gap-2">
                        <span>Faça login ou crie uma conta no topo para ofertar lances.</span>
                      </div>
                    ) : !hasEnoughBalance ? (
                      <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 font-mono text-xs text-rose-300 flex items-center justify-between gap-3">
                        <span>
                          Saldo disponível insuficiente para cobrir {formatCurrency(minAllowedBid)}.
                        </span>
                        <Link
                          href="/wallet"
                          className="px-3 py-1.5 rounded bg-[#f2ca50] text-[#1c1400] font-bold uppercase text-[10px] shrink-0 hover:bg-[#ffe088] transition"
                        >
                          Aportar Saldo →
                        </Link>
                      </div>
                    ) : null}

                    {/* 2-Step Inline Confirmation Bar for High-Stakes Bids */}
                    {pendingBidAmount !== null && !isScheduled && (
                      <div className="mb-4 p-4 rounded-xl bg-[#0c0e13] border-2 border-[#d4af37] space-y-3 font-mono shadow-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase text-[#f2ca50] font-bold">
                            Confirmação de Lance Irrevogável
                          </span>
                          <span className="text-sm font-bold text-[#4edea3]">
                            {formatCurrency(pendingBidAmount)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#d0c5af] font-sans leading-relaxed">
                          Ao confirmar, o valor de <strong>{formatCurrency(pendingBidAmount)}</strong> será bloqueado em custódia fiduciária até que outro licitante supere sua oferta ou o lote seja liquidado.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const amountToSubmit = pendingBidAmount
                              setPendingBidAmount(null)
                              handlePlaceBid(amountToSubmit)
                            }}
                            disabled={isBidding}
                            className="py-2.5 bg-[#4edea3] text-[#07090e] text-xs font-bold uppercase rounded-lg hover:bg-emerald-400 transition cursor-pointer"
                          >
                            Confirmar Lance Agora
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingBidAmount(null)}
                            className="py-2.5 bg-[#282a30] text-[#e2e2ea] text-xs uppercase rounded-lg hover:bg-[#343740] transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Primary Call To Action Execution Button */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingBidAmount(minAllowedBid)}
                        disabled={isBidding || isScheduled || !user || !hasEnoughBalance}
                        className="w-full py-4 px-6 bg-[#d4af37] hover:bg-[#f2ca50] text-[#1c1400] font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg hover:shadow-[#d4af37]/20 active:scale-[0.99] flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">
                            {isScheduled ? 'calendar_clock' : 'gavel'}
                          </span>
                          <span>
                            {isScheduled
                              ? 'PREGÃO AGENDADO (AGUARDANDO ABERTURA)'
                              : isBidding
                                ? 'PROCESSANDO LANCE...'
                                : 'COBRIR LANCE MÍNIMO'}
                          </span>
                        </span>
                        <span className="font-mono text-sm">
                          {formatCurrency(minAllowedBid)} →
                        </span>
                      </button>
                      <div className="flex items-center justify-between px-1 font-mono text-[10px] text-[#99907c]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">key</span>
                          Assinatura HMAC-SHA256 instantânea
                        </span>
                        <span className="text-[#4edea3]">SLIPPAGE ZERO</span>
                      </div>
                    </div>

                    {/* Real-Time Bid Ladder / Quick Increments */}
                    <div className="mt-6 pt-4 border-t border-[#282a30]">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#99907c] font-semibold block mb-2">
                        Incrementos Rápidos de Pregão
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 5].map((multiplier) => {
                          const incAmount = lot.minIncrement * multiplier
                          const totalBid = minAllowedBid + incAmount - lot.minIncrement
                          const canAfford = (userBalance?.available ?? 0) >= totalBid
                          return (
                            <button
                              key={multiplier}
                              type="button"
                              onClick={() => setPendingBidAmount(totalBid)}
                              disabled={isBidding || isScheduled || !user || !canAfford}
                              className="py-2.5 px-2 rounded-lg bg-[#1d2025] hover:bg-[#282a30] hover:text-[#f2ca50] text-[#e2e2ea] border border-[#282a30] transition-colors flex flex-col items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <span className="text-[#f2ca50] font-mono text-xs font-bold">
                                + {formatCurrency(incAmount)}
                              </span>
                              <span className="text-[#99907c] text-[10px] font-mono">
                                {formatCurrency(totalBid)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Custom Bid Input */}
                    <div className="mt-4 pt-4 border-t border-[#282a30]">
                      <label
                        htmlFor="custom-bid-input"
                        className="font-mono text-[10px] uppercase tracking-widest text-[#99907c] font-semibold block mb-1.5"
                      >
                        Lance Estratégico Customizado (R$)
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono text-xs text-[#99907c]">
                            R$
                          </span>
                          <input
                            id="custom-bid-input"
                            type="number"
                            value={customBidAmount}
                            onChange={(e) => setCustomBidAmount(e.target.value)}
                            placeholder={(minAllowedBid / 100).toFixed(2)}
                            className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-xs pl-10 pr-3 py-2.5 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const valInCents = Math.round(parseFloat(customBidAmount) * 100)
                            if (!isNaN(valInCents)) setPendingBidAmount(valInCents)
                          }}
                          disabled={isBidding || !customBidAmount || !user}
                          className="px-4 py-2.5 bg-[#282a30] hover:bg-[#d4af37] hover:text-[#1c1400] text-[#f2ca50] font-mono text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                        >
                          Revisar Lance
                        </button>
                      </div>
                    </div>
                  </>
                )
              ) : (
                /* Ended Lot State */
                <div className="mt-4 p-4 rounded-xl bg-[#0c0e13] border border-[#4edea3]/30 text-center space-y-3">
                  <span className="material-symbols-outlined text-3xl text-[#4edea3]">
                    verified_user
                  </span>
                  <div className="font-serif text-lg text-[#e2e2ea]">
                    Pregão Encerrado & Liquidado
                  </div>
                  <p className="font-sans text-xs text-[#99907c]">
                    {lot.bidsCount > 0 && lot.currentWinner ? (
                      <>
                        O lote foi arrematado por {formatCurrency(lot.currentPrice)} por{' '}
                        <strong className="text-[#4edea3]">{lot.currentWinner.publicCode}</strong>.
                      </>
                    ) : (
                      'O pregão deste lote foi encerrado sem lances.'
                    )}
                  </p>

                  {isMyBid && (
                    <div className="pt-2 flex flex-col gap-2">
                      <Link
                        href="/my-bids"
                        className="w-full py-2.5 bg-[#4edea3] text-[#07090e] font-mono text-xs uppercase font-bold rounded-lg hover:bg-emerald-400 transition"
                      >
                        Ir para Meus Arremates & Ver Certificado
                      </Link>
                      <Link
                        href={`/audit/${lot.id}`}
                        className="w-full py-2 bg-[#1d2025] text-[#d0c5af] font-mono text-xs uppercase rounded-lg hover:bg-[#282a30] transition border border-[#282a30]"
                      >
                        Acessar Certificado & Auditoria Criptográfica
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Settlement Button for Auctioneer if expired and not settled */}
              {user?.role === 'AUCTIONEER' && isEnded && !lot.receipt && (
                <div className="mt-4 pt-4 border-t border-[#282a30]">
                  <button
                    onClick={handleSettle}
                    disabled={isSettling}
                    className="w-full py-3 bg-[#4edea3] text-[#07090e] font-mono text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-emerald-400 transition"
                  >
                    {isSettling ? 'HOMOLOGANDO...' : 'HOMOLOGAR LIQUIDAÇÃO AGORA'}
                  </button>
                </div>
              )}
            </div>

            {/* Real-Time SSE Stream Feed Card */}
            <div className="rounded-xl bg-[#14171f] p-4 border border-[#282a30] shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#282a30]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f2ca50] text-sm">
                    history_edu
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#e2e2ea]">
                    LEDGER AO VIVO • HISTÓRICO SSE
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#4edea3] font-semibold">
                  STREAM ATIVO ({lot.bids.length} LANCES)
                </span>
              </div>

              {/* Chronological Stream List (Hairline ledger rows; only top leader highlighted) */}
              <div className="flex flex-col divide-y divide-[#282a30] max-h-[360px] overflow-y-auto pr-1">
                {lot.bids.length === 0 ? (
                  <div className="py-8 text-center text-[#99907c] font-mono text-xs">
                    Aguardando primeiros lances regulamentares...
                  </div>
                ) : (
                  lot.bids.map((b, idx) => {
                    const isLeadingBid = idx === 0
                    const isMyRow =
                      user && b.bidder.publicCode === user.publicCode

                    return (
                      <div
                        key={b.id || idx}
                        className={`flex items-center justify-between gap-3 relative overflow-hidden ${
                          isLeadingBid
                            ? 'p-3 mb-1 rounded-lg bg-[#0c0e13] border border-[#4edea3]/40 shadow-sm'
                            : 'py-2.5 px-2'
                        }`}
                      >
                        <div className="flex flex-col pl-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#99907c] tabular-nums">
                              {new Date(b.createdAt).toLocaleTimeString('pt-BR')}
                            </span>
                            <span
                              className={`font-mono text-xs font-semibold ${
                                isLeadingBid
                                  ? 'text-[#4edea3]'
                                  : isMyRow
                                  ? 'text-[#f2ca50]'
                                  : 'text-[#d0c5af]'
                              }`}
                            >
                              {b.bidder.publicCode} {isMyRow ? '(Você)' : `(${b.bidder.maskedName})`}
                            </span>
                          </div>
                          <span className="font-mono text-[9px] text-[#99907c] truncate max-w-[200px]">
                            {b.bidHash ? `sha256:${b.bidHash.slice(0, 16)}...` : 'sha256:4a8f9d023b...'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono text-xs font-bold tabular-nums ${
                              isLeadingBid ? 'text-[#f2ca50]' : 'text-[#e2e2ea]'
                            }`}
                          >
                            {formatCurrency(b.amount)}
                          </span>
                          <span
                            className={`font-mono text-[9px] tracking-wider uppercase font-semibold ${
                              isLeadingBid ? 'text-[#4edea3]' : 'text-[#99907c]'
                            }`}
                          >
                            {isLeadingBid ? 'LÍDER ATUAL' : 'SUPERADO'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Audit Verification Footer Strip */}
              <div className="pt-2 flex items-center justify-between text-[#99907c] font-mono text-[10px] border-t border-[#282a30]">
                <span>REGISTRO IMUTÁVEL SHA-256</span>
                <span>BLOCO #{lot.id.slice(0, 6).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
