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

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Executando prova matemática de integridade HMAC-SHA256...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md py-20 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Erro na Auditoria</h2>
        <p className="mt-2 text-xs text-slate-400">{error || 'Lote não localizado.'}</p>
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

  // Se houver simulação de adulteração ativa, muta os dados visualmente
  const isCurrentlyTampered =
    data.chainStatus.tampered || simulatedTamperingIndex !== null

  const tamperedIndex =
    simulatedTamperingIndex !== null
      ? simulatedTamperingIndex
      : data.chainStatus.tamperedAtIndex

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header com Navegação */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-3">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between">
          <Link
            href={`/lots/${lotId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para a Sala de Pregão</span>
          </Link>

          <span className="text-xs font-mono font-semibold text-slate-400">
            Lote: {data.lotTitle}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10 space-y-8">
        {/* Banner de Resultado Geral */}
        <div
          className={`rounded-3xl border p-8 shadow-2xl relative overflow-hidden transition duration-500 ${
            !isCurrentlyTampered
              ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40'
              : 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-900 border-rose-500/60 animate-pulse'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border ${
                  !isCurrentlyTampered
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/40'
                }`}
              >
                {!isCurrentlyTampered ? (
                  <ShieldCheck className="h-9 w-9" />
                ) : (
                  <ShieldAlert className="h-9 w-9" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      !isCurrentlyTampered
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {!isCurrentlyTampered
                      ? 'Integridade Matemática 100% Autêntica'
                      : 'Adulteração Detectada! Corrente Quebrada'}
                  </span>
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-serif font-extrabold text-white">
                  {!isCurrentlyTampered
                    ? 'Trilha Criptográfica Inviolada'
                    : `Violação Identificada no Elo #${tamperedIndex !== null ? tamperedIndex + 1 : '?'}`}
                </h1>
                <p className="mt-1 text-xs text-slate-300 max-w-xl">
                  {!isCurrentlyTampered
                    ? 'Todos os hashes HMAC-SHA256 correspondem exatamente ao histórico ordenado. Nenhum lance foi inserido, alterado ou excluído diretamente no banco de dados.'
                    : simulatedTamperingIndex !== null
                    ? 'SIMULAÇÃO ATIVA: O valor ou os metadados do lance foram alterados. Como o HMAC recalculado não confere com o original, a assinatura criptográfica foi desfeita.'
                    : `MOTIVO DA FALHA: ${data.chainStatus.reason || 'Corrupção de integridade'}`}
                </p>
              </div>
            </div>

            {/* Ações do Simulador */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              {simulatedTamperingIndex === null ? (
                data.chain.length > 0 && (
                  <button
                    onClick={() => handleSimulateTamper(0)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-xs font-bold text-rose-200 transition shadow-lg shadow-rose-950/50"
                  >
                    <Bug className="h-4 w-4 text-rose-400" />
                    <span>Simular Tentativa de Fraude</span>
                  </button>
                )
              ) : (
                <button
                  onClick={handleResetSimulation}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-lg"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Restaurar Estado Legítimo</span>
                </button>
              )}
            </div>
          </div>

          {/* Dados Resumidos */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Lances na Corrente</span>
              <span className="font-mono text-white font-bold text-base">{data.totalBids}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Algoritmo de Prova</span>
              <span className="font-mono text-amber-400 font-bold">HMAC-SHA256</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block font-medium">Selo Raiz Oficial (Lot Seal)</span>
              <span className="font-mono text-[11px] text-emerald-300 truncate block">
                {data.lotSealHash || 'Aguardando encerramento'}
              </span>
            </div>
          </div>
        </div>

        {/* Visualizador da Corrente de Blocos (Blockchain-style Hash Chain) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-amber-400" />
                Estrutura Sequencial da Hash Chain
              </h2>
              <p className="text-xs text-slate-400">
                Cada lance incorpora o hash do lance anterior (<code className="text-slate-300">prevHash</code>) e gera sua própria assinatura criptográfica (<code className="text-slate-300">bidHash</code>).
              </p>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Gênese: <code>000000000000...</code>
            </span>
          </div>

          {data.chain.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center text-xs text-slate-400">
              Este lote ainda não possui lances registrados para auditar.
            </div>
          ) : (
            <div className="space-y-4">
              {data.chain.map((node, i) => {
                const isTamperedNode =
                  (simulatedTamperingIndex !== null && i >= simulatedTamperingIndex) ||
                  (data.chainStatus.tamperedAtIndex !== null && i >= data.chainStatus.tamperedAtIndex)

                return (
                  <div key={node.id} className="relative">
                    {/* Linha vertical conectora entre blocos */}
                    {i < data.chain.length - 1 && (
                      <div
                        className={`absolute left-6 top-16 bottom-[-20px] w-0.5 z-0 transition ${
                          isTamperedNode ? 'bg-rose-500' : 'bg-slate-700'
                        }`}
                      />
                    )}

                    <div
                      className={`relative z-10 rounded-2xl border p-5 transition duration-300 ${
                        isTamperedNode
                          ? 'bg-rose-950/40 border-rose-600/80 shadow-lg shadow-rose-950/40'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold border ${
                              isTamperedNode
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-slate-800 text-amber-400 border-slate-700'
                            }`}
                          >
                            #{node.index}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">
                              {node.bidderMaskedName}
                            </span>
                            <span className="ml-2 text-[10px] font-mono text-slate-400 px-1 rounded bg-slate-950 border border-slate-800">
                              {node.bidderPublicCode}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(node.createdAt).toLocaleTimeString()}
                          </span>
                          <span className="font-mono text-base font-extrabold text-white">
                            {formatCurrency(node.amount)}
                          </span>
                          {isTamperedNode ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              CORROMPIDO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              ÍNDICE VÁLIDO
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Exibição dos Hashes Conectados */}
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                            Previous Hash (Elo Anterior)
                          </span>
                          <span className="text-slate-300 break-all select-all">
                            {node.prevHash}
                          </span>
                        </div>

                        <div
                          className={`p-2.5 rounded-xl border ${
                            isTamperedNode
                              ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                              : 'bg-slate-950 border-slate-800/80 text-emerald-300'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                            Bid Hash (HMAC-SHA256 Assinado)
                          </span>
                          <span className="break-all select-all">
                            {isTamperedNode && simulatedTamperingIndex === i
                              ? '⚠️ 9f8a3c... (HASH ALTERADO FRAUDULENTAMENTE)'
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
