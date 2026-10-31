'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  Gavel,
  Wallet,
  LogOut,
  PlusCircle,
  LogIn,
  ChevronDown,
  Sparkles,
  Layers,
  ShieldCheck,
  UserCheck,
  X,
  CreditCard,
  Lock,
} from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user, logout, login } = useAuth()
  const [balance, setBalance] = useState<{
    available: number
    committed: number
    total: number
  } | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Atualiza saldo quando o usuário estiver logado
  useEffect(() => {
    if (!user) {
      setBalance(null)
      return
    }

    const fetchBalance = async () => {
      try {
        const data = await apiRequest<any>('/wallet/balance')
        const available =
          data?.balances?.availableInCents ?? data?.balanceAvailable ?? 0
        const committed =
          data?.balances?.committedInCents ?? data?.balanceCommitted ?? 0
        const total =
          data?.balances?.totalInCents ?? data?.balanceTotal ?? 0
        setBalance({
          available,
          committed,
          total,
        })
      } catch {
        // Silêncio em caso de falha de polling
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 8000)
    return () => clearInterval(interval)
  }, [user])

  const handleTestLogin = async (email: string, pass: string = 'password123') => {
    setIsLoggingIn(true)
    setLoginError('')
    try {
      await login(email, pass)
      setShowTestAccounts(false)
      setShowLoginModal(false)
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao realizar login.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput || !passwordInput) return
    setIsLoggingIn(true)
    setLoginError('')
    try {
      await login(emailInput, passwordInput)
      setShowLoginModal(false)
      setEmailInput('')
      setPasswordInput('')
    } catch (err: any) {
      setLoginError(err.message || 'Credenciais inválidas.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-95">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/30 text-amber-400 shadow-inner shadow-amber-500/20 group-hover:border-amber-400 transition-colors">
            <Gavel className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-white">
                BELMONT
              </span>
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
                AUCTIONS
              </span>
            </div>
            <span className="text-[10px] tracking-widest uppercase font-medium text-slate-400">
              Fine Art & Antiques • 1892
            </span>
          </div>
        </Link>

        {/* Links Centrais de Navegação */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              pathname === '/'
                ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Vitrine de Pregões</span>
            </span>
          </Link>

          {user?.role === 'AUCTIONEER' && (
            <Link
              href="/auctioneer"
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                pathname === '/auctioneer'
                  ? 'bg-purple-950/80 text-purple-300 shadow-sm border border-purple-800/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-purple-400" />
              <span>Painel do Leiloeiro</span>
            </Link>
          )}

          {user && (
            <Link
              href="/wallet"
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                pathname === '/wallet'
                  ? 'bg-emerald-950/80 text-emerald-300 shadow-sm border border-emerald-800/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Carteira Digital</span>
            </Link>
          )}
        </nav>

        {/* Lado Direito: Ações & Perfil */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Saldo Disponível */}
              {balance !== null && (
                <Link
                  href="/wallet"
                  className="hidden sm:flex flex-col items-end px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-colors group cursor-pointer"
                  title="Saldo Disponível para Lances"
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-emerald-400 transition-colors">
                    Disponível
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatCurrency(balance.available)}
                  </span>
                </Link>
              )}

              {/* Informações do Usuário com LGPD */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">
                      {user.maskedName || user.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                        user.role === 'AUCTIONEER'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/80'
                          : 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
                      }`}
                    >
                      {user.publicCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {user.role === 'AUCTIONEER' ? 'Leiloeiro Oficial' : 'Licitante Habilitado'}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                  title="Sair da Conta"
                >
                  <LogOut className="h-4 w-4 stroke-[1.75]" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Seletor Rápido de Contas de Teste (Avaliador Verzel) */}
              <div className="relative">
                <button
                  onClick={() => setShowTestAccounts(!showTestAccounts)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-xl hover:bg-amber-900/50 hover:border-amber-700 transition shadow-sm cursor-pointer"
                  title="Acesso com 1 clique para avaliação"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Acesso Rápido (Avaliador)</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {showTestAccounts && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-2.5 shadow-2xl z-50">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5 mb-1.5">
                      Contas Pré-Configuradas (Seeds)
                    </div>

                    <button
                      disabled={isLoggingIn}
                      onClick={() => handleTestLogin('auctioneer@belmont.com')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center">
                          <Gavel className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-purple-300 transition">
                            Leiloeiro Belmont
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">LEI-0001</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 font-mono font-bold">
                        LEI
                      </span>
                    </button>

                    <button
                      disabled={isLoggingIn}
                      onClick={() => handleTestLogin('bidder1@belmont.com')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition flex items-center justify-between text-xs mt-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-400 flex items-center justify-center">
                          <UserCheck className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-blue-300 transition">
                            Carlos Drummond
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono font-medium">
                            Saldo: R$ 50.000,00
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800 font-mono font-bold">
                        LIC-0001
                      </span>
                    </button>

                    <button
                      disabled={isLoggingIn}
                      onClick={() => handleTestLogin('bidder2@belmont.com')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition flex items-center justify-between text-xs mt-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-400 flex items-center justify-center">
                          <UserCheck className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-blue-300 transition">
                            Mariana Ximenes
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono font-medium">
                            Saldo: R$ 50.000,00
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800 font-mono font-bold">
                        LIC-0002
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Entrar Tradicional */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Login Elegante */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <Gavel className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Acesso à Sala de Pregão</h3>
                <p className="text-xs text-slate-400">Informe suas credenciais ou use o acesso de teste</p>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 rounded-xl bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail institucional ou licitante
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="licitante@belmont.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Senha de acesso
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoggingIn ? 'Autenticando...' : 'Entrar na Sala'}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
