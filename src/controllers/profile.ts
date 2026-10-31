import type { FastifyReply, FastifyRequest } from 'fastify'
import { makeGetUserProfileUseCase } from '../use-cases/factories/makeGetUserProfileUseCase.js'

export async function profileController(request: FastifyRequest, reply: FastifyReply) {
  const getUserProfile = makeGetUserProfileUseCase()

  const { user } = await getUserProfile.execute({
    userId: request.user.sub,
  })

  return reply.status(200).send({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      publicCode: user.publicCode,
      maskedName: user.maskedName,
      balanceTotal: Number(user.balanceTotal),
      balanceCommitted: Number(user.balanceCommitted),
      createdAt: user.createdAt,
    },
  })
}
