import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { registerUserController } from './controllers/registerUser.js'
import { authenticateUserController } from './controllers/authenticateUser.js'
import { verifyJwt } from './middlewares/verifyJwt.js'
import { verifyUserRole } from './middlewares/verifyUserRole.js'
import { profileController } from './controllers/profile.js'
import { depositController } from './controllers/deposit.js'
import { getWalletBalanceController } from './controllers/getWalletBalance.js'
import { getWalletStatementController } from './controllers/getWalletStatement.js'
import { searchArtworksController } from './controllers/searchArtworks.js'
import { getArtworkDetailsController } from './controllers/getArtworkDetails.js'
import { createLotController } from './controllers/createLot.js'
import { listLotsController } from './controllers/listLots.js'
import { getLotDetailsController } from './controllers/getLotDetails.js'
import { createBidController } from './controllers/createBid.js'
import { verifyLotAuditTrailController } from './controllers/verifyLotAuditTrail.js'
import { settleLotController } from './controllers/settleLot.js'
import { getReceiptByCodeController } from './controllers/getReceiptByCode.js'

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
  app.get(
    '/artworks/search',
    {
      schema: {
        tags: ['Catálogo de Obras'],
        summary: 'Buscar obras no acervo do Art Institute of Chicago',
        description:
          'Pesquisa obras de domínio público com imagens IIIF e fallback em cache local',
        querystring: z.object({
          query: z
            .string()
            .optional()
            .describe('Termo de busca (ex: Monet, Van Gogh, Landscape)'),
          page: z
            .coerce
            .number()
            .int()
            .positive()
            .optional()
            .describe('Página da busca'),
          limit: z
            .coerce
            .number()
            .int()
            .positive()
            .optional()
            .describe('Limite de resultados por página'),
        }),
      },
    },
    searchArtworksController,
  )
  app.get(
    '/artworks/:id',
    {
      schema: {
        tags: ['Catálogo de Obras'],
        summary: 'Detalhes de uma obra de arte',
        description:
          'Retorna metadados completos da obra a partir do ID do museu com fallback em cache',
        params: z.object({
          id: z
            .string()
            .describe('ID da obra de arte no Art Institute of Chicago'),
        }),
      },
    },
    getArtworkDetailsController,
  )
  app.post(
    '/lots',
    {
      onRequest: [verifyJwt, verifyUserRole('AUCTIONEER')],
      schema: {
        tags: ['Lotes'],
        summary: 'Criar novo lote de leilão',
        description:
          'Cria um novo lote de obra de arte para leilão. Restrito a usuários com papel AUCTIONEER.',
        body: z.object({
          title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
          description: z
            .string()
            .min(5, 'A descrição deve ter no mínimo 5 caracteres'),
          imageUrl: z.string().url('URL da imagem inválida'),
          artist: z.string().nullable().optional(),
          externalApiId: z.string().nullable().optional(),
          startPriceInCents: z
            .number()
            .int()
            .positive('O preço inicial deve ser positivo e em centavos'),
          minIncrementInCents: z
            .number()
            .int()
            .positive('O incremento mínimo deve ser positivo e em centavos'),
          startTime: z
            .string()
            .datetime({ message: 'Data de início em formato ISO 8601 inválida' }),
          endTime: z
            .string()
            .datetime({ message: 'Data de término em formato ISO 8601 inválida' }),
        }),
      },
    },
    createLotController,
  )
  app.get(
    '/lots',
    {
      schema: {
        tags: ['Lotes'],
        summary: 'Vitrine pública de lotes',
        description:
          'Lista os lotes de leilão disponíveis, com filtros opcionais por status (SCHEDULED, LIVE, ENDED, CANCELLED).',
        querystring: z.object({
          status: z
            .enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'])
            .optional()
            .describe('Status do lote'),
          page: z
            .coerce
            .number()
            .int()
            .positive()
            .optional()
            .describe('Página da listagem'),
          limit: z
            .coerce
            .number()
            .int()
            .positive()
            .optional()
            .describe('Limite de lotes por página'),
        }),
      },
    },
    listLotsController,
  )
  app.get(
    '/lots/:id',
    {
      schema: {
        tags: ['Lotes'],
        summary: 'Detalhes de um lote',
        description:
          'Retorna as informações completas do lote e o status atual do pregão.',
        params: z.object({
          id: z.string().uuid('ID do lote inválido'),
        }),
      },
    },
    getLotDetailsController,
  )
  app.post(
    '/lots/:id/bids',
    {
      onRequest: [verifyJwt],
      schema: {
        tags: ['Lances'],
        summary: 'Dar um lance no lote',
        description:
          'Registra um novo lance com lock pessimista, validação de incremento mínimo, bloqueio/desbloqueio atômico de saldos e mecanismo Anti-Sniping (+2 min nos minutos finais).',
        params: z.object({
          id: z.string().uuid('ID do lote inválido'),
        }),
        body: z.object({
          amountInCents: z
            .number()
            .int()
            .positive('O valor do lance em centavos deve ser positivo'),
        }),
      },
    },
    createBidController,
  )
  app.get(
    '/audit/verify/:lotId',
    {
      schema: {
        tags: ['Auditoria Criptográfica'],
        summary: 'Verificador público de integridade da Hash Chain',
        description:
          'Recalcula e audita publicamente toda a cadeia criptográfica de lances do lote, detectando qualquer adulteração no banco de dados sem exigir autenticação.',
        params: z.object({
          lotId: z.string().uuid('ID do lote inválido'),
        }),
      },
    },
    verifyLotAuditTrailController,
  )
  app.post(
    '/lots/:id/settle',
    {
      onRequest: [verifyJwt],
      schema: {
        tags: ['Liquidação'],
        summary: 'Encerrar e liquidar lote',
        description:
          'Rotina idempotente de encerramento do pregão: debita em definitivo o saldo do vencedor, calcula o selo criptográfico raiz e emite o comprovante oficial.',
        params: z.object({
          id: z.string().uuid('ID do lote inválido'),
        }),
      },
    },
    settleLotController,
  )
  app.get(
    '/receipts/:code',
    {
      schema: {
        tags: ['Comprovantes'],
        summary: 'Consultar comprovante oficial de arremate',
        description:
          'Retorna os dados autenticados do arremate, metadados da obra, dados pseudonimizados LGPD do arrematante e o selo de auditoria criptográfica.',
        params: z.object({
          code: z
            .string()
            .describe('Código oficial do comprovante (ex: REC-2026-A1B2C3)'),
        }),
      },
    },
    getReceiptByCodeController,
  )
}
