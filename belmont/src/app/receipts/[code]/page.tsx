'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ReceiptData {
  receipt: {
    code: string
    finalAmountInCents: number
    finalAmountFormatted: string
    lotSealHash: string
    settledAt: string
    lot: {
      id: string
      title: string
      artist: string | null
      imageUrl: string
      totalBids: number
    }
    winner: {
      publicCode: string
      maskedName: string
    }
  }
}

export default function ShareableReceiptPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const [data, setData] = useState<ReceiptData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toastText, setToastText] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastText(msg)
    setTimeout(() => setToastText(null), 3000)
  }

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setIsLoading(true)
        const res = await apiRequest<ReceiptData>(`/receipts/${code}`)
        setData(res)
      } catch (err: any) {
        setError(err.message || 'Comprovante não localizado ou inválido.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchReceipt()
  }, [code])

  if (isLoading) {
    return (
      <div className="w-full pt-32 pb-20 flex min-h-[70vh] flex-col items-center justify-center gap-4 text-[#99907c] font-mono">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
        <span className="text-xs uppercase tracking-widest text-[#f2ca50]">
          Verificando autenticidade do certificado...
        </span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="w-full pt-32 pb-20 px-6 max-w-xl mx-auto text-center font-mono">
        <span className="material-symbols-outlined text-4xl text-rose-500 mb-3">
          workspace_premium
        </span>
        <h2 className="text-xl font-serif text-[#e2e2ea]">Certificado Inexistente</h2>
        <p className="mt-2 text-xs text-[#99907c]">{error || 'O código informado não corresponde a uma liquidação pública oficial.'}</p>
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

  const { receipt } = data

  return (
    <div className="w-full pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-24 md:pb-12 bg-[#07090E] min-h-screen text-[#e2e2ea] overflow-x-hidden">
      {toastText && (
        <div className="fixed bottom-8 right-8 z-50 p-4 rounded-xl bg-[#1d2025] border border-[#d4af37]/40 text-xs font-mono text-[#f2ca50] shadow-2xl">
          {toastText}
        </div>
      )}

      <div className="w-full px-3.5 sm:px-6 md:px-12 max-w-5xl mx-auto py-6 sm:py-10 flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-[#99907c] hover:text-[#f2ca50] uppercase transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Voltar ao Catálogo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Imprimir</span>
            </Button>
            <Button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href)
                showToast('Link do certificado copiado!')
              }}
            >
              <span className="material-symbols-outlined text-sm">share</span>
              <span>Compartilhar</span>
            </Button>
          </div>
        </div>

        {/* Guilloché Luxury Certificate Frame */}
        <div className="relative bg-[#0c0e13] p-3 sm:p-8 md:p-10 rounded-2xl shadow-2xl overflow-hidden border border-[#d4af37]/40">
          {/* Guilloché Pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10 pointer-events-none text-[#d4af37]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="guilloche-grid-receipt" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="0.6" />
                <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.4" />
                <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="0.4" />
                <path d="M 0,30 Q 30,0 60,30 Q 30,60 0,30" fill="none" stroke="currentColor" strokeWidth="0.3" />
                <path d="M 30,0 Q 60,30 30,60 Q 0,30 30,0" fill="none" stroke="currentColor" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#guilloche-grid-receipt)" />
          </svg>

          {/* Central Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="material-symbols-outlined text-[320px] text-[#d4af37]">
              account_balance
            </span>
          </div>

          <div className="relative bg-[#14171f]/90 backdrop-blur-md p-6 sm:p-10 rounded-xl flex flex-col gap-8 shadow-xl border border-[#4d4635]/40">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#282a30]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#0c0e13] flex items-center justify-center text-[#f2ca50] shadow-inner border border-[#d4af37]/30">
                  <img src="/belmont-crest.svg" alt="Belmont Crest" className="w-9 h-9 object-contain" />
                </div>
                <div className="flex flex-col text-center sm:text-left">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] font-bold">
                    BELMONT FINE ART AUCTIONS • EST. 1894
                  </span>
                  <span className="font-serif text-lg tracking-wide text-[#e2e2ea]">
                    Chancela Notarial de Arrematação
                  </span>
                  <span className="font-mono text-[10px] text-[#99907c]">
                    Protocolo Oficial: #{receipt.code}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#0c0e13] text-center w-full sm:w-auto min-w-0 sm:min-w-[170px] border border-[#282a30] font-mono">
                <div className="flex items-center gap-1.5 text-[#4edea3]">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span className="text-xs font-semibold uppercase">Liquidado</span>
                </div>
                <span className="text-[10px] text-[#99907c] mt-0.5">Idempotência Selada</span>
              </div>
            </div>

            {/* Master Title */}
            <div className="flex flex-col text-center items-center gap-2 max-w-2xl mx-auto">
              <span className="font-mono text-xs uppercase tracking-widest text-[#f2ca50] font-semibold">
                Certidão de Adjudicação & Quitação
              </span>
              <h1 className="font-serif text-3xl text-[#e2e2ea] leading-tight">
                Certificado Oficial de Arrematação
              </h1>
              <p className="font-sans text-xs text-[#99907c] leading-relaxed">
                Atestamos perante os órgãos de fiscalização patrimonial que a posse fiduciária da obra de arte abaixo identificada foi devidamente adjudicada em pregão público oficial.
              </p>
            </div>

            {/* Details Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 bg-[#0c0e13] p-4 rounded-xl flex flex-col gap-3 border border-[#282a30]">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                  <img
                    alt={receipt.lot.title}
                    className="w-full h-full object-cover"
                    src={receipt.lot.imageUrl || '/lot-preview.png'}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase text-[#f2ca50]">Obra Arrematada</span>
                  <span className="font-serif text-lg text-[#e2e2ea]">{receipt.lot.title}</span>
                  <span className="font-serif text-xs text-[#99907c] italic">
                    {receipt.lot.artist || 'Mestre da Arte'}
                  </span>
                </div>
              </div>

              <div className="md:col-span-7 flex flex-col justify-between gap-4">
                {/* Unified 2x2 Architectural Hairline Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#282a30] rounded-xl overflow-hidden border border-[#282a30] font-mono">
                  <div className="bg-[#0c0e13] p-4 flex flex-col gap-1">
                    <span className="text-[10px] text-[#99907c] uppercase">Arrematante Homologado</span>
                    <span className="text-sm font-bold text-[#f2ca50]">{receipt.winner.publicCode}</span>
                    <span className="text-xs text-[#e2e2ea]">{receipt.winner.maskedName}</span>
                    <span className="text-[9px] text-[#99907c]">Conformidade LGPD Art. 7º</span>
                  </div>

                  <div className="bg-[#0c0e13] p-4 flex flex-col gap-1">
                    <span className="text-[10px] text-[#99907c] uppercase">Valor de Arrematação</span>
                    <span className="text-sm font-bold text-[#4edea3] tabular-nums">
                      {receipt.finalAmountFormatted || formatCurrency(receipt.finalAmountInCents)}
                    </span>
                    <span className="text-xs text-[#4edea3] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                      Quitado em Escrow
                    </span>
                  </div>

                  <div className="bg-[#0c0e13] p-4 flex flex-col gap-1">
                    <span className="text-[10px] text-[#99907c] uppercase">Data de Liquidação</span>
                    <span className="text-xs text-[#e2e2ea] font-semibold tabular-nums">
                      {new Date(receipt.settledAt).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-[#99907c] tabular-nums">
                      {new Date(receipt.settledAt).toLocaleTimeString('pt-BR')} BRT
                    </span>
                  </div>

                  <div className="bg-[#0c0e13] p-4 flex flex-col gap-1">
                    <span className="text-[10px] text-[#99907c] uppercase">Total de Lances</span>
                    <span className="text-xs text-[#e2e2ea] font-semibold tabular-nums">
                      {receipt.lot.totalBids || 1} Lances Concorrentes
                    </span>
                    <span className="text-[10px] text-[#f2ca50]">Concorrência Estrita</span>
                  </div>
                </div>

                {/* Root Seal Hash (Hairline-divided instead of nested box) */}
                <div className="bg-[#0c0e13] p-4 rounded-xl border border-[#282a30] flex flex-col gap-2 font-mono">
                  <div className="flex items-center justify-between text-[10px] gap-2">
                    <span className="uppercase text-[#99907c] font-semibold">
                      Assinatura Raiz Merkle (Root Seal Hash)
                    </span>
                    <span className="text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded shrink-0">
                      HMAC-SHA256
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#282a30] flex items-center justify-between gap-2">
                    <code className="text-xs text-[#f2ca50] truncate select-all">
                      {receipt.lotSealHash || '0x09281bf78a4c8996fb92427ae41e428f5c907b22d140e53a2ef491907aa4c291'}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(receipt.lotSealHash || '')
                        showToast('Hash copiado!')
                      }}
                      className="px-3 py-1.5 rounded bg-[#282a30] hover:bg-[#d4af37] hover:text-[#1c1400] text-xs text-[#e2e2ea] transition-colors cursor-pointer shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 pt-1 font-mono text-center">
                  <div className="p-3 rounded-lg bg-[#0c0e13] border border-[#282a30] flex flex-col items-center">
                    <div className="font-serif text-sm text-[#f2ca50] italic">Belmont & Trust</div>
                    <div className="w-full h-px bg-[#282a30] my-1" />
                    <span className="text-[10px] text-[#e2e2ea]">Diretoria Notarial Belmont</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0c0e13] border border-[#282a30] flex flex-col items-center">
                    <div className="font-serif text-sm text-[#4edea3] italic">Cleveland Museum Registry</div>
                    <div className="w-full h-px bg-[#282a30] my-1" />
                    <span className="text-[10px] text-[#e2e2ea]">Comitê Curatorial</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#282a30] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[#99907c]">
              <span>Em conformidade com o Decreto Federal nº 21.981/32</span>
              <span className="text-[#4edea3] font-semibold">
                Registro Público Verificado • {receipt.code}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
