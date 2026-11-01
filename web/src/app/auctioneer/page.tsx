'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'

interface ArtworkSearchResult {
  id: string
  title: string
  artistTitle: string | null
  dateDisplay: string | null
  mediumDisplay: string | null
  imageUrl: string | null
  isPublicDomain: boolean
}

export default function AuctioneerMasterCockpitPage() {
  const router = useRouter()
  const { user, login } = useAuth()

  // Telemetria SSE simulada
  const [latencyMs, setLatencyMs] = useState(8)
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyMs(Math.floor(Math.random() * 5) + 7)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Busca de obras na API pública
  const [artQuery, setArtQuery] = useState('Vincent van Gogh')
  const [artworks, setArtworks] = useState<ArtworkSearchResult[]>([])
  const [isSearchingArt, setIsSearchingArt] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Formulário Oficial de Publicação de Lote
  const [title, setTitle] = useState('The Bedroom (O Quarto em Arles)')
  const [artist, setArtist] = useState('Vincent van Gogh (1853–1890)')
  const [techniqueDimensions, setTechniqueDimensions] = useState('Óleo sobre tela • 72 × 90 cm')
  const [imageUrl, setImageUrl] = useState('/arles.png')
  const [externalApiId, setExternalApiId] = useState('28560')
  const [manifestUrl, setManifestUrl] = useState('https://openaccess-api.clevelandart.org/api/artworks/28560')
  const [startPriceBRL, setStartPriceBRL] = useState('350000') // R$ 350.000,00
  const [minIncrementBRL, setMinIncrementBRL] = useState('10000') // R$ 10.000,00
  const [antiSnipingEnabled, setAntiSnipingEnabled] = useState(true)
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState('Aguardando comando do Leiloeiro')

  // Lote ao vivo ativo para controle do martelo
  const [activeLiveLot, setActiveLiveLot] = useState<any | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{
    text: string
    color: string
  } | null>(null)
  const [isSettling, setIsSettling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [endedLots, setEndedLots] = useState<any[]>([])
  const [totalReceivedInCents, setTotalReceivedInCents] = useState(0)

  // Realizar busca inicial de obras
  const searchMuseumArtworks = async (queryText: string) => {
    setIsSearchingArt(true)
    setSearchError('')
    try {
      const data = await apiRequest<{ items: ArtworkSearchResult[] }>(
        `/artworks/search?query=${encodeURIComponent(queryText)}&limit=6`,
      )
      setArtworks(data.items || [])
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao consultar acervo do museu.')
    } finally {
      setIsSearchingArt(false)
    }
  }

  useEffect(() => {
    searchMuseumArtworks('Monet')
  }, [])

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

  // Buscar lote ativo para o console inferior
  const refreshActiveLot = async () => {
    try {
      const res = await apiRequest<{ lots: any[] }>('/lots?status=LIVE')
      if (res.lots && res.lots.length > 0) {
        setActiveLiveLot(res.lots[0])
      } else {
        const allRes = await apiRequest<{ lots: any[] }>('/lots')
        if (allRes.lots && allRes.lots.length > 0) {
          setActiveLiveLot(allRes.lots[0])
        }
      }
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

  // Cancelar lote sem lances (Regra de Negócio Oficial)
  const handleCancelLot = async () => {
    if (!activeLiveLot) return
    if (!user || user.role !== 'AUCTIONEER') {
      setActionFeedback({
        text: 'Acesso restrito: apenas o Leiloeiro Oficial pode cancelar lotes.',
        color: 'text-rose-400 font-bold',
      })
      return
    }

    if (activeLiveLot.bidsCount > 0) {
      setActionFeedback({
        text: 'REGULAMENTO: Não é permitido cancelar um lote que já possui lances registrados.',
        color: 'text-rose-400 font-bold',
      })
      return
    }

    setIsCancelling(true)
    try {
      await apiRequest(`/lots/${activeLiveLot.id}/cancel`, { method: 'POST' })
      setActionFeedback({
        text: `LOTE #${activeLiveLot.id.slice(0, 4).toUpperCase()} CANCELADO COM SUCESSO! O lote foi removido da vitrine pública.`,
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
    setTitle(art.title)
    setArtist(art.artistTitle || 'Mestre da Pintura')
    setTechniqueDimensions(`${art.mediumDisplay || 'Óleo sobre tela'} • ${art.dateDisplay || 'Séc. XIX'}`)
    setImageUrl(art.imageUrl || '/lot-preview.png')
    setExternalApiId(String(art.id))
    setManifestUrl(`https://openaccess-api.clevelandart.org/api/artworks/${art.id}`)
    setPublishStatus(`Obra #${art.id} selecionada para pregão`)
  }

  // Publicar lote
  const handlePublishLot = async () => {
    if (!user || user.role !== 'AUCTIONEER') {
      setActionFeedback({
        text: 'Acesso restrito: identifique-se como Leiloeiro Oficial (LEI-0001) para publicar lotes.',
        color: 'text-[#f2ca50]',
      })
      return
    }

    if (!title || !imageUrl) return

    setIsPublishing(true)
    setPublishStatus('Transmitindo lote para a rede SSE...')

    try {
      const now = new Date()
      const startTime = now.toISOString()
      const endTime = new Date(
        now.getTime() + parseInt(durationMinutes || '30') * 60 * 1000,
      ).toISOString()

      const created = await apiRequest<{ lot: any }>('/lots', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: `Catalogação oficial: ${techniqueDimensions}. Proveniência certificada via API pública de museu (#${externalApiId}).`,
          imageUrl,
          artist,
          externalApiId,
          startPrice: Math.round(parseFloat(startPriceBRL) * 100),
          minIncrement: Math.round(parseFloat(minIncrementBRL) * 100),
          startTime,
          endTime,
        }),
      })

      setPublishStatus('Transmitido com sucesso via SSE para todos os terminais ao vivo!')
      setActionFeedback({
        text: `LOTE #${created.lot.id.slice(0, 4).toUpperCase()} PUBLICADO E AO VIVO NA REDE!`,
        color: 'text-[#4edea3] font-bold',
      })
      refreshActiveLot()
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

  // Ações de intervenção do Leiloeiro
  const handleAuctionAction = async (action: 'hammer' | 'three' | 'pause' | 'cancel_bid') => {
    if (!activeLiveLot) return

    if (action === 'hammer') {
      setIsSettling(true)
      try {
        const res = await apiRequest<{
          settled: boolean
          receiptCode: string
        }>(`/lots/${activeLiveLot.id}/settle`, { method: 'POST' })

        setActionFeedback({
          text: `MARTELO BATIDO! Lote ${activeLiveLot.title} adjudicado oficialmente. Certificado emitido: ${res.receiptCode}`,
          color: 'text-[#4edea3] font-bold',
        })
        refreshActiveLot()
      } catch (err: any) {
        setActionFeedback({
          text: err.message || 'Erro ao bater martelo e liquidar.',
          color: 'text-rose-400 font-bold',
        })
      } finally {
        setIsSettling(false)
      }
    } else if (action === 'three') {
      setActionFeedback({
        text: "PREGÃO: 'DOU-LHE TRÊS' anunciado no pregão! Cronômetro final de arrematação iniciado.",
        color: 'text-[#f2ca50] font-semibold',
      })
    } else if (action === 'pause') {
      setActionFeedback({
        text: 'SALA EM SUSPENSÃO TEMPORÁRIA: Pregão pausado pelo leiloeiro oficial.',
        color: 'text-[#e2e2ea] font-semibold',
      })
    } else if (action === 'cancel_bid') {
      setActionFeedback({
        text: 'INTERVENÇÃO: Advertência notarial emitida aos licitantes conectados.',
        color: 'text-rose-400 font-semibold',
      })
    }
  }

  return (
    <div className="w-full pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* Operational Sub-Header Bar (Master Cockpit Status) */}
      <section className="w-full px-6 lg:px-12 py-3 bg-[#0c0e13] border-b border-[#282a30]">
        <div className="w-full max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Official License Identity */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#282a30] rounded border border-[#4d4635]/40">
              <span className="material-symbols-outlined text-[#f2ca50] text-base">
                gavel
              </span>
              <span className="font-mono text-xs text-[#f2ca50] font-bold tracking-wider">
                LEI-0001
              </span>
              <span className="text-[#99907c] text-xs">/</span>
              <span className="font-mono text-xs text-[#d0c5af]">
                LEILOEIRO OFICIAL MATRICULADO (JUCESP #894)
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-[#4edea3]/10 border border-[#4edea3]/30 rounded">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#4edea3] font-bold">
                MARTELO ELETRÔNICO • SALA AO VIVO ATIVA
              </span>
            </div>

            {/* Quick Login if not logged as auctioneer */}
            {(!user || user.role !== 'AUCTIONEER') && (
              <button
                onClick={() => login('auctioneer@belmont.com', 'password123')}
                className="px-3 py-1 bg-[#f2ca50] text-[#1c1400] font-mono text-xs font-bold uppercase rounded hover:bg-[#ffe088] transition-colors cursor-pointer"
              >
                Autenticar como Leiloeiro Oficial (1 Clique)
              </button>
            )}
          </div>

          {/* Network Telemetry & Cryptographic Heartbeat */}
          <div className="flex items-center gap-6 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#99907c] text-sm">
                network_check
              </span>
              <span className="text-[#99907c]">LATÊNCIA SSE:</span>
              <span className="text-[#4edea3] font-bold">{latencyMs}ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#f2ca50] text-sm">
                schedule
              </span>
              <span className="text-[#99907c]">SINCRONIA NTP:</span>
              <span className="text-[#f2ca50] font-bold">ESTÁVEL (±0.002s)</span>
            </div>
            <div className="px-3 py-1 bg-[#282a30] rounded text-[#99907c]">
              AUDIT ID: <span className="text-[#e2e2ea] font-semibold">0x7F2...8C91</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Institutional Workspace: 2-Column High-Density Grid */}
      <section className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Museum Catalog Ingestion & Manifest Terminal (Cols 1-6) */}
          <div className="xl:col-span-6 flex flex-col gap-6">
            <div className="bg-[#14171f] rounded-xl p-6 border border-[#282a30] shadow-xl flex flex-col gap-4">
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
                  <button
                    type="button"
                    onClick={() => {
                      setArtQuery('Monet')
                      searchMuseumArtworks('Monet')
                    }}
                    className="px-3 py-1 rounded bg-[#d4af37] text-[#1c1400] font-bold"
                  >
                    Claude Monet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArtQuery('Van Gogh')
                      searchMuseumArtworks('Van Gogh')
                    }}
                    className="px-3 py-1 rounded bg-[#282a30] text-[#d0c5af] hover:text-[#e2e2ea] transition-colors"
                  >
                    Vincent van Gogh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArtQuery('Rembrandt')
                      searchMuseumArtworks('Rembrandt')
                    }}
                    className="px-3 py-1 rounded bg-[#282a30] text-[#d0c5af] hover:text-[#e2e2ea] transition-colors"
                  >
                    Rembrandt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArtQuery('Landscape')
                      searchMuseumArtworks('Landscape')
                    }}
                    className="px-3 py-1 rounded bg-[#282a30] text-[#d0c5af] hover:text-[#e2e2ea] transition-colors"
                  >
                    Paisagens
                  </button>
                </div>
              </form>

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
                    className="p-3 bg-[#1d2025] rounded-xl border border-[#282a30] hover:border-[#d4af37]/40 flex flex-col md:flex-row gap-4 shadow-md transition-colors"
                  >
                    <div className="w-full md:w-36 h-28 shrink-0 overflow-hidden rounded-lg bg-[#0c0e13] relative group">
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
                          <span className="px-2 py-0.5 bg-[#4edea3]/20 text-[#4edea3] font-mono text-[9px] rounded uppercase font-semibold">
                            Domínio Público
                          </span>
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
                          className="px-3 py-1.5 bg-[#d4af37] text-[#1c1400] font-mono text-[10px] rounded uppercase font-bold flex items-center gap-1 shadow-sm hover:bg-[#f2ca50] transition-colors cursor-pointer"
                        >
                          <span>Importar Metadados</span>
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
            <div className="bg-[#14171f] rounded-xl p-6 border border-[#282a30] shadow-xl flex flex-col gap-4">
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
                {/* Metadata Ingestion Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#1d2025] rounded-xl border border-[#282a30]">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="font-mono text-[10px] uppercase text-[#99907c] tracking-wider">
                      Título Oficial da Obra (Catalogação JUCESP)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs px-3 py-2 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase text-[#99907c] tracking-wider">
                      Artista Autoral
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      className="bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs px-3 py-2 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase text-[#99907c] tracking-wider">
                      Técnica & Dimensões
                    </label>
                    <input
                      type="text"
                      value={techniqueDimensions}
                      onChange={(e) => setTechniqueDimensions(e.target.value)}
                      className="bg-[#0c0e13] text-[#e2e2ea] font-sans text-xs px-3 py-2 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[10px] uppercase text-[#99907c] tracking-wider">
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
                        type="text"
                        value={manifestUrl}
                        readOnly
                        className="bg-transparent text-[#f2ca50] font-mono text-[11px] flex-1 focus:outline-none truncate"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial & Escrow Parameters Block */}
                <div className="p-4 bg-[#1d2025] rounded-xl border border-[#282a30] flex flex-col gap-4">
                  <span className="font-mono text-[11px] uppercase text-[#f2ca50] font-bold tracking-widest">
                    Parâmetros Econômicos & Liquidação Financeira
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lance Inicial */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                        Lance Inicial (Reserva Mínima)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#f2ca50] font-bold">
                          R$
                        </span>
                        <input
                          type="number"
                          value={startPriceBRL}
                          onChange={(e) => setStartPriceBRL(e.target.value)}
                          className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-xs font-bold pl-10 pr-3 py-2.5 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                      <span className="font-mono text-[9px] text-[#99907c]">
                        Garantia bancária mínima (10%): {formatCurrency(Math.round(parseFloat(startPriceBRL || '0') * 10))}
                      </span>
                    </div>

                    {/* Incremento Mínimo */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                        Incremento Mínimo Obrigatório
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#f2ca50] font-bold">
                          R$
                        </span>
                        <input
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
                      <label className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
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
                          type="checkbox"
                          checked={antiSnipingEnabled}
                          onChange={(e) => setAntiSnipingEnabled(e.target.checked)}
                          className="accent-[#d4af37] w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Expected Duration */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                        Duração Prevista do Pregão
                      </label>
                      <div className="flex items-center bg-[#0c0e13] rounded-lg px-3 py-2 border border-[#282a30]">
                        <span className="material-symbols-outlined text-[#99907c] text-base mr-2">
                          timer
                        </span>
                        <select
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

                {/* Publicação Master CTA Button */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="w-full py-4 px-6 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#f2ca50] shadow-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xl">
                      broadcast_on_personal
                    </span>
                    <span>
                      {isPublishing
                        ? 'TRANSMITINDO LOTE PARA A REDE SSE...'
                        : 'ABRIR PREGÃO OFICIAL E PUBLICAR LOTE EM REDE SSE →'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between px-1 text-[#99907c] font-mono text-[10px]">
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
      <section className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 pb-8">
        <div className="bg-[#0c0e13] rounded-xl p-6 border border-[#282a30] shadow-xl flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#282a30]">
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
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead className="bg-[#14171f] text-[#99907c] uppercase border-b border-[#282a30]">
                  <tr>
                    <th className="p-3">Obra / Título</th>
                    <th className="p-3">Arrematante</th>
                    <th className="p-3 text-right">Lances</th>
                    <th className="p-3 text-right">Valor Final</th>
                    <th className="p-3 text-center">Status / Certificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282a30]">
                  {endedLots.map((lot) => {
                    const hasWinner = lot.bidsCount > 0 && lot.currentWinner
                    return (
                      <tr key={lot.id} className="hover:bg-[#14171f]/50 transition">
                        <td className="p-3">
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
                        </td>
                        <td className="p-3">
                          {hasWinner ? (
                            <span className="px-2 py-1 rounded bg-[#4edea3]/10 text-[#4edea3] font-bold">
                              {lot.currentWinner?.publicCode} ({lot.currentWinner?.maskedName})
                            </span>
                          ) : (
                            <span className="text-[#99907c]">Sem Lances</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-[#e2e2ea]">{lot.bidsCount}</td>
                        <td className="p-3 text-right font-bold text-[#f2ca50]">
                          {formatCurrency(lot.currentPrice)}
                        </td>
                        <td className="p-3 text-center">
                          <Link
                            href={`/audit/${lot.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#282a30] hover:bg-[#343740] text-[10px] text-[#e2e2ea] transition"
                          >
                            <span className="material-symbols-outlined text-xs">verified</span>
                            <span>Ver Auditoria</span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM OPERATIONAL MONITOR & LEILÃO CONTROL COCKPIT */}
      <section className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 pb-12">
        <div className="bg-[#0c0e13] rounded-xl p-6 border border-[#282a30] shadow-2xl flex flex-col gap-4">
          {/* Panel Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#282a30]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#4edea3] animate-pulse" />
              <div className="flex flex-col">
                <span className="font-serif text-lg text-[#e2e2ea]">
                  Console de Intervenção em Tempo Real
                </span>
                <span className="font-mono text-[10px] text-[#99907c]">
                  LOTE ATUALMENTE NO TABLADO:{' '}
                  {activeLiveLot
                    ? `LOT-${activeLiveLot.id.slice(0, 4).toUpperCase()} • ${activeLiveLot.artist}, "${activeLiveLot.title}"`
                    : 'Aguardando publicação...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#99907c] uppercase tracking-wider">Cronômetro de Batida:</span>
              <span className="text-[#f2ca50] font-bold px-3 py-1 bg-[#1d2025] rounded border border-[#282a30]">
                00:01:42
              </span>
            </div>
          </div>

          {/* Live Bidding Data Barometer */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#14171f] rounded-lg border border-[#282a30]">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#99907c] uppercase">
                Lance Mais Alto Homologado
              </span>
              <span className="font-serif text-2xl text-[#f2ca50] font-bold mt-0.5">
                {activeLiveLot ? formatCurrency(activeLiveLot.currentPrice) : 'R$ 0,00'}
              </span>
              <span className="font-mono text-[10px] text-[#4edea3] mt-0.5">
                Líder: {activeLiveLot?.currentWinner?.publicCode || 'Aguardando lance'}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#99907c] uppercase">
                Total de Lances Válidos
              </span>
              <span className="font-serif text-2xl text-[#e2e2ea] font-bold mt-0.5">
                {activeLiveLot ? `${activeLiveLot.bidsCount || 0} Registros` : '0'}
              </span>
              <span className="font-mono text-[10px] text-[#99907c] mt-0.5">
                Auditados na trilha criptográfica
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#99907c] uppercase">
                Estado Atual da Oferta
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-[#f2ca50]/20 text-[#f2ca50] font-mono text-[10px] rounded uppercase font-bold">
                  DOU-LHE DUAS
                </span>
                <span className="font-mono text-[10px] text-[#99907c]">
                  Aguardando contraoferta
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#99907c] mt-1">
                Próximo piso: {activeLiveLot ? formatCurrency(activeLiveLot.currentPrice + activeLiveLot.minIncrement) : 'R$ 0,00'}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#99907c] uppercase">
                Garantia em Custódia (Escrow)
              </span>
              <span className="font-serif text-2xl text-[#4edea3] font-bold mt-0.5">
                100% Coberta
              </span>
              <span className="font-mono text-[10px] text-[#99907c] mt-0.5">
                Depósito fiduciário segregado
              </span>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div className="p-3 bg-[#1d2025] rounded-lg border border-[#d4af37]/40 flex items-center justify-between font-mono text-xs">
              <span className={actionFeedback.color}>{actionFeedback.text}</span>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-[#99907c] hover:text-[#e2e2ea]"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Overrides: Official Auctioneer Emergency Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              {/* Bater Martelo (Primary Authority Act) */}
              <button
                type="button"
                onClick={() => handleAuctionAction('hammer')}
                disabled={isSettling || !activeLiveLot}
                className="px-5 py-3 bg-[#4edea3] text-[#07090e] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center gap-2 hover:bg-emerald-400 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">gavel</span>
                <span>{isSettling ? 'HOMOLOGANDO...' : 'BATER MARTELO & LIQUIDAR LOTE'}</span>
              </button>

              {/* Declarar Dou-lhe Três */}
              <button
                type="button"
                onClick={() => handleAuctionAction('three')}
                className="px-5 py-3 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center gap-2 hover:bg-[#f2ca50] shadow-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">campaign</span>
                <span>DECLARAR DOU-LHE TRÊS</span>
              </button>

              {/* Pausar Pregão */}
              <button
                type="button"
                onClick={() => handleAuctionAction('pause')}
                className="px-5 py-3 bg-[#282a30] text-[#e2e2ea] hover:text-[#f2ca50] font-mono text-xs uppercase tracking-wider font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">pause_circle</span>
                <span>PAUSAR PREGÃO</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Cancelar Lote Sem Lances (Regra de Negócio Central) */}
              {activeLiveLot && activeLiveLot.bidsCount === 0 && (
                <button
                  type="button"
                  onClick={handleCancelLot}
                  disabled={isCancelling}
                  className="px-5 py-3 bg-rose-600/20 text-rose-300 border border-rose-500/40 font-mono text-xs uppercase tracking-wider font-bold rounded-lg flex items-center gap-2 hover:bg-rose-600/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">block</span>
                  <span>{isCancelling ? 'CANCELANDO...' : 'CANCELAR LOTE (0 LANCES)'}</span>
                </button>
              )}

              {/* Cancelar Lance Ilícito */}
              <button
                type="button"
                onClick={() => handleAuctionAction('cancel_bid')}
                className="px-5 py-3 bg-rose-950/40 text-rose-300 border border-rose-500/30 font-mono text-xs uppercase tracking-wider font-semibold rounded-lg flex items-center gap-2 hover:bg-rose-900/50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">cancel</span>
                <span>EMITIR ADVERTÊNCIA NOTARIAL</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
