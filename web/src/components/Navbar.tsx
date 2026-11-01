'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const { user, logout, login } = useAuth()
  const [balance, setBalance] = useState<{
    available: number
    committed: number
    total: number
  } | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [firstLotId, setFirstLotId] = useState<string>('')

  // Obter primeiro lote ativo para as rotas /lots e /audit
  useEffect(() => {
    apiRequest<{ lots: any[] }>('/lots')
      .then((data) => {
        if (data.lots && data.lots.length > 0) {
          setFirstLotId(data.lots[0].id)
        }
      })
      .catch(() => {})
  }, [])

  // Atualizar saldo
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
        setBalance({ available, committed, total })
      } catch {}
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 6000)
    return () => clearInterval(interval)
  }, [user])

  const handleTestLogin = async (email: string) => {
    setIsLoggingIn(true)
    setLoginError('')
    try {
      await login(email, 'password123')
      setShowUserDropdown(false)
      setShowLoginModal(false)
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao realizar login')
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
      setShowUserDropdown(false)
      setEmailInput('')
      setPasswordInput('')
    } catch (err: any) {
      setLoginError(err.message || 'Credenciais inválidas')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const navLinks = [
    { label: 'Catálogo', path: '/' },
    {
      label: 'Sala de Pregão',
      path: firstLotId ? `/lots/${firstLotId}` : '/#catalogo',
    },
    { label: 'Meus Arremates', path: '/my-bids' },
    { label: 'Carteira Digital', path: '/wallet' },
    { label: 'Painel Leiloeiro', path: '/auctioneer' },
    {
      label: 'Certificados & Auditoria',
      path: firstLotId ? `/audit/${firstLotId}` : '/#auditoria',
    },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#07090E]/90 backdrop-blur-xl border-b border-[#d4af37]/20">
        <div className="h-20 w-full max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          {/* Logo & Marca Belmont */}
          <Link href="/" className="flex items-center gap-3.5 shrink-0 group">
            <img
              alt="Belmont Auctions Crest"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              src="/belmont-crest.png"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-wider text-[#e2e2ea] font-medium leading-tight">
                BELMONT AUCTIONS
              </span>
              <span className="font-mono text-[9px] tracking-widest uppercase text-[#99907c]">
                EST. 1894 • CHICAGO & GENEVA
              </span>
            </div>
          </Link>

          {/* Navegação Principal */}
          <nav className="hidden xl:flex items-center gap-2">
            {navLinks.map((item) => {
              const isActive =
                item.path === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.path.split('?')[0])
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors rounded ${
                    isActive
                      ? 'bg-[#d4af37] text-[#1c1400] font-bold shadow-sm'
                      : 'text-[#d0c5af] hover:text-[#e2e2ea] hover:bg-[#282a30]/60'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Área de Status, Saldo e Perfil */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Live SSE Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded border border-[#4edea3]/30 bg-[#4edea3]/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#4edea3] font-semibold">
                REDE AO VIVO • SSE ATIVO
              </span>
            </div>

            {/* Saldo Disponível */}
            {user && (
              <Link
                href="/wallet"
                className="hidden lg:flex items-center px-3 py-1.5 rounded border border-[#d4af37]/20 bg-[#0c0e13]/60 hover:border-[#d4af37]/50 transition-colors"
              >
                <span className="font-sans text-xs text-[#99907c] mr-2">
                  Disponível:
                </span>
                <span className="font-mono text-xs font-bold text-[#f2ca50]">
                  {formatCurrency(balance?.available ?? 0)}
                </span>
              </Link>
            )}

            {/* Profile Pill */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 p-1 pr-3 rounded border border-[#4d4635]/60 bg-[#14171f]/80 hover:border-[#d4af37]/50 transition-colors cursor-pointer"
                >
                  <img
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/30"
                    src="/avatar.png"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }}
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-mono text-[10px] font-bold tracking-wide text-[#f2ca50]">
                      {user.publicCode}
                    </span>
                    <span className="font-sans text-xs text-[#e2e2ea] truncate max-w-[120px]">
                      {user.name.split(' ')[0]} (Verificado)
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#99907c] text-sm">
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#14171f] border border-[#d4af37]/30 shadow-2xl p-2 z-50">
                    <div className="p-3 border-b border-[#282a30]">
                      <div className="font-mono text-xs text-[#f2ca50] font-bold">
                        {user.publicCode} • {user.role}
                      </div>
                      <div className="font-sans text-sm text-[#e2e2ea] truncate">
                        {user.name}
                      </div>
                      <div className="font-sans text-xs text-[#99907c] truncate">
                        {user.email}
                      </div>
                    </div>

                    <div className="py-2 space-y-1">
                      <Link
                        href="/wallet"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center justify-between px-3 py-2 rounded text-xs text-[#d0c5af] hover:bg-[#282a30] hover:text-[#e2e2ea]"
                      >
                        <span>Carteira & Saldos</span>
                        <span className="font-mono text-[#f2ca50]">
                          {formatCurrency(balance?.available ?? 0)}
                        </span>
                      </Link>
                      <Link
                        href="/auctioneer"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center px-3 py-2 rounded text-xs text-[#d0c5af] hover:bg-[#282a30] hover:text-[#e2e2ea]"
                      >
                        Terminal do Leiloeiro
                      </Link>
                    </div>

                    <div className="border-t border-[#282a30] pt-2">
                      <div className="px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[#99907c]">
                        Alternar Conta de Teste
                      </div>
                      <button
                        onClick={() => handleTestLogin('carlos@artinvest.com')}
                        className="w-full text-left px-3 py-1.5 rounded text-xs text-[#99907c] hover:bg-[#282a30] hover:text-[#e2e2ea]"
                      >
                        LIC-0001 • Carlos Daniel
                      </button>
                      <button
                        onClick={() => handleTestLogin('marina@gallery.com')}
                        className="w-full text-left px-3 py-1.5 rounded text-xs text-[#99907c] hover:bg-[#282a30] hover:text-[#e2e2ea]"
                      >
                        LIC-0002 • Marina Silva
                      </button>
                      <button
                        onClick={() => handleTestLogin('auctioneer@belmont.com')}
                        className="w-full text-left px-3 py-1.5 rounded text-xs text-[#f2ca50] hover:bg-[#282a30]"
                      >
                        LEI-0001 • Leiloeiro Oficial
                      </button>
                    </div>

                    <div className="border-t border-[#282a30] pt-2">
                      <button
                        onClick={() => {
                          logout()
                          setShowUserDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2 rounded text-xs text-rose-400 hover:bg-rose-500/10 font-semibold"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-[#d4af37] text-[#1c1400] font-mono text-xs uppercase tracking-wider font-bold rounded hover:bg-[#f2ca50] transition-colors cursor-pointer"
              >
                Identificar-se
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Login */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-[#14171f] border border-[#d4af37]/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#282a30]">
              <div>
                <h3 className="font-serif text-lg text-[#e2e2ea]">
                  Acesso Belmont Auctions
                </h3>
                <p className="font-sans text-xs text-[#99907c]">
                  Autenticação fiduciária para habilitação de lances
                </p>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-[#99907c] hover:text-[#e2e2ea]"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="my-3 p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleManualLogin} className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-xs text-[#99907c] uppercase mb-1">
                  E-mail institucional
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full bg-[#0c0e13] border border-[#4d4635] rounded px-3 py-2 text-sm text-[#e2e2ea] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#99907c] uppercase mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0c0e13] border border-[#4d4635] rounded px-3 py-2 text-sm text-[#e2e2ea] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-[#d4af37] text-[#1c1400] font-mono text-xs font-bold uppercase tracking-wider rounded hover:bg-[#f2ca50] transition-colors"
              >
                {isLoggingIn ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#282a30]">
              <div className="font-mono text-[10px] uppercase text-[#99907c] mb-2">
                Acesso Rápido de Demonstração (1 Clique)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTestLogin('carlos@artinvest.com')}
                  className="p-2 rounded bg-[#1d2025] hover:bg-[#282a30] text-left border border-[#4d4635]/40"
                >
                  <div className="font-mono text-[10px] text-[#f2ca50]">LIC-0001</div>
                  <div className="text-xs text-[#e2e2ea] truncate">Carlos Daniel</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleTestLogin('auctioneer@belmont.com')}
                  className="p-2 rounded bg-[#1d2025] hover:bg-[#282a30] text-left border border-[#4d4635]/40"
                >
                  <div className="font-mono text-[10px] text-[#4edea3]">LEI-0001</div>
                  <div className="text-xs text-[#e2e2ea] truncate">Leiloeiro Oficial</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
