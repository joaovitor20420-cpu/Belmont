import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeCreateLotUseCase } from '../use-cases/factories/makeCreateLotUseCase.js'

export async function createLotController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createLotBodySchema = z.object({
    title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
    description: z
      .string()
      .min(5, 'A descrição deve ter no mínimo 5 caracteres'),
    imageUrl: z.string().url('URL da imagem inválida'),
    artist: z.string().nullable().optional(),
    externalApiId: z.string().nullable().optional(),
    startPriceInCents: z.number().int().positive().optional(),
    startPrice: z.number().int().positive().optional(),
    minIncrementInCents: z.number().int().positive().optional(),
    minIncrement: z.number().int().positive().optional(),
    startTime: z
      .string()
      .datetime({ message: 'Data de início em formato ISO 8601 inválida' }),
    endTime: z
      .string()
      .datetime({ message: 'Data de término em formato ISO 8601 inválida' }),
  })

  const body = createLotBodySchema.parse(request.body)
  const startPriceInCents = body.startPriceInCents ?? body.startPrice
  const minIncrementInCents = body.minIncrementInCents ?? body.minIncrement

  if (!startPriceInCents) {
    return reply.status(400).send({ message: 'O preço inicial deve ser informado.' })
  }
  if (!minIncrementInCents) {
    return reply.status(400).send({ message: 'O incremento mínimo deve ser informado.' })
  }

  try {
    const createLotUseCase = makeCreateLotUseCase()

    const { lot } = await createLotUseCase.execute({
      userId: request.user.sub,
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl,
      artist: body.artist,
      externalApiId: body.externalApiId,
      startPriceInCents,
      minIncrementInCents,
      startTime: body.startTime,
      endTime: body.endTime,
    })

    return reply.status(201).send({ lot })
  } catch (err) {
    if (err instanceof Error) {
      return reply.status(400).send({ message: err.message })
    }

    throw err
  }
}
