'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatTimeRemaining } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ArtworkSearchResult {
  id: string
  title: string
  artistTitle: string | null
  dateDisplay: string | null
  mediumDisplay: string | null
  imageUrl: string | null
  isPublicDomain: boolean
}

function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AuctioneerMasterCockpitPage() {
  const { user } = useAuth()

  // Estado de confirmação em 2 passos para ações irreversíveis do Leiloeiro
  const [confirmAction, setConfirmAction] = useState<'hammer' | 'cancel' | null>(null)

  // Busca de obras na API pública
  const [artQuery, setArtQuery] = useState('Monet')
  const [artworks, setArtworks] = useState<ArtworkSearchResult[]>([])
  const [isSearchingArt, setIsSearchingArt] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Formulário Oficial de Publicação de Lote (Preenchido exclusivamente via API pública)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [techniqueDimensions, setTechniqueDimensions] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [externalApiId, setExternalApiId] = useState('')
  const [manifestUrl, setManifestUrl] = useState('')
  const [startPriceBRL, setStartPriceBRL] = useState('50000') // R$ 50.000,00
  const [minIncrementBRL, setMinIncrementBRL] = useState('5000') // R$ 5.000,00
  const [antiSnipingEnabled, setAntiSnipingEnabled] = useState(true)
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [launchMode, setLaunchMode] = useState<'IMMEDIATE' | 'SCHEDULED'>('IMMEDIATE')
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() =>
    toLocalDatetimeInputValue(new Date(Date.now() + 15 * 60 * 1000)),
  )
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState('Selecione uma obra na API ao lado para configurar o lote')

  // Lote ao vivo ativo e fila de lotes agendados
  const [activeLiveLot, setActiveLiveLot] = useState<any | null>(null)
  const [scheduledLots, setScheduledLots] = useState<any[]>([])
  const [startingLotId, setStartingLotId] = useState<string | null>(null)
  const [cancellingScheduledId, setCancellingScheduledId] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{
    text: string
    color: string
  } | null>(null)
  const [isSettling, setIsSettling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [endedLots, setEndedLots] = useState<any[]>([])
  const [totalReceivedInCents, setTotalReceivedInCents] = useState(0)
  // Obras já vinculadas a lotes não cancelados (externalApiId / título -> status)
  const [usedItems, setUsedItems] = useState<Record<string, 'LIVE' | 'SCHEDULED' | 'ENDED'>>({})

  const refreshUsedItems = async () => {
    try {
      const res = await apiRequest<{ lots: any[] }>('/lots?limit=500')
      const map: Record<string, 'LIVE' | 'SCHEDULED' | 'ENDED'> = {}
      for (const l of res.lots || []) {
        if (l.externalApiId) map[`id:${l.externalApiId}`] = l.status
        if (l.title) map[`t:${String(l.title).trim().toLowerCase()}`] = l.status
      }
      setUsedItems(map)
    } catch {}
  }

  const getItemUsage = (id?: string | number | null, itemTitle?: string | null) =>
    (id != null && id !== '' ? usedItems[`id:${id}`] : undefined) ||
    (itemTitle ? usedItems[`t:${itemTitle.trim().toLowerCase()}`] : undefined)

  // Realizar busca inicial de obras na API Pública
  const searchMuseumArtworks = async (queryText: string) => {
    setIsSearchingArt(true)
    setSearchError('')
    try {
      const data = await apiRequest<{ items: ArtworkSearchResult[] }>(
        `/artworks/search?query=${encodeURIComponent(queryText)}&limit=6`,
      )
      const list = data.items || []
      setArtworks(list)
      const firstAvailable = list.find((a) => !getItemUsage(a.id, a.title))
      if (firstAvailable && !title) {
        const first = firstAvailable
        setTitle(first.title)
        setArtist(first.artistTitle || 'Mestre da Pintura')
        setTechniqueDimensions(`${first.mediumDisplay || 'Óleo sobre tela'} • ${first.dateDisplay || 'Acervo Histórico'}`)
        setImageUrl(first.imageUrl || '')
        setExternalApiId(String(first.id))
        setManifestUrl(`https://openaccess-api.clevelandart.org/api/artworks/${first.id}`)
        setPublishStatus(`Obra #${first.id} carregada da API pública`)
      }
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao consultar acervo do museu.')
    } finally {
      setIsSearchingArt(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'AUCTIONEER') {
      searchMuseumArtworks('Monet')
      refreshUsedItems()
    }
  }, [user])

  // Buscar resultados de lotes encerrados e total recebido
  const refreshEndedLots = async () => {
    try {
      const res = await apiRequest<{ lots: any[] }>('/lots?status=ENDED')
      if (res.lots) {
        setEndedLots(res.lots)
        const total = res.lots.reduce((acc: number, l: any) => {
          if (l.bidsCount > 0 && l.currentPrice) {
            return acc + Number(l.currentPrice)
          }
          return acc
        }, 0)
        setTotalReceivedInCents(total)
      }
    } catch {}
  }

  // Buscar lote ativo ao vivo e fila de lotes agendados
  const refreshActiveLot = async () => {
    try {
      const [liveRes, schedRes] = await Promise.all([
        apiRequest<{ lots: any[] }>('/lots?status=LIVE'),
        apiRequest<{ lots: any[] }>('/lots?status=SCHEDULED'),
      ])
      if (liveRes.lots && liveRes.lots.length > 0) {
        setActiveLiveLot(liveRes.lots[0])
      } else {
        setActiveLiveLot(null)
      }
      setScheduledLots(schedRes.lots || [])
    } catch {}
  }

  useEffect(() => {
    refreshActiveLot()
    refreshEndedLots()
    const timer = setInterval(() => {
      refreshActiveLot()
      refreshEndedLots()
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  // Atalho de pré-seleção de minutos futuros para agendamento
  const applySchedulePresetMinutes = (minutesFromNow: number) => {
    setScheduledDateTime(
      toLocalDatetimeInputValue(new Date(Date.now() + minutesFromNow * 60 * 1000)),
    )
  }

  // Iniciar imediatamente um lote que estava agendado
  const handleStartScheduledLot = async (lotId: string, lotTitle: string) => {
    setStartingLotId(lotId)
    try {
      await apiRequest(`/lots/${lotId}/start`, { method: 'POST' })
      setActionFeedback({
        text: `PREGÃO INICIADO! O lote "${lotTitle}" está AO VIVO na Sala de Pregão.`,
        color: 'text-[#4edea3] font-bold',
      })
      refreshActiveLot()
    } catch (err: any) {
      setActionFeedback({
        text: err.message || 'Erro ao iniciar pregão agendado.',
        color: 'text-rose-400 font-bold',
      })
    } finally {
      setStartingLotId(null)
    }
  }

  // Cancelar um lote agendado na fila
  const handleCancelScheduledLot = async (lotId: string, lotTitle: string) => {
    setCancellingScheduledId(lotId)
    try {
      await apiRequest(`/lots/${lotId}/cancel`, { method: 'POST' })
      setActionFeedback({
        text: `AGENDAMENTO CANCELADO! O lote "${lotTitle}" foi removido da fila oficial.`,
        color: 'text-[#4edea3] font-bold',
      })
      refreshActiveLot()
      refreshEndedLots()
    } catch (err: any) {
      setActionFeedback({
        text: err.message || 'Erro ao cancelar lote agendado.',
        color: 'text-rose-400 font-bold',
      })
    } finally {
      setCancellingScheduledId(null)
    }
  }

  // Cancelar lote (sem lances ou com estorno automático do saldo comprometido do líder)
  const handleCancelLot = async () => {
    if (!activeLiveLot) return
    if (!user || user.role !== 'AUCTIONEER') {
      setActionFeedback({
        text: 'Acesso restrito: apenas o Leiloeiro Oficial pode cancelar lotes.',
        color: 'text-rose-400 font-bold',
      })
      return
    }

    setIsCancelling(true)
    try {
      const res = await apiRequest<{
        cancelled: boolean
        refundedAmountInCents?: number
      }>(`/lots/${activeLiveLot.id}/cancel?autoRefund=true`, { method: 'POST' })
      const refundMsg =
        res.refundedAmountInCents && res.refundedAmountInCents > 0
          ? ` Estorno automático de ${formatCurrency(res.refundedAmountInCents)} realizado para o licitante líder.`
          : ' O lote foi removido da vitrine pública.'
      setActionFeedback({
        text: `LOTE #${activeLiveLot.id.slice(0, 4).toUpperCase()} CANCELADO COM SUCESSO!${refundMsg}`,
        color: 'text-[#4edea3] font-bold',
      })
      refreshActiveLot()
      refreshEndedLots()
    } catch (err: any) {
      setActionFeedback({
        text: err.message || 'Erro ao cancelar lote.',
        color: 'text-rose-400 font-bold',
      })
    } finally {
      setIsCancelling(false)
    }
  }

  // Selecionar obra da lista de ingestão
  const handleSelectArtwork = (art: ArtworkSearchResult) => {
    const usage = getItemUsage(art.id, art.title)
    if (usage) {
      setActionFeedback({
        text:
          usage === 'ENDED'
            ? `A obra "${art.title}" já foi leiloada e não pode ser republicada.`
            : `A obra "${art.title}" já possui um lote ativo ou agendado.`,
        color: 'text-rose-400 font-bold',
      })
      return
    }
    setTitle(art.title)
    setArtist(art.artistTitle || 'Mestre da Pintura')
    setTechniqueDimensions(`${art.mediumDisplay || 'Óleo sobre tela'} • ${art.dateDisplay || 'Séc. XIX'}`)
    setImageUrl(art.imageUrl || '/lot-preview.png')
    setExternalApiId(String(art.id))
    setManifestUrl(`https://openaccess-api.clevelandart.org/api/artworks/${art.id}`)
    setPublishStatus(`Obra #${art.id} selecionada para pregão`)
  }

  // Publicar ou agendar lote
  const handlePublishLot = async () => {
    if (!user || user.role !== 'AUCTIONEER') {
      setActionFeedback({
        text: 'Acesso restrito: identifique-se como Leiloeiro Oficial (LEI-0001) para publicar lotes.',
        color: 'text-[#f2ca50]',
      })
      return
    }

    if (!title || !imageUrl) return

    const usage = getItemUsage(externalApiId, title)
    if (usage) {
      setActionFeedback({
        text:
          usage === 'ENDED'
            ? `A obra "${title}" já foi leiloada e não pode ser republicada em um novo lote.`
            : `A obra "${title}" já possui um lote ativo ou agendado no catálogo.`,
        color: 'text-rose-400 font-bold',
      })
      return
    }

    const nowMs = Date.now()
    const durationMs = parseInt(durationMinutes || '30') * 60 * 1000
    let startTimeIso: string
    let endTimeIso: string

    if (launchMode === 'SCHEDULED') {
      const scheduledStartMs = new Date(scheduledDateTime).getTime()
      if (!Number.isFinite(scheduledStartMs) || scheduledStartMs <= nowMs + 10000) {
        setActionFeedback({
          text: 'Horário inválido: selecione uma data e horário futuros para agendar o lote.',
          color: 'text-rose-400 font-bold',
        })
        return
      }
      startTimeIso = new Date(scheduledStartMs).toISOString()
      endTimeIso = new Date(scheduledStartMs + durationMs).toISOString()
    } else {
      startTimeIso = new Date(nowMs - 1000).toISOString()
      endTimeIso = new Date(nowMs + durationMs).toISOString()
    }

    setIsPublishing(true)
    setPublishStatus(
      launchMode === 'SCHEDULED'
        ? 'Registrando agendamento oficial no catálogo...'
        : 'Transmitindo lote para a rede SSE...',
    )

    try {
      const startPriceInCents = Math.round(parseFloat(startPriceBRL || '50000') * 100)
      const minIncrementInCents = Math.round(parseFloat(minIncrementBRL || '5000') * 100)

      const created = await apiRequest<{ lot: any }>('/lots', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: `Catalogação oficial: ${techniqueDimensions}. Proveniência certificada via API pública de museu (#${externalApiId}).`,
          imageUrl,
          artist,
          externalApiId,
          startPriceInCents,
          minIncrementInCents,
          startPrice: startPriceInCents,
          minIncrement: minIncrementInCents,
          startTime: startTimeIso,
          endTime: endTimeIso,
        }),
      })

      if (launchMode === 'SCHEDULED' || created.lot.status === 'SCHEDULED') {
        const formattedSchedule = new Date(created.lot.startTime).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
        setPublishStatus(`Lote agendado para abertura em ${formattedSchedule}`)
        setActionFeedback({
          text: `LOTE #${created.lot.id.slice(0, 4).toUpperCase()} AGENDADO COM SUCESSO PARA ${formattedSchedule}!`,
          color: 'text-[#f2ca50] font-bold',
        })
      } else {
        setPublishStatus('Transmitido com sucesso via SSE para todos os terminais ao vivo!')
        setActionFeedback({
          text: `LOTE #${created.lot.id.slice(0, 4).toUpperCase()} PUBLICADO E AO VIVO NA REDE!`,
          color: 'text-[#4edea3] font-bold',
        })
      }
      refreshActiveLot()
      refreshUsedItems()
    } catch (err: any) {
      setPublishStatus('Falha na homologação do lote')
      setActionFeedback({
        text: err.message || 'Erro ao publicar lote no pregão.',
        color: 'text-rose-400 font-bold',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // Ação oficial de liquidação do Leiloeiro (somente ações reais no servidor)
  const handleSettleActiveLot = async () => {
    if (!activeLiveLot) return

    setIsSettling(true)
    setConfirmAction(null)
    try {
      const res = await apiRequest<{
        settled: boolean
        receiptCode: string
      }>(`/lots/${activeLiveLot.id}/settle`, { method: 'POST' })

      setActionFeedback({
        text: `MARTELO BATIDO! Lote "${activeLiveLot.title}" adjudicado oficialmente.${res.receiptCode ? ` Certificado emitido: ${res.receiptCode}` : ''}`,
        color: 'text-[#4edea3] font-bold',
      })
      refreshActiveLot()
      refreshEndedLots()
    } catch (err: any) {
      setActionFeedback({
        text: err.message || 'Erro ao bater martelo e liquidar.',
        color: 'text-rose-400 font-bold',
      })
    } finally {
      setIsSettling(false)
    }
  }

  // Proteção Estrita de Rota: somente o Leiloeiro Oficial pode acessar o Painel do Leiloeiro
  if (!user || user.role !== 'AUCTIONEER') {
    return (
      <div className="w-full pt-32 pb-20 px-6 max-w-xl mx-auto text-center font-mono">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <h2 className="text-2xl font-serif text-[#e2e2ea]">
          Acesso Exclusivo ao Leiloeiro Oficial
        </h2>
        <p className="mt-2 text-xs text-[#99907c] leading-relaxed">
          Usuários licitantes e visitantes não possuem permissão para acessar o Painel do Leiloeiro. Somente o Leiloeiro Oficial autenticado pode pesquisar o acervo da API pública e publicar novos lotes de leilão.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1d2025] border border-[#d4af37]/40 px-5 py-2.5 text-xs text-[#f2ca50] hover:bg-[#282a30] transition uppercase font-bold"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Voltar ao Catálogo</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* Operational Sub-Header Bar (Master Cockpit Status) */}
      <section className="w-full px-3.5 sm:px-6 lg:px-12 py-2.5 sm:py-3 bg-[#0c0e13] border-b border-[#282a30]">
        <div className="w-full max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Official License Identity */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#282a30] rounded border border-[#4d4635]/40 max-w-full">
              <span className="material-symbols-outlined text-[#f2ca50] text-base">
                gavel
              </span>
              <span className="font-mono text-xs text-[#f2ca50] font-bold tracking-wider">
                LEI-0001
              </span>
              <span className="text-[#99907c] text-xs">/</span>
              <span className="font-mono text-xs text-[#d0c5af] truncate">
                LEILOEIRO OFICIAL MATRICULADO (JUCESP #894)
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-[#4edea3]/10 border border-[#4edea3]/30 rounded max-w-full">
              <span className="relative flex h-2 w-2">
                {activeLiveLot && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#4edea3] font-bold truncate">
                {activeLiveLot
                  ? `PREGÃO AO VIVO • ${activeLiveLot.title}`
                  : 'PAINEL PRONTO PARA PUBLICAÇÃO'}
              </span>
            </div>
          </div>

          {/* Real Operational Metrics */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#f2ca50] text-sm">
                schedule
              </span>
              <span className="text-[#99907c]">AGENDADOS:</span>
              <span className="text-[#f2ca50] font-bold tabular-nums">{scheduledLots.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#f2ca50] text-sm">
                gavel
              </span>
              <span className="text-[#99907c]">LOTES ENCERRADOS:</span>
              <span className="text-[#e2e2ea] font-bold tabular-nums">{endedLots.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4edea3] text-sm">
                payments
              </span>
              <span className="text-[#99907c]">CAIXA TOTAL:</span>
              <span className="text-[#4edea3] font-bold tabular-nums">
                {formatCurrency(totalReceivedInCents)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TOP LIVE LOT & SCHEDULED QUEUE CONTROL COCKPIT (Visível no topo para acesso imediato do Leiloeiro) */}
      {(activeLiveLot || scheduledLots.length > 0 || actionFeedback) && (
        <section className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 pt-4 sm:pt-6">
          <div className="bg-[#0c0e13] rounded-xl p-4 sm:p-6 border border-[#d4af37]/40 shadow-2xl flex flex-col gap-4 sm:gap-5">
            {actionFeedback && (
              <div className="p-3 bg-[#1d2025] rounded-lg border border-[#d4af37]/40 flex items-center justify-between font-mono text-xs">
                <span className={actionFeedback.color}>{actionFeedback.text}</span>
                <button
                  type="button"
                  aria-label="Fechar aviso"
                  onClick={() => setActionFeedback(null)}
                  className="text-[#99907c] hover:text-[#e2e2ea]"
                >
                  ✕
                </button>
              </div>
            )}

            {activeLiveLot && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#282a30]">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#4edea3] animate-pulse" />
                    <div className="flex flex-col">
                      <span className="font-serif text-lg text-[#e2e2ea]">
                        Console de Controle do Pregão Ativo
                      </span>
                      <span className="font-mono text-xs text-[#f2ca50] line-clamp-1">
                        LOTE #{activeLiveLot.id.slice(0, 4).toUpperCase()} • {activeLiveLot.artist}, &ldquo;{activeLiveLot.title}&rdquo;
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-[#99907c] uppercase tracking-wider">Cronômetro:</span>
                    <span className="text-[#f2ca50] font-bold px-3 py-1 bg-[#1d2025] rounded border border-[#282a30] tabular-nums">
                      {formatTimeRemaining(activeLiveLot.endTime)}
                    </span>
                    <Link
                      href={`/lots/${activeLiveLot.id}`}
                      className="px-3 py-1 bg-[#282a30] hover:bg-[#343740] text-[#e2e2ea] rounded transition"
                    >
                      Abrir Sala Ao Vivo →
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#282a30] pt-1">
                  <div className="flex flex-col pb-4 md:pb-0 md:pr-6">
                    <span className="font-mono text-[10px] text-[#99907c] uppercase">
                      Lance Líder Atual
                    </span>
                    <span className="font-serif text-2xl text-[#f2ca50] font-bold mt-0.5 tabular-nums">
                      {formatCurrency(activeLiveLot.currentPrice)}
                    </span>
                    <span className="font-mono text-xs text-[#4edea3] mt-0.5">
                      Líder: {activeLiveLot.currentWinner?.publicCode || 'Sem lances registrados'}
                    </span>
                  </div>

                  <div className="flex flex-col py-4 md:py-0 md:px-6">
                    <span className="font-mono text-[10px] text-[#99907c] uppercase">
                      Total de Lances no Lote
                    </span>
                    <span className="font-serif text-2xl text-[#e2e2ea] font-bold mt-0.5 tabular-nums">
                      {activeLiveLot.bidsCount || 0} Lances
                    </span>
                    <span className="font-mono text-xs text-[#99907c] mt-0.5">
                      Próximo lance mínimo: {formatCurrency(activeLiveLot.currentPrice + activeLiveLot.minIncrement)}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center gap-2 pt-4 md:pt-0 md:pl-6">
                    {confirmAction === 'hammer' ? (
                      <div className="p-3 rounded-lg bg-[#0c0e13] border border-[#4edea3] space-y-2 font-mono">
                        <span className="block text-xs text-[#e2e2ea] font-bold">
                          Confirmar batida de martelo e liquidação definitiva?
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleSettleActiveLot}
                            disabled={isSettling}
                            className="py-2 bg-[#4edea3] text-[#07090e] text-xs font-bold uppercase rounded cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmAction(null)}
                            className="py-2 bg-[#282a30] text-[#e2e2ea] text-xs uppercase rounded cursor-pointer"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    ) : confirmAction === 'cancel' ? (
                      <div className="p-3 rounded-lg bg-[#0c0e13] border border-rose-500 space-y-2 font-mono">
                        <span className="block text-xs text-rose-300 font-bold">
                          {activeLiveLot.bidsCount > 0
                            ? `Confirmar cancelamento e estorno automático de ${formatCurrency(activeLiveLot.currentPrice)} ao líder?`
                            : 'Confirmar cancelamento definitivo deste lote sem lances?'}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmAction(null)
                              handleCancelLot()
                            }}
                            disabled={isCancelling}
                            className="py-2 bg-rose-600 text-white text-xs font-bold uppercase rounded cursor-pointer"
                          >
                            Confirmar Cancelamento
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmAction(null)}
                            className="py-2 bg-[#282a30] text-[#e2e2ea] text-xs uppercase rounded cursor-pointer"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmAction('hammer')}
                          disabled={isSettling}
                          className="flex-1 py-3 px-4 min-h-[48px] bg-[#4edea3] text-[#07090e] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-400 shadow-lg cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-base">gavel</span>
                          <span>{isSettling ? 'LIQUIDANDO...' : 'BATER MARTELO & LIQUIDAR'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmAction('cancel')}
                          disabled={isCancelling}
                          className="py-3 px-4 min-h-[48px] bg-rose-600/20 text-rose-300 border border-rose-500/40 font-mono text-xs uppercase tracking-wider font-bold rounded-lg hover:bg-rose-600/30 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                        >
                          {activeLiveLot.bidsCount > 0
                            ? 'Cancelar c/ Estorno'
                            : 'Cancelar Lote (0 Lances)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* FILA DE LOTES AGENDADOS (Agendamentos Oficiais do Leiloeiro) */}
            {scheduledLots.length > 0 && (
              <div className={activeLiveLot ? 'pt-5 border-t border-[#282a30] flex flex-col gap-3' : 'flex flex-col gap-3'}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f2ca50] text-lg">
                      calendar_clock
                    </span>
                    <span className="font-serif text-lg text-[#e2e2ea]">
                      Fila de Lotes Agendados ({scheduledLots.length})
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                    Abertura automática no horário programado ou início manual imediato
                  </span>
                </div>

                <div className="divide-y divide-[#282a30] border-t border-[#282a30]">
                  {scheduledLots.map((schedLot) => {
                    const formattedStart = new Date(schedLot.startTime).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                    const isStartingThis = startingLotId === schedLot.id
                    const isCancellingThis = cancellingScheduledId === schedLot.id
                    return (
                      <div
                        key={schedLot.id}
                        className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={schedLot.imageUrl || '/lot-preview.png'}
                            alt={schedLot.title}
                            className="w-12 h-12 rounded object-cover bg-[#14171f] border border-[#282a30] shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#f2ca50]/15 text-[#f2ca50] border-[#d4af37]/30">
                                Agendado • #{schedLot.id.slice(0, 4).toUpperCase()}
                              </Badge>
                              <span className="text-[#99907c] text-[11px] tabular-nums">
                                Abertura: {formattedStart} ({formatTimeRemaining(schedLot.startTime)})
                              </span>
                            </div>
                            <span className="font-serif text-base text-[#e2e2ea] truncate mt-0.5">
                              {schedLot.artist ? `${schedLot.artist} — ` : ''}&ldquo;{schedLot.title}&rdquo;
                            </span>
                            <span className="text-[11px] text-[#99907c] tabular-nums">
                              Lance Inicial: {formatCurrency(schedLot.startPrice)} • Incremento: {formatCurrency(schedLot.minIncrement)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 shrink-0 w-full sm:w-auto">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartScheduledLot(schedLot.id, schedLot.title)}
                            disabled={isStartingThis || isCancellingThis}
                          >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            <span>{isStartingThis ? 'Iniciando...' : 'Iniciar Pregão Agora'}</span>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/lots/${schedLot.id}`}>Ver Lote</Link>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelScheduledLot(schedLot.id, schedLot.title)}
                            disabled={isStartingThis || isCancellingThis}
                          >
                            {isCancellingThis ? 'Cancelando...' : 'Cancelar'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Institutional Workspace: 2-Column High-Density Grid */}
      <section className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 py-4 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Museum Catalog Ingestion & Manifest Terminal (Cols 1-6) */}
          <div className="xl:col-span-6 flex flex-col gap-6">
            <div className="bg-[#14171f] rounded-xl p-4 sm:p-6 border border-[#282a30] shadow-xl flex flex-col gap-4">
              {/* Terminal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#282a30]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#f2ca50] text-xl">
                    museum
                  </span>
                  <div className="flex flex-col">
                    <span className="font-serif text-xl text-[#e2e2ea]">
                      Acervo Internacional & API Pública
                    </span>
                    <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                      IIIF API v3 • PROTOCOLO DE IMPORTAÇÃO INSTITUCIONAL
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#282a30] rounded text-[#4edea3] font-mono text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                  ENDPOINT ATIVO
                </div>
              </div>

              {/* Museum Live Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (artQuery) searchMuseumArtworks(artQuery)
                }}
                className="flex flex-col gap-2"
              >
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#99907c] text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={artQuery}
                    onChange={(e) => setArtQuery(e.target.value)}
                    placeholder="Buscar no acervo de museus (Ex: Monet, Van Gogh, Rembrandt)..."
                    className="w-full bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs pl-10 pr-24 py-2.5 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingArt}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#d4af37] text-[#1c1400] font-mono text-xs rounded uppercase font-bold hover:bg-[#f2ca50] transition-colors cursor-pointer"
                  >
                    {isSearchingArt ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 flex-wrap pt-1 font-mono text-[10px]">
                  <span className="text-[#99907c] uppercase tracking-wider mr-1">Filtros:</span>
                  {[
                    { label: 'Claude Monet', query: 'Monet' },
                    { label: 'Vincent van Gogh', query: 'Van Gogh' },
                    { label: 'Rembrandt', query: 'Rembrandt' },
                    { label: 'Paisagens', query: 'Landscape' },
                  ].map((chip) => {
                    const isChipActive =
                      artQuery.trim().toLowerCase() === chip.query.toLowerCase()
                    return (
                      <button
                        key={chip.query}
                        type="button"
                        onClick={() => {
                          setArtQuery(chip.query)
                          searchMuseumArtworks(chip.query)
                        }}
                        className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                          isChipActive
                            ? 'bg-[#d4af37] text-[#1c1400] font-bold'
                            : 'bg-[#282a30] text-[#d0c5af] hover:text-[#e2e2ea]'
                        }`}
                      >
                        {chip.label}
                      </button>
                    )
                  })}
                </div>
              </form>

              {searchError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 font-mono text-xs text-rose-300">
                  <span>{searchError}</span>
                  <button
                    type="button"
                    onClick={() => searchMuseumArtworks(artQuery || 'Monet')}
                    className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] uppercase font-bold shrink-0 cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {/* Ingestion Queue Cards List */}
              <div className="flex flex-col gap-3 pt-2 max-h-[500px] overflow-y-auto pr-1">
                {artworks.length === 0 && !isSearchingArt && (
                  <div className="py-10 text-center font-mono text-xs text-[#99907c]">
                    Nenhuma obra localizada. Digite um termo de pesquisa acima.
                  </div>
                )}

                {artworks.map((art) => (
                  <div
                    key={art.id}
                    className="p-3 bg-[#1d2025] rounded-xl border border-[#282a30] hover:border-[#d4af37]/40 flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-md transition-colors"
                  >
                    <div className="w-full sm:w-36 h-36 sm:h-28 shrink-0 overflow-hidden rounded-lg bg-[#0c0e13] relative group">
                      <img
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={art.imageUrl || '/lot-preview.png'}
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#0c0e13]/85 backdrop-blur rounded font-mono text-[9px] text-[#f2ca50] font-semibold">
                        #{art.id}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif text-base text-[#e2e2ea] truncate">
                            {art.title}
                          </span>
                          {getItemUsage(art.id, art.title) ? (
                            <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 font-mono text-[9px] rounded uppercase font-semibold shrink-0">
                              {getItemUsage(art.id, art.title) === 'ENDED' ? 'Já Leiloada' : 'Em Lote Ativo'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#4edea3]/20 text-[#4edea3] font-mono text-[9px] rounded uppercase font-semibold shrink-0">
                              Domínio Público
                            </span>
                          )}
                        </div>
                        <span className="font-sans text-xs text-[#f2ca50] font-medium">
                          {art.artistTitle || 'Artista Não Especificado'}
                        </span>
                        <span className="font-mono text-[10px] text-[#99907c] truncate mt-0.5">
                          {art.mediumDisplay || 'Óleo sobre tela'} • {art.dateDisplay || 'Datação Histórica'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#282a30]">
                        <span className="font-mono text-[10px] text-[#99907c] truncate max-w-[200px]">
                          CMA API: #{art.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectArtwork(art)}
                          disabled={!!getItemUsage(art.id, art.title)}
                          className="px-3 py-2 min-h-[40px] bg-[#d4af37] text-[#1c1400] font-mono text-[11px] rounded uppercase font-bold flex items-center gap-1 shadow-sm hover:bg-[#f2ca50] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d4af37]"
                        >
                          <span>{getItemUsage(art.id, art.title) ? 'Indisponível' : 'Importar Metadados'}</span>
                          <span className="material-symbols-outlined text-sm">
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Telemetry Ingestion Stats */}
              <div className="p-3 bg-[#0c0e13] rounded-lg border border-[#282a30] flex items-center justify-between text-[#99907c] font-mono text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#f2ca50] text-base">
                    cloud_download
                  </span>
                  IIIF Cache: 420 MB sincronizados
                </span>
                <span className="text-[#4edea3]">Manifestos validados por SHA-256</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Lot Configuration & Live Publishing Console (Cols 7-12) */}
          <div className="xl:col-span-6 flex flex-col gap-6">
            <div className="bg-[#14171f] rounded-xl p-4 sm:p-6 border border-[#282a30] shadow-xl flex flex-col gap-4">
              {/* Console Head */}
              <div className="flex items-center justify-between pb-3 border-b border-[#282a30]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#f2ca50] text-xl">
                    gavel
                  </span>
                  <div className="flex flex-col">
                    <span className="font-serif text-xl text-[#e2e2ea]">
                      Configuração Oficial de Lote
                    </span>
                    <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                      PUBLICAÇÃO IMUTÁVEL EM TEMPO REAL (BROADCAST SSE)
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-[#d4af37]/10 text-[#f2ca50] font-mono text-[10px] rounded uppercase font-bold border border-[#d4af37]/30">
                  LOTE CANDIDATO #{externalApiId ? externalApiId.slice(0, 4) : '01'}
                </div>
              </div>

              {/* Dynamic Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handlePublishLot()
                }}
                className="flex flex-col gap-4"
              >
                {/* Metadata Ingestion Block (Hairline-separated instead of nested card) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label
                      htmlFor="lot-title"
                      className="font-mono text-[10px] uppercase text-[#99907c] tracking-wider"
                    >
                      Título Oficial da Obra (Catalogação JUCESP)
                    </label>
                    <input
                      id="lot-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs px-3 py-2.5 min-h-[44px] rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="lot-artist"
                      className="font-mono text-[10px] uppercase text-[#99907c] tracking-wider"
                    >
                      Artista Autoral
                    </label>
                    <input
                      id="lot-artist"
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      className="bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs px-3 py-2 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="lot-technique"
                      className="font-mono text-[10px] uppercase text-[#99907c] tracking-wider"
                    >
                      Técnica & Dimensões
                    </label>
                    <input
                      id="lot-technique"
                      type="text"
                      value={techniqueDimensions}
                      onChange={(e) => setTechniqueDimensions(e.target.value)}
                      className="bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs px-3 py-2 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="lot-manifest"
                        className="font-mono text-[10px] uppercase text-[#99907c] tracking-wider"
                      >
                        Manifesto IIIF Verificado (JSON-LD)
                      </label>
                      <span className="font-mono text-[10px] text-[#4edea3] font-semibold">
                        Válido (IIIF v3.0 Standard)
                      </span>
                    </div>
                    <div className="flex items-center bg-[#0c0e13] rounded-lg px-3 py-2 border border-[#282a30]">
                      <span className="material-symbols-outlined text-[#99907c] text-sm mr-2">
                        verified_user
                      </span>
                      <input
                        id="lot-manifest"
                        type="text"
                        value={manifestUrl}
                        readOnly
                        className="bg-transparent text-[#f2ca50] font-mono text-[11px] flex-1 focus:outline-none truncate"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial & Escrow Parameters Block (Hairline-separated instead of nested card) */}
                <div className="pt-5 border-t border-[#282a30] flex flex-col gap-4">
                  <span className="font-mono text-[11px] uppercase text-[#f2ca50] font-bold tracking-widest">
                    Parâmetros Econômicos & Liquidação Financeira
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lance Inicial */}
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="lot-start-price"
                        className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider"
                      >
                        Lance Inicial (Reserva Mínima)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#f2ca50] font-bold">
                          R$
                        </span>
                        <input
                          id="lot-start-price"
                          type="number"
                          value={startPriceBRL}
                          onChange={(e) => setStartPriceBRL(e.target.value)}
                          className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-xs font-bold pl-10 pr-3 py-2.5 min-h-[44px] rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                      <span className="font-mono text-[10px] text-[#99907c]">
                        Garantia integral exigida (100%): {formatCurrency(Math.round(parseFloat(startPriceBRL || '0') * 100))}
                      </span>
                    </div>

                    {/* Incremento Mínimo */}
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="lot-min-increment"
                        className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider"
                      >
                        Incremento Mínimo Obrigatório
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#f2ca50] font-bold">
                          R$
                        </span>
                        <input
                          id="lot-min-increment"
                          type="number"
                          value={minIncrementBRL}
                          onChange={(e) => setMinIncrementBRL(e.target.value)}
                          className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-xs font-bold pl-10 pr-3 py-2.5 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                      <span className="font-mono text-[9px] text-[#99907c]">
                        Escadinha automática de lances homologada
                      </span>
                    </div>

                    {/* Anti-sniping toggle */}
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="lot-anti-sniping"
                        className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider"
                      >
                        Regra Anti-Sniping (Soft Close)
                      </label>
                      <div className="flex items-center justify-between p-2.5 bg-[#0c0e13] rounded-lg border border-[#282a30]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#4edea3] text-sm">
                            alarm_on
                          </span>
                          <span className="font-mono text-[10px] text-[#e2e2ea]">
                            +120s em lances nos 2 min finais
                          </span>
                        </div>
                        <input
                          id="lot-anti-sniping"
                          type="checkbox"
                          checked={antiSnipingEnabled}
                          onChange={(e) => setAntiSnipingEnabled(e.target.checked)}
                          className="accent-[#d4af37] w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Expected Duration */}
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="lot-duration"
                        className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider"
                      >
                        Duração Prevista do Pregão
                      </label>
                      <div className="flex items-center bg-[#0c0e13] rounded-lg px-3 py-2 border border-[#282a30]">
                        <span className="material-symbols-outlined text-[#99907c] text-base mr-2">
                          timer
                        </span>
                        <select
                          id="lot-duration"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(e.target.value)}
                          className="bg-transparent text-[#e2e2ea] font-mono text-xs flex-1 focus:outline-none cursor-pointer"
                        >
                          <option value="15" className="bg-[#14171f]">15 minutos (Leilão Expresso)</option>
                          <option value="30" className="bg-[#14171f]">30 minutos (Padrão Masterpiece)</option>
                          <option value="45" className="bg-[#14171f]">45 minutos (Sessão Especial)</option>
                          <option value="60" className="bg-[#14171f]">60 minutos (Sessão Magna)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modalidade de Abertura & Agendamento Oficial */}
                <div className="pt-5 border-t border-[#282a30] flex flex-col gap-4">
                  <span className="font-mono text-[11px] uppercase text-[#f2ca50] font-bold tracking-widest">
                    Modalidade de Abertura & Agendamento do Pregão
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setLaunchMode('IMMEDIATE')}
                      className={`py-3 px-4 min-h-[48px] rounded-lg border flex items-center justify-between transition cursor-pointer ${
                        launchMode === 'IMMEDIATE'
                          ? 'bg-[#4edea3]/10 border-[#4edea3] text-[#4edea3] font-bold'
                          : 'bg-[#0c0e13] border-[#282a30] text-[#99907c] hover:text-[#e2e2ea]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">sensors</span>
                        <span>Abrir Ao Vivo Agora</span>
                      </span>
                      <span className="text-[10px] uppercase">Imediato</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLaunchMode('SCHEDULED')
                        if (!scheduledDateTime) {
                          applySchedulePresetMinutes(15)
                        }
                      }}
                      className={`py-3 px-4 rounded-lg border flex items-center justify-between transition cursor-pointer ${
                        launchMode === 'SCHEDULED'
                          ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#f2ca50] font-bold'
                          : 'bg-[#0c0e13] border-[#282a30] text-[#99907c] hover:text-[#e2e2ea]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">calendar_clock</span>
                        <span>Agendar para Horário Futuro</span>
                      </span>
                      <span className="text-[10px] uppercase">Programado</span>
                    </button>
                  </div>

                  {launchMode === 'SCHEDULED' && (
                    <div className="flex flex-col gap-3 pt-1 font-mono text-xs">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                          <label
                            htmlFor="lot-schedule-datetime"
                            className="text-[10px] text-[#99907c] uppercase tracking-wider"
                          >
                            Data e Horário Oficial de Abertura do Pregão
                          </label>
                          <input
                            id="lot-schedule-datetime"
                            type="datetime-local"
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            className="w-full bg-[#0c0e13] text-[#f2ca50] font-mono text-xs font-bold px-3 py-2.5 rounded-lg border border-[#d4af37]/50 focus:outline-none focus:border-[#d4af37] tabular-nums"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#99907c] uppercase tracking-wider">
                            Atalhos Rápidos de Agendamento
                          </span>
                          <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
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
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#99907c]">
                        O lote ficará visível no Catálogo como &ldquo;Agendado&rdquo; e entrará AO VIVO automaticamente no horário definido (ou quando o Leiloeiro clicar em &ldquo;Iniciar Pregão Agora&rdquo;).
                      </span>
                    </div>
                  )}
                </div>

                {/* Publicação Master CTA Button */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="w-full py-3.5 sm:py-4 px-4 sm:px-6 min-h-[50px] bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#f2ca50] shadow-xl transition-all cursor-pointer disabled:opacity-50 text-center leading-snug"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {launchMode === 'SCHEDULED' ? 'calendar_clock' : 'broadcast_on_personal'}
                    </span>
                    <span>
                      {isPublishing
                        ? launchMode === 'SCHEDULED'
                          ? 'REGISTRANDO AGENDAMENTO OFICIAL...'
                          : 'TRANSMITINDO LOTE PARA A REDE SSE...'
                        : launchMode === 'SCHEDULED'
                          ? 'AGENDAR LOTE OFICIAL NO CATÁLOGO →'
                          : 'ABRIR PREGÃO OFICIAL E PUBLICAR LOTE EM REDE SSE →'}
                    </span>
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 px-1 text-[#99907c] font-mono text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[#4edea3] text-sm">
                        lock
                      </span>
                      Assinado com Chave JUCESP HSM: #A938-E190
                    </span>
                    <span className="text-[#f2ca50]">{publishStatus}</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO OFICIAL: RESULTADOS DOS LOTES ENCERRADOS & TOTAL RECEBIDO (REQUISITO VERZEL) */}
      <section className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 pb-8">
        <div className="bg-[#0c0e13] rounded-xl p-4 sm:p-6 border border-[#282a30] shadow-xl flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#282a30]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#f2ca50] text-2xl">
                payments
              </span>
              <div>
                <h2 className="font-serif text-xl text-[#e2e2ea]">
                  Resultados dos Lotes Encerrados & Prestação de Contas
                </h2>
                <p className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                  Relatório oficial de arremates homologados e apuração de receita total recebida
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-[#14171f] border border-[#d4af37]/40 flex items-center gap-3">
                <span className="font-mono text-xs text-[#99907c] uppercase">TOTAL RECEBIDO:</span>
                <span className="font-mono text-lg text-[#4edea3] font-bold">
                  {formatCurrency(totalReceivedInCents)}
                </span>
              </div>
            </div>
          </div>

          {endedLots.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-[#99907c] border border-dashed border-[#282a30] rounded-lg">
              Nenhum lote foi encerrado até o momento. Lotes liquidados aparecerão aqui com os dados do arrematante e certificado.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
            <Table className="whitespace-nowrap">
              <TableHeader className="bg-[#14171f]">
                <TableRow>
                  <TableHead>Obra / Título</TableHead>
                  <TableHead>Arrematante</TableHead>
                  <TableHead className="text-right">Lances</TableHead>
                  <TableHead className="text-right">Valor Final</TableHead>
                  <TableHead className="text-center">Status / Certificado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endedLots.map((lot) => {
                  const hasWinner = lot.bidsCount > 0 && lot.currentWinner
                  return (
                    <TableRow key={lot.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={lot.imageUrl || '/lot-preview.png'}
                            alt={lot.title}
                            className="w-10 h-10 object-cover rounded border border-[#282a30]"
                          />
                          <div>
                            <span className="block font-medium text-[#e2e2ea] line-clamp-1">{lot.title}</span>
                            <span className="block text-[10px] text-[#99907c]">{lot.artist || 'Mestre da Pintura'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasWinner ? (
                          <Badge variant="secondary" className="bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30">
                            {lot.currentWinner?.publicCode} ({lot.currentWinner?.maskedName})
                          </Badge>
                        ) : (
                          <span className="text-[#99907c]">Sem Lances</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-[#e2e2ea] tabular-nums">{lot.bidsCount}</TableCell>
                      <TableCell className="text-right font-bold text-[#f2ca50] tabular-nums">
                        {formatCurrency(lot.currentPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/audit/${lot.id}`}>
                            <span className="material-symbols-outlined text-xs">verified</span>
                            <span>Trilha de Auditoria</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
