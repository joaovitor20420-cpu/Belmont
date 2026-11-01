import type { FastifyReply, FastifyRequest } from 'fastify'
import { makeSettleExpiredLotsUseCase } from '../use-cases/factories/makeSettleExpiredLotsUseCase.js'

export async function settleExpiredLotsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const settleExpiredLotsUseCase = makeSettleExpiredLotsUseCase()
    const result = await settleExpiredLotsUseCase.execute()

    return reply.status(200).send(result)
  } catch (err: any) {
    return reply.status(500).send({ message: err.message || 'Erro ao liquidar lotes expirados.' })
  }
}
