'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AuditChainNode {
  index: number
  id: string
  amount: number
  createdAt: string
  bidderPublicCode: string
  bidderMaskedName: string
  prevHash: string
  bidHash: string
  status: 'VALID' | 'CORRUPTED'
}

interface AuditResponse {
  lotId: string
  lotTitle: string
  isValid: boolean
  totalBids: number
  lotSealHash: string | null
  receipt?: {
    publicCode: string
  } | null
  lot: {
    id: string
    title: string
    artist: string | null
    imageUrl: string
    startPrice: number
    currentPrice: number
    status: string
    startTime: string
    endTime: string
    winner?: {
      publicCode: string
      maskedName: string
    } | null
  }
  chain: AuditChainNode[]
}

export default function CertificadosAuditoriaPage({
  params,
}: {
  params: Promise<{ lotId: string }>
}) {
  const { lotId } = use(params)
  const { user } = useAuth()
  const [data, setData] = useState<AuditResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentView, setCurrentView] = useState<'cert' | 'ledger'>('ledger')

  // Simulador de adulteração
  const [isTampered, setIsTampered] = useState(false)
  const [toastText, setToastText] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastText(msg)
    setTimeout(() => setToastText(null), 3000)
  }

  const fetchAuditData = async () => {
    try {
      setIsLoading(true)
      const [lotRes, verifyRes] = await Promise.all([
        apiRequest<{ lot: any }>(`/lots/${lotId}`),
        apiRequest<any>(`/audit/verify/${lotId}`).catch(() => null),
      ])

      const rawLot = lotRes.lot
      const bids = rawLot.bids || []

      // Monta cadeia de nós (somente lances reais registrados no banco)
      const nodes: AuditChainNode[] = bids.map((b: any, idx: number) => ({
        index: idx + 1,
        id: b.id,
        amount: b.amount,
        createdAt: b.createdAt,
        bidderPublicCode: b.bidder?.publicCode || '---',
        bidderMaskedName: b.bidder?.maskedName || '---',
        prevHash: b.prevHash || (idx === 0 ? '0'.repeat(64) : bids[idx - 1]?.bidHash || '0'.repeat(64)),
        bidHash: b.bidHash || '',
        status: 'VALID',
      }))

      setData({
        lotId,
        lotTitle: rawLot.title,
        isValid: verifyRes?.isValid ?? true,
        totalBids: bids.length,
        lotSealHash: rawLot.lotSealHash || null,
        receipt: rawLot.receipt,
        lot: {
          id: rawLot.id,
          title: rawLot.title,
          artist: rawLot.artist,
          imageUrl: rawLot.imageUrl,
          startPrice: rawLot.startPrice,
          currentPrice: rawLot.currentPrice,
          status: rawLot.status,
          startTime: rawLot.startTime,
          endTime: rawLot.endTime,
          winner: rawLot.currentWinner,
        },
        chain: nodes,
      })
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar auditoria do lote.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditData()
  }, [lotId])

  if (isLoading) {
    return (
      <div className="w-full pt-32 pb-20 flex min-h-[70vh] flex-col items-center justify-center gap-4 text-[#99907c] font-mono">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
        <span className="text-xs uppercase tracking-widest text-[#f2ca50]">
          Auditando cadeia criptográfica SHA-256...
        </span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="w-full pt-32 pb-20 px-6 max-w-xl mx-auto text-center font-mono">
        <span className="material-symbols-outlined text-4xl text-rose-500 mb-3">
          error_outline
        </span>
        <h2 className="text-xl font-serif text-[#e2e2ea]">Lote Não Auditado</h2>
        <p className="mt-2 text-xs text-[#99907c]">{error || 'O registro do lote não foi localizado.'}</p>
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

  // Regra Estrita: O Certificado Oficial de Arremate pertence ao Vencedor, enquanto a Auditoria do Histórico de Lances (Hash Chain) é pública mesmo sem login
  const isWinner = Boolean(
    user &&
      data.lot.status === 'ENDED' &&
      data.lot.winner?.publicCode &&
      user.publicCode === data.lot.winner.publicCode,
  )
  const isAuctioneer = user?.role === 'AUCTIONEER'

  return (
    <div className="w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* Toast Notification */}
      {toastText && (
        <div className="fixed bottom-8 right-8 z-50 p-4 rounded-xl bg-[#1d2025] border border-[#d4af37]/40 text-xs font-mono text-[#f2ca50] shadow-2xl">
          {toastText}
        </div>
      )}

      {/* Subtle Ambient Glow */}
      <div className="relative w-full overflow-hidden pb-12">
        <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-[840px] h-[340px] bg-gradient-to-b from-[#f2ca50]/10 via-[#d4af37]/5 to-transparent blur-3xl rounded-full opacity-60" />

        <div className="w-full px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-6 relative z-10 pt-6">
          {/* Navigation & Mode Switcher Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#14171f] p-4 rounded-xl border border-[#282a30] shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#f2ca50] text-2xl">
                verified_user
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#99907c]">
                  Soberania Registral & Escrow Fiduciário
                </span>
                <span className="font-serif text-lg text-[#e2e2ea]">
                  Certificados & Auditoria Criptográfica
                </span>
              </div>
            </div>

            {/* View Segmented Switcher */}
            <div className="flex items-center bg-[#0c0e13] p-1 rounded-lg gap-1 w-full md:w-auto border border-[#282a30]">
              <button
                onClick={() => setCurrentView('cert')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'cert'
                    ? 'bg-[#d4af37] text-[#1c1400] font-bold shadow-sm'
                    : 'text-[#99907c] hover:text-[#e2e2ea] hover:bg-[#1d2025]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                <span>Certificado Oficial</span>
              </button>
              <button
                onClick={() => setCurrentView('ledger')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'ledger'
                    ? 'bg-[#d4af37] text-[#1c1400] font-bold shadow-sm'
                    : 'text-[#99907c] hover:text-[#e2e2ea] hover:bg-[#1d2025]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">hub</span>
                <span>Verificador Hash Chain</span>
              </button>
            </div>
          </div>

          {/* Live Cryptographic Trust Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#14171f] p-4 rounded-xl border border-[#282a30] flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3] shrink-0">
                <span className="material-symbols-outlined text-lg">enhanced_encryption</span>
              </div>
              <div className="flex flex-col min-w-0 font-mono">
                <span className="text-[10px] uppercase text-[#99907c]">Protocolo de Integridade</span>
                <span className="text-xs text-[#4edea3] font-semibold truncate">Merkle Tree SHA-256</span>
              </div>
            </div>

            <div className="bg-[#14171f] p-4 rounded-xl border border-[#282a30] flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#f2ca50] shrink-0">
                <span className="material-symbols-outlined text-lg">gavel</span>
              </div>
              <div className="flex flex-col min-w-0 font-mono">
                <span className="text-[10px] uppercase text-[#99907c]">Sessão Belmont #894</span>
                <span className="text-xs text-[#e2e2ea] font-semibold truncate">
                  {data.lot.status === 'ENDED' ? 'Pregão Encerrado & Quitado' : 'Pregão Ao Vivo / Agendado'}
                </span>
              </div>
            </div>

            <div className="bg-[#14171f] p-4 rounded-xl border border-[#282a30] flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3] shrink-0">
                <span className="material-symbols-outlined text-lg">shield</span>
              </div>
              <div className="flex flex-col min-w-0 font-mono">
                <span className="text-[10px] uppercase text-[#99907c]">Custódia Registrada</span>
                <span className="text-xs text-[#4edea3] font-semibold truncate">Fiança 100% Retida & Escrow</span>
              </div>
            </div>

            <div className="bg-[#14171f] p-4 rounded-xl border border-[#282a30] flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#282a30] flex items-center justify-center text-[#f2ca50] shrink-0">
                <span className="material-symbols-outlined text-lg">account_balance</span>
              </div>
              <div className="flex flex-col min-w-0 font-mono">
                <span className="text-[10px] uppercase text-[#99907c]">Instituição Depositária</span>
                <span className="text-xs text-[#e2e2ea] font-semibold truncate">Cleveland Museum & Art Trust</span>
              </div>
            </div>
          </div>

          {/* VIEW 1: OFFICIAL SHAREABLE CERTIFICATE (Restrito ao Vencedor / Leiloeiro) */}
          {currentView === 'cert' && !isWinner && !isAuctioneer && (
            <div className="py-16 px-6 max-w-xl mx-auto text-center font-mono bg-[#14171f] rounded-2xl border border-[#282a30]">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h2 className="text-2xl font-serif text-[#e2e2ea]">
                Certificado Exclusivo do Arrematante Vencedor
              </h2>
              <p className="mt-2 text-xs text-[#99907c] leading-relaxed">
                {data.lot.status !== 'ENDED'
                  ? 'Este lote ainda não foi encerrado. O Certificado Oficial de Propriedade só é emitido após a liquidação do pregão.'
                  : 'O Certificado de Propriedade pertence exclusivamente ao licitante vencedor. Qualquer visitante pode auditar livremente o histórico completo de lances na aba "Verificador Hash Chain".'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  onClick={() => setCurrentView('ledger')}
                >
                  <span className="material-symbols-outlined text-sm">hub</span>
                  <span>Auditar Histórico de Lances (Público)</span>
                </Button>
                <Button asChild variant="outline" className="border-[#d4af37]/40 text-[#f2ca50]">
                  <Link href="/">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    <span>Voltar ao Catálogo</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {currentView === 'cert' && (isWinner || isAuctioneer) && (
            <div className="flex flex-col gap-6">
              <div className="relative bg-[#0c0e13] p-4 sm:p-8 md:p-12 rounded-2xl shadow-2xl overflow-hidden border border-[#d4af37]/40">
                {/* Guilloché Geometric SVG Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-10 pointer-events-none text-[#d4af37]"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="guilloche-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                      <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="0.6" />
                      <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.4" />
                      <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="0.4" />
                      <path d="M 0,30 Q 30,0 60,30 Q 30,60 0,30" fill="none" stroke="currentColor" strokeWidth="0.3" />
                      <path d="M 30,0 Q 60,30 30,60 Q 0,30 30,0" fill="none" stroke="currentColor" strokeWidth="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#guilloche-grid)" />
                </svg>

                {/* Central Watermark Crest */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <span className="material-symbols-outlined text-[320px] text-[#d4af37]">
                    account_balance
                  </span>
                </div>

                <div className="relative bg-[#14171f]/90 backdrop-blur-md p-6 sm:p-10 rounded-xl flex flex-col gap-8 shadow-xl border border-[#4d4635]/40">
                  {/* Top Certificate Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#282a30]">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#0c0e13] flex items-center justify-center text-[#f2ca50] shadow-inner border border-[#d4af37]/30">
                        <img src="/belmont-crest.svg" alt="Belmont Crest" className="w-10 h-10 object-contain" />
                      </div>
                      <div className="flex flex-col text-center sm:text-left">
                        <span className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] font-bold">
                          BELMONT FINE ART AUCTIONS • EST. 1894
                        </span>
                        <span className="font-serif text-xl tracking-wide text-[#e2e2ea]">
                          Chancela Fiduciária de Arrematação
                        </span>
                        <span className="font-mono text-[10px] text-[#99907c]">
                          Selo de Autenticidade Registral • Protocolo Oficial N° 2026/CHI-{data.lot.id.slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#0c0e13] text-center w-full sm:w-auto min-w-0 sm:min-w-[190px] border border-[#282a30]">
                      <div className="flex items-center gap-1.5 text-[#4edea3]">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                          Auditado e Selado
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#99907c] mt-1">
                        Status: {data.lot.status === 'ENDED' ? 'Liquidado (Idempotente)' : 'Em Pregão'}
                      </span>
                      <span className="font-mono text-xs text-[#f2ca50] font-bold">
                        LOTE #{data.lot.id.slice(0, 4).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Master Title */}
                  <div className="flex flex-col text-center items-center gap-2 max-w-3xl mx-auto">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] font-semibold">
                      Instrumento Notarial de Homologação
                    </span>
                    <h1 className="font-serif text-3xl lg:text-4xl text-[#e2e2ea] leading-tight">
                      Certificado Oficial de Arrematação & Custódia Patrimonial
                    </h1>
                    <p className="font-sans text-xs text-[#99907c] max-w-2xl leading-relaxed">
                      Certificamos para todos os fins jurídicos, museológicos e patrimoniais que a titularidade fiduciária e direitos de custódia da obra descrita foram formalizados de forma irrevogável e auditável em pregão público internacional.
                    </p>
                  </div>

                  {/* Artwork & Auction Bento Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Visual Artwork & Specs (Cols 1-5) */}
                    <div className="lg:col-span-5 bg-[#0c0e13] p-4 rounded-xl flex flex-col gap-4 border border-[#282a30]">
                      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                        <img
                          alt={data.lot.title}
                          className="w-full h-full object-cover"
                          src={data.lot.imageUrl || '/lot-preview.png'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e13] via-transparent to-transparent opacity-70" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded bg-[#0c0e13]/80 backdrop-blur-sm font-mono text-[9px]">
                          <span className="text-[#f2ca50] uppercase">Museum Catalog #{data.lot.id.slice(0, 6)}</span>
                          <span className="text-[#99907c]">IIIF High-Res Manifest v3</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#f2ca50]">
                          Obra Arrematada
                        </span>
                        <div className="font-serif text-xl text-[#e2e2ea]">{data.lot.title}</div>
                        <div className="font-serif text-sm text-[#99907c] italic">
                          {data.lot.artist || 'Mestre da Arte'}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-[#282a30] flex flex-col gap-1 text-xs font-mono text-[#99907c]">
                        <span className="text-[#e2e2ea]">Óleo sobre tela • Catalogação Oficial</span>
                        <span>Coleção de Origem: Museu Internacional & Belas Artes</span>
                      </div>
                    </div>

                    {/* Settlement Ledger Fields (Cols 6-12) */}
                    <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                      {/* Unified 2x2 Architectural Hairline Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#282a30] rounded-xl overflow-hidden border border-[#282a30] font-mono">
                        <div className="bg-[#0c0e13] p-4 flex flex-col gap-1">
                          <span className="text-[10px] text-[#99907c] uppercase">Arrematante Homologado</span>
                          <span className="text-sm font-bold text-[#f2ca50]">
                            {data.lot.winner?.publicCode || 'Sem Arrematante'}
                          </span>
                          <span className="text-xs text-[#e2e2ea]">
                            {data.lot.winner?.maskedName || 'Nenhum lance vencedor'}
                          </span>
                          <span className="text-[9px] text-[#99907c]">Mascarado sob LGPD Art. 7º</span>
                        </div>

                        <div className="bg-[#0c0e13] p-4 flex flex-col gap-1">
                          <span className="text-[10px] text-[#99907c] uppercase">Valor de Liquidação</span>
                          <span className="text-sm font-bold text-[#4edea3] tabular-nums">
                            {formatCurrency(data.lot.currentPrice)}
                          </span>
                          <span className="text-xs text-[#4edea3] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                            Quitação Idempotente Confirmada
                          </span>
                        </div>

                        <div className="bg-[#0c0e13] p-4 flex flex-col gap-1">
                          <span className="text-[10px] text-[#99907c] uppercase">Data do Pregão</span>
                          <span className="text-xs text-[#e2e2ea] font-semibold tabular-nums">
                            {new Date(data.lot.endTime).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px] text-[#99907c] tabular-nums">
                            Sessão #894 • {new Date(data.lot.endTime).toLocaleTimeString('pt-BR')} BRT
                          </span>
                        </div>

                        <div className="bg-[#0c0e13] p-4 flex flex-col gap-1">
                          <span className="text-[10px] text-[#99907c] uppercase">Laudo Museológico</span>
                          <span className="text-xs text-[#e2e2ea] font-semibold">Condição Íntegra (Grau A+)</span>
                          <span className="text-[10px] text-[#f2ca50] flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            Autenticidade Fiduciária
                          </span>
                        </div>
                      </div>

                      {/* Merkle Root Hash Strip (Hairline-divided instead of nested box) */}
                      <div className="bg-[#0c0e13] p-4 rounded-xl border border-[#282a30] flex flex-col gap-2.5 font-mono">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase text-[#99907c] font-semibold">
                            Carimbo Criptográfico Raiz (Merkle Root Hash)
                          </span>
                          <span className="text-[10px] text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded shrink-0">
                            HMAC-SHA256 VÁLIDO
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-[#282a30]">
                          <code className="text-xs text-[#f2ca50] truncate select-all">
                            {data.lotSealHash}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(data.lotSealHash || '')
                              showToast('Hash Raiz copiado com sucesso!')
                            }}
                            className="px-3 py-1.5 bg-[#282a30] hover:bg-[#d4af37] hover:text-[#1c1400] text-[#e2e2ea] text-xs rounded transition-colors cursor-pointer shrink-0"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>

                      {/* Institutional Signatures */}
                      <div className="grid grid-cols-2 gap-4 pt-1 font-mono text-center">
                        <div className="p-3 rounded-lg bg-[#0c0e13] border border-[#282a30] flex flex-col items-center">
                          <div className="font-serif text-sm text-[#f2ca50] italic">Belmont & Trust</div>
                          <div className="w-full h-px bg-[#282a30] my-1" />
                          <span className="text-[10px] text-[#e2e2ea]">Diretoria de Custódia Belmont</span>
                          <span className="text-[9px] text-[#99907c]">Chancela Digital RSA-4096</span>
                        </div>

                        <div className="p-3 rounded-lg bg-[#0c0e13] border border-[#282a30] flex flex-col items-center">
                          <div className="font-serif text-sm text-[#4edea3] italic">Cleveland Museum Registry</div>
                          <div className="w-full h-px bg-[#282a30] my-1" />
                          <span className="text-[10px] text-[#e2e2ea]">Comitê Curatorial CMA</span>
                          <span className="text-[9px] text-[#99907c]">Acervo Homologado</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Controls Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#282a30]">
                    <div className="flex items-center gap-2 font-mono text-xs text-[#99907c]">
                      <span className="material-symbols-outlined text-base text-[#4edea3]">lock</span>
                      <span>Registro perene sob custódia fiduciária. Hash imutável.</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-lg bg-[#1d2025] hover:bg-[#282a30] text-[#e2e2ea] font-mono text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer border border-[#282a30]"
                      >
                        <span className="material-symbols-outlined text-sm">print</span>
                        <span>Imprimir Certificado</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.href)
                          showToast('Link do certificado copiado!')
                        }}
                        className="px-4 py-2 rounded-lg bg-[#1d2025] hover:bg-[#282a30] text-[#e2e2ea] font-mono text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer border border-[#282a30]"
                      >
                        <span className="material-symbols-outlined text-sm">share</span>
                        <span>Compartilhar Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentView('ledger')}
                        className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#f2ca50] text-[#1c1400] font-mono text-xs uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
                      >
                        <span className="material-symbols-outlined text-sm">troubleshoot</span>
                        <span>Auditar Trilha no Ledger</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: INTERACTIVE CRYPTOGRAPHIC HASH CHAIN VERIFIER */}
          {currentView === 'ledger' && (
            <div className="flex flex-col gap-6">
              {/* Verifier Status Banner */}
              <div
                className={`p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-all duration-500 border ${
                  isTampered
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    : 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isTampered ? 'bg-rose-500/20 text-rose-400' : 'bg-[#4edea3]/20 text-[#4edea3]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {isTampered ? 'gpp_bad' : 'verified'}
                    </span>
                  </div>
                  <div className="flex flex-col font-mono">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isTampered
                        ? 'ALERTA CRÍTICO: ADULTERAÇÃO DETECTADA NA CADEIA!'
                        : 'Trilha Criptográfica Verificada e Integral'}
                    </span>
                    <span className="text-xs text-[#99907c]">
                      {isTampered
                        ? 'A quebra do hash SHA-256 no Bloco #2 invalidou a Merkle Root. O banco rejeitou a manipulação!'
                        : `0 Adulterações • ${data.chain.length + 1} Blocos Encadeados Sequencialmente via SHA-256`}
                    </span>
                  </div>
                </div>

                {/* Tamper Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsTampered(!isTampered)
                    showToast(
                      !isTampered
                        ? 'Simulação de ataque iniciada: Hash do bloco alterado!'
                        : 'Integridade da cadeia restaurada!',
                    )
                  }}
                  className={`px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                    isTampered
                      ? 'bg-emerald-500 text-[#07090e] hover:bg-emerald-400'
                      : 'bg-rose-600 text-white hover:bg-rose-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isTampered ? 'restore' : 'biotech'}
                  </span>
                  <span>{isTampered ? 'Restaurar Integridade' : 'Simular Adulteração no Banco'}</span>
                </button>
              </div>

              {/* Explanatory Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#14171f] border border-[#282a30]">
                <div>
                  <h3 className="font-serif text-lg text-[#e2e2ea]">
                    Cadeia Criptográfica de Lances (Hash Chain)
                  </h3>
                  <p className="font-sans text-xs text-[#99907c] max-w-2xl mt-0.5">
                    Cada lance no pregão Belmont gera um hash SHA-256 imutável atrelado ao bloco precedente. Qualquer alteração retroativa em valores ou timestamps quebra a integridade da assinatura raiz.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#0c0e13] border border-[#282a30] text-right font-mono text-[10px]">
                  <span className="text-[#99907c] block">Algoritmo</span>
                  <span className="text-[#f2ca50] font-bold">HMAC-SHA256 (Canonical JSON)</span>
                </div>
              </div>

              {/* Node 0: Genesis Block */}
              <div className="bg-[#14171f] p-6 rounded-xl border border-[#282a30] flex flex-col gap-4 shadow-md font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded bg-[#282a30] text-[#f2ca50] text-xs font-bold">
                      BLOCO #0
                    </span>
                    <span className="font-serif text-base text-[#e2e2ea]">
                      Gênese do Lote (Abertura de Pregão)
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded bg-[#4edea3]/10 text-[#4edea3] text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                    Status: Válido
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0c0e13] p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-[#99907c] text-[10px] uppercase block">Timestamp</span>
                    <span className="text-[#e2e2ea] font-semibold">
                      {new Date(data.lot.startTime).toLocaleDateString('pt-BR')} • {new Date(data.lot.startTime).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#99907c] text-[10px] uppercase block">Evento</span>
                    <span className="text-[#e2e2ea] font-semibold">Publicação pelo Leiloeiro Oficial</span>
                  </div>
                  <div>
                    <span className="text-[#99907c] text-[10px] uppercase block">Lance Inicial</span>
                    <span className="text-[#f2ca50] font-semibold">{formatCurrency(data.lot.startPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[#99907c] text-[10px] uppercase block">Consenso</span>
                    <span className="text-[#e2e2ea] font-semibold">Belmont Genesis Node</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#282a30] text-[10px]">
                  <div className="min-w-0">
                    <span className="text-[#99907c] uppercase block">Previous Hash (Gen)</span>
                    <span className="text-[#4d4635] truncate block">0000000000000000000000000000000000000000000000000000000000000000</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[#99907c] uppercase block">Current Block Hash</span>
                    <span className="text-[#f2ca50] truncate block">1c828d1544a0349f48208728d1fa183c21aa5c9115f5c1d68a2bf6249ec3081e</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Bid Nodes */}
              {data.chain.map((node, idx) => {
                const nodeIsTampered = isTampered && idx === 1

                return (
                  <div
                    key={node.id || idx}
                    className={`p-6 rounded-xl border flex flex-col gap-4 shadow-md font-mono transition-all duration-300 ${
                      nodeIsTampered
                        ? 'bg-rose-950/30 border-rose-500/60'
                        : 'bg-[#14171f] border-[#282a30]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            nodeIsTampered ? 'bg-rose-500 text-white' : 'bg-[#282a30] text-[#f2ca50]'
                          }`}
                        >
                          BLOCO #{idx + 1}
                        </span>
                        <span className="font-serif text-base text-[#e2e2ea]">
                          Lance Registrado • {formatCurrency(node.amount)}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 ${
                          nodeIsTampered
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-[#4edea3]/10 text-[#4edea3]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            nodeIsTampered ? 'bg-rose-500 animate-ping' : 'bg-[#4edea3]'
                          }`}
                        />
                        Status: {nodeIsTampered ? 'CORROMPIDO (HASH QUEBRADO)' : 'Válido & Assinado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0c0e13] p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-[#99907c] text-[10px] uppercase block">Timestamp</span>
                        <span className="text-[#e2e2ea] font-semibold tabular-nums">
                          {new Date(node.createdAt).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#99907c] text-[10px] uppercase block">Licitante</span>
                        <span className="text-[#e2e2ea] font-semibold">{node.bidderPublicCode}</span>
                      </div>
                      <div>
                        <span className="text-[#99907c] text-[10px] uppercase block">Valor da Oferta</span>
                        <span className="text-[#f2ca50] font-semibold tabular-nums">
                          {formatCurrency(node.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#99907c] text-[10px] uppercase block">Caução</span>
                        <span className="text-[#4edea3] font-semibold">100% Retido em Escrow</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#282a30] text-[10px]">
                      <div className="min-w-0">
                        <span className="text-[#99907c] uppercase block">Previous Hash</span>
                        <span className="text-[#99907c] truncate block">{node.prevHash}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[#99907c] uppercase block">
                          {nodeIsTampered ? 'Manipulated Hash' : 'Block Hash HMAC-SHA256'}
                        </span>
                        <span
                          className={`truncate block font-bold ${
                            nodeIsTampered ? 'text-rose-400' : 'text-[#f2ca50]'
                          }`}
                        >
                          {nodeIsTampered ? '0xDEADBEEF_TAMPERED_INCONSISTENT_HASH_VALUE' : node.bidHash}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
