import type { ExternalItemCache } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import type { ArtInstituteItem } from '../../lib/artInstituteClient.js'
import type { ExternalItemsCacheRepository } from '../externalItemsCacheRepository.js'

export class PrismaExternalItemsCacheRepository
  implements ExternalItemsCacheRepository
{
  async save(item: ArtInstituteItem): Promise<void> {
    await prisma.externalItemCache.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        artist: item.artistTitle,
        dateDisplay: item.dateDisplay,
        medium: item.mediumDisplay,
        dimensions: item.dimensions,
        imageId: item.imageId,
        cachedAt: new Date(),
      },
      create: {
        id: item.id,
        title: item.title,
        artist: item.artistTitle,
        dateDisplay: item.dateDisplay,
        medium: item.mediumDisplay,
        dimensions: item.dimensions,
        imageId: item.imageId,
      },
    })
  }

  async findManyByQuery(query: string): Promise<ExternalItemCache[]> {
    return prisma.externalItemCache.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { artist: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { cachedAt: 'desc' },
    })
  }

  async findById(id: string): Promise<ExternalItemCache | null> {
    return prisma.externalItemCache.findUnique({
      where: { id },
    })
  }
}
