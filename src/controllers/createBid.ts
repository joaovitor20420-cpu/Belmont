import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeCreateBidUseCase } from '../use-cases/factories/makeCreateBidUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'
import { AuctionNotActiveError } from '../use-cases/errors/auction-not-active-error.js'
import { SelfOutbidError } from '../use-cases/errors/self-outbid-error.js'
import { InvalidBidAmountError } from '../use-cases/errors/invalid-bid-amount-error.js'
import { InsufficientFundsError } from '../use-cases/errors/insufficient-funds-error.js'
import { AuctioneerCannotBidError } from '../use-cases/errors/auctioneer-cannot-bid-error.js'

export async function createBidController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createBidParamsSchema = z.object({
    id: z.string().uuid('ID do lote inválido'),
  })

  const createBidBodySchema = z
    .object({
      amountInCents: z.number().int().positive().optional(),
      amount: z.number().int().positive().optional(),
    })
    .refine((data) => data.amountInCents !== undefined || data.amount !== undefined, {
      message: 'O valor do lance em centavos deve ser informado.',
    })

  const { id: lotId } = createBidParamsSchema.parse(request.params)
  const body = createBidBodySchema.parse(request.body)
  const amountInCents = body.amountInCents ?? body.amount!

  try {
    const createBidUseCase = makeCreateBidUseCase()

    const result = await createBidUseCase.execute({
      lotId,
      bidderId: request.user.sub,
      amountInCents,
    })

    return reply.status(201).send(result)
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message })
    }

    if (err instanceof AuctioneerCannotBidError) {
      return reply.status(403).send({ message: err.message })
    }

    if (
      err instanceof AuctionNotActiveError ||
      err instanceof SelfOutbidError ||
      err instanceof InvalidBidAmountError ||
      err instanceof InsufficientFundsError
    ) {
      return reply.status(400).send({ message: err.message })
    }

    if (err instanceof Error) {
      return reply.status(400).send({ message: err.message })
    }

    throw err
  }
}
