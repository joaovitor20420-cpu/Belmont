export interface ArtInstituteItem {
  id: string
  title: string
  artistTitle: string | null
  dateDisplay: string | null
  mediumDisplay: string | null
  dimensions: string | null
  imageId: string | null
  imageUrl: string | null
  isPublicDomain: boolean
}

export interface SearchArtworksParams {
  query?: string
  page?: number
  limit?: number
}

interface RawArtInstituteArtwork {
  id: number | string
  title: string
  artist_title: string | null
  date_display: string | null
  medium_display: string | null
  dimensions: string | null
  image_id: string | null
  is_public_domain: boolean
}

interface RawSearchResponse {
  data: RawArtInstituteArtwork[]
}

interface RawDetailResponse {
  data: RawArtInstituteArtwork
}

export class ArtInstituteClient {
  private readonly baseUrl = 'https://api.artic.edu/api/v1'
  private readonly clevelandBaseUrl = 'https://openaccess-api.clevelandart.org/api'
  private readonly defaultTimeoutMs = 3500
  private readonly requestHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'AIC-User-Agent': 'CasaDeLeiloesBelmont/1.0 (verzel-elite-dev@belmont.com)',
    Accept: 'application/json',
  }

  buildIiifImageUrl(imageId: string | null): string | null {
    if (!imageId) {
      return 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop'
    }

    if (imageId.startsWith('http')) {
      return imageId
    }

    return `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg`
  }

  private mapRawToItem(raw: RawArtInstituteArtwork): ArtInstituteItem {
    return {
      id: String(raw.id),
      title: raw.title,
      artistTitle: raw.artist_title ?? null,
      dateDisplay: raw.date_display ?? null,
      mediumDisplay: raw.medium_display ?? null,
      dimensions: raw.dimensions ?? null,
      imageId: raw.image_id ?? null,
      imageUrl: this.buildIiifImageUrl(raw.image_id),
      isPublicDomain: Boolean(raw.is_public_domain),
    }
  }

  async searchPublicArtworks(
    params: SearchArtworksParams = {},
  ): Promise<ArtInstituteItem[]> {
    const { query = 'Monet', page = 1, limit = 15 } = params

    // 1. Tenta buscar no Art Institute of Chicago
    try {
      const searchParams = new URLSearchParams({
        q: query,
        page: String(page),
        limit: String(limit),
        fields:
          'id,title,artist_title,date_display,medium_display,dimensions,image_id,is_public_domain',
      })

      const url = `${this.baseUrl}/artworks/search?${searchParams.toString()}`

      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.defaultTimeoutMs,
      )

      const response = await fetch(url, {
        headers: this.requestHeaders,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const body = (await response.json()) as RawSearchResponse
        if (body.data && Array.isArray(body.data) && body.data.length > 0) {
          const publicItems = body.data
            .filter((raw) => raw.is_public_domain === true)
            .map((raw) => this.mapRawToItem(raw))

          if (publicItems.length > 0) {
            return publicItems
          }
        }
      }
    } catch {
      // Ignora erro do artic.edu e avança para o fallback oficial de museus abertos
    }

    // 2. Fallback de Alta Disponibilidade: Cleveland Museum of Art Open Access API
    try {
      const clevelandUrl = `${this.clevelandBaseUrl}/artworks/?q=${encodeURIComponent(
        query,
      )}&has_image=1&limit=${limit}&skip=${(page - 1) * limit}`

      const clevelandController = new AbortController()
      const clevelandTimeoutId = setTimeout(
        () => clevelandController.abort(),
        this.defaultTimeoutMs,
      )

      const clevelandRes = await fetch(clevelandUrl, {
        headers: { Accept: 'application/json' },
        signal: clevelandController.signal,
      })

      clearTimeout(clevelandTimeoutId)

      if (clevelandRes.ok) {
        const json = await clevelandRes.json()
        if (json.data && Array.isArray(json.data)) {
          return json.data.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            artistTitle: item.creators?.[0]?.description ?? 'Artista do Acervo',
            dateDisplay: item.creation_date ?? null,
            mediumDisplay: item.technique ?? null,
            dimensions: item.measurements ?? null,
            imageId: String(item.id),
            imageUrl:
              item.images?.web?.url ||
              item.images?.print?.url ||
              'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop',
            isPublicDomain: true,
          }))
        }
      }
    } catch {
      // Falha de rede tratada pelo chamador
    }

    return []
  }

  async getArtworkById(id: string): Promise<ArtInstituteItem | null> {
    // 1. Tenta no Art Institute
    try {
      const fields =
        'id,title,artist_title,date_display,medium_display,dimensions,image_id,is_public_domain'
      const url = `${this.baseUrl}/artworks/${encodeURIComponent(id)}?fields=${fields}`

      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.defaultTimeoutMs,
      )

      const response = await fetch(url, {
        headers: this.requestHeaders,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const body = (await response.json()) as RawDetailResponse
        if (body.data) {
          return this.mapRawToItem(body.data)
        }
      }
    } catch {
      // Ignora e tenta o museu parceiro
    }

    // 2. Tenta no Cleveland Museum of Art
    try {
      const clevelandUrl = `${this.clevelandBaseUrl}/artworks/${encodeURIComponent(id)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.defaultTimeoutMs,
      )

      const res = await fetch(clevelandUrl, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const item = json.data
          return {
            id: String(item.id),
            title: item.title,
            artistTitle: item.creators?.[0]?.description ?? 'Artista do Acervo',
            dateDisplay: item.creation_date ?? null,
            mediumDisplay: item.technique ?? null,
            dimensions: item.measurements ?? null,
            imageId: String(item.id),
            imageUrl:
              item.images?.web?.url ||
              item.images?.print?.url ||
              'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop',
            isPublicDomain: true,
          }
        }
      }
    } catch {
      // Ignora
    }

    return null
  }
}

export const artInstituteClient = new ArtInstituteClient()
