import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeGetLotDetailsUseCase } from '../use-cases/factories/makeGetLotDetailsUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'

export async function getLotDetailsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getLotDetailsParamsSchema = z.object({
    id: z.string().uuid('ID do lote inválido'),
  })

  const { id } = getLotDetailsParamsSchema.parse(request.params)

  try {
    const getLotDetailsUseCase = makeGetLotDetailsUseCase()

    const { lot } = await getLotDetailsUseCase.execute({ id })

    return reply.status(200).send({ lot })
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: 'Lote não encontrado.' })
    }

    throw err
  }
}
