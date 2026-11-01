import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeSettleLotUseCase } from '../use-cases/factories/makeSettleLotUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'

export async function settleLotController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const settleParamsSchema = z.object({
    id: z.string().uuid('ID do lote inválido'),
  })

  const { id } = settleParamsSchema.parse(request.params)

  try {
    const settleLotUseCase = makeSettleLotUseCase()

    const result = await settleLotUseCase.execute({
      lotId: id,
      requestedByUserId: request.user?.sub,
      requestedByUserRole: request.user?.role,
    })

    return reply.status(200).send(result)
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: 'Lote não encontrado.' })
    }

    if (err instanceof Error) {
      return reply.status(400).send({ message: err.message })
    }

    throw err
  }
}
