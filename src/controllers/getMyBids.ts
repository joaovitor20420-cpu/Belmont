import type { FastifyReply, FastifyRequest } from 'fastify'
import { makeGetMyBidsUseCase } from '../use-cases/factories/makeGetMyBidsUseCase.js'

export async function getMyBidsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const getMyBidsUseCase = makeGetMyBidsUseCase()

    const result = await getMyBidsUseCase.execute(request.user.sub)

    return reply.status(200).send(result)
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao consultar histórico de arremates.' })
  }
}
