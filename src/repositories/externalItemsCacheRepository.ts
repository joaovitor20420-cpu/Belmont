import type { ExternalItemCache } from '@prisma/client'
import type { ArtInstituteItem } from '../lib/artInstituteClient.js'

export interface ExternalItemsCacheRepository {
  save(item: ArtInstituteItem): Promise<void>
  findManyByQuery(query: string): Promise<ExternalItemCache[]>
  findById(id: string): Promise<ExternalItemCache | null>
}
