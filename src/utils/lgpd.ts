import crypto from 'node:crypto'

export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts
    .map((part) => {
      if (part.length <= 1) return part
      return `${part[0]}***`
    })
    .join(' ')
}

export function generatePublicCode(role: 'AUCTIONEER' | 'BIDDER'): string {
  const prefix = role === 'AUCTIONEER' ? 'LEI' : 'LIC'
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `${prefix}-${randomSuffix}`
}
