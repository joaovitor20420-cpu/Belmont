import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { maskName } from '../src/utils/lgpd.js'
import { calculateBidHash, calculateLotSealHash } from '../src/utils/cryptoAudit.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando processo de seed das contas e lotes obrigatórios...')

  const passwordHash = await bcrypt.hash('password123', 6)

  // 1. Criar Leiloeiro Oficial
  const auctioneer = await prisma.user.upsert({
    where: { email: 'auctioneer@belmont.com' },
    update: {
      passwordHash,
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
  console.log(`✓ Leiloeiro cadastrado: ${auctioneer.name} (${auctioneer.publicCode})`)

  // 2. Criar Licitante 1 (Carlos)
  const bidder1 = await prisma.user.upsert({
    where: { email: 'bidder1@belmont.com' },
    update: {
      passwordHash,
      balanceTotal: BigInt(5000000), // R$ 50.000,00
    },
    create: {
      name: 'Carlos Drummond de Andrade',
      email: 'bidder1@belmont.com',
      document: '22233344455',
      passwordHash,
      maskedName: maskName('Carlos Drummond de Andrade'),
      publicCode: 'LIC-0001',
      role: 'BIDDER',
      balanceTotal: BigInt(5000000), // R$ 50.000,00
      balanceCommitted: BigInt(0),
    },
  })
  console.log(`✓ Licitante 1 cadastrado: ${bidder1.name} (${bidder1.publicCode})`)

  // Depósito inicial para Licitante 1
  const deposit1Exists = await prisma.walletTransaction.findFirst({
    where: { userId: bidder1.id, type: 'DEPOSIT' },
  })
  if (!deposit1Exists) {
    await prisma.walletTransaction.create({
      data: {
        userId: bidder1.id,
        amount: BigInt(5000000),
        balanceAfter: BigInt(5000000),
        type: 'DEPOSIT',
        description: 'Depósito inicial de avaliação',
      },
    })
  }

  // 3. Criar Licitante 2 (Mariana)
  const bidder2 = await prisma.user.upsert({
    where: { email: 'bidder2@belmont.com' },
    update: {
      passwordHash,
      balanceTotal: BigInt(5000000), // R$ 50.000,00
    },
    create: {
      name: 'Mariana Ximenes Prado',
      email: 'bidder2@belmont.com',
      document: '33344455566',
      passwordHash,
      maskedName: maskName('Mariana Ximenes Prado'),
      publicCode: 'LIC-0002',
      role: 'BIDDER',
      balanceTotal: BigInt(5000000), // R$ 50.000,00
      balanceCommitted: BigInt(0),
    },
  })
  console.log(`✓ Licitante 2 cadastrado: ${bidder2.name} (${bidder2.publicCode})`)

  // Depósito inicial para Licitante 2
  const deposit2Exists = await prisma.walletTransaction.findFirst({
    where: { userId: bidder2.id, type: 'DEPOSIT' },
  })
  if (!deposit2Exists) {
    await prisma.walletTransaction.create({
      data: {
        userId: bidder2.id,
        amount: BigInt(5000000),
        balanceAfter: BigInt(5000000),
        type: 'DEPOSIT',
        description: 'Depósito inicial de avaliação',
      },
    })
  }

  // 4. Lote 1 (AO VIVO): Claude Monet — Water Lilies
  const now = new Date()
  const liveEndTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hora de pregão
  const lot1Id = 'a1111111-1111-4111-a111-111111111111'

  const liveLot = await prisma.lot.upsert({
    where: { id: lot1Id },
    update: {
      status: 'LIVE',
      startTime: now,
      endTime: liveEndTime,
    },
    create: {
      id: lot1Id,
      title: 'Water Lilies (Nymphéas)',
      description:
        'Obra-prima impressionista de Claude Monet, pintada em Giverny por volta de 1906. Óleo sobre tela do acervo permanente do Art Institute of Chicago (#16568). Obra em domínio público internacional.',
      artist: 'Claude Monet',
      imageUrl:
        'https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/843,/0/default.jpg',
      externalApiId: '16568',
      startPrice: BigInt(1000000), // R$ 10.000,00
      currentPrice: BigInt(1000000),
      minIncrement: BigInt(50000), // R$ 500,00
      status: 'LIVE',
      startTime: now,
      endTime: liveEndTime,
      userId: auctioneer.id,
    },
  })
  console.log(`✓ Lote Ao Vivo semeado: ${liveLot.title} (${liveLot.id})`)

  // 5. Lote 2 (AGENDADO): Vincent van Gogh — The Bedroom
  const scheduledStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const scheduledEndTime = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const lot2Id = 'b2222222-2222-4222-a222-222222222222'

  const scheduledLot = await prisma.lot.upsert({
    where: { id: lot2Id },
    update: {},
    create: {
      id: lot2Id,
      title: 'The Bedroom (De Slaapkamer)',
      description:
        'Famosa pintura pós-impressionista de Vincent van Gogh retratando seu quarto em Arles (1889). Óleo sobre tela icônico, representativo da busca de repouso e cores intensas (#28560).',
      artist: 'Vincent van Gogh',
      imageUrl:
        'https://www.artic.edu/iiif/2/25c31d8d-21a4-9ea1-1d73-6a4ec4d97d02/full/843,/0/default.jpg',
      externalApiId: '28560',
      startPrice: BigInt(2500000), // R$ 25.000,00
      currentPrice: BigInt(2500000),
      minIncrement: BigInt(100000), // R$ 1.000,00
      status: 'SCHEDULED',
      startTime: scheduledStartTime,
      endTime: scheduledEndTime,
      userId: auctioneer.id,
    },
  })
  console.log(`✓ Lote Agendado semeado: ${scheduledLot.title} (${scheduledLot.id})`)

  // 6. Lote 3 (ENCERRADO COM COMPROVANTE & AUDITORIA): Georges Seurat
  const pastStartTime = new Date(now.getTime() - 4 * 3600 * 1000)
  const pastEndTime = new Date(now.getTime() - 2 * 3600 * 1000)
  const lot3Id = 'c3333333-3333-4333-a333-333333333333'

  // Cria lance prévio e calcula hashes da cadeia
  const genesisPrevHash = '0'.repeat(64)
  const bid1Amount = 4500000 // R$ 45.000,00
  const bid1Time = new Date(now.getTime() - 3 * 3600 * 1000)

  const bidHash1 = calculateBidHash({
    lotId: lot3Id,
    sequenceNumber: 1,
    bidderId: bidder1.id,
    amount: BigInt(bid1Amount),
    timestamp: bid1Time,
    prevHash: genesisPrevHash,
  })

  const rootSeal = calculateLotSealHash({
    lotId: lot3Id,
    winnerId: bidder1.id,
    finalPrice: BigInt(bid1Amount),
    totalBids: 1,
    lastBidHash: bidHash1,
  })

  const closedLot = await prisma.lot.upsert({
    where: { id: lot3Id },
    update: {},
    create: {
      id: lot3Id,
      title: 'A Sunday on La Grande Jatte',
      description:
        'Monumento do pontilhismo pintado por Georges Seurat entre 1884 e 1886. Uma das mais famosas obras de arte do mundo (#27992), arrematada em pregão histórico.',
      artist: 'Georges Seurat',
      imageUrl:
        'https://www.artic.edu/iiif/2/1adf2696-848d-499e-a6ea-46b8e504f48e/full/843,/0/default.jpg',
      externalApiId: '27992',
      startPrice: BigInt(3000000), // R$ 30.000,00
      currentPrice: BigInt(bid1Amount),
      minIncrement: BigInt(100000),
      status: 'ENDED',
      startTime: pastStartTime,
      endTime: pastEndTime,
      bidsCount: 1,
      currentWinnerId: bidder1.id,
      lotSealHash: rootSeal,
      userId: auctioneer.id,
    },
  })

  // Lance do Lote 3
  const bidExists = await prisma.bid.findFirst({
    where: { lotId: closedLot.id },
  })
  if (!bidExists) {
    await prisma.bid.create({
      data: {
        lotId: closedLot.id,
        bidderId: bidder1.id,
        amount: BigInt(bid1Amount),
        sequenceNumber: 1,
        prevHash: genesisPrevHash,
        bidHash: bidHash1,
        timestamp: bid1Time,
      },
    })
  }

  // Comprovante Oficial do Lote 3
  const receiptCode = 'REC-2026-SEURAT'
  await prisma.receipt.upsert({
    where: { code: receiptCode },
    update: {},
    create: {
      code: receiptCode,
      lotId: closedLot.id,
      winnerId: bidder1.id,
      finalAmount: BigInt(bid1Amount),
      lotSealHash: rootSeal,
      settledAt: pastEndTime,
    },
  })
  console.log(`✓ Lote Encerrado semeado com Comprovante: ${closedLot.title} (${receiptCode})`)

  console.log('\n✨ Todas as seeds obrigatórias foram criadas com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro na execução do seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
