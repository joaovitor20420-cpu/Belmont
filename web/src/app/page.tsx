'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatCurrency, formatTimeRemaining } from '@/lib/utils'
import {
  Gavel,
  Flame,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Search,
} from 'lucide-react'

interface LotItem {
  id: string
  title: string
  description: string
  imageUrl: string
  artist: string | null
  startPrice: number
  currentPrice: number
  minIncrement: number
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  startTime: string
  endTime: string
  bidsCount: number
  lotSealHash: string | null
  currentWinner?: {
    publicCode: string
    maskedName: string
  } | null
}

export default function HomePage() {
  const [lots, setLots] = useState<LotItem[]>([])
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCHEDULED' | 'ENDED'>('LIVE')
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [now, setNow] = useState(Date.now())

  // Timer para contagem regressiva
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Buscar lotes da API
  useEffect(() => {
    const fetchLots = async () => {
      try {
        setIsLoading(true)
        const data = await apiRequest<{ lots: LotItem[] }>(`/lots?status=${activeTab}`)
        setLots(data.lots || [])
      } catch (err) {
        console.error('Erro ao buscar lotes:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLots()
  }, [activeTab])

  const filteredLots = lots.filter(
    (lot) =>
      lot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lot.artist && lot.artist.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.12),rgba(255,255,255,0))]"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Belas Artes & Acervo Histórico do Art Institute of Chicago</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Leilões Exclusivos com{' '}
            <span className="gold-gradient-text">Pregão em Tempo Real</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Dispute obras-primas com lances instantâneos via Server-Sent Events, proteção inteligente contra snipe e auditoria criptográfica HMAC-SHA256 à prova de manipulação.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <Flame className="h-4 w-4 text-rose-500" />
              <span>Anti-Sniping (+2 min)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Cadeia de Hash Criptográfica</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Comprovante com Selo Raiz</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        {/* Filtros e Abas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('LIVE')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'LIVE'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Ao Vivo
            </button>

            <button
              onClick={() => setActiveTab('SCHEDULED')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'SCHEDULED'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Agendados
            </button>

            <button
              onClick={() => setActiveTab('ENDED')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'ENDED'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Encerrados
            </button>
          </div>

          {/* Barra de Busca */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por obra ou artista..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Grade de Lotes */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Carregando catálogo de leilões...
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-4">
              <Gavel className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Nenhum lote encontrado nesta categoria
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === 'LIVE'
                ? 'Não há leilões em andamento neste momento. O leiloeiro pode criar um novo lote através do Painel do Leiloeiro.'
                : 'Nenhum registro corresponde aos filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLots.map((lot) => {
              const remainingMs = new Date(lot.endTime).getTime() - now
              const isClosingSoon = remainingMs > 0 && remainingMs <= 120000

              return (
                <div
                  key={lot.id}
                  className="group relative flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden hover:border-amber-500/40 transition duration-300 shadow-lg hover:shadow-amber-500/5"
                >
                  {/* Imagem do Lote */}
                  <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                    <img
                      src={lot.imageUrl}
                      alt={lot.title}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop'
                      }}
                    />

                    {/* Badge de Status */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {lot.status === 'LIVE' && (
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
                            isClosingSoon
                              ? 'bg-rose-500/90 text-white animate-pulse'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                          {isClosingSoon ? 'RETA FINAL (+ANTI-SNIPE)' : 'AO VIVO'}
                        </span>
                      )}

                      {lot.status === 'SCHEDULED' && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                          <Clock className="h-3 w-3" />
                          EM BREVE
                        </span>
                      )}

                      {lot.status === 'ENDED' && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-slate-300 border border-slate-700 backdrop-blur-md">
                          ENCERRADO
                        </span>
                      )}
                    </div>

                    {/* Contador Regressivo sobreposto */}
                    {lot.status === 'LIVE' && (
                      <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-xs font-mono font-semibold text-white border border-slate-800">
                        ⏱️ {formatTimeRemaining(remainingMs)}
                      </div>
                    )}
                  </div>

                  {/* Detalhes do Lote */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400/90">
                        {lot.artist || 'Artista Renomado'}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-white line-clamp-1 group-hover:text-amber-300 transition">
                        {lot.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {lot.description}
                    </p>

                    {/* Preços e Lances */}
                    <div className="mt-auto pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          {lot.status === 'ENDED' ? 'Arrematado por' : 'Lance Atual'}
                        </span>
                        <span className="font-mono text-base font-bold text-white">
                          {formatCurrency(lot.currentPrice || lot.startPrice)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Disputa
                        </span>
                        <span className="text-xs font-semibold text-amber-400">
                          {lot.bidsCount} {lot.bidsCount === 1 ? 'lance' : 'lances'}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Ação */}
                    <div className="mt-4 pt-2">
                      <Link
                        href={`/lots/${lot.id}`}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition ${
                          lot.status === 'LIVE'
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <span>
                          {lot.status === 'LIVE'
                            ? 'Entrar no Pregão Ao Vivo'
                            : 'Ver Detalhes & Auditoria'}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
