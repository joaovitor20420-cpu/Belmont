import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeVerifyLotAuditTrailUseCase } from '../use-cases/factories/makeVerifyLotAuditTrailUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'

export async function verifyLotAuditTrailController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const verifyParamsSchema = z.object({
    lotId: z.string().uuid('ID do lote inválido'),
  })

  const { lotId } = verifyParamsSchema.parse(request.params)

  try {
    const verifyLotAuditTrailUseCase = makeVerifyLotAuditTrailUseCase()

    const result = await verifyLotAuditTrailUseCase.execute({ lotId })

    return reply.status(200).send(result)
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: 'Lote não encontrado.' })
    }

    throw err
  }
}
