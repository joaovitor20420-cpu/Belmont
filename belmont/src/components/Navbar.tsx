'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { apiRequest } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, login, register } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [balance, setBalance] = useState<{
    available: number
    committed: number
    total: number
  } | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN')

  // Campos de Login
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  // Campos de Cadastro de Novo Usuário (Licitante)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regDocument, setRegDocument] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [firstLotId, setFirstLotId] = useState<string>('')

  // Obter primeiro lote ativo para o atalho da Sala de Pregão
  useEffect(() => {
    const fetchActiveLot = () => {
      apiRequest<{ lots: any[] }>('/lots?status=LIVE')
        .then((data) => {
          if (data.lots && data.lots.length > 0) {
            setFirstLotId(data.lots[0].id)
          } else {
            setFirstLotId('')
          }
        })
        .catch(() => {})
    }
    fetchActiveLot()
    const interval = setInterval(fetchActiveLot, 6000)
    return () => clearInterval(interval)
  }, [pathname])

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
    const interval = setInterval(fetchBalance, 5000)
    return () => clearInterval(interval)
  }, [user, pathname])

  const handleTestLogin = async (email: string) => {
    setIsLoggingIn(true)
    setLoginError('')
    try {
      const loggedUser = await login(email, 'password123')
      setShowUserDropdown(false)
      setShowLoginModal(false)
      if (loggedUser.role === 'AUCTIONEER') {
        router.push('/auctioneer')
      } else {
        router.push('/')
      }
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
      const loggedUser = await login(emailInput, passwordInput)
      setShowLoginModal(false)
      setShowUserDropdown(false)
      setEmailInput('')
      setPasswordInput('')
      if (loggedUser.role === 'AUCTIONEER') {
        router.push('/auctioneer')
      }
    } catch (err: any) {
      setLoginError(err.message || 'Credenciais inválidas')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEmail || !regDocument || !regPassword) {
      setLoginError('Preencha todos os campos para criar sua conta.')
      return
    }
    setIsLoggingIn(true)
    setLoginError('')
    try {
      const cleanDoc = regDocument.replace(/\D/g, '')
      if (cleanDoc.length < 11) {
        setLoginError('O CPF deve conter pelo menos 11 dígitos numéricos.')
        setIsLoggingIn(false)
        return
      }
      await register({
        name: regName,
        email: regEmail,
        document: cleanDoc,
        password: regPassword,
        role: 'BIDDER',
      })
      setShowLoginModal(false)
      setShowUserDropdown(false)
      setRegName('')
      setRegEmail('')
      setRegDocument('')
      setRegPassword('')
      router.push('/')
    } catch (err: any) {
      setLoginError(err.message || 'Não foi possível criar a conta.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Construção estrita dos links de navegação baseada no papel (RBAC)
  const navLinks: Array<{ label: string; path: string }> = [
    { label: 'Catálogo', path: '/' },
  ]

  if (firstLotId) {
    navLinks.push({
      label: 'Sala de Pregão',
      path: `/lots/${firstLotId}`,
    })
  }

  navLinks.push({
    label: 'Auditoria Pública',
    path: '/audit',
  })

  if (user?.role === 'BIDDER') {
    // Usuário licitante vê Meus Arremates e Carteira Digital (NUNCA vê Painel do Leiloeiro)
    navLinks.push({ label: 'Meus Arremates', path: '/my-bids' })
    navLinks.push({ label: 'Carteira Digital', path: '/wallet' })
  } else if (user?.role === 'AUCTIONEER') {
    // Leiloeiro Oficial vê Painel do Leiloeiro e Recebimentos (NUNCA vê Meus Arremates)
    navLinks.push({ label: 'Painel do Leiloeiro', path: '/auctioneer' })
    navLinks.push({ label: 'Recebimentos & Caixa', path: '/wallet' })
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLoginModal(false)
        setShowUserDropdown(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#07090E]/90 backdrop-blur-xl border-b border-[#d4af37]/20">
        <div className="h-20 w-full max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
          {/* Logo & Marca Belmont */}
          <Link href="/" className="flex items-center gap-3.5 shrink-0 group">
            <img
              alt="Belmont Auctions Crest"
              className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
              src="/belmont-crest.svg"
            />
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-wider text-[#e2e2ea] font-medium leading-tight">
                BELMONT AUCTIONS
              </span>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#99907c]">
                EST. 1894 • CHICAGO & GENEVA
              </span>
            </div>
          </Link>

          {/* Navegação Principal (Estritamente filtrada por Papel, visível a partir de md) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((item) => {
              const isActive =
                item.path === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.path.split('?')[0])
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className={`px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition-colors rounded ${
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
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Botão de Alternância Light / Dark Mode */}
            <button
              type="button"
              onClick={toggleTheme}
              title={
                theme === 'dark'
                  ? 'Mudar para Modo Claro (Light Mode)'
                  : 'Mudar para Modo Escuro (Dark Mode)'
              }
              aria-label={
                theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'
              }
              className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded border border-[#282a30] bg-[#14171f] hover:border-[#d4af37]/60 text-[#d0c5af] hover:text-[#e2e2ea] transition-colors cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base text-[#f2ca50]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider font-semibold">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Real Live Lot Status Badge */}
            <div
              className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded border ${
                firstLotId
                  ? 'border-[#4edea3]/30 bg-[#4edea3]/10'
                  : 'border-[#282a30] bg-[#14171f]'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {firstLotId && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    firstLotId ? 'bg-[#4edea3]' : 'bg-[#99907c]'
                  }`}
                />
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${
                  firstLotId ? 'text-[#4edea3]' : 'text-[#99907c]'
                }`}
              >
                {firstLotId ? 'PREGÃO AO VIVO ATIVO' : 'ACERVO SINCRONIZADO'}
              </span>
            </div>

            {/* Saldo Disponível / Recebido */}
            {user && (
              <Link
                href="/wallet"
                className="hidden lg:flex items-center px-3 py-1.5 rounded border border-[#d4af37]/20 bg-[#0c0e13]/60 hover:border-[#d4af37]/50 transition-colors"
              >
                <span className="font-sans text-xs text-[#99907c] mr-2">
                  {user.role === 'AUCTIONEER' ? 'Caixa Recebido:' : 'Disponível:'}
                </span>
                <span className="font-mono text-xs font-bold text-[#f2ca50]">
                  {formatCurrency(
                    user.role === 'AUCTIONEER'
                      ? balance?.total ?? 0
                      : balance?.available ?? 0,
                  )}
                </span>
              </Link>
            )}

            {/* Profile Pill */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={showUserDropdown}
                  aria-haspopup="menu"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 p-1 pr-3 rounded border border-[#4d4635]/60 bg-[#14171f]/80 hover:border-[#d4af37]/50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#282a30] border border-[#d4af37]/40 flex items-center justify-center font-mono text-xs font-bold text-[#f2ca50]">
                    {user.role === 'AUCTIONEER' ? 'LEI' : 'LIC'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-mono text-[10px] font-bold tracking-wide text-[#f2ca50]">
                      {user.publicCode} • {user.role === 'AUCTIONEER' ? 'LEILOEIRO' : 'LICITANTE'}
                    </span>
                    <span className="font-sans text-xs text-[#e2e2ea] truncate max-w-[130px]">
                      {user.name}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#99907c] text-sm">
                    {showUserDropdown ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <>
                    <div
                      aria-hidden="true"
                      onClick={() => setShowUserDropdown(false)}
                      className="fixed inset-0 z-40"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-72 rounded-xl bg-[#14171f] border border-[#d4af37]/30 shadow-2xl p-2 z-50"
                    >
                    <div className="p-3 border-b border-[#282a30]">
                      <div className="font-mono text-xs text-[#f2ca50] font-bold">
                        {user.publicCode} • {user.role === 'AUCTIONEER' ? 'LEILOEIRO OFICIAL' : 'LICITANTE'}
                      </div>
                      <div className="font-sans text-sm text-[#e2e2ea] truncate">
                        {user.name}
                      </div>
                      <div className="font-sans text-xs text-[#99907c] truncate">
                        {user.email}
                      </div>
                    </div>

                    <div className="py-2 space-y-1">
                      {user.role === 'AUCTIONEER' ? (
                        <>
                          <Link
                            href="/auctioneer"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center justify-between px-3 py-2 rounded text-xs text-[#f2ca50] font-semibold hover:bg-[#282a30]"
                          >
                            <span>Painel do Leiloeiro</span>
                            <span className="material-symbols-outlined text-sm">gavel</span>
                          </Link>
                          <Link
                            href="/wallet"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center justify-between px-3 py-2 rounded text-xs text-[#d0c5af] hover:bg-[#282a30] hover:text-[#e2e2ea]"
                          >
                            <span>Recebimentos & Caixa</span>
                            <span className="font-mono text-[#4edea3]">
                              {formatCurrency(balance?.total ?? 0)}
                            </span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/my-bids"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center justify-between px-3 py-2 rounded text-xs text-[#f2ca50] font-semibold hover:bg-[#282a30]"
                          >
                            <span>Meus Arremates & Lances</span>
                            <span className="material-symbols-outlined text-sm">trophy</span>
                          </Link>
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
                        </>
                      )}
                    </div>

                    <div className="border-t border-[#282a30] pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false)
                          setAuthTab('REGISTER')
                          setShowLoginModal(true)
                        }}
                        className="w-full text-left px-3 py-2 rounded text-xs text-[#d0c5af] hover:bg-[#282a30] hover:text-[#e2e2ea] flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-[#f2ca50]">person_add</span>
                        <span>Criar / Trocar Conta de Usuário</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          logout()
                          setShowUserDropdown(false)
                          router.push('/')
                        }}
                        className="w-full text-left px-3 py-2 rounded text-xs text-rose-400 hover:bg-rose-500/10 font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>Desconectar da Conta</span>
                      </button>
                    </div>
                  </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setAuthTab('LOGIN')
                    setShowLoginModal(true)
                  }}
                >
                  Entrar / Cadastrar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Navegação Mobile (< 768px) */}
        <nav className="flex md:hidden items-center gap-1.5 px-4 py-2 bg-[#0c0e13] border-t border-[#282a30] overflow-x-auto">
          {navLinks.map((item) => {
            const isActive =
              item.path === '/'
                ? pathname === '/'
                : pathname.startsWith(item.path.split('?')[0])
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`px-4 py-2.5 min-h-[44px] flex items-center font-mono text-xs uppercase tracking-wider transition-colors rounded shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-[#d4af37] text-[#1c1400] font-bold'
                    : 'text-[#d0c5af] hover:text-[#e2e2ea]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Modal de Login & Cadastro de Conta com shadcn/ui Dialog + Tabs */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="bg-[#14171f] border-[#d4af37]/30 text-[#e2e2ea] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-[#282a30]">
            <DialogTitle className="font-serif text-lg text-[#e2e2ea]">
              Acesso Belmont Auctions
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-[#99907c]">
              Entre na sua conta ou cadastre um novo usuário licitante
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={authTab}
            onValueChange={(val) => {
              setAuthTab(val as 'LOGIN' | 'REGISTER')
              setLoginError('')
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-[#0c0e13] border border-[#282a30] h-10">
              <TabsTrigger
                value="LOGIN"
                className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-[#1c1400]"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="REGISTER"
                className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-[#1c1400]"
              >
                Criar Conta (Usuário)
              </TabsTrigger>
            </TabsList>

            {loginError && (
              <div className="my-3 p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                {loginError}
              </div>
            )}

            <TabsContent value="LOGIN" className="mt-4">
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-[#99907c]">
                    E-mail
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-[#99907c]">
                    Senha
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full"
                >
                  {isLoggingIn ? 'Autenticando...' : 'Entrar no Sistema'}
                </Button>
              </form>

              <Separator className="my-5 bg-[#282a30]" />

              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase text-[#99907c] mb-2">
                  Contas Semeadas Obrigatórias (1 Leiloeiro + 2 Clientes)
                </div>
                <button
                  type="button"
                  onClick={() => handleTestLogin('auctioneer@belmont.com')}
                  className="w-full p-2.5 rounded-lg bg-[#1d2025] hover:bg-[#282a30] text-left border border-[#d4af37]/40 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-[#f2ca50]">
                      LEI-0001 • Leiloeiro Oficial Belmont
                    </div>
                    <div className="text-[11px] text-[#99907c] font-mono">
                      auctioneer@belmont.com
                    </div>
                  </div>
                  <Badge variant="outline" className="border-[#d4af37]/40 text-[#f2ca50]">
                    Leiloeiro →
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestLogin('bidder1@belmont.com')}
                  className="w-full p-2.5 rounded-lg bg-[#1d2025] hover:bg-[#282a30] text-left border border-[#282a30] flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-[#e2e2ea]">
                      LIC-0001 • Helena Vasconcelos
                    </div>
                    <div className="text-[11px] text-[#99907c] font-mono">
                      bidder1@belmont.com
                    </div>
                  </div>
                  <Badge variant="outline" className="border-[#3c3f47] text-[#e2e2ea]">
                    Cliente 1 →
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestLogin('bidder2@belmont.com')}
                  className="w-full p-2.5 rounded-lg bg-[#1d2025] hover:bg-[#282a30] text-left border border-[#282a30] flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-[#e2e2ea]">
                      LIC-0002 • Eduardo Albuquerque (Líder no Lote Seed)
                    </div>
                    <div className="text-[11px] text-[#99907c] font-mono">
                      bidder2@belmont.com
                    </div>
                  </div>
                  <Badge variant="outline" className="border-[#3c3f47] text-[#e2e2ea]">
                    Cliente 2 →
                  </Badge>
                </button>
              </div>
            </TabsContent>

            <TabsContent value="REGISTER" className="mt-4">
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-[#99907c]">
                    Nome Completo
                  </Label>
                  <Input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: João Victor Silva"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-[#99907c]">
                    E-mail
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="joao@exemplo.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-document" className="text-[#99907c]">
                    CPF (11 dígitos)
                  </Label>
                  <Input
                    id="reg-document"
                    type="text"
                    inputMode="numeric"
                    value={regDocument}
                    onChange={(e) => setRegDocument(e.target.value)}
                    placeholder="12345678901"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-[#99907c]">
                    Senha (mín. 6 caracteres)
                  </Label>
                  <Input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoggingIn}
                  className="w-full"
                >
                  {isLoggingIn ? 'Criando Conta...' : 'Criar Conta de Licitante & Entrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
