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
  private readonly defaultTimeoutMs = 3500
  private readonly requestHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'AIC-User-Agent': 'CasaDeLeiloesBelmont/1.0 (verzel-elite-dev@belmont.com)',
    Accept: 'application/json',
  }

  buildIiifImageUrl(imageId: string | null): string | null {
    if (!imageId) {
      return 'https://placehold.co/843x600?text=Sem+Imagem'
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
    const { query = '', page = 1, limit = 15 } = params

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

    try {
      const response = await fetch(url, {
        headers: this.requestHeaders,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(
          `Art Institute API error: ${response.status} ${response.statusText}`,
        )
      }

      const body = (await response.json()) as RawSearchResponse

      if (!body.data || !Array.isArray(body.data)) {
        return []
      }

      return body.data
        .filter((raw) => raw.is_public_domain === true)
        .map((raw) => this.mapRawToItem(raw))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async getArtworkById(id: string): Promise<ArtInstituteItem | null> {
    const fields =
      'id,title,artist_title,date_display,medium_display,dimensions,image_id,is_public_domain'
    const url = `${this.baseUrl}/artworks/${encodeURIComponent(id)}?fields=${fields}`

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.defaultTimeoutMs,
    )

    try {
      const response = await fetch(url, {
        headers: this.requestHeaders,
        signal: controller.signal,
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(
          `Art Institute API error: ${response.status} ${response.statusText}`,
        )
      }

      const body = (await response.json()) as RawDetailResponse

      if (!body.data) {
        return null
      }

      const item = this.mapRawToItem(body.data)

      return item
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export const artInstituteClient = new ArtInstituteClient()
