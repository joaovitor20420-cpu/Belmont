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
  ShieldCheck,
  User,
  LogOut,
  PlusCircle,
  LogIn,
  ChevronDown,
  Sparkles,
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
        const data = await apiRequest<{
          balances: {
            availableInCents: number
            committedInCents: number
            totalInCents: number
          }
        }>('/wallet/balance')
        setBalance({
          available: data.balances.availableInCents,
          committed: data.balances.committedInCents,
          total: data.balances.totalInCents,
        })
      } catch {
        // Silêncio se não conseguir buscar
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)
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
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Gavel className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              BELMONT <span className="text-amber-400 text-xs font-sans px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">AUCTIONS</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase text-slate-400">
              Casa de Leilões de Belas Artes
            </span>
          </div>
        </Link>

        {/* Links Centrais */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition ${
              pathname === '/'
                ? 'text-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Vitrine de Lotes
          </Link>

          {user?.role === 'AUCTIONEER' && (
            <Link
              href="/auctioneer"
              className={`text-sm font-medium transition flex items-center gap-1.5 ${
                pathname === '/auctioneer'
                  ? 'text-amber-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <PlusCircle className="h-4 w-4 text-amber-400" />
              Painel do Leiloeiro
            </Link>
          )}

          {user && (
            <Link
              href="/wallet"
              className={`text-sm font-medium transition flex items-center gap-1.5 ${
                pathname === '/wallet'
                  ? 'text-amber-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Wallet className="h-4 w-4 text-emerald-400" />
              Carteira Digital
            </Link>
          )}
        </nav>

        {/* Direita: Auth & Saldo */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Saldo Disponível (se tiver) */}
              {balance !== null && (
                <Link
                  href="/wallet"
                  className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                  title="Saldo Disponível para Lances"
                >
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Disponível
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {formatCurrency(balance.available)}
                  </span>
                </Link>
              )}

              {/* Informações do Usuário & Mascaramento */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">
                      {user.maskedName || user.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        user.role === 'AUCTIONEER'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {user.publicCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {user.role === 'AUCTIONEER' ? 'Leiloeiro Oficial' : 'Licitante Habilitado'}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                  title="Sair da Conta"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Seletor Rápido de Contas de Teste (Avaliador Verzel) */}
              <div className="relative">
                <button
                  onClick={() => setShowTestAccounts(!showTestAccounts)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg hover:bg-amber-900/50 transition"
                  title="Troca rápida para testes do avaliador"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Acesso Rápido (Avaliador)</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {showTestAccounts && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-50">
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Contas Semeadas
                    </div>
                    <button
                      disabled={isLoggingIn}
                      onClick={() => handleTestLogin('auctioneer@belmont.com')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-purple-300">Leiloeiro Belmont</div>
                        <div className="text-[10px] text-slate-400">auctioneer@belmont.com</div>
                      </div>
                      <span className="text-[10px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800">
                        LEI-0001
                      </span>
                    </button>
                    <button
                      disabled={isLoggingIn}
                      onClick={() => handleTestLogin('bidder1@belmont.com')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-between text-xs mt-1"
                    >
                      <div>
                        <div className="font-semibold text-blue-300">Licitante 1 (Carlos)</div>
                        <div className="text-[10px] text-slate-400">bidder1@belmont.com</div>
                      </div>
                      <span className="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">
                        LIC-0001
                      </span>
                    </button>
                    <button
                      disabled={isLoggingIn}
                      onClick={() => handleTestLogin('bidder2@belmont.com')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-between text-xs mt-1"
                    >
                      <div>
                        <div className="font-semibold text-blue-300">Licitante 2 (Mariana)</div>
                        <div className="text-[10px] text-slate-400">bidder2@belmont.com</div>
                      </div>
                      <span className="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">
                        LIC-0002
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão de Login Tradicional */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Login */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Gavel className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Entrar na Sala de Leilões</h3>
                <p className="text-xs text-slate-400">Informe suas credenciais para continuar</p>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 rounded-lg bg-rose-950/50 border border-rose-800 p-2.5 text-xs text-rose-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 py-2.5 text-sm font-bold text-slate-950 transition disabled:opacity-50"
              >
                {isLoggingIn ? 'Conectando...' : 'Acessar Sala'}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
