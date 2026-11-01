import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeCancelLotUseCase } from '../use-cases/factories/makeCancelLotUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'
import { LotCancellationError } from '../use-cases/errors/lot-cancellation-error.js'

export async function cancelLotController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const cancelParamsSchema = z.object({
    id: z.string().uuid('ID do lote inválido'),
  })

  const { id } = cancelParamsSchema.parse(request.params)

  try {
    const cancelLotUseCase = makeCancelLotUseCase()

    const result = await cancelLotUseCase.execute({
      lotId: id,
      userId: request.user.sub,
      userRole: request.user.role,
    })

    return reply.status(200).send(result)
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: 'Lote não encontrado.' })
    }

    if (err instanceof LotCancellationError) {
      return reply.status(400).send({ message: err.message })
    }

    if (err instanceof Error) {
      return reply.status(400).send({ message: err.message })
    }

    throw err
  }
}
