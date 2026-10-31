import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeSearchArtworksUseCase } from '../use-cases/factories/makeSearchArtworksUseCase.js'

export async function searchArtworksController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const searchQuerySchema = z.object({
    query: z.string().default(''),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(15),
  })

  const { query, page, limit } = searchQuerySchema.parse(request.query)

  const searchArtworksUseCase = makeSearchArtworksUseCase()

  const result = await searchArtworksUseCase.execute({
    query,
    page,
    limit,
  })

  return reply.status(200).send(result)
}
