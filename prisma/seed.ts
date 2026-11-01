import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { maskName } from '../src/utils/lgpd.js'
import { makeCreateBidUseCase } from '../src/use-cases/factories/makeCreateBidUseCase.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando Seed Oficial (Requisitos Verzel - Pág. 05)...')

  const passwordHash = await bcrypt.hash('password123', 6)

  // 1. Leiloeiro Oficial (AUCTIONEER)
  const auctioneer = await prisma.user.upsert({
    where: { email: 'auctioneer@belmont.com' },
    update: {
      passwordHash,
      role: 'AUCTIONEER',
    },
    create: {
      name: 'Leiloeiro Belmont Oficial',
      email: 'auctioneer@belmont.com',
      document: '11122233344',
      passwordHash,
      maskedName: maskName('Leiloeiro Belmont Oficial'),
      publicCode: 'LEI-0001',
      role: 'AUCTIONEER',
      balanceTotal: BigInt(0),
      balanceCommitted: BigInt(0),
    },
  })
  console.log(`✓ 1. Leiloeiro Oficial: ${auctioneer.email} (${auctioneer.publicCode}) | Senha: password123`)

  // 2. Cliente Licitante 1 (BIDDER)
  const bidder1 = await prisma.user.upsert({
    where: { email: 'bidder1@belmont.com' },
    update: {
      passwordHash,
      role: 'BIDDER',
      balanceTotal: BigInt(25000000), // R$ 250.000,00
      balanceCommitted: BigInt(0),
    },
    create: {
      name: 'Helena Vasconcelos',
      email: 'bidder1@belmont.com',
      document: '22233344455',
      passwordHash,
      maskedName: maskName('Helena Vasconcelos'),
      publicCode: 'LIC-0001',
      role: 'BIDDER',
      balanceTotal: BigInt(25000000), // R$ 250.000,00
      balanceCommitted: BigInt(0),
    },
  })
  console.log(`✓ 2. Cliente Licitante 1: ${bidder1.email} (${bidder1.publicCode}) | Senha: password123`)

  // 3. Cliente Licitante 2 (BIDDER)
  const bidder2 = await prisma.user.upsert({
    where: { email: 'bidder2@belmont.com' },
    update: {
      passwordHash,
      role: 'BIDDER',
      balanceTotal: BigInt(25000000), // R$ 250.000,00
      balanceCommitted: BigInt(0),
    },
    create: {
      name: 'Eduardo Albuquerque',
      email: 'bidder2@belmont.com',
      document: '33344455566',
      passwordHash,
      maskedName: maskName('Eduardo Albuquerque'),
      publicCode: 'LIC-0002',
      role: 'BIDDER',
      balanceTotal: BigInt(25000000), // R$ 250.000,00
      balanceCommitted: BigInt(0),
    },
  })
  console.log(`✓ 3. Cliente Licitante 2: ${bidder2.email} (${bidder2.publicCode}) | Senha: password123`)

  // 4. Ao menos 1 Lote Publicado AO VIVO com Lances Abertos (Requisito Pág. 05 do PDF)
  const existingLiveWithBids = await prisma.lot.findFirst({
    where: {
      status: 'LIVE',
      bidsCount: { gt: 0 },
    },
  })

  if (existingLiveWithBids) {
    console.log(`✓ 4. Já existe lote AO VIVO com lances abertos: "${existingLiveWithBids.title}" (#${existingLiveWithBids.id.slice(0, 8)})`)
  } else {
    const now = Date.now()
    const seededLot = await prisma.lot.create({
      data: {
        userId: auctioneer.id,
        title: 'The Stroller (A Passeata - Coleção CMA)',
        description:
          'Catalogação oficial: Óleo sobre tela • Acervo Cleveland Museum of Art (#151904).',
        imageUrl: 'https://openaccess-cdn.clevelandart.org/1958.31/1958.31_web.jpg',
        artist: 'Pierre-Auguste Renoir',
        externalApiId: '151904',
        startPrice: BigInt(5000000), // R$ 50.000,00
        currentPrice: BigInt(5000000),
        minIncrement: BigInt(500000), // R$ 5.000,00
        status: 'LIVE',
        startTime: new Date(now - 5 * 60 * 1000),
        endTime: new Date(now + 45 * 60 * 1000),
      },
    })

    const createBidUseCase = makeCreateBidUseCase()

    // 1º Lance real pelo Cliente 1 (R$ 50.000,00) -> gera Hash Chain SHA-256 real
    await createBidUseCase.execute({
      lotId: seededLot.id,
      bidderId: bidder1.id,
      amountInCents: 5000000,
    })

    // 2º Lance real pelo Cliente 2 (R$ 55.000,00) -> libera saldo do Cliente 1 e retém do Cliente 2
    await createBidUseCase.execute({
      lotId: seededLot.id,
      bidderId: bidder2.id,
      amountInCents: 5500000,
    })

    console.log(
      `✓ 4. Lote AO VIVO semeado com 2 lances abertos reais e Hash Chain SHA-256 íntegra: "${seededLot.title}" (#${seededLot.id.slice(0, 8)})`,
    )
  }

  console.log('\n🎉 Seed concluído com sucesso! Seus lotes e contas pessoais existentes foram preservados.')
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
