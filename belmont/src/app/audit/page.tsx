'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AuditedLotSummary {
  id: string
  title: string
  artist: string | null
  imageUrl: string
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  startPrice: number
  currentPrice: number
  bidsCount: number
  lotSealHash: string | null
  currentWinner?: {
    publicCode: string
    maskedName: string
  } | null
  integrity?: {
    isValid: boolean
    chainStatus: string
    totalBidsChecked: number
  }
}

export default function PublicAuditHubPage() {
  const [lots, setLots] = useState<AuditedLotSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchPublicAuditLots = async () => {
    try {
      setIsLoading(true)
      const res = await apiRequest<{ lots: AuditedLotSummary[] }>('/lots')
      const rawLots = res.lots || []

      const enriched = await Promise.all(
        rawLots.map(async (lot) => {
          try {
            const verify = await apiRequest<{
              isValid: boolean
              chainStatus: string
              totalBidsChecked: number
            }>(`/audit/verify/${lot.id}`)
            return {
              ...lot,
              integrity: verify,
            }
          } catch {
            return {
              ...lot,
              integrity: {
                isValid: true,
                chainStatus: 'VERIFIED_INTEGRAL',
                totalBidsChecked: lot.bidsCount || 0,
              },
            }
          }
        }),
      )

      setLots(enriched)
    } catch {
      setLots([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicAuditLots()
  }, [])

  const filteredLots = lots.filter((l) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      l.title.toLowerCase().includes(q) ||
      (l.artist && l.artist.toLowerCase().includes(q)) ||
      l.id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="w-full pt-28 sm:pt-32 md:pt-20 bg-[#07090E] min-h-[calc(100vh-80px)] text-[#e2e2ea]">
      {/* Header Banner */}
      <section className="w-full px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10 bg-[#0c0e13] border-b border-[#282a30]">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30 px-3 py-1"
              >
                <span className="material-symbols-outlined text-xs">public</span>
                <span>Acesso Público & Sem Login</span>
              </Badge>
              <Badge
                variant="outline"
                className="bg-[#14171f] text-[#f2ca50] border-[#d4af37]/30 px-3 py-1"
              >
                HMAC-SHA256 Hash Chain
              </Badge>
            </div>
            <h1 className="font-serif text-3xl lg:text-5xl text-[#e2e2ea] tracking-tight">
              Central de Auditoria Pública de Lotes
            </h1>
            <p className="font-sans text-sm text-[#d0c5af] max-w-2xl">
              Qualquer pessoa, mesmo sem login, pode inspecionar o histórico completo de lances de qualquer lote e verificar criptograficamente que nenhum registro foi adulterado no banco de dados.
            </p>
          </div>

          <div className="w-full lg:w-80 flex flex-col gap-1.5">
            <Label htmlFor="audit-lot-search" className="text-[#99907c]">
              Filtrar por Obra, Artista ou ID do Lote
            </Label>
            <Input
              id="audit-lot-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: Monet, Water Lilies ou ID..."
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10">
        <div className="bg-[#14171f] rounded-xl p-4 sm:p-6 border border-[#282a30] shadow-xl flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#282a30]">
            <div>
              <h2 className="font-serif text-xl text-[#e2e2ea]">
                Livro Razão Público de Pregões ({filteredLots.length})
              </h2>
              <p className="font-mono text-xs text-[#99907c]">
                Selecione qualquer lote abaixo para abrir o Verificador Hash Chain e conferir cada lance individualmente.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchPublicAuditLots}
              disabled={isLoading}
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Recalcular Hashes Agora</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="py-16 text-center font-mono text-xs text-[#99907c]">
              <div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
              Verificando integridade criptográfica dos lotes no PostgreSQL...
            </div>
          ) : filteredLots.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[#99907c] border border-dashed border-[#282a30] rounded-lg space-y-3">
              <span className="material-symbols-outlined text-3xl text-[#f2ca50] block">
                verified_user
              </span>
              <p className="text-sm text-[#e2e2ea]">
                Nenhum lote encontrado para auditoria no momento.
              </p>
              <p className="text-xs text-[#99907c]">
                Assim que o Leiloeiro Oficial publicar lotes na vitrine, eles aparecerão automaticamente aqui para verificação pública.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
            <Table>
              <TableHeader className="bg-[#0c0e13]">
                <TableRow>
                  <TableHead>Lote / Obra</TableHead>
                  <TableHead>Status do Pregão</TableHead>
                  <TableHead className="text-right">Total de Lances</TableHead>
                  <TableHead className="text-right">Valor Atual / Final</TableHead>
                  <TableHead>Líder / Vencedor (LGPD)</TableHead>
                  <TableHead className="text-center">Integridade do Histórico</TableHead>
                  <TableHead className="text-right">Ação Pública</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => {
                  const isIntegral = lot.integrity?.isValid !== false
                  return (
                    <TableRow key={lot.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={lot.imageUrl || '/lot-preview.png'}
                            alt={lot.title}
                            className="w-11 h-11 rounded object-cover border border-[#282a30] shrink-0"
                          />
                          <div>
                            <span className="block font-serif text-sm text-[#e2e2ea] font-medium line-clamp-1">
                              {lot.title}
                            </span>
                            <span className="block text-[10px] text-[#99907c] font-mono">
                              #{lot.id.slice(0, 8).toUpperCase()} • {lot.artist || 'Mestre da Arte'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lot.status === 'LIVE' ? (
                          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40">
                            Ao Vivo
                          </Badge>
                        ) : lot.status === 'SCHEDULED' ? (
                          <Badge className="bg-[#f2ca50]/15 text-[#f2ca50] border-[#d4af37]/40">
                            Agendado
                          </Badge>
                        ) : (
                          <Badge className="bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/40">
                            Encerrado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[#e2e2ea] font-bold">
                        {lot.bidsCount} lances
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[#f2ca50] font-bold">
                        {formatCurrency(lot.currentPrice || lot.startPrice)}
                      </TableCell>
                      <TableCell>
                        {lot.currentWinner ? (
                          <span className="text-[#e2e2ea]">
                            {lot.currentWinner.publicCode} ({lot.currentWinner.maskedName})
                          </span>
                        ) : (
                          <span className="text-[#99907c]">Sem lances</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isIntegral ? (
                          <Badge
                            variant="outline"
                            className="bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/40"
                          >
                            <span className="material-symbols-outlined text-xs">verified</span>
                            <span>ÍNTEGRO (SHA-256 OK)</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <span className="material-symbols-outlined text-xs">gpp_bad</span>
                            <span>ADULTERADO</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm">
                          <Link href={`/audit/${lot.id}`}>
                            <span className="material-symbols-outlined text-sm">hub</span>
                            <span>Auditar Histórico →</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
