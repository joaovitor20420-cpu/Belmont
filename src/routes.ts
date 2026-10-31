import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { registerUserController } from './controllers/registerUser.js'
import { authenticateUserController } from './controllers/authenticateUser.js'
import { verifyJwt } from './middlewares/verifyJwt.js'
import { profileController } from './controllers/profile.js'
import { depositController } from './controllers/deposit.js'
import { getWalletBalanceController } from './controllers/getWalletBalance.js'
import { getWalletStatementController } from './controllers/getWalletStatement.js'

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
  app.get(
    '/me',
    {
      onRequest: [verifyJwt],
      schema: {
        tags: ['Usuários'],
        summary: 'Perfil do usuário logado',
        description: 'Retorna os dados do perfil autenticado a partir do token JWT',
      },
    },
    profileController,
  )
  app.post(
    '/wallet/deposit',
    {
      onRequest: [verifyJwt],
      schema: {
        tags: ['Carteira'],
        summary: 'Depositar saldo na carteira',
        description:
          'Adiciona saldo simulado em centavos (ex: 5000 para R$ 50,00)',
        body: z.object({
          amountInCents: z
            .number()
            .int()
            .positive('O valor deve ser positivo e em centavos'),
        }),
      },
    },
    depositController,
  )
  app.get(
    '/wallet/balance',
    {
      onRequest: [verifyJwt],
      schema: {
        tags: ['Carteira'],
        summary: 'Consultar saldos da carteira',
        description:
          'Retorna os saldos Total, Comprometido e Disponível em centavos e formatados em reais',
      },
    },
    getWalletBalanceController,
  )
  app.get(
    '/wallet/statement',
    {
      onRequest: [verifyJwt],
      schema: {
        tags: ['Carteira'],
        summary: 'Consultar extrato de transações',
        description:
          'Retorna o histórico contábil completo de transações da carteira do usuário logado',
      },
    },
    getWalletStatementController,
  )
}
