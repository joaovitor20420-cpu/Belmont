import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeGetArtworkDetailsUseCase } from '../use-cases/factories/makeGetArtworkDetailsUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'

export async function getArtworkDetailsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const artworkParamsSchema = z.object({
    id: z.string(),
  })

  const { id } = artworkParamsSchema.parse(request.params)

  try {
    const getArtworkDetailsUseCase = makeGetArtworkDetailsUseCase()

    const result = await getArtworkDetailsUseCase.execute({ id })

    return reply.status(200).send(result)
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply
        .status(404)
        .send({ message: 'Obra de arte não encontrada.' })
    }

    throw err
  }
}
