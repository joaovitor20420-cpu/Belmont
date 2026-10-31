import type { FastifyReply, FastifyRequest } from 'fastify'

export function verifyUserRole(roleToVerify: 'AUCTIONEER' | 'BIDDER') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user

    if (role !== roleToVerify) {
      return reply.status(403).send({ message: 'Acesso negado: permissão insuficiente.' })
    }
  }
}