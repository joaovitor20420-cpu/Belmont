import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { env } from '../env.js'
import { InvalidCredentialsError } from '../use-cases/errors/invalid-credentials-error.js'
import { makeAuthenticateUserUseCase } from '../use-cases/factories/makeAuthenticateUserUseCase.js'

export async function authenticateUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authenticateBodySchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  })

  const { email, password } = authenticateBodySchema.parse(request.body)

  try {
    const authenticateUserUseCase = makeAuthenticateUserUseCase()

    const { user } = await authenticateUserUseCase.execute({
      email,
      password,
    })

    // 1. Gera o Token JWT assinado com a nossa chave secreta
    const token = await reply.jwtSign(
      {
        role: user.role,
        publicCode: user.publicCode,
        maskedName: user.maskedName,
      },
      {
        sign: {
          sub: user.id,
          expiresIn: '7d',
        },
      },
    )

    // 2. Grava o cookie seguro HttpOnly e responde com o token
    return reply
      .setCookie('token', token, {
        path: '/',
        secure: env.NODE_ENV === 'production',
        sameSite: true,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60, // 7 dias
      })
      .status(200)
      .send({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          publicCode: user.publicCode,
          maskedName: user.maskedName,
        },
      })
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return reply.status(400).send({ message: err.message })
    }

    throw err
  }
}
