import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import {
  auctionEvents,
  type AuctionEventPayload,
} from '../lib/auctionEvents.js'

export async function liveAuctionStreamController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const streamParamsSchema = z.object({
    id: z.string().uuid('ID do lote inválido'),
  })

  const { id: lotId } = streamParamsSchema.parse(request.params)

  reply.raw.setHeader('Content-Type', 'text/event-stream')
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform')
  reply.raw.setHeader('Connection', 'keep-alive')
  reply.raw.setHeader('Access-Control-Allow-Origin', '*')

  // Envia mensagem inicial de handshake confirmando conexão na sala
  reply.raw.write(
    `event: connected\ndata: ${JSON.stringify({ lotId, connectedAt: new Date().toISOString() })}\n\n`,
  )

  const onAuctionUpdate = (event: AuctionEventPayload) => {
    if (event.lotId === lotId) {
      reply.raw.write(`event: update\ndata: ${JSON.stringify(event)}\n\n`)
    }
  }

  auctionEvents.on('update', onAuctionUpdate)

  // Envia heartbeat para manter a conexão aberta em proxies e load balancers
  const keepAliveInterval = setInterval(() => {
    reply.raw.write(': keep-alive\n\n')
  }, 20000)

  // Trata desconexão do cliente para liberar memória e remover o listener
  request.raw.on('close', () => {
    clearInterval(keepAliveInterval)
    auctionEvents.off('update', onAuctionUpdate)
  })
}
