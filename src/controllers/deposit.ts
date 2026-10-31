import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeDepositUseCase } from '../use-cases/factories/makeDepositUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'

export async function depositController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const depositBodySchema = z.object({
    amountInCents: z.number().int().positive('O valor deve ser positivo e em centavos'),
  })

  const { amountInCents } = depositBodySchema.parse(request.body)

  try {
    const depositUseCase = makeDepositUseCase()

    const { balanceTotal, balanceAvailable } = await depositUseCase.execute({
      userId: request.user.sub,
      amountInCents,
    })

    return reply.status(200).send({
      balanceTotal,
      balanceAvailable,
    })
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message })
    }

    throw err
  }
}
