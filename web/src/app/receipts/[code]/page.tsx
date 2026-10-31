'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Printer,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Gavel,
  BadgeCheck,
  Calendar,
} from 'lucide-react'

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

export default function ReceiptShareablePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const [data, setData] = useState<ReceiptData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedHash, setCopiedHash] = useState(false)

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2500)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <span className="text-xs tracking-wider">Verificando autenticidade do certificado oficial...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md py-24 px-4 text-center">
        <Award className="mx-auto h-12 w-12 text-rose-500 mb-4 stroke-[1.5]" />
        <h2 className="text-2xl font-serif font-bold text-white">Certificado Inexistente</h2>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">{error || 'O código informado não corresponde a uma liquidação pública oficial.'}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a Vitrine</span>
        </Link>
      </div>
    )
  }

  const { receipt } = data

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Barra Superior de Ações */}
      <div className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md py-4 print:hidden">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Vitrine</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar Link'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 transition cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Certificado Oficial (Documento Notarial Impresso) */}
      <div className="mx-auto max-w-4xl px-4 pt-10">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border-2 border-amber-500/35 p-8 sm:p-14 shadow-2xl relative overflow-hidden print:border-black print:bg-white print:text-black">
          {/* Marca d'água sutil de fundo */}
          <div className="absolute right-[-40px] top-[-40px] opacity-[0.03] pointer-events-none print:hidden">
            <Gavel className="w-96 h-96 text-amber-300" />
          </div>

          {/* Cabeçalho do Certificado */}
          <div className="text-center pb-8 border-b border-amber-500/25 relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-1.5 text-xs font-bold text-emerald-300 mb-4 shadow-sm">
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              <span>REGISTRO PÚBLICO OFICIAL DE ARREMATAÇÃO & LIQUIDAÇÃO</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-black text-white tracking-tight">
              BELMONT AUCTIONS
            </h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1.5 font-medium">
              Chancelaria Notarial Eletrônica • Prova de Autenticidade Criptográfica
            </p>

            <div className="mt-5 font-mono text-sm font-bold text-amber-400 bg-amber-950/50 inline-block px-4 py-1.5 rounded-xl border border-amber-800/80 shadow-inner">
              CÓDIGO DE AUTENTICIDADE: {receipt.code}
            </div>
          </div>

          {/* Seção da Obra Arrematada */}
          <div className="py-10 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
                <img
                  src={receipt.lot.imageUrl}
                  alt={receipt.lot.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop'
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col justify-center space-y-3.5">
              <div>
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block">
                  {receipt.lot.artist || 'Mestre Renomado'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {receipt.lot.title}
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Obra oficial arrematada e autenticada pela Belmont Auctions com registro criptográfico em cadeia.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs text-slate-400 font-mono">
                <span>Lote ID: <code className="text-slate-300">{receipt.lot.id.slice(0, 8)}</code></span>
                <span>•</span>
                <span>Disputa: <span className="text-amber-400 font-bold">{receipt.lot.totalBids} lances</span></span>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro & Titularidade */}
          <div className="py-8 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/90 p-5 shadow-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                Valor Final de Arremate
              </span>
              <span className="font-serif text-2xl sm:text-3xl font-black text-emerald-400 mt-2 block">
                {receipt.finalAmountFormatted}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Liquidado via Carteira</span>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/90 p-5 shadow-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                Arrematante Titular (LGPD)
              </span>
              <span className="font-sans text-lg font-bold text-white mt-2 block">
                {receipt.winner.maskedName}
              </span>
              <span className="text-[10px] font-mono text-blue-400 block mt-0.5">
                {receipt.winner.publicCode}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/90 p-5 shadow-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                Data do Arremate
              </span>
              <span className="font-mono text-sm font-bold text-white mt-2 block">
                {new Date(receipt.settledAt).toLocaleDateString()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {new Date(receipt.settledAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Selo Criptográfico Raiz */}
          <div className="pt-8">
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Selo Criptográfico Raiz do Lote (Root Seal Hash)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopyHash(receipt.lotSealHash)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedHash ? 'Copiado!' : 'Copiar Hash'}</span>
                  </button>

                  <Link
                    href={`/audit/${receipt.lot.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    <span>Auditar Corrente Completa</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 break-all select-all leading-relaxed shadow-inner">
                {receipt.lotSealHash}
              </div>
              <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
                Este hash é o selo criptográfico HMAC-SHA256 gerado a partir de toda a cadeia de lances. Qualquer adulteração retroativa quebra a prova matemática de integridade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
