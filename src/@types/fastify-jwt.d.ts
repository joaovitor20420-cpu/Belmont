import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string
      role: 'AUCTIONEER' | 'BIDDER'
      publicCod: string
      maskedName: string
    }
  }
}
