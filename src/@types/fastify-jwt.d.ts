import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string
      role: 'AUCTIONEER' | 'BIDDER'
      publicCode: string
      maskedName: string
    }
  }
}
