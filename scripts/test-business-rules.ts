import assert from 'node:assert/strict'
import { prisma } from '../src/lib/prisma.js'
import { makeCreateBidUseCase } from '../src/use-cases/factories/makeCreateBidUseCase.js'
import { makeSettleLotUseCase } from '../src/use-cases/factories/makeSettleLotUseCase.js'
import { makeCancelLotUseCase } from '../src/use-cases/factories/makeCancelLotUseCase.js'
import { makeVerifyLotAuditTrailUseCase } from '../src/use-cases/factories/makeVerifyLotAuditTrailUseCase.js'
import { AuctioneerCannotBidError } from '../src/use-cases/errors/auctioneer-cannot-bid-error.js'
import { SelfOutbidError } from '../src/use-cases/errors/self-outbid-error.js'
import { InvalidBidAmountError } from '../src/use-cases/errors/invalid-bid-amount-error.js'
import { InsufficientFundsError } from '../src/use-cases/errors/insufficient-funds-error.js'
import { LotCancellationError } from '../src/use-cases/errors/lot-cancellation-error.js'
import { AuctionNotActiveError } from '../src/use-cases/errors/auction-not-active-error.js'

async function runBusinessRulesTests() {
  console.log('🧪 ========================================================')
  console.log('   INICIANDO SUÍTE DE TESTES DAS REGRAS DE NEGÓCIO (VERZEL)')
  console.log('========================================================\n')

  // 1. Preparação dos Usuários de Teste (Leiloeiro, Licitante 1, Licitante 2)
  const auctioneer = await prisma.user.findUniqueOrThrow({
    where: { email: 'auctioneer@belmont.com' },
  })
  const bidder1 = await prisma.user.findUniqueOrThrow({
    where: { email: 'bidder1@belmont.com' },
  })
  const bidder2 = await prisma.user.findUniqueOrThrow({
    where: { email: 'bidder2@belmont.com' },
  })

  // Restaura saldos para estado previsível
  await prisma.user.update({
    where: { id: bidder1.id },
    data: { balanceTotal: BigInt(5000000), balanceCommitted: BigInt(0) }, // R$ 50.000
  })
  await prisma.user.update({
    where: { id: bidder2.id },
    data: { balanceTotal: BigInt(5000000), balanceCommitted: BigInt(0) }, // R$ 50.000
  })

  const createBidUseCase = makeCreateBidUseCase()
  const settleLotUseCase = makeSettleLotUseCase()
  const cancelLotUseCase = makeCancelLotUseCase()
  const verifyLotAuditUseCase = makeVerifyLotAuditTrailUseCase()

  // 2. Criação de um lote isolado para os testes
  const now = new Date()
  const startTime = new Date(now.getTime() - 1000 * 60) // Começou há 1 min
  const endTime = new Date(now.getTime() + 1000 * 60 * 30) // Termina em 30 min

  const testLot = await prisma.lot.create({
    data: {
      userId: auctioneer.id,
      title: 'Obra de Teste das Regras de Negócio',
      description: 'Pintura a óleo de teste para validação de concorrência e regras ACID',
      imageUrl: '/arles.png',
      startPrice: BigInt(100000), // R$ 1.000,00
      currentPrice: BigInt(100000),
      minIncrement: BigInt(10000), // R$ 100,00
      status: 'LIVE',
      startTime,
      endTime,
    },
  })

  console.log(`✓ Lote de teste criado: #${testLot.id.slice(0, 8)} (Inicial: R$ 1.000,00 | Inc: R$ 100,00)`)

  try {
    // ----------------------------------------------------
    // TESTE 1: Leiloeiro NÃO pode dar lances em lotes
    // ----------------------------------------------------
    console.log('\n[REGRA 1] Testando proibição de lances por Leiloeiro...')
    await assert.rejects(
      async () => {
        await createBidUseCase.execute({
          lotId: testLot.id,
          bidderId: auctioneer.id,
          amountInCents: 100000,
        })
      },
      (err: any) => err instanceof AuctioneerCannotBidError,
      'Deveria lançar AuctioneerCannotBidError quando o leiloeiro tenta dar lance.',
    )
    console.log('  ✓ Leiloeiro impedido de dar lances com sucesso (HTTP 403 Forbidden).')

    // ----------------------------------------------------
    // TESTE 2: Licitante com Saldo Insuficiente é rejeitado
    // ----------------------------------------------------
    console.log('\n[REGRA 2] Testando recusa por saldo insuficiente...')
    await assert.rejects(
      async () => {
        await createBidUseCase.execute({
          lotId: testLot.id,
          bidderId: bidder1.id,
          amountInCents: 10000000, // R$ 100.000,00 (usuário só tem R$ 50.000)
        })
      },
      (err: any) => err instanceof InsufficientFundsError,
      'Deveria lançar InsufficientFundsError quando o lance excede o saldo disponível.',
    )
    console.log('  ✓ Lance acima do saldo disponível recusado ("saldo insuficiente").')

    // ----------------------------------------------------
    // TESTE 3: Lance abaixo do mínimo permitido é rejeitado
    // ----------------------------------------------------
    console.log('\n[REGRA 3] Testando recusa por valor abaixo do mínimo...')
    await assert.rejects(
      async () => {
        await createBidUseCase.execute({
          lotId: testLot.id,
          bidderId: bidder1.id,
          amountInCents: 50000, // R$ 500,00 (mínimo é R$ 1.000,00)
        })
      },
      (err: any) => err instanceof InvalidBidAmountError,
      'Deveria lançar InvalidBidAmountError quando lance for menor que startPrice.',
    )
    console.log('  ✓ Lance abaixo do piso inicial recusado ("abaixo do mínimo").')

    // ----------------------------------------------------
    // TESTE 4: 1º Lance Válido pelo Licitante 1
    // ----------------------------------------------------
    console.log('\n[REGRA 4] Executando 1º lance válido (Licitante 1: R$ 1.000,00)...')
    const bid1Res = await createBidUseCase.execute({
      lotId: testLot.id,
      bidderId: bidder1.id,
      amountInCents: 100000, // R$ 1.000,00
    })

    assert.equal(bid1Res.bid.sequenceNumber, 1)
    assert.equal(bid1Res.lot.currentPrice, 100000)
    assert.equal(bid1Res.lot.currentWinnerId, bidder1.id)

    // Verifica bloqueio atômico na carteira do Licitante 1
    const bidder1AfterBid = await prisma.user.findUniqueOrThrow({ where: { id: bidder1.id } })
    assert.equal(bidder1AfterBid.balanceCommitted, BigInt(100000))
    console.log('  ✓ 1º lance aceito com sucesso e R$ 1.000,00 comprometidos atomicamente na carteira.')

    // ----------------------------------------------------
    // TESTE 5: Auto-cobertura (Líder cobrindo o próprio lance) é proibida
    // ----------------------------------------------------
    console.log('\n[REGRA 5] Testando regra de auto-cobertura...')
    await assert.rejects(
      async () => {
        await createBidUseCase.execute({
          lotId: testLot.id,
          bidderId: bidder1.id,
          amountInCents: 120000,
        })
      },
      (err: any) => err instanceof SelfOutbidError,
      'Deveria lançar SelfOutbidError quando líder tenta cobrir próprio lance.',
    )
    console.log('  ✓ Líder impedido de cobrir o próprio lance ("você já está ganhando").')

    // ----------------------------------------------------
    // TESTE 6: Incremento Mínimo nos Lances Subsequentes
    // ----------------------------------------------------
    console.log('\n[REGRA 6] Testando incremento mínimo subsequente (mínimo R$ 1.100,00)...')
    await assert.rejects(
      async () => {
        await createBidUseCase.execute({
          lotId: testLot.id,
          bidderId: bidder2.id,
          amountInCents: 105000, // R$ 1.050,00 (faltam R$ 50 para o incremento de R$ 100)
        })
      },
      (err: any) => err instanceof InvalidBidAmountError,
      'Deveria exigir currentPrice + minIncrement.',
    )
    console.log('  ✓ Lance com incremento insuficiente recusado ("abaixo do mínimo").')

    // ----------------------------------------------------
    // TESTE 7: Troca Atômica de Saldo Comprometido (Superação de Lance)
    // ----------------------------------------------------
    console.log('\n[REGRA 7] Executando superação de lance (Licitante 2: R$ 1.200,00)...')
    const bid2Res = await createBidUseCase.execute({
      lotId: testLot.id,
      bidderId: bidder2.id,
      amountInCents: 120000, // R$ 1.200,00
    })

    assert.equal(bid2Res.bid.sequenceNumber, 2)
    assert.equal(bid2Res.lot.currentPrice, 120000)
    assert.equal(bid2Res.lot.currentWinnerId, bidder2.id)

    // O Licitante 1 deve ter seu saldo comprometido LIBERADO imediatamente
    const bidder1Refunded = await prisma.user.findUniqueOrThrow({ where: { id: bidder1.id } })
    assert.equal(bidder1Refunded.balanceCommitted, BigInt(0), 'Saldo do líder anterior deve voltar a 0 comprometido')

    // O Licitante 2 deve ter seu saldo comprometido BLOQUEADO
    const bidder2Locked = await prisma.user.findUniqueOrThrow({ where: { id: bidder2.id } })
    assert.equal(bidder2Locked.balanceCommitted, BigInt(120000))
    console.log('  ✓ Troca atômica de garantia executada: Licitante 1 estornado, Licitante 2 retido.')

    // ----------------------------------------------------
    // TESTE 8: Anti-Sniping (+2 minutos nos 2 minutos finais)
    // ----------------------------------------------------
    console.log('\n[REGRA 8] Testando prorrogação Anti-Sniping nos minutos finais...')
    // Simula lote a 60 segundos do encerramento
    const closingEndTime = new Date(Date.now() + 60 * 1000) // 1 minuto restante
    await prisma.lot.update({
      where: { id: testLot.id },
      data: { endTime: closingEndTime },
    })

    const antiSnipingRes = await createBidUseCase.execute({
      lotId: testLot.id,
      bidderId: bidder1.id,
      amountInCents: 150000, // R$ 1.500,00
    })

    assert.equal(antiSnipingRes.antiSniping.extended, true)
    const diffMs = antiSnipingRes.lot.endTime.getTime() - closingEndTime.getTime()
    assert.equal(diffMs, 120000, 'Deveria prorrogar em exatamente 120.000 ms (2 minutos)')
    console.log('  ✓ Anti-sniping acionado: fim do lote prorrogado em +2 minutos com sucesso.')

    // ----------------------------------------------------
    // TESTE 9: Cancelamento de Lote com Lances é PROIBIDO
    // ----------------------------------------------------
    console.log('\n[REGRA 9] Testando proibição de cancelamento de lote com lances...')
    await assert.rejects(
      async () => {
        await cancelLotUseCase.execute({
          lotId: testLot.id,
          userId: auctioneer.id,
          userRole: 'AUCTIONEER',
        })
      },
      (err: any) => err instanceof LotCancellationError,
      'Deveria proibir cancelamento de lote com lances.',
    )
    console.log('  ✓ Cancelamento de lote com lances bloqueado com sucesso (integridade jurídica).')

    // ----------------------------------------------------
    // TESTE 10: Cancelamento de Lote SEM lances é PERMITIDO
    // ----------------------------------------------------
    console.log('\n[REGRA 10] Testando cancelamento de lote virgem (0 lances)...')
    const virginLot = await prisma.lot.create({
      data: {
        userId: auctioneer.id,
        title: 'Lote Sem Lances para Cancelamento',
        description: 'Lote de teste sem lances',
        imageUrl: '/arles.png',
        startPrice: BigInt(100000),
        currentPrice: BigInt(100000),
        minIncrement: BigInt(10000),
        status: 'SCHEDULED',
        startTime,
        endTime,
      },
    })

    const cancelRes = await cancelLotUseCase.execute({
      lotId: virginLot.id,
      userId: auctioneer.id,
      userRole: 'AUCTIONEER',
    })

    assert.equal(cancelRes.lot.status, 'CANCELLED')
    console.log('  ✓ Lote sem lances cancelado com sucesso.')

    // ----------------------------------------------------
    // TESTE 11: Auditoria Criptográfica de Integridade da Hash Chain
    // ----------------------------------------------------
    console.log('\n[REGRA 11] Testando verificação criptográfica da Hash Chain...')
    const auditRes = await verifyLotAuditUseCase.execute({ lotId: testLot.id })
    assert.equal(auditRes.isValid, true)
    assert.equal(auditRes.chainStatus, 'VERIFIED_INTEGRAL')
    console.log(`  ✓ Trilha de lances 100% íntegra (auditados ${auditRes.totalBidsChecked} elos com HMAC-SHA256).`)

    // ----------------------------------------------------
    // TESTE 12: Liquidação Definitiva (Settlement) & Crédito do Leiloeiro
    // ----------------------------------------------------
    console.log('\n[REGRA 12] Testando liquidação definitiva (martelo batido)...')
    const auctioneerBeforeSettle = await prisma.user.findUniqueOrThrow({ where: { id: auctioneer.id } })
    const winnerBeforeSettle = await prisma.user.findUniqueOrThrow({ where: { id: bidder1.id } })

    const settleRes = await settleLotUseCase.execute({
      lotId: testLot.id,
      requestedByUserId: auctioneer.id,
      requestedByUserRole: 'AUCTIONEER',
    })

    assert.equal(settleRes.lot.status, 'ENDED')
    assert.ok(settleRes.receipt)
    assert.equal(settleRes.receipt.finalAmount, 150000)
    assert.match(settleRes.receipt.code, /^REC-\d{4}-[A-F0-9]{6}$/)

    // Verifica saldo do vencedor debitado definitivamente
    const winnerAfterSettle = await prisma.user.findUniqueOrThrow({ where: { id: bidder1.id } })
    assert.equal(winnerAfterSettle.balanceTotal, winnerBeforeSettle.balanceTotal - BigInt(150000))
    assert.equal(winnerAfterSettle.balanceCommitted, BigInt(0))

    // Verifica saldo do leiloeiro creditado com o valor arrematado
    const auctioneerAfterSettle = await prisma.user.findUniqueOrThrow({ where: { id: auctioneer.id } })
    assert.equal(auctioneerAfterSettle.balanceTotal, auctioneerBeforeSettle.balanceTotal + BigInt(150000))
    console.log('  ✓ Liquidação concluída: Vencedor debitado, Leiloeiro creditado, Comprovante oficial emitido.')

    // ----------------------------------------------------
    // TESTE 13: Idempotência da Liquidação
    // ----------------------------------------------------
    console.log('\n[REGRA 13] Testando idempotência da liquidação...')
    const secondSettleRes = await settleLotUseCase.execute({
      lotId: testLot.id,
      requestedByUserId: auctioneer.id,
      requestedByUserRole: 'AUCTIONEER',
    })

    assert.equal(secondSettleRes.alreadySettled, true)
    assert.equal(secondSettleRes.receipt?.code, settleRes.receipt.code)

    // Saldos não devem sofrer novo débito ou crédito
    const winnerAfterSecondSettle = await prisma.user.findUniqueOrThrow({ where: { id: bidder1.id } })
    assert.equal(winnerAfterSecondSettle.balanceTotal, winnerAfterSettle.balanceTotal)
    console.log('  ✓ Idempotência confirmada: chamada subsequente não duplica débitos/créditos.')

    // ----------------------------------------------------
    // TESTE 14: Lote Encerrado rejeita novos lances
    // ----------------------------------------------------
    console.log('\n[REGRA 14] Testando rejeição de lance em lote já encerrado...')
    await assert.rejects(
      async () => {
        await createBidUseCase.execute({
          lotId: testLot.id,
          bidderId: bidder2.id,
          amountInCents: 200000,
        })
      },
      (err: any) => err instanceof AuctionNotActiveError,
      'Deveria recusar lances em lote encerrado.',
    )
    console.log('  ✓ Lance em lote encerrado recusado ("lote encerrado").')

    console.log('\n🎉 ========================================================')
    console.log('   TODAS AS 14 REGRAS DE NEGÓCIO FORAM APROVADAS COM SUCESSO!')
    console.log('========================================================\n')
  } finally {
    // Limpeza dos lotes de teste
    await prisma.walletTransaction.deleteMany({ where: { lotId: testLot.id } }).catch(() => {})
    await prisma.receipt.deleteMany({ where: { lotId: testLot.id } }).catch(() => {})
    await prisma.bid.deleteMany({ where: { lotId: testLot.id } }).catch(() => {})
    await prisma.lot.delete({ where: { id: testLot.id } }).catch(() => {})
  }
}

runBusinessRulesTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha nos testes de regras de negócio:', err)
    process.exit(1)
  })
