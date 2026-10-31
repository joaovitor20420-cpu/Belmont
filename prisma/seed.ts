import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { maskName } from '../src/utils/lgpd.js'
import { calculateBidHash, calculateLotSealHash } from '../src/utils/cryptoAudit.js'
import { artInstituteClient } from '../src/lib/artInstituteClient.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed: buscando obras de arte diretamente da API pública de museus...')

  const passwordHash = await bcrypt.hash('password123', 6)

  // 1. Limpeza de dados antigos para sincronização limpa
  await prisma.bid.deleteMany({})
  await prisma.receipt.deleteMany({})
  await prisma.lot.deleteMany({})
  console.log('✓ Lotes e lances antigos limpos.')

  // 2. Criar Leiloeiro Oficial Belmont
  const auctioneer = await prisma.user.upsert({
    where: { email: 'auctioneer@belmont.com' },
    update: { passwordHash },
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
  console.log(`✓ Leiloeiro autenticado: ${auctioneer.name} (${auctioneer.publicCode})`)

  // 3. Criar Licitante 1 (Carlos)
  const bidder1 = await prisma.user.upsert({
    where: { email: 'bidder1@belmont.com' },
    update: {
      passwordHash,
      balanceTotal: BigInt(5000000), // R$ 50.000,00
      balanceCommitted: BigInt(0),
    },
    create: {
      name: 'Carlos Drummond de Andrade',
      email: 'bidder1@belmont.com',
      document: '22233344455',
      passwordHash,
      maskedName: maskName('Carlos Drummond de Andrade'),
      publicCode: 'LIC-0001',
      role: 'BIDDER',
      balanceTotal: BigInt(5000000),
      balanceCommitted: BigInt(0),
    },
  })

  await prisma.walletTransaction.deleteMany({ where: { userId: bidder1.id } })
  await prisma.walletTransaction.create({
    data: {
      userId: bidder1.id,
      amount: BigInt(5000000),
      balanceAfter: BigInt(5000000),
      type: 'DEPOSIT',
      description: 'Depósito inicial de avaliação',
    },
  })
  console.log(`✓ Licitante 1 autenticado: ${bidder1.name} (${bidder1.publicCode}) com R$ 50.000,00`)

  // 4. Criar Licitante 2 (Mariana)
  const bidder2 = await prisma.user.upsert({
    where: { email: 'bidder2@belmont.com' },
    update: {
      passwordHash,
      balanceTotal: BigInt(5000000), // R$ 50.000,00
      balanceCommitted: BigInt(0),
    },
    create: {
      name: 'Mariana Ximenes Prado',
      email: 'bidder2@belmont.com',
      document: '33344455566',
      passwordHash,
      maskedName: maskName('Mariana Ximenes Prado'),
      publicCode: 'LIC-0002',
      role: 'BIDDER',
      balanceTotal: BigInt(5000000),
      balanceCommitted: BigInt(0),
    },
  })

  await prisma.walletTransaction.deleteMany({ where: { userId: bidder2.id } })
  await prisma.walletTransaction.create({
    data: {
      userId: bidder2.id,
      amount: BigInt(5000000),
      balanceAfter: BigInt(5000000),
      type: 'DEPOSIT',
      description: 'Depósito inicial de avaliação',
    },
  })
  console.log(`✓ Licitante 2 autenticado: ${bidder2.name} (${bidder2.publicCode}) com R$ 50.000,00`)

  // 5. Buscar obras reais dinamicamente direto da API
  console.log('\n🌐 Consultando a API de acervo de museus em tempo real...')
  const searchQueries = ['Monet', 'Van Gogh', 'Rembrandt']
  const apiArtworks = []

  for (const q of searchQueries) {
    try {
      const results = await artInstituteClient.searchPublicArtworks({
        query: q,
        limit: 3,
      })
      for (const item of results) {
        if (item.imageUrl && !apiArtworks.some((a) => a.id === item.id)) {
          apiArtworks.push(item)
        }
      }
    } catch (err) {
      console.warn(`Erro ao buscar query "${q}":`, err)
    }
  }

  console.log(`✓ Total de ${apiArtworks.length} obras obtidas dinamicamente da API!`)

  const now = new Date()

  // 6. Cadastrar os lotes com dados 100% originários da API
  for (let i = 0; i < apiArtworks.length; i++) {
    const art = apiArtworks[i]
    let status: 'LIVE' | 'SCHEDULED' | 'ENDED' = 'LIVE'
    let startTime = now
    let endTime = new Date(now.getTime() + (i + 1) * 30 * 60 * 1000) // 30min, 60min, 90min...

    if (i >= 3 && i < 5) {
      status = 'SCHEDULED'
      startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    } else if (i >= 5) {
      status = 'ENDED'
      startTime = new Date(now.getTime() - 4 * 3600 * 1000)
      endTime = new Date(now.getTime() - 2 * 3600 * 1000)
    }

    const startPriceInCents = 1000000 + i * 500000 // R$ 10.000, R$ 15.000, etc.
    const minIncrementInCents = 50000

    const createdLot = await prisma.lot.create({
      data: {
        title: art.title,
        description: `Obra autêntica obtida via API oficial de museu (#${art.id}).\n${art.mediumDisplay || 'Técnica Mista'} • ${art.dateDisplay || 'Data histórica'}.\nDimensões catalogadas: ${art.dimensions || 'Sob consulta'}.\nDomínio público verificado internacionalmente.`,
        artist: art.artistTitle || 'Mestre Renomado',
        imageUrl: art.imageUrl!,
        externalApiId: art.id,
        startPrice: BigInt(startPriceInCents),
        currentPrice: BigInt(startPriceInCents),
        minIncrement: BigInt(minIncrementInCents),
        status,
        startTime,
        endTime,
        bidsCount: 0,
        userId: auctioneer.id,
      },
    })

    // Se o lote for ENCERRADO, cria um lance vencedor e emite o comprovante oficial com Hash Chain
    if (status === 'ENDED') {
      const bidAmount = startPriceInCents + 1000000
      const bidTime = new Date(now.getTime() - 3 * 3600 * 1000)
      const genesisPrevHash = '0'.repeat(64)

      const bidHash = calculateBidHash({
        lotId: createdLot.id,
        sequenceNumber: 1,
        bidderId: bidder1.id,
        amount: BigInt(bidAmount),
        timestamp: bidTime,
        prevHash: genesisPrevHash,
      })

      const rootSeal = calculateLotSealHash({
        lotId: createdLot.id,
        winnerId: bidder1.id,
        finalPrice: BigInt(bidAmount),
        totalBids: 1,
        lastBidHash: bidHash,
      })

      await prisma.lot.update({
        where: { id: createdLot.id },
        data: {
          currentPrice: BigInt(bidAmount),
          bidsCount: 1,
          currentWinnerId: bidder1.id,
          lotSealHash: rootSeal,
        },
      })

      await prisma.bid.create({
        data: {
          lotId: createdLot.id,
          bidderId: bidder1.id,
          amount: BigInt(bidAmount),
          sequenceNumber: 1,
          prevHash: genesisPrevHash,
          bidHash,
          timestamp: bidTime,
        },
      })

      const receiptCode = `REC-2026-${art.id}`
      await prisma.receipt.create({
        data: {
          code: receiptCode,
          lotId: createdLot.id,
          winnerId: bidder1.id,
          finalAmount: BigInt(bidAmount),
          lotSealHash: rootSeal,
          settledAt: endTime,
        },
      })

      console.log(`✓ Lote da API Criado (ENCERRADO com Comprovante ${receiptCode}): ${createdLot.title}`)
    } else {
      console.log(`✓ Lote da API Criado (${status}): ${createdLot.title} — ${art.artistTitle}`)
    }
  }

  console.log('\n✨ Todos os lotes foram sincronizados e criados dinamicamente direto da API!')
}

main()
  .catch((e) => {
    console.error('Erro durante a sincronização com a API:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
