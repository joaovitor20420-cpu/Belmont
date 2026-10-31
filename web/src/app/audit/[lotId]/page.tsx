'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  ShieldCheck,
  ShieldAlert,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Bug,
  RotateCcw,
  Check,
  Lock,
  Copy,
  Layers,
  HelpCircle,
} from 'lucide-react'

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
  chainStatus: {
    tampered: boolean
    tamperedAtIndex: number | null
    reason: string | null
  }
  chain: AuditChainNode[]
}

export default function AuditVerifierPage({
  params,
}: {
  params: Promise<{ lotId: string }>
}) {
  const { lotId } = use(params)
  const [data, setData] = useState<AuditResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Simulador interativo de fraude
  const [simulatedTamperingIndex, setSimulatedTamperingIndex] = useState<number | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const fetchAuditData = async () => {
    try {
      setIsLoading(true)
      const [lotRes, verifyRes] = await Promise.all([
        apiRequest<{
          lot: {
            id: string
            title: string
            lotSealHash: string | null
            bids: Array<{
              id: string
              amount: number
              createdAt: string
              prevHash: string
              bidHash: string
              bidder: {
                publicCode: string
                maskedName: string
              }
            }>
          }
        }>(`/lots/${lotId}`),
        apiRequest<any>(`/audit/verify/${lotId}`),
      ])

      const sortedBids = [...(lotRes.lot.bids || [])].reverse()

      setData({
        lotId,
        lotTitle: lotRes.lot.title,
        isValid: verifyRes.isValid,
        totalBids: verifyRes.totalBidsChecked,
        lotSealHash: lotRes.lot.lotSealHash,
        chainStatus: {
          tampered: !verifyRes.isValid,
          tamperedAtIndex: verifyRes.tamperedBid ? verifyRes.tamperedBid.sequenceNumber : null,
          reason: verifyRes.tamperedBid ? verifyRes.tamperedBid.reason : null,
        },
        chain: sortedBids.map((b, i) => ({
          index: i + 1,
          id: b.id,
          amount: b.amount,
          createdAt: b.createdAt,
          bidderPublicCode: b.bidder.publicCode,
          bidderMaskedName: b.bidder.maskedName,
          prevHash: b.prevHash,
          bidHash: b.bidHash,
          status: 'VALID',
        })),
      })
      setSimulatedTamperingIndex(null)
    } catch (err: any) {
      setError(err.message || 'Falha ao processar trilha criptográfica.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditData()
  }, [lotId])

  const handleSimulateTamper = (index: number) => {
    setSimulatedTamperingIndex(index)
  }

  const handleResetSimulation = () => {
    setSimulatedTamperingIndex(null)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-xs tracking-wider">Recalculando e auditando hashes HMAC-SHA256...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md py-24 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-rose-500 mb-4 stroke-[1.5]" />
        <h2 className="text-2xl font-serif font-bold text-white">Falha na Auditoria</h2>
        <p className="mt-2 text-xs text-slate-400">{error || 'O pregão não pôde ser auditado.'}</p>
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

  const isCurrentlyTampered =
    data.chainStatus.tampered || simulatedTamperingIndex !== null

  const tamperedIndex =
    simulatedTamperingIndex !== null
      ? simulatedTamperingIndex
      : data.chainStatus.tamperedAtIndex

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Sub-Header */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-4">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between">
          <Link
            href={`/lots/${lotId}`}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para a Sala de Pregão</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Pregão:</span>
            <span className="text-white font-semibold">{data.lotTitle}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10 space-y-10">
        {/* Banner Geral de Integridade */}
        <div
          className={`rounded-3xl border-2 p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-500 ${
            !isCurrentlyTampered
              ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/50 shadow-emerald-950/20'
              : 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-900 border-rose-500/70 shadow-rose-950/40 animate-pulse'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className={`h-18 w-18 rounded-3xl flex items-center justify-center shrink-0 border-2 shadow-xl ${
                  !isCurrentlyTampered
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/50'
                }`}
              >
                {!isCurrentlyTampered ? (
                  <ShieldCheck className="h-10 w-10 stroke-[1.75]" />
                ) : (
                  <ShieldAlert className="h-10 w-10 stroke-[1.75]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                      !isCurrentlyTampered
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {!isCurrentlyTampered
                      ? 'PROVA MATEMÁTICA 100% ÍNTEGRA'
                      : 'VIOLAÇÃO DETECTADA! CORRENTE QUEBRADA'}
                  </span>
                </div>
                <h1 className="mt-2.5 text-2xl sm:text-4xl font-serif font-black text-white leading-tight">
                  {!isCurrentlyTampered
                    ? 'Trilha Criptográfica Inviolada'
                    : `Adulteração Identificada no Bloco #${tamperedIndex !== null ? tamperedIndex + 1 : '?'}`}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {!isCurrentlyTampered
                    ? 'Todos os hashes HMAC-SHA256 correspondem exatamente ao histórico ordenado. Nenhum registro foi inserido, alterado ou excluído no banco de dados.'
                    : simulatedTamperingIndex !== null
                    ? 'SIMULAÇÃO ATIVA: Um dado de lance foi corrompido no banco. Como o hash recalculado não confere com a assinatura em cadeia, o sistema rejeitou o lote imediatamente.'
                    : `MOTIVO DA FALHA: ${data.chainStatus.reason || 'Corrupção de integridade'}`}
                </p>
              </div>
            </div>

            {/* Ações do Simulador de Fraude */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {simulatedTamperingIndex === null ? (
                data.chain.length > 0 && (
                  <button
                    onClick={() => handleSimulateTamper(0)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-xs font-bold text-rose-200 transition-all shadow-xl shadow-rose-950/50 cursor-pointer active:scale-95"
                  >
                    <Bug className="h-4 w-4 text-rose-400" />
                    <span>Simular Tentativa de Fraude</span>
                  </button>
                )
              ) : (
                <button
                  onClick={handleResetSimulation}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-xs font-bold text-white transition-all shadow-xl shadow-emerald-950/50 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Restaurar Estado Legítimo</span>
                </button>
              )}
            </div>
          </div>

          {/* Dados Resumidos */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Lances na Corrente</span>
              <span className="font-mono text-white font-black text-lg">{data.totalBids}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Algoritmo de Prova</span>
              <span className="font-mono text-amber-400 font-bold text-sm">HMAC-SHA256</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block font-medium">Selo Raiz Oficial (Lot Seal)</span>
              <span className="font-mono text-[11px] text-emerald-300 truncate block mt-0.5">
                {data.lotSealHash || 'Aguardando encerramento'}
              </span>
            </div>
          </div>
        </div>

        {/* Visualizador da Corrente de Blocos */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2.5">
                <LinkIcon className="h-5 w-5 text-amber-400" />
                Estrutura Sequencial da Hash Chain
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Cada lance incorpora o hash do lance anterior (<code className="text-slate-300 font-mono">prevHash</code>) e gera sua própria assinatura inviolável (<code className="text-slate-300 font-mono">bidHash</code>).
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>Gênese: 000000000000...</span>
            </div>
          </div>

          {data.chain.length === 0 ? (
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-16 text-center text-xs text-slate-400">
              Este lote ainda não possui lances registrados na cadeia.
            </div>
          ) : (
            <div className="space-y-5">
              {data.chain.map((node, i) => {
                const isTamperedNode =
                  (simulatedTamperingIndex !== null && i >= simulatedTamperingIndex) ||
                  (data.chainStatus.tamperedAtIndex !== null && i >= data.chainStatus.tamperedAtIndex)

                return (
                  <div key={node.id} className="relative">
                    {/* Linha vertical conectora entre blocos */}
                    {i < data.chain.length - 1 && (
                      <div
                        className={`absolute left-7 top-20 bottom-[-24px] w-0.5 z-0 transition-colors ${
                          isTamperedNode ? 'bg-rose-500/80' : 'bg-slate-700'
                        }`}
                      />
                    )}

                    <div
                      className={`relative z-10 rounded-3xl border-2 p-6 transition-all duration-300 shadow-xl ${
                        isTamperedNode
                          ? 'bg-rose-950/40 border-rose-600/80 shadow-rose-950/40'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold border ${
                              isTamperedNode
                                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30'
                                : 'bg-slate-800 text-amber-400 border-slate-700'
                            }`}
                          >
                            #{node.index}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {node.bidderMaskedName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800">
                                {node.bidderPublicCode}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(node.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-lg font-black text-white">
                            {formatCurrency(node.amount)}
                          </span>
                          {isTamperedNode ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                              ASSINATURA ROMPIDA
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              ELO VÁLIDO
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hashes do Nó */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-mono">
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                            <span>Previous Hash (Elo Anterior)</span>
                            <button
                              onClick={() => handleCopy(node.prevHash)}
                              className="text-slate-400 hover:text-white transition cursor-pointer"
                              title="Copiar hash"
                            >
                              {copiedHash === node.prevHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <span className="text-slate-300 break-all select-all block leading-relaxed text-[11px]">
                            {node.prevHash}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl border ${
                            isTamperedNode
                              ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                              : 'bg-slate-950 border-slate-800/80 text-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                            <span>Bid Hash (HMAC-SHA256 Assinado)</span>
                            <button
                              onClick={() => handleCopy(node.bidHash)}
                              className="text-slate-400 hover:text-white transition cursor-pointer"
                              title="Copiar hash"
                            >
                              {copiedHash === node.bidHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <span className="break-all select-all block leading-relaxed text-[11px]">
                            {isTamperedNode && simulatedTamperingIndex === i
                              ? '⚠️ 9f8a3c... (HMAC INVALIDADO POR ALTERAÇÃO)'
                              : node.bidHash}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
