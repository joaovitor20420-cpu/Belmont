import type { FastifyReply, FastifyRequest } from 'fastify'
import { makeGetWalletBalanceUseCase } from '../use-cases/factories/makeGetWalletBalanceUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'

export async function getWalletBalanceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const getWalletBalanceUseCase = makeGetWalletBalanceUseCase()

    const balance = await getWalletBalanceUseCase.execute({
      userId: request.user.sub,
    })

    return reply.status(200).send(balance)
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message })
    }

    throw err
  }
}
