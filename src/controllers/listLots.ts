import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeListLotsUseCase } from '../use-cases/factories/makeListLotsUseCase.js'

export async function listLotsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const listLotsQuerySchema = z.object({
    status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(20),
  })

  const { status, page, limit } = listLotsQuerySchema.parse(request.query)

  const listLotsUseCase = makeListLotsUseCase()

  const { lots } = await listLotsUseCase.execute({
    status,
    page,
    limit,
  })

  return reply.status(200).send({ lots })
}
