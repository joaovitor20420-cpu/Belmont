import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { registerUserController } from './controllers/registerUser.js'
import { authenticateUserController } from './controllers/authenticateUser.js'

export async function appRoutes(app: FastifyInstance) {
  app.post(
    '/users',
    {
      schema: {
        tags: ['Usuários'],
        summary: 'Cadastrar novo usuário',
        description:
          'Cadastra um licitante ou leiloeiro com pseudonimização LGPD e hash seguro de senha',
        body: z.object({
          name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
          email: z.string().email('Email inválido'),
          password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
          document: z.string().min(11, 'O CPF deve ter pelo menos 11 caracteres'),
          role: z.enum(['AUCTIONEER', 'BIDDER']).default('BIDDER'),
        }),
      },
    },
    registerUserController,
  )
app.post(
    '/sessions',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Login do usuário',
        description: 'Autentica o usuário e emite o token JWT com cookie HttpOnly',
        body: z.object({
          email: z.string().email('Email inválido'),
          password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
        }),
      },
    },
    authenticateUserController,
  )
}