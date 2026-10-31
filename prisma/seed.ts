import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { maskName } from '../src/utils/lgpd.js'
import { calculateBidHash, calculateLotSealHash } from '../src/utils/cryptoAudit.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando processo de seed das contas e galeria de obras de arte...')

  const passwordHash = await bcrypt.hash('password123', 6)

  // 1. Limpeza de lotes de teste residuais
  await prisma.bid.deleteMany({
    where: {
      lot: {
        OR: [
          { title: { startsWith: 'Lote Teste' } },
          { title: { startsWith: 'Obra Rara de Monet' } },
          { title: { contains: 'Hash Chain' } },
          { id: { startsWith: '00000000' } },
          { id: { in: ['165906c3-665d-4c94-8cfa-3d7028b2645a', '6cf0f862-42b8-476e-8cf9-b74292279086', '9619f283-d60b-4031-bb4b-fd79d534f40b'] } },
          { title: { contains: 'Nymphas' } },
        ],
      },
    },
  })
  await prisma.receipt.deleteMany({
    where: {
      lot: {
        OR: [
          { title: { startsWith: 'Lote Teste' } },
          { title: { startsWith: 'Obra Rara de Monet' } },
          { title: { contains: 'Hash Chain' } },
          { id: { startsWith: '00000000' } },
          { id: { in: ['165906c3-665d-4c94-8cfa-3d7028b2645a', '6cf0f862-42b8-476e-8cf9-b74292279086', '9619f283-d60b-4031-bb4b-fd79d534f40b'] } },
          { title: { contains: 'Nymphas' } },
        ],
      },
    },
  })
  await prisma.lot.deleteMany({
    where: {
      OR: [
        { title: { startsWith: 'Lote Teste' } },
        { title: { startsWith: 'Obra Rara de Monet' } },
        { title: { contains: 'Hash Chain' } },
        { id: { startsWith: '00000000' } },
        { id: { in: ['165906c3-665d-4c94-8cfa-3d7028b2645a', '6cf0f862-42b8-476e-8cf9-b74292279086', '9619f283-d60b-4031-bb4b-fd79d534f40b'] } },
        { title: { contains: 'Nymphas' } },
      ],
    },
  })
  console.log('✓ Lotes de teste residuais limpos com sucesso.')

  // 2. Criar Leiloeiro Oficial
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

  // 3. Criar Licitante 1 (Carlos)
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

  // 4. Criar Licitante 2 (Mariana)
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

  const now = new Date()

  // -------------------------------------------------------------
  // LOTE 1 (AO VIVO): Claude Monet — Water Lilies (Nymphéas)
  // -------------------------------------------------------------
  const lot1Id = 'a1111111-1111-4111-a111-111111111111'
  const liveEndTime1 = new Date(now.getTime() + 60 * 60 * 1000)
  const liveLot1 = await prisma.lot.upsert({
    where: { id: lot1Id },
    update: {
      title: 'Water Lilies (Nymphéas)',
      artist: 'Claude Monet',
      imageUrl: 'https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/843,/0/default.jpg',
      status: 'LIVE',
      startTime: now,
      endTime: liveEndTime1,
    },
    create: {
      id: lot1Id,
      title: 'Water Lilies (Nymphéas)',
      description:
        'Obra-prima impressionista de Claude Monet, pintada em Giverny por volta de 1906. Óleo sobre tela do acervo permanente do Art Institute of Chicago (#16568). Obra em domínio público internacional.',
      artist: 'Claude Monet',
      imageUrl: 'https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/843,/0/default.jpg',
      externalApiId: '16568',
      startPrice: BigInt(1000000), // R$ 10.000,00
      currentPrice: BigInt(1000000),
      minIncrement: BigInt(50000), // R$ 500,00
      status: 'LIVE',
      startTime: now,
      endTime: liveEndTime1,
      userId: auctioneer.id,
    },
  })
  console.log(`✓ Lote Ao Vivo 1: ${liveLot1.title} (${liveLot1.id})`)

  // -------------------------------------------------------------
  // LOTE 2 (AO VIVO): Katsushika Hokusai — The Great Wave
  // -------------------------------------------------------------
  const lot2Id = 'a2222222-2222-4222-a222-222222222222'
  const liveEndTime2 = new Date(now.getTime() + 90 * 60 * 1000)
  const liveLot2 = await prisma.lot.upsert({
    where: { id: lot2Id },
    update: {
      title: 'Under the Wave off Kanagawa (The Great Wave)',
      artist: 'Katsushika Hokusai',
      imageUrl: 'https://www.artic.edu/iiif/2/b3974542-b9b4-7568-fc4b-966738f61d78/full/843,/0/default.jpg',
      status: 'LIVE',
      startTime: now,
      endTime: liveEndTime2,
    },
    create: {
      id: lot2Id,
      title: 'Under the Wave off Kanagawa (The Great Wave)',
      description:
        'A xilogravura em madeira mais célebre da história da arte japonesa, criada por Katsushika Hokusai por volta de 1831 da série 36 Vistas do Monte Fuji (#24645).',
      artist: 'Katsushika Hokusai',
      imageUrl: 'https://www.artic.edu/iiif/2/b3974542-b9b4-7568-fc4b-966738f61d78/full/843,/0/default.jpg',
      externalApiId: '24645',
      startPrice: BigInt(2000000), // R$ 20.000,00
      currentPrice: BigInt(2000000),
      minIncrement: BigInt(100000), // R$ 1.000,00
      status: 'LIVE',
      startTime: now,
      endTime: liveEndTime2,
      userId: auctioneer.id,
    },
  })
  console.log(`✓ Lote Ao Vivo 2: ${liveLot2.title} (${liveLot2.id})`)

  // -------------------------------------------------------------
  // LOTE 3 (AO VIVO): Vincent van Gogh — Self-Portrait
  // -------------------------------------------------------------
  const lot3Id = 'a3333333-3333-4333-a333-333333333333'
  const liveEndTime3 = new Date(now.getTime() + 45 * 60 * 1000)
  const liveLot3 = await prisma.lot.upsert({
    where: { id: lot3Id },
    update: {
      title: 'Self-Portrait (Autorretrato em Paris)',
      artist: 'Vincent van Gogh',
      imageUrl: 'https://www.artic.edu/iiif/2/47c5bcb8-62ef-e5d7-55e7-f5121f409a30/full/843,/0/default.jpg',
      status: 'LIVE',
      startTime: now,
      endTime: liveEndTime3,
    },
    create: {
      id: lot3Id,
      title: 'Self-Portrait (Autorretrato em Paris)',
      description:
        'Pintura a óleo sobre prancha de artista, pintada por Vincent van Gogh no verão de 1887 em Paris. Expressão vibrante de pinceladas pós-impressionistas (#80607).',
      artist: 'Vincent van Gogh',
      imageUrl: 'https://www.artic.edu/iiif/2/47c5bcb8-62ef-e5d7-55e7-f5121f409a30/full/843,/0/default.jpg',
      externalApiId: '80607',
      startPrice: BigInt(1800000), // R$ 18.000,00
      currentPrice: BigInt(1800000),
      minIncrement: BigInt(50000), // R$ 500,00
      status: 'LIVE',
      startTime: now,
      endTime: liveEndTime3,
      userId: auctioneer.id,
    },
  })
  console.log(`✓ Lote Ao Vivo 3: ${liveLot3.title} (${liveLot3.id})`)

  // -------------------------------------------------------------
  // LOTE 4 (AGENDADO): Vincent van Gogh — The Bedroom
  // -------------------------------------------------------------
  const lot4Id = 'b2222222-2222-4222-a222-222222222222'
  const schedStartTime1 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const schedEndTime1 = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const schedLot1 = await prisma.lot.upsert({
    where: { id: lot4Id },
    update: {
      title: 'The Bedroom (De Slaapkamer)',
      artist: 'Vincent van Gogh',
      imageUrl: 'https://www.artic.edu/iiif/2/6644829f-f292-c5c4-a73c-0356a6fdbf0d/full/843,/0/default.jpg',
      status: 'SCHEDULED',
      startTime: schedStartTime1,
      endTime: schedEndTime1,
    },
    create: {
      id: lot4Id,
      title: 'The Bedroom (De Slaapkamer)',
      description:
        'Famosa pintura pós-impressionista de Vincent van Gogh retratando seu quarto na Casa Amarela em Arles (1889). Acervo permanente do Art Institute of Chicago (#28560).',
      artist: 'Vincent van Gogh',
      imageUrl: 'https://www.artic.edu/iiif/2/6644829f-f292-c5c4-a73c-0356a6fdbf0d/full/843,/0/default.jpg',
      externalApiId: '28560',
      startPrice: BigInt(2500000), // R$ 25.000,00
      currentPrice: BigInt(2500000),
      minIncrement: BigInt(100000), // R$ 1.000,00
      status: 'SCHEDULED',
      startTime: schedStartTime1,
      endTime: schedEndTime1,
      userId: auctioneer.id,
    },
  })
  console.log(`✓ Lote Agendado 1: ${schedLot1.title} (${schedLot1.id})`)

  // -------------------------------------------------------------
  // LOTE 5 (AGENDADO): Paul Cézanne — The Basket of Apples
  // -------------------------------------------------------------
  const lot5Id = 'b3333333-3333-4333-a333-333333333333'
  const schedStartTime2 = new Date(now.getTime() + 36 * 60 * 60 * 1000)
  const schedEndTime2 = new Date(now.getTime() + 60 * 60 * 1000)
  const schedLot2 = await prisma.lot.upsert({
    where: { id: lot5Id },
    update: {
      title: 'The Basket of Apples (Natureza-morta com Maçãs)',
      artist: 'Paul Cézanne',
      imageUrl: 'https://www.artic.edu/iiif/2/52ac8996-3460-cf71-cb42-5c4d0aa29b74/full/843,/0/default.jpg',
      status: 'SCHEDULED',
      startTime: schedStartTime2,
      endTime: schedEndTime2,
    },
    create: {
      id: lot5Id,
      title: 'The Basket of Apples (Natureza-morta com Maçãs)',
      description:
        'Uma das mais influentes naturezas-mortas da era moderna, pintada por Paul Cézanne por volta de 1893. Precursora revolucionária do cubismo (#111436).',
      artist: 'Paul Cézanne',
      imageUrl: 'https://www.artic.edu/iiif/2/52ac8996-3460-cf71-cb42-5c4d0aa29b74/full/843,/0/default.jpg',
      externalApiId: '111436',
      startPrice: BigInt(1500000), // R$ 15.000,00
      currentPrice: BigInt(1500000),
      minIncrement: BigInt(50000), // R$ 500,00
      status: 'SCHEDULED',
      startTime: schedStartTime2,
      endTime: schedEndTime2,
      userId: auctioneer.id,
    },
  })
  console.log(`✓ Lote Agendado 2: ${schedLot2.title} (${schedLot2.id})`)

  // -------------------------------------------------------------
  // LOTE 6 (ENCERRADO): Georges Seurat — A Sunday on La Grande Jatte
  // -------------------------------------------------------------
  const lot6Id = 'c3333333-3333-4333-a333-333333333333'
  const pastStartTime1 = new Date(now.getTime() - 4 * 3600 * 1000)
  const pastEndTime1 = new Date(now.getTime() - 2 * 3600 * 1000)

  const genesisPrevHash = '0'.repeat(64)
  const bid1Amount = 4500000 // R$ 45.000,00
  const bid1Time = new Date(now.getTime() - 3 * 3600 * 1000)

  const bidHash1 = calculateBidHash({
    lotId: lot6Id,
    sequenceNumber: 1,
    bidderId: bidder1.id,
    amount: BigInt(bid1Amount),
    timestamp: bid1Time,
    prevHash: genesisPrevHash,
  })

  const rootSeal = calculateLotSealHash({
    lotId: lot6Id,
    winnerId: bidder1.id,
    finalPrice: BigInt(bid1Amount),
    totalBids: 1,
    lastBidHash: bidHash1,
  })

  const closedLot1 = await prisma.lot.upsert({
    where: { id: lot6Id },
    update: {
      title: 'A Sunday on La Grande Jatte',
      artist: 'Georges Seurat',
      imageUrl: 'https://www.artic.edu/iiif/2/1adf2696-848d-499e-a6ea-46b8e504f48e/full/843,/0/default.jpg',
      status: 'ENDED',
      startTime: pastStartTime1,
      endTime: pastEndTime1,
      currentPrice: BigInt(bid1Amount),
      bidsCount: 1,
      currentWinnerId: bidder1.id,
      lotSealHash: rootSeal,
    },
    create: {
      id: lot6Id,
      title: 'A Sunday on La Grande Jatte',
      description:
        'Monumento do pontilhismo pintado por Georges Seurat entre 1884 e 1886. Uma das mais famosas obras de arte do mundo (#27992), arrematada em pregão histórico.',
      artist: 'Georges Seurat',
      imageUrl: 'https://www.artic.edu/iiif/2/1adf2696-848d-499e-a6ea-46b8e504f48e/full/843,/0/default.jpg',
      externalApiId: '27992',
      startPrice: BigInt(3000000), // R$ 30.000,00
      currentPrice: BigInt(bid1Amount),
      minIncrement: BigInt(100000),
      status: 'ENDED',
      startTime: pastStartTime1,
      endTime: pastEndTime1,
      bidsCount: 1,
      currentWinnerId: bidder1.id,
      lotSealHash: rootSeal,
      userId: auctioneer.id,
    },
  })

  const bidExists = await prisma.bid.findFirst({
    where: { lotId: closedLot1.id },
  })
  if (!bidExists) {
    await prisma.bid.create({
      data: {
        lotId: closedLot1.id,
        bidderId: bidder1.id,
        amount: BigInt(bid1Amount),
        sequenceNumber: 1,
        prevHash: genesisPrevHash,
        bidHash: bidHash1,
        timestamp: bid1Time,
      },
    })
  }

  // Comprovante Oficial do Lote 6
  const receiptCode1 = 'REC-2026-SEURAT'
  await prisma.receipt.upsert({
    where: { code: receiptCode1 },
    update: {
      lotId: closedLot1.id,
      winnerId: bidder1.id,
      finalAmount: BigInt(bid1Amount),
      lotSealHash: rootSeal,
      settledAt: pastEndTime1,
    },
    create: {
      code: receiptCode1,
      lotId: closedLot1.id,
      winnerId: bidder1.id,
      finalAmount: BigInt(bid1Amount),
      lotSealHash: rootSeal,
      settledAt: pastEndTime1,
    },
  })
  console.log(`✓ Lote Encerrado 1: ${closedLot1.title} (${receiptCode1})`)

  // -------------------------------------------------------------
  // LOTE 7 (ENCERRADO): Edgar Degas — Ballet at the Paris Opéra
  // -------------------------------------------------------------
  const lot7Id = 'c4444444-4444-4444-a444-444444444444'
  const pastStartTime2 = new Date(now.getTime() - 8 * 3600 * 1000)
  const pastEndTime2 = new Date(now.getTime() - 6 * 3600 * 1000)
  const bid2Amount = 3800000 // R$ 38.000,00
  const bid2Time = new Date(now.getTime() - 7 * 3600 * 1000)

  const bidHash2 = calculateBidHash({
    lotId: lot7Id,
    sequenceNumber: 1,
    bidderId: bidder2.id,
    amount: BigInt(bid2Amount),
    timestamp: bid2Time,
    prevHash: genesisPrevHash,
  })

  const rootSeal2 = calculateLotSealHash({
    lotId: lot7Id,
    winnerId: bidder2.id,
    finalPrice: BigInt(bid2Amount),
    totalBids: 1,
    lastBidHash: bidHash2,
  })

  const closedLot2 = await prisma.lot.upsert({
    where: { id: lot7Id },
    update: {
      title: 'Ballet at the Paris Opéra',
      artist: 'Edgar Degas',
      imageUrl: 'https://www.artic.edu/iiif/2/cb34b0a8-bc51-d063-aab1-47c7debf3a7b/full/843,/0/default.jpg',
      status: 'ENDED',
      startTime: pastStartTime2,
      endTime: pastEndTime2,
      currentPrice: BigInt(bid2Amount),
      bidsCount: 1,
      currentWinnerId: bidder2.id,
      lotSealHash: rootSeal2,
    },
    create: {
      id: lot7Id,
      title: 'Ballet at the Paris Opéra',
      description:
        'Pastel sobre monotipia sobre papel, criado por Edgar Degas por volta de 1877. Captação magistral da luz dos palcos e das bailarinas da Ópera de Paris (#111442).',
      artist: 'Edgar Degas',
      imageUrl: 'https://www.artic.edu/iiif/2/cb34b0a8-bc51-d063-aab1-47c7debf3a7b/full/843,/0/default.jpg',
      externalApiId: '111442',
      startPrice: BigInt(2200000), // R$ 22.000,00
      currentPrice: BigInt(bid2Amount),
      minIncrement: BigInt(100000),
      status: 'ENDED',
      startTime: pastStartTime2,
      endTime: pastEndTime2,
      bidsCount: 1,
      currentWinnerId: bidder2.id,
      lotSealHash: rootSeal2,
      userId: auctioneer.id,
    },
  })

  const bid2Exists = await prisma.bid.findFirst({
    where: { lotId: closedLot2.id },
  })
  if (!bid2Exists) {
    await prisma.bid.create({
      data: {
        lotId: closedLot2.id,
        bidderId: bidder2.id,
        amount: BigInt(bid2Amount),
        sequenceNumber: 1,
        prevHash: genesisPrevHash,
        bidHash: bidHash2,
        timestamp: bid2Time,
      },
    })
  }

  const receiptCode2 = 'REC-2026-DEGAS'
  await prisma.receipt.upsert({
    where: { code: receiptCode2 },
    update: {
      lotId: closedLot2.id,
      winnerId: bidder2.id,
      finalAmount: BigInt(bid2Amount),
      lotSealHash: rootSeal2,
      settledAt: pastEndTime2,
    },
    create: {
      code: receiptCode2,
      lotId: closedLot2.id,
      winnerId: bidder2.id,
      finalAmount: BigInt(bid2Amount),
      lotSealHash: rootSeal2,
      settledAt: pastEndTime2,
    },
  })
  console.log(`✓ Lote Encerrado 2: ${closedLot2.title} (${receiptCode2})`)

  console.log('\n✨ Todas as 7 obras-primas autênticas do acervo foram semeadas com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
