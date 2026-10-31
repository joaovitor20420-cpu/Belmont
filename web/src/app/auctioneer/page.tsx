'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import {
  Gavel,
  Search,
  PlusCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Layers,
  Image as ImageIcon,
} from 'lucide-react'

interface ArtworkSearchResult {
  id: string
  title: string
  artistTitle: string | null
  dateDisplay: string | null
  mediumDisplay: string | null
  imageUrl: string | null
  isPublicDomain: boolean
}

export default function AuctioneerPanelPage() {
  const { user, login } = useAuth()

  // Busca no Art Institute
  const [artQuery, setArtQuery] = useState('Monet')
  const [artworks, setArtworks] = useState<ArtworkSearchResult[]>([])
  const [isSearchingArt, setIsSearchingArt] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Formulário de Criação de Lote
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [artist, setArtist] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [externalApiId, setExternalApiId] = useState<string | null>(null)
  const [startPrice, setStartPrice] = useState('5000') // em reais
  const [minIncrement, setMinIncrement] = useState('200') // em reais
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [isCreatingLot, setIsCreatingLot] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Realizar busca no Art Institute
  const handleSearchArtworks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!artQuery.trim()) return

    setIsSearchingArt(true)
    setSearchError('')
    try {
      const data = await apiRequest<{ items: ArtworkSearchResult[] }>(
        `/artworks/search?query=${encodeURIComponent(artQuery.trim())}&limit=6`,
      )
      setArtworks(data.items || [])
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao consultar o catálogo do Art Institute.')
    } finally {
      setIsSearchingArt(false)
    }
  }

  // Preenche formulário com dados da obra selecionada
  const handleSelectArtwork = (art: ArtworkSearchResult) => {
    setTitle(art.title)
    setArtist(art.artistTitle || 'Artista Renomado')
    setImageUrl(art.imageUrl || '')
    setExternalApiId(art.id ? String(art.id) : null)
    setDescription(
      `Obra do acervo permanente do Art Institute of Chicago (#${art.id}).\n${art.mediumDisplay || 'Técnica Mista'} - ${art.dateDisplay || 'Data não informada'}.\nDomínio público verificado internacionalmente.`,
    )
    window.scrollTo({ top: 500, behavior: 'smooth' })
  }

  // Submeter criação de lote
  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !imageUrl) return

    setIsCreatingLot(true)
    setFeedback(null)

    const now = new Date()
    const startTime = now.toISOString()
    const endTime = new Date(
      now.getTime() + parseInt(durationMinutes || '60') * 60 * 1000,
    ).toISOString()

    try {
      await apiRequest<{ lot: { id: string } }>('/lots', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          artist,
          externalApiId: externalApiId ? String(externalApiId) : null,
          startPriceInCents: Math.round(parseFloat(startPrice) * 100),
          minIncrementInCents: Math.round(parseFloat(minIncrement) * 100),
          startTime,
          endTime,
        }),
      })

      setFeedback({
        type: 'success',
        message: 'Lote criado com sucesso! Ele já está disponível no pregão ao vivo.',
      })

      // Limpar formulário
      setTitle('')
      setDescription('')
      setArtist('')
      setImageUrl('')
      setExternalApiId(null)
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Falha ao registrar o lote.',
      })
    } finally {
      setIsCreatingLot(false)
    }
  }

  // Se o usuário não for leiloeiro, barreira amigável
  if (!user || user.role !== 'AUCTIONEER') {
    return (
      <div className="mx-auto max-w-lg py-24 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-950/60 border border-purple-800 text-purple-400 mb-5 shadow-2xl">
          <Gavel className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-white">Painel do Leiloeiro Oficial</h2>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          Esta área é restrita a usuários com perfil de Leiloeiro (RBAC: `AUCTIONEER`). Você pode acessar instantaneamente com a conta pré-configurada abaixo.
        </p>

        <button
          onClick={() => login('auctioneer@belmont.com', 'password123')}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-6 py-3 text-xs font-bold text-white transition shadow-lg shadow-purple-600/25 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Acessar como Leiloeiro Belmont (LEI-0001)</span>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header do Painel */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/80 mb-3">
                Leiloeiro Oficial • {user.publicCode}
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                Painel de Gestão de Catálogo & Pregões
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Consulte o acervo internacional do Art Institute of Chicago, importe metadados com 1 clique e publique novos lotes.
              </p>
            </div>

            <Link
              href="/"
              className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              Ver Vitrine Pública
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {/* Seção 1: Pesquisa no Art Institute of Chicago */}
        <section className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Catálogo Internacional (Art Institute of Chicago API)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pesquise por artistas (ex: Monet, Van Gogh, Renoir, Cézanne) e selecione uma obra para preencher o lote com 1 clique.
              </p>
            </div>

            <form onSubmit={handleSearchArtworks} className="flex gap-2.5 w-full sm:w-auto">
              <input
                type="text"
                value={artQuery}
                onChange={(e) => setArtQuery(e.target.value)}
                placeholder="Ex: Monet, Van Gogh, Renoir..."
                className="w-full sm:w-72 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-medium"
              />
              <button
                type="submit"
                disabled={isSearchingArt}
                className="rounded-2xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
              >
                {isSearchingArt ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          </div>

          {searchError && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 mb-6">
              {searchError}
            </div>
          )}

          {artworks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {artworks.map((art) => (
                <div
                  key={art.id}
                  className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-3.5 flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300 group shadow-lg"
                >
                  <div>
                    <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                      <img
                        src={art.imageUrl || ''}
                        alt={art.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop'
                        }}
                      />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/90 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                        Domínio Público
                      </span>
                    </div>
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider truncate">
                      {art.artistTitle || 'Artista Desconhecido'}
                    </div>
                    <h4 className="text-xs font-serif font-bold text-white line-clamp-1 mt-0.5">{art.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-mono">
                      {art.mediumDisplay || art.dateDisplay}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectArtwork(art)}
                    className="mt-3.5 w-full py-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold text-slate-200 transition-colors border border-slate-800 cursor-pointer"
                  >
                    Usar no Lote
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seção 2: Formulário de Criação de Lote */}
        <section className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 shadow-xl">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2.5 mb-1">
            <PlusCircle className="h-5 w-5 text-emerald-400" />
            Cadastrar Novo Lote no Pregão Ao Vivo
          </h2>
          <p className="text-xs text-slate-400 mb-8 max-w-xl">
            Defina os parâmetros do lote. O sistema aplicará as regras de concorrência ACID, incremento mínimo e extensão anti-sniping automaticamente.
          </p>

          {feedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-medium mb-6 flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/80 border border-rose-800 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleCreateLot} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Título da Obra / Lote *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Water Lilies (Nymphéas)"
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Artista / Autor
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ex: Claude Monet"
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                URL da Imagem em Alta Resolução *
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Descrição Histórica & Laudo Técnico
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes históricos, procedência e estado de conservação..."
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Preço Inicial (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={startPrice}
                  onChange={(e) => setStartPrice(e.target.value)}
                  placeholder="5000.00"
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Incremento Mínimo (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={minIncrement}
                  onChange={(e) => setMinIncrement(e.target.value)}
                  placeholder="200.00"
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Duração do Pregão (Minutos) *
                </label>
                <input
                  type="number"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="60"
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isCreatingLot}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-slate-950 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isCreatingLot ? 'Publicando Lote...' : 'Publicar Lote no Pregão Ao Vivo'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
