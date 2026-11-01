'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'

interface TransactionItem {
  id: string
  amount: number
  type: 'DEPOSIT' | 'BID_LOCK' | 'BID_RELEASE' | 'SETTLEMENT' | 'SETTLEMENT_CREDIT'
  description: string | null
  createdAt: string
  lotId?: string | null
  hash?: string
}

export default function DigitalWalletPage() {
  const { user } = useAuth()
  const isAuctioneer = user?.role === 'AUCTIONEER'

  const [balances, setBalances] = useState<{
    total: number
    committed: number
    available: number
  }>({ total: 0, committed: 0, available: 0 })

  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [filterCategory, setFilterCategory] = useState<'all' | 'lock' | 'settlement' | 'deposit'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Estado de Depósito / Reforço
  const [depositAmountBRL, setDepositAmountBRL] = useState('10000')
  const [depositMethod, setDepositMethod] = useState<'pix' | 'ted'>('pix')
  const [isDepositing, setIsDepositing] = useState(false)
  const [toastMessage, setToastMessage] = useState<{
    title: string
    message: string
  } | null>(null)

  const showToast = (title: string, message: string) => {
    setToastMessage({ title, message })
    setTimeout(() => setToastMessage(null), 5000)
  }

  const fetchWalletData = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const [balRes, stmtRes] = await Promise.all([
        apiRequest<any>('/wallet/balance'),
        apiRequest<{
          transactions: TransactionItem[]
        }>('/wallet/statement'),
      ])

      const total =
        balRes?.balances?.totalInCents ?? balRes?.balanceTotal ?? 0
      const committed =
        balRes?.balances?.committedInCents ?? balRes?.balanceCommitted ?? 0
      const available =
        balRes?.balances?.availableInCents ?? balRes?.balanceAvailable ?? 0

      setBalances({
        total,
        committed,
        available,
      })

      // Identificador real de auditoria por transação
      const txs = (stmtRes?.transactions || []).map((t) => ({
        ...t,
        hash: t.hash || t.id,
      }))

      setTransactions(txs)
    } catch (err) {
      console.error('Erro ao carregar carteira:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [user])

  // Aporte instantâneo
  const handleExecuteDeposit = async () => {
    if (!user) {
      showToast('Autenticação Necessária', 'Identifique-se para aportar garantia.')
      return
    }

    const val = parseFloat(depositAmountBRL)
    if (isNaN(val) || val <= 0) return

    setIsDepositing(true)
    const amountInCents = Math.round(val * 100)

    try {
      await apiRequest('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amountInCents }),
      })

      showToast(
        'Aporte Concluído',
        `Garantia fiduciária de ${formatCurrency(amountInCents)} creditada com liquidação atômica.`,
      )
      fetchWalletData()
    } catch (err: any) {
      showToast('Falha no Aporte', err.message || 'Erro ao processar garantia.')
    } finally {
      setIsDepositing(false)
    }
  }

  // Cálculos de alocação de capital
  const total = balances.total || 1
  const lockedPct = Math.round((balances.committed / total) * 100)
  const availablePct = Math.max(0, 100 - lockedPct)

  const filteredTransactions = transactions.filter((tx) => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'lock')
      return tx.type === 'BID_LOCK' || tx.type === 'BID_RELEASE'
    if (filterCategory === 'settlement')
      return tx.type === 'SETTLEMENT' || tx.type === 'SETTLEMENT_CREDIT'
    if (filterCategory === 'deposit') return tx.type === 'DEPOSIT'
    return true
  })

  return (
    <div className="w-full pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* Dynamic Notification Bar (Toast) */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 p-4 rounded-xl bg-[#1d2025] border border-[#d4af37]/40 shadow-2xl transition-all duration-300 max-w-md">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#4edea3] text-2xl">
              verified
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs text-[#e2e2ea] font-bold">
                {toastMessage.title}
              </span>
              <span className="font-sans text-xs text-[#99907c]">
                {toastMessage.message}
              </span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-auto text-[#99907c] hover:text-[#e2e2ea] text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Page Header & Credential Strip */}
      <div className="w-full px-6 lg:px-12 py-10 bg-[#0c0e13] border-b border-[#282a30]">
        <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-mono text-[10px] tracking-widest uppercase flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#4edea3] inline-block" />
                Conta Segregada Ativa
              </span>
              <span className="font-mono text-[10px] text-[#99907c] tracking-wider uppercase">
                Custódia Multilateral • Lei 21.981/32
              </span>
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl text-[#e2e2ea] tracking-tight">
              {isAuctioneer
                ? 'Recebimentos & Caixa do Leiloeiro'
                : 'Carteira Digital & Custódia Fiduciária'}
            </h1>
            <p className="font-sans text-base text-[#d0c5af] max-w-2xl mt-1">
              {isAuctioneer
                ? 'Apuração em tempo real das receitas de arrematação liquidadas e extrato fiduciário oficial da casa leiloeira.'
                : 'Gestão de margens de garantia, cauções segregadas e liquidação financeira do licitante sob supervisão contábil e criptográfica.'}
            </p>
          </div>

          {/* Verified Identity Shield Pill */}
          {user ? (
            <div className="p-4 rounded-xl bg-[#14171f] border border-[#d4af37]/30 flex items-center gap-4 shrink-0 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-[#282a30] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#f2ca50] text-2xl">
                  shield_with_heart
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#f2ca50] tracking-wider">
                    {user.publicCode}
                  </span>
                  <span className="font-mono text-[10px] text-[#4edea3] bg-[#4edea3]/10 px-1.5 py-0.5 rounded uppercase font-semibold">
                    {user.role}
                  </span>
                </div>
                <span className="font-sans text-sm text-[#e2e2ea] font-medium">
                  {user.name}
                </span>
                <span className="font-mono text-[10px] text-[#99907c]">
                  Homologação Institucional • KYC Auditado
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#14171f] border border-[#282a30] flex items-center gap-3 text-left">
              <span className="material-symbols-outlined text-[#f2ca50] text-2xl">
                account_balance_wallet
              </span>
              <div>
                <div className="font-mono text-xs text-[#e2e2ea] font-bold">
                  Sessão Não Autenticada
                </div>
                <div className="font-sans text-xs text-[#99907c]">
                  Use o botão &ldquo;Entrar / Criar Conta&rdquo; no topo para acessar sua carteira
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full px-6 lg:px-12 py-10 max-w-[1600px] mx-auto flex flex-col gap-5">
        {/* Tri-Fold Financial Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Saldo Total */}
          <div className="p-6 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#99907c]">
                  Posição Consolidada
                </span>
                <span className="font-serif text-lg text-[#e2e2ea] mt-1">
                  Saldo Total em Custódia
                </span>
              </div>
              <span className="material-symbols-outlined text-[#99907c] group-hover:text-[#f2ca50] transition-colors">
                account_balance
              </span>
            </div>
            <div className="my-4">
              <div className="font-serif text-3xl font-bold text-[#e2e2ea] tracking-tight">
                {formatCurrency(balances.total)}
              </div>
              <div className="font-sans text-xs text-[#99907c] mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#4edea3]">
                  check_circle
                </span>
                Garantia auditada por Banco Central do Brasil & PwC
              </div>
            </div>
            <div className="pt-2 bg-[#0c0e13]/80 -mx-6 -mb-6 px-6 py-2 flex items-center justify-between border-t border-[#282a30] font-mono text-[10px]">
              <span className="text-[#99907c]">CONTA ESCROW #7792-BC</span>
              <span className="text-[#4edea3] font-medium">100% LASTREADO</span>
            </div>
          </div>

          {/* Card 2: Saldo Comprometido */}
          <div className="p-6 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#f2ca50]">
                  Margem Retida em Pregão
                </span>
                <span className="font-serif text-lg text-[#e2e2ea] mt-1">
                  Saldo Comprometido
                </span>
              </div>
              <span className="material-symbols-outlined text-[#f2ca50] group-hover:animate-pulse">
                lock_clock
              </span>
            </div>
            <div className="my-4">
              <div className="font-serif text-3xl font-bold text-[#f2ca50] tracking-tight">
                {formatCurrency(balances.committed)}
              </div>
              <div className="font-sans text-xs text-[#99907c] mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#f2ca50]">
                  priority_high
                </span>
                Garantia integral de 100% retida em lotes com lance líder ativo
              </div>
            </div>
            <div className="pt-2 bg-[#0c0e13]/80 -mx-6 -mb-6 px-6 py-2 flex items-center justify-between border-t border-[#282a30] font-mono text-[10px]">
              <span className="text-[#f2ca50] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50] inline-block" />
                CAUÇÃO ATIVA
              </span>
              <span className="text-[#99907c]">LIBERAÇÃO ATÔMICA</span>
            </div>
          </div>

          {/* Card 3: Saldo Disponível */}
          <div className="p-6 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#4edea3]">
                  Poder de Lance Imediato
                </span>
                <span className="font-serif text-lg text-[#e2e2ea] mt-1">
                  Saldo Disponível
                </span>
              </div>
              <span className="material-symbols-outlined text-[#4edea3]">
                payments
              </span>
            </div>
            <div className="my-4">
              <div className="font-serif text-3xl font-bold text-[#4edea3] tracking-tight">
                {formatCurrency(balances.available)}
              </div>
              <div className="font-sans text-xs text-[#99907c] mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#4edea3]">
                  bolt
                </span>
                Livre para novas ofertas e contrapropostas em tempo real
              </div>
            </div>
            <div className="pt-2 bg-[#0c0e13]/80 -mx-6 -mb-6 px-6 py-2 flex items-center justify-between border-t border-[#282a30] font-mono text-[10px]">
              <span className="text-[#4edea3] font-medium">DISPONIBILIDADE ZERO-LATÊNCIA</span>
              <span className="text-[#99907c]">SSE SINCRONIZADO</span>
            </div>
          </div>
        </div>

        {/* Proportional Capital Allocation Bar & Explanatory Architecture */}
        <div className="p-6 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#99907c]">
                Segregação Patrimonial Instantânea
              </span>
              <span className="font-serif text-lg text-[#e2e2ea]">
                Distribuição das Reservas do Licenciamento
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f2ca50] inline-block" />
                <span className="text-[#d0c5af]">
                  Comprometido: {lockedPct}% ({formatCurrency(balances.committed)})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3] inline-block" />
                <span className="text-[#d0c5af]">
                  Disponível: {availablePct}% ({formatCurrency(balances.available)})
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Bar Visualization */}
          <div className="w-full h-3 bg-[#0c0e13] rounded-full flex overflow-hidden p-0.5 border border-[#282a30]">
            <div
              className="h-full bg-[#f2ca50] rounded-l-full transition-all duration-500 ease-out"
              style={{ width: `${lockedPct}%` }}
              title={`Comprometido: ${formatCurrency(balances.committed)} (${lockedPct}%)`}
            />
            <div className="w-0.5 bg-[#07090e]" />
            <div
              className="h-full bg-[#4edea3] rounded-r-full transition-all duration-500 ease-out"
              style={{ width: `${availablePct}%` }}
              title={`Disponível: ${formatCurrency(balances.available)} (${availablePct}%)`}
            />
          </div>

          {/* Descriptive Microcopy Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-2.5 text-[#99907c] font-sans text-xs">
              <span className="material-symbols-outlined text-[#f2ca50] text-base mt-0.5 shrink-0">
                cached
              </span>
              <span>
                <strong className="text-[#e2e2ea]">Desbloqueio Atômico Automático:</strong> Caso o seu lance seja superado por outro investidor no pregão ao vivo, a margem vinculada ao lote retorna imediatamente ao Saldo Disponível sem necessidade de solicitação manual.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-[#99907c] font-sans text-xs">
              <span className="material-symbols-outlined text-[#4edea3] text-base mt-0.5 shrink-0">
                verified_user
              </span>
              <span>
                <strong className="text-[#e2e2ea]">Segregação Inviolável:</strong> Os valores de caução repousam em subconta fiduciária individualizada, imunes a arresto, penhora ou obrigações operacionais da Belmont Fine Art Trust.
              </span>
            </div>
          </div>
        </div>

        {/* Main Operational Grid: Deposit Simulator & Ledger Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-5">
          {/* Left Column: Instant Reforço de Garantia (Bidder) or Resumo de Recebimentos (Auctioneer) (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {isAuctioneer ? (
              <div className="p-6 rounded-xl bg-[#14171f] border border-[#d4af37]/30 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#282a30]">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#f2ca50]">
                      Tesouraria do Leiloeiro Oficial
                    </span>
                    <span className="font-serif text-lg text-[#e2e2ea]">
                      Recebimentos de Liquidação
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#4edea3] text-xl">
                    payments
                  </span>
                </div>

                <p className="font-sans text-xs text-[#d0c5af] leading-relaxed">
                  Como <strong>Leiloeiro Oficial ({user?.publicCode})</strong>, você não realiza lances nem deposita caução de licitante. O seu caixa recebe automaticamente 100% do valor dos lotes liquidados no instante da batida do martelo (<code className="text-[#4edea3] font-mono">SETTLEMENT_CREDIT</code>).
                </p>

                <div className="pt-3 border-t border-[#282a30] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#99907c] text-[10px] uppercase">Receita Acumulada:</span>
                    <span className="text-[#4edea3] font-bold tabular-nums">
                      {formatCurrency(balances.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#99907c] text-[10px] uppercase">Liquidações no Extrato:</span>
                    <span className="text-[#e2e2ea] font-bold tabular-nums">
                      {transactions.filter((t) => t.type === 'SETTLEMENT_CREDIT').length} recebimentos
                    </span>
                  </div>
                </div>

                <Link
                  href="/auctioneer"
                  className="w-full py-3.5 bg-[#d4af37] text-[#1c1400] font-mono text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#f2ca50] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">gavel</span>
                  <span>Ir para o Painel do Leiloeiro</span>
                </Link>
              </div>
            ) : (
            <div className="p-6 rounded-xl bg-[#14171f] border border-[#282a30] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#282a30]">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#99907c]">
                    Aporte em Tempo Real
                  </span>
                  <span className="font-serif text-lg text-[#e2e2ea]">
                    Reforço de Garantia
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#f2ca50] text-xl">
                  add_card
                </span>
              </div>

              <p className="font-sans text-xs text-[#99907c] leading-relaxed">
                Aumente seu poder de lance instantaneamente para garantir participação em lotes de alto calibre com liquidação via Pix Criptografado ou TED Judicial.
              </p>

              {/* Quick Chips */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                  Selecione o montante de aporte:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[5000, 10000, 25000, 50000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDepositAmountBRL(String(amount))}
                      className={`px-3 py-2 rounded-lg font-mono text-xs text-center transition-colors cursor-pointer border ${
                        depositAmountBRL === String(amount)
                          ? 'bg-[#d4af37] text-[#1c1400] font-bold border-[#d4af37]'
                          : 'bg-[#1d2025] hover:bg-[#282a30] text-[#e2e2ea] border-[#282a30]'
                      }`}
                    >
                      + {formatCurrency(amount * 100)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Value Input */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="deposit-amount-input"
                  className="font-mono text-[10px] text-[#99907c] uppercase"
                >
                  Ou digite o valor pretendido:
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-xs text-[#99907c]">
                    R$
                  </span>
                  <input
                    id="deposit-amount-input"
                    type="number"
                    value={depositAmountBRL}
                    onChange={(e) => setDepositAmountBRL(e.target.value)}
                    min="1000"
                    step="1000"
                    className="w-full bg-[#0c0e13] text-[#e2e2ea] font-mono text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#282a30] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Method Selector Tabs */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#99907c] uppercase">
                  Canal de Liquidação:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositMethod('pix')}
                    className={`p-2.5 rounded-lg font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                      depositMethod === 'pix'
                        ? 'bg-[#1d2025] text-[#f2ca50] border-[#d4af37]/40 font-bold'
                        : 'bg-[#0c0e13] text-[#99907c] border-[#282a30]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">qr_code_2</span>
                    Pix Instantâneo
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMethod('ted')}
                    className={`p-2.5 rounded-lg font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                      depositMethod === 'ted'
                        ? 'bg-[#1d2025] text-[#f2ca50] border-[#d4af37]/40 font-bold'
                        : 'bg-[#0c0e13] text-[#99907c] border-[#282a30]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">account_balance</span>
                    TED Judicial
                  </button>
                </div>
              </div>

              {/* Method Details Section */}
              {depositMethod === 'pix' ? (
                <div className="p-3 rounded-lg bg-[#0c0e13] border border-[#282a30] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#4edea3] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] inline-block animate-ping" />
                      Chave Copia-e-Cola Dinâmica
                    </span>
                    <span className="text-[#99907c]">Liquidação Imediata</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        '00020126580014br.gov.bcb.pix0136belmont-trust-custodia-fiduciaria-2026-sec-0001520400005303986',
                      )
                      showToast('Chave Copiada', 'Código Pix copiado para a área de transferência.')
                    }}
                    className="w-full text-left font-mono text-[10px] bg-[#1d2025] p-2.5 rounded text-[#d0c5af] truncate select-all cursor-pointer hover:text-[#f2ca50] transition-colors border border-[#282a30]"
                  >
                    00020126580014br.gov.bcb.pix0136belmont-trust-custodia-fiduciaria-2026-sec-0001520400005303986
                  </button>
                  <span className="text-[10px] text-[#99907c] text-right font-mono">
                    Clique para copiar a chave Pix
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#0c0e13] border border-[#282a30] flex flex-col gap-1 font-mono text-[11px] text-[#d0c5af]">
                  <div><strong>Banco:</strong> 001 - Banco do Brasil (Fundo Belmont Escrow)</div>
                  <div><strong>Agência:</strong> 3345-0 • <strong>Conta Corrente:</strong> 88910-1</div>
                  <div><strong>Favorecido:</strong> Belmont Fine Art Institutional Trust</div>
                  <div><strong>CNPJ Custodiante:</strong> 18.940.100/0001-94</div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleExecuteDeposit}
                disabled={isDepositing}
                className="w-full py-3.5 bg-[#d4af37] text-[#1c1400] font-mono text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#f2ca50] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">verified</span>
                <span>{isDepositing ? 'PROCESSANDO APORTE...' : 'Aportar Garantia Fiduciária Instantânea'}</span>
              </button>
            </div>
            )}

            {/* Trust & Compliance Box */}
            <div className="p-4 rounded-xl bg-[#14171f] border border-[#282a30] flex flex-col gap-2 text-[#99907c] font-sans text-xs">
              <div className="flex items-center gap-2 text-[#e2e2ea] font-serif text-sm">
                <span className="material-symbols-outlined text-[#f2ca50] text-base">
                  gavel
                </span>
                Estrutura Regulatória & Imunidade de Saldo
              </div>
              <p className="leading-relaxed">
                Em total observância ao <strong>Decreto Federal nº 21.981/1932</strong> que disciplina a profissão de leiloeiro oficial, e às normas de custódia fiduciária, todos os valores recebidos a título de caução são mantidos segregados do patrimônio da casa leiloeira em conta garantidora especial com emissão de hash HMAC-SHA256 na rede de auditoria.
              </p>
            </div>
          </div>

          {/* Right Column: Audit Statement Ledger (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="p-6 rounded-xl bg-[#14171f] border border-[#282a30] shadow-sm flex flex-col gap-4 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#282a30]">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#99907c]">
                    Auditoria Contábil Imutável
                  </span>
                  <h2 className="font-serif text-2xl text-[#e2e2ea]">
                    Extrato Fiduciário de Lances
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.print()
                  }}
                  className="no-print px-3.5 py-1.5 rounded-lg bg-[#1d2025] text-[#e2e2ea] border border-[#282a30] font-mono text-xs flex items-center gap-1.5 hover:bg-[#282a30] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-[#f2ca50]">
                    print
                  </span>
                  <span>Imprimir / Exportar Extrato (PDF)</span>
                </button>
              </div>

              {/* Ledger Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1.5 rounded uppercase font-semibold transition-colors shrink-0 ${
                    filterCategory === 'all'
                      ? 'bg-[#d4af37] text-[#1c1400]'
                      : 'bg-[#1d2025] text-[#99907c] hover:text-[#e2e2ea]'
                  }`}
                >
                  Todos os Movimentos ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('lock')}
                  className={`px-3 py-1.5 rounded uppercase font-semibold transition-colors shrink-0 ${
                    filterCategory === 'lock'
                      ? 'bg-[#d4af37] text-[#1c1400]'
                      : 'bg-[#1d2025] text-[#99907c] hover:text-[#e2e2ea]'
                  }`}
                >
                  Bloqueios Preventivos (Escrow)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('settlement')}
                  className={`px-3 py-1.5 rounded uppercase font-semibold transition-colors shrink-0 ${
                    filterCategory === 'settlement'
                      ? 'bg-[#d4af37] text-[#1c1400]'
                      : 'bg-[#1d2025] text-[#99907c] hover:text-[#e2e2ea]'
                  }`}
                >
                  Liquidações (Settlement)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('deposit')}
                  className={`px-3 py-1.5 rounded uppercase font-semibold transition-colors shrink-0 ${
                    filterCategory === 'deposit'
                      ? 'bg-[#d4af37] text-[#1c1400]'
                      : 'bg-[#1d2025] text-[#99907c] hover:text-[#e2e2ea]'
                  }`}
                >
                  Depósitos
                </button>
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-[#0c0e13] text-[#99907c] font-mono text-[10px] uppercase tracking-wider border-y border-[#282a30]">
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4">Operação</th>
                      <th className="py-3 px-4">Lote / Referência</th>
                      <th className="py-3 px-4">Hash HMAC-SHA256</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282a30]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#99907c] font-mono">
                          Carregando lançamentos contábeis...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#99907c] font-mono">
                          Nenhum lançamento registrado nesta categoria.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isLock = tx.type === 'BID_LOCK'
                        const isRelease = tx.type === 'BID_RELEASE'
                        const isSettlement = tx.type === 'SETTLEMENT'
                        const isSettlementCredit = tx.type === 'SETTLEMENT_CREDIT'
                        const isDeposit = tx.type === 'DEPOSIT'

                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-[#1d2025]/60 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-[11px] text-[#d0c5af] tabular-nums">
                              {new Date(tx.createdAt).toLocaleDateString('pt-BR')}{' '}
                              <br />
                              <span className="text-[#99907c]">
                                {new Date(tx.createdAt).toLocaleTimeString('pt-BR')}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div
                                className={`flex items-center gap-1.5 font-mono text-[11px] font-bold ${
                                  isLock
                                    ? 'text-[#f2ca50]'
                                    : isRelease || isSettlementCredit
                                    ? 'text-[#4edea3]'
                                    : isSettlement
                                    ? 'text-[#e2e2ea]'
                                    : 'text-[#4edea3]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {isLock
                                    ? 'lock'
                                    : isRelease
                                    ? 'lock_open'
                                    : isSettlement || isSettlementCredit
                                    ? 'verified'
                                    : 'input'}
                                </span>
                                {tx.type}
                              </div>
                              <span className="text-[10px] text-[#99907c]">
                                {isLock
                                  ? 'Garantia Preventiva'
                                  : isRelease
                                  ? 'Desbloqueio Superado'
                                  : isSettlementCredit
                                  ? 'Recebimento de Liquidação (Leiloeiro)'
                                  : isSettlement
                                  ? 'Arrematação Definitiva'
                                  : 'Aporte de Garantia'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-medium text-[#e2e2ea]">
                                {tx.lotId ? `Lote #${tx.lotId.slice(0, 4)}` : 'Tesouraria Belmont'}
                              </span>
                              <div className="text-[10px] text-[#99907c] truncate max-w-[160px]">
                                {tx.description || 'Custódia Fiduciária'}
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(tx.hash || '')
                                  showToast('Hash Copiado', 'Identificador de auditoria copiado.')
                                }}
                                className="text-[#99907c] hover:text-[#f2ca50] transition-colors flex items-center gap-1"
                              >
                                <span>{tx.hash ? tx.hash.slice(0, 12) + '...' : '0xe3b0c4...'}</span>
                                <span className="material-symbols-outlined text-xs">
                                  content_copy
                                </span>
                              </button>
                            </td>

                            <td
                              className={`py-3 px-4 text-right font-mono text-xs font-bold ${
                                isLock || isSettlement
                                  ? 'text-[#f2ca50]'
                                  : 'text-[#4edea3]'
                              }`}
                            >
                              {isLock || isSettlement ? '-' : '+'} {formatCurrency(tx.amount)}
                              <div className="font-mono text-[9px] text-[#99907c]">
                                {isLock
                                  ? 'RETIDO EM PREGÃO'
                                  : isRelease
                                  ? 'LIBERADO AUTOMÁTICO'
                                  : isSettlementCredit
                                  ? 'RECEITA CREDITADA AO LEILOEIRO'
                                  : isSettlement
                                  ? 'TITULARIDADE TRANSMITIDA'
                                  : 'ENTRADA ESCROW'}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] whitespace-nowrap ${
                                  isLock
                                    ? 'bg-[#f2ca50]/10 text-[#f2ca50]'
                                    : 'bg-[#4edea3]/10 text-[#4edea3]'
                                }`}
                              >
                                {isLock
                                  ? '🟡 Em Custódia'
                                  : isRelease
                                  ? '🟢 Estornado'
                                  : isSettlement
                                  ? '🟢 Liquidado'
                                  : '🟢 Confirmado'}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cryptographic Integrity Stamp Footer */}
              <div className="pt-3 bg-[#0c0e13] -mx-6 -mb-6 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#282a30] font-mono text-[10px] text-[#99907c]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-sm">
                    verified_user
                  </span>
                  <span>
                    Último Registro:{' '}
                    <strong className="text-[#e2e2ea]">
                      {transactions[0]?.id ? `#${transactions[0].id.slice(0, 12)}` : 'Sem lançamentos'}
                    </strong>{' '}
                    • Livro-Razão Fiduciário Sincronizado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Sincronização Criptográfica:</span>
                  <span className="text-[#4edea3] font-semibold tabular-nums">
                    {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')} BRT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
