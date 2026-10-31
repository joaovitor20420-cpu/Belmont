'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Gavel,
  ShieldCheck,
  CreditCard,
  PieChart,
} from 'lucide-react'

interface TransactionItem {
  id: string
  amount: number
  type: 'DEPOSIT' | 'BID_LOCK' | 'BID_RELEASE' | 'SETTLEMENT'
  description: string | null
  createdAt: string
  lotId?: string | null
}

export default function WalletPage() {
  const { user, login } = useAuth()

  const [balances, setBalances] = useState<{
    total: number
    committed: number
    available: number
  }>({ total: 0, committed: 0, available: 0 })

  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estado de Depósito
  const [depositAmount, setDepositAmount] = useState('5000') // em reais
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState('')
  const [depositError, setDepositError] = useState('')

  const fetchWalletData = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const [balRes, stmtRes] = await Promise.all([
        apiRequest<{
          balances: {
            totalInCents: number
            committedInCents: number
            availableInCents: number
          }
        }>('/wallet/balance'),
        apiRequest<{
          transactions: TransactionItem[]
        }>('/wallet/statement'),
      ])

      setBalances({
        total: balRes.balances.totalInCents,
        committed: balRes.balances.committedInCents,
        available: balRes.balances.availableInCents,
      })
      setTransactions(stmtRes.transactions || [])
    } catch (err) {
      console.error('Erro ao carregar carteira:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [user])

  const handleDeposit = async (amountInCents: number) => {
    setIsDepositing(true)
    setDepositSuccess('')
    setDepositError('')
    try {
      await apiRequest('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amountInCents }),
      })
      setDepositSuccess(`Depósito simulado de ${formatCurrency(amountInCents)} creditado com sucesso!`)
      fetchWalletData()
    } catch (err: any) {
      setDepositError(err.message || 'Erro ao realizar depósito.')
    } finally {
      setIsDepositing(false)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-24 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 text-emerald-400 mb-5 shadow-2xl">
          <Wallet className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-white">Carteira Digital do Licitante</h2>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          Autentique-se com sua conta para consultar os saldos comprometidos em garantias e efetuar novos depósitos simulados.
        </p>
        <button
          onClick={() => login('bidder1@belmont.com', 'password123')}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-3 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Acessar como Carlos Drummond (LIC-0001)</span>
        </button>
      </div>
    )
  }

  // Cálculo da barra proporcional de saldos
  const availablePercent =
    balances.total > 0 ? Math.round((balances.available / balances.total) * 100) : 100
  const committedPercent = 100 - availablePercent

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header da Carteira */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-800/80 mb-3">
                Licitante Oficial • {user.publicCode}
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                Carteira Digital & Gestão de Saldos
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Cálculo atômico de saldos: Total, Comprometido em lances ativos e Disponível para novos arremates.
              </p>
            </div>

            <Link
              href="/"
              className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              Voltar ao Pregão
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
        {/* Barra de Distribuição Patrimonial */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-3">
            <span className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-amber-400" />
              <span>Distribuição de Capital na Plataforma</span>
            </span>
            <span className="font-mono text-slate-400">
              {availablePercent}% Disponível • {committedPercent}% Bloqueado
            </span>
          </div>

          {/* Barra Visual */}
          <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${availablePercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              title={`Disponível: ${availablePercent}%`}
            />
            <div
              style={{ width: `${committedPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
              title={`Comprometido: ${committedPercent}%`}
            />
          </div>
        </div>

        {/* 3 Cards de Saldo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card: Saldo Disponível */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 p-7 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Saldo Disponível
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 font-mono text-3xl sm:text-4xl font-black text-white">
              {formatCurrency(balances.available)}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              Recursos livres para cobrir novos lances e participar de qualquer leilão.
            </p>
          </div>

          {/* Card: Saldo Comprometido */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 p-7 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Saldo Comprometido
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/30">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 font-mono text-3xl sm:text-4xl font-black text-white">
              {formatCurrency(balances.committed)}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              Retido temporariamente como garantia nos lotes onde você é o atual líder.
            </p>
          </div>

          {/* Card: Saldo Total */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-7 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Patrimônio Total
              </span>
              <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
            </div>
            <div className="mt-5 font-mono text-3xl sm:text-4xl font-black text-white">
              {formatCurrency(balances.total)}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              Consolidação total (Disponível + Comprometido em disputa).
            </p>
          </div>
        </div>

        {/* Seção de Depósito Simulado */}
        <section className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-2">
            <PlusCircle className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-serif font-bold text-white">Depósito Imediato (Simulador)</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6 max-w-xl">
            Injete fundos simulados na sua conta para testar o bloqueio atômico de garantias e a liberação imediata de saldo caso outro licitante supere sua oferta.
          </p>

          {depositSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 mb-5 flex items-center gap-2.5 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{depositSuccess}</span>
            </div>
          )}

          {depositError && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200 mb-5 flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{depositError}</span>
            </div>
          )}

          {/* Chips Rápidos de Depósito */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
            <button
              disabled={isDepositing}
              onClick={() => handleDeposit(100000)}
              className="py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono font-bold text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              +{formatCurrency(100000)}
            </button>
            <button
              disabled={isDepositing}
              onClick={() => handleDeposit(500000)}
              className="py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono font-bold text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              +{formatCurrency(500000)}
            </button>
            <button
              disabled={isDepositing}
              onClick={() => handleDeposit(1000000)}
              className="py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono font-bold text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              +{formatCurrency(1000000)}
            </button>
            <button
              disabled={isDepositing}
              onClick={() => handleDeposit(5000000)}
              className="py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono font-bold text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              +{formatCurrency(5000000)}
            </button>
          </div>

          {/* Input de Valor Personalizado */}
          <div className="flex gap-3 max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Valor em reais"
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
              />
            </div>
            <button
              disabled={isDepositing || !depositAmount}
              onClick={() => handleDeposit(Math.round(parseFloat(depositAmount) * 100))}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-6 py-2.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              {isDepositing ? 'Creditando...' : 'Depositar'}
            </button>
          </div>
        </section>

        {/* Extrato Completo */}
        <section className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 shadow-xl">
          <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-slate-400" />
              <h2 className="text-base font-serif font-bold text-white">Extrato Notarial de Movimentações</h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {transactions.length} registros
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Nenhuma transação financeira registrada nesta conta.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Operação</th>
                    <th className="py-3.5 px-4">Descrição</th>
                    <th className="py-3.5 px-4">Data/Hora</th>
                    <th className="py-3.5 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {transactions.map((t) => {
                    let badgeClass = 'bg-slate-800 text-slate-300'
                    let label: string = t.type
                    let icon = null
                    let isCredit = false

                    if (t.type === 'DEPOSIT') {
                      badgeClass = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                      label = 'Depósito Creditado'
                      icon = <ArrowDownLeft className="h-3 w-3" />
                      isCredit = true
                    } else if (t.type === 'BID_LOCK') {
                      badgeClass = 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                      label = 'Bloqueio de Garantia'
                      icon = <Lock className="h-3 w-3" />
                    } else if (t.type === 'BID_RELEASE') {
                      badgeClass = 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
                      label = 'Garantia Liberada (Superado)'
                      icon = <ArrowUpRight className="h-3 w-3" />
                      isCredit = true
                    } else if (t.type === 'SETTLEMENT') {
                      badgeClass = 'bg-purple-950/80 text-purple-300 border border-purple-800/80'
                      label = 'Arremate Liquidado'
                      icon = <Gavel className="h-3 w-3" />
                    }

                    return (
                      <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeClass}`}
                          >
                            {icon}
                            <span>{label}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {t.description || 'Transação em carteira'}
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                        <td
                          className={`py-4 px-4 text-right font-mono font-bold text-sm ${
                            isCredit ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
