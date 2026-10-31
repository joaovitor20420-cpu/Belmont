import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeGetReceiptByCodeUseCase } from '../use-cases/factories/makeGetReceiptByCodeUseCase.js'
import { ResourceNotFoundError } from '../use-cases/errors/resource-not-found-error.js'

export async function getReceiptByCodeController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getReceiptParamsSchema = z.object({
    code: z.string().min(5, 'Código de comprovante inválido'),
  })

  const { code } = getReceiptParamsSchema.parse(request.params)

  try {
    const getReceiptByCodeUseCase = makeGetReceiptByCodeUseCase()

    const result = await getReceiptByCodeUseCase.execute({ code })

    return reply.status(200).send(result)
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: 'Comprovante não encontrado.' })
    }

    throw err
  }
}
