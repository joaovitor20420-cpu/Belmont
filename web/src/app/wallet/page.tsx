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
      setDepositSuccess(`Depósito simulado de ${formatCurrency(amountInCents)} efetuado com sucesso!`)
      fetchWalletData()
    } catch (err: any) {
      setDepositError(err.message || 'Erro ao realizar depósito.')
    } finally {
      setIsDepositing(false)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-20 px-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 mb-4">
          <Wallet className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Carteira Digital do Licitante</h2>
        <p className="mt-2 text-xs text-slate-400">
          Você precisa estar conectado para visualizar seus saldos e realizar depósitos simulados.
        </p>
        <button
          onClick={() => login('bidder1@belmont.com', 'password123')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition"
        >
          <Sparkles className="h-4 w-4" />
          <span>Acessar com Licitante 1 (Carlos - LIC-0001)</span>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header da Carteira */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800 mb-2">
                Licitante • {user.publicCode}
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Carteira Digital & Extrato de Lances
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Acompanhe o saldo total, o valor comprometido em disputas ativas e realize depósitos instantâneos.
              </p>
            </div>

            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Ir para o Pregão
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Cards de Saldo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Saldo Disponível */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Saldo Disponível
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 font-mono text-3xl font-extrabold text-white">
              {formatCurrency(balances.available)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Livre para cobrir lances e participar de novos leilões.
            </p>
          </div>

          {/* Saldo Comprometido */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Saldo Comprometido
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 font-mono text-3xl font-extrabold text-white">
              {formatCurrency(balances.committed)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Bloqueado temporariamente como garantia nos lotes onde você é o líder atual.
            </p>
          </div>

          {/* Saldo Total */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Patrimônio Total
              </span>
              <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 font-mono text-3xl font-extrabold text-white">
              {formatCurrency(balances.total)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Soma total (Disponível + Comprometido).
            </p>
          </div>
        </div>

        {/* Seção de Depósito Simulado */}
        <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-1">
            <PlusCircle className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Realizar Depósito Simulado</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Adicione saldo instantâneo à sua carteira para testar a mecânica de lances, bloqueio de garantia e liberação imediata ao ser superado.
          </p>

          {depositSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{depositSuccess}</span>
            </div>
          )}

          {depositError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{depositError}</span>
            </div>
          )}

          {/* Botões Rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <button
              disabled={isDepositing}
              onClick={() => handleDeposit(100000)}
              className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-white transition disabled:opacity-50"
            >
              +{formatCurrency(100000)}
            </button>
            <button
              disabled={isDepositing}
              onClick={() => handleDeposit(500000)}
              className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-white transition disabled:opacity-50"
            >
              +{formatCurrency(500000)}
            </button>
            <button
              disabled={isDepositing}
              onClick={() => handleDeposit(1000000)}
              className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-white transition disabled:opacity-50"
            >
              +{formatCurrency(1000000)}
            </button>
            <button
              disabled={isDepositing}
              onClick={() => handleDeposit(5000000)}
              className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-white transition disabled:opacity-50"
            >
              +{formatCurrency(5000000)}
            </button>
          </div>

          {/* Valor Personalizado */}
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Valor personalizado"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <button
              disabled={isDepositing || !depositAmount}
              onClick={() => handleDeposit(Math.round(parseFloat(depositAmount) * 100))}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-40"
            >
              {isDepositing ? 'Processando...' : 'Depositar'}
            </button>
          </div>
        </section>

        {/* Extrato de Transações */}
        <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h2 className="text-base font-bold text-white">Extrato Completo de Movimentações</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">
              {transactions.length} registros
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhuma movimentação financeira encontrada nesta carteira.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {transactions.map((t) => {
                    let badgeClass = 'bg-slate-800 text-slate-300'
                    let label: string = t.type
                    let icon = null
                    let isCredit = false

                    if (t.type === 'DEPOSIT') {
                      badgeClass = 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      label = 'Depósito'
                      icon = <ArrowDownLeft className="h-3 w-3" />
                      isCredit = true
                    } else if (t.type === 'BID_LOCK') {
                      badgeClass = 'bg-amber-950 text-amber-300 border border-amber-800'
                      label = 'Bloqueio de Lance'
                      icon = <Lock className="h-3 w-3" />
                    } else if (t.type === 'BID_RELEASE') {
                      badgeClass = 'bg-blue-950 text-blue-300 border border-blue-800'
                      label = 'Liberação (Superado)'
                      icon = <ArrowUpRight className="h-3 w-3" />
                      isCredit = true
                    } else if (t.type === 'SETTLEMENT') {
                      badgeClass = 'bg-purple-950 text-purple-300 border border-purple-800'
                      label = 'Arremate Oficial'
                      icon = <Gavel className="h-3 w-3" />
                    }

                    return (
                      <tr key={t.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}
                          >
                            {icon}
                            <span>{label}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {t.description || 'Movimentação da carteira'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
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
