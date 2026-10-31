import type { FastifyReply, FastifyRequest } from 'fastify'
import { makeGetWalletStatementUseCase } from '../use-cases/factories/makeGetWalletStatementUseCase.js'

export async function getWalletStatementController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getWalletStatementUseCase = makeGetWalletStatementUseCase()

  const { transactions } = await getWalletStatementUseCase.execute({
    userId: request.user.sub,
  })

  return reply.status(200).send({
    transactions,
  })
}
