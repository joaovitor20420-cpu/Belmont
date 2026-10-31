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
  Radio,
  Calendar,
  Award,
  Layers,
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
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Hero Section com iluminação sutil de galeria */}
      <section className="relative overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(212,175,55,0.09),transparent)] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 mb-8 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="tracking-wide">Acervo Internacional • Art Institute of Chicago API</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Obras Raras.{' '}
            <span className="gold-gradient-text">Pregão em Tempo Real.</span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Plataforma institucional de alta fidelidade com motor de lances de concorrência estrita, proteção Anti-Sniping e trilha criptográfica HMAC-SHA256 à prova de manipulação no banco.
          </p>

          {/* Selos de Garantia e Tecnologia */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <Flame className="h-4 w-4 text-rose-400" />
              <span className="font-medium text-slate-300">Anti-Sniping (+120s)</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-slate-300">Hash Chain HMAC-SHA256</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-slate-300">Certificado com Selo Raiz</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Lotes */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          {/* Abas com indicador de status */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('LIVE')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'LIVE'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Ao Vivo</span>
            </button>

            <button
              onClick={() => setActiveTab('SCHEDULED')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SCHEDULED'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Agendados</span>
            </button>

            <button
              onClick={() => setActiveTab('ENDED')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ENDED'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Encerrados</span>
            </button>
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por obra ou mestre..."
              className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
            />
          </div>
        </div>

        {/* Listagem de Lotes */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-3" />
            <div className="text-xs text-slate-400">Carregando acervo oficial...</div>
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="py-28 text-center rounded-3xl border border-slate-900 bg-slate-900/20 my-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-4">
              <Gavel className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-serif font-bold text-white">
              Nenhum lote disponível nesta categoria
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === 'LIVE'
                ? 'Não há leilões ao vivo no momento. Novos lotes podem ser publicados pelo Painel do Leiloeiro.'
                : 'Nenhum resultado corresponde aos filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLots.map((lot) => {
              const remainingMs = new Date(lot.endTime).getTime() - now
              const isClosingSoon = remainingMs > 0 && remainingMs <= 120000

              return (
                <div
                  key={lot.id}
                  className="group relative flex flex-col rounded-3xl bg-slate-900/50 border border-slate-800/80 overflow-hidden hover:border-amber-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/5"
                >
                  {/* Moldura da Obra */}
                  <div className="relative h-64 w-full overflow-hidden bg-slate-950">
                    <img
                      src={lot.imageUrl}
                      alt={lot.title}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Gradient Overlay na Imagem */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                    {/* Badge de Status Superior */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      {lot.status === 'LIVE' && (
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-md ${
                            isClosingSoon
                              ? 'bg-rose-600/90 text-white animate-pulse'
                              : 'bg-emerald-950/85 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                          <span>{isClosingSoon ? 'RETA FINAL (+ANTI-SNIPE)' : 'AO VIVO'}</span>
                        </span>
                      )}

                      {lot.status === 'SCHEDULED' && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-950/85 text-blue-300 border border-blue-500/40 backdrop-blur-md shadow-md">
                          <Calendar className="h-3 w-3" />
                          <span>EM BREVE</span>
                        </span>
                      )}

                      {lot.status === 'ENDED' && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950/90 text-slate-300 border border-slate-700 backdrop-blur-md shadow-md">
                          <CheckCircle2 className="h-3 w-3 text-slate-400" />
                          <span>ENCERRADO</span>
                        </span>
                      )}
                    </div>

                    {/* Badge de Contagem Regressiva Inferior */}
                    {lot.status === 'LIVE' && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md px-3 py-1 text-xs font-mono font-bold text-amber-300 border border-slate-800 shadow-md">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span>{formatTimeRemaining(remainingMs)}</span>
                      </div>
                    )}
                  </div>

                  {/* Corpo do Card */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 block">
                        {lot.artist || 'Mestre Renomado'}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors mt-0.5">
                        {lot.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-5">
                      {lot.description}
                    </p>

                    {/* Valores e Disputa */}
                    <div className="mt-auto pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          {lot.status === 'ENDED' ? 'Arrematado por' : 'Lance Atual'}
                        </span>
                        <span className="font-mono text-lg font-extrabold text-white">
                          {formatCurrency(lot.currentPrice || lot.startPrice)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Disputa
                        </span>
                        <span className="text-xs font-semibold text-amber-400">
                          {lot.bidsCount} {lot.bidsCount === 1 ? 'lance' : 'lances'}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Ação */}
                    <div className="mt-5">
                      <Link
                        href={`/lots/${lot.id}`}
                        className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-bold transition-all cursor-pointer ${
                          lot.status === 'LIVE'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/15'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <span>
                          {lot.status === 'LIVE'
                            ? 'Entrar no Pregão Ao Vivo'
                            : 'Ver Detalhes & Auditoria'}
                        </span>
                        <ArrowRight className="h-4 w-4" />
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
