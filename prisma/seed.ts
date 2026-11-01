import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { maskName } from '../src/utils/lgpd.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpando todos os lotes, lances, certificados e transações anteriores...')

  await prisma.bid.deleteMany({})
  await prisma.receipt.deleteMany({})
  await prisma.walletTransaction.deleteMany({})
  await prisma.lot.deleteMany({})
  await prisma.externalItemCache.deleteMany({})

  console.log('✓ Todos os lotes, lances e certificados antigos foram removidos do banco.')

  const passwordHash = await bcrypt.hash('password123', 6)

  // Garante a conta oficial do Leiloeiro para o usuário logar e criar seus próprios lotes
  const auctioneer = await prisma.user.upsert({
    where: { email: 'auctioneer@belmont.com' },
    update: {
      passwordHash,
      role: 'AUCTIONEER',
      balanceTotal: BigInt(0),
      balanceCommitted: BigInt(0),
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
  console.log(`✓ Conta do Leiloeiro Oficial pronta: ${auctioneer.email} (Senha: password123)`)

  // Atualiza contas de licitantes existentes para zerar bloqueios
  await prisma.user.updateMany({
    where: { role: 'BIDDER' },
    data: {
      balanceCommitted: BigInt(0),
    },
  })

  console.log('\n✨ Banco de dados zerado e pronto! Nenhum lote fictício foi criado.')
  console.log('👉 Faça login como Leiloeiro (auctioneer@belmont.com) para pesquisar obras na API e publicar seus próprios lotes.')
}

main()
  .catch((e) => {
    console.error('Erro ao limpar banco:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
