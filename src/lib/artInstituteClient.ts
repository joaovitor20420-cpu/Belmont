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

export class ArtInstituteClient {
  private readonly museumApiUrl = 'https://openaccess-api.clevelandart.org/api'
  private readonly defaultTimeoutMs = 4500

  buildIiifImageUrl(imageId: string | null): string | null {
    if (!imageId) return null
    if (imageId.startsWith('http')) return imageId
    return `https://openaccess-cdn.clevelandart.org/${imageId}/${imageId}_web.jpg`
  }

  async searchPublicArtworks(
    params: SearchArtworksParams = {},
  ): Promise<ArtInstituteItem[]> {
    const { query = 'Monet', page = 1, limit = 15 } = params
    const skip = (page - 1) * limit

    const url = `${this.museumApiUrl}/artworks/?q=${encodeURIComponent(
      query,
    )}&has_image=1&limit=${limit}&skip=${skip}`

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.defaultTimeoutMs,
    )

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CasaDeLeiloesBelmont/1.0 (verzel-elite-dev@belmont.com)',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Museum API HTTP ${response.status}`)
      }

      const body = await response.json()

      if (!body.data || !Array.isArray(body.data)) {
        return []
      }

      return body.data
        .filter((item: any) => item.images?.web?.url || item.images?.print?.url)
        .map((item: any) => {
          const imageUrl = item.images?.web?.url || item.images?.print?.url
          return {
            id: String(item.id),
            title: item.title,
            artistTitle: item.creators?.[0]?.description ?? 'Artista do Acervo',
            dateDisplay: item.creation_date ?? null,
            mediumDisplay: item.technique ?? null,
            dimensions: item.measurements ?? null,
            imageId: String(item.id),
            imageUrl,
            isPublicDomain: true,
          }
        })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async getArtworkById(id: string): Promise<ArtInstituteItem | null> {
    const url = `${this.museumApiUrl}/artworks/${encodeURIComponent(id)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.defaultTimeoutMs,
    )

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CasaDeLeiloesBelmont/1.0 (verzel-elite-dev@belmont.com)',
        },
        signal: controller.signal,
      })

      if (response.status === 404) return null
      if (!response.ok) throw new Error(`Museum API HTTP ${response.status}`)

      const body = await response.json()
      if (!body.data) return null

      const item = body.data
      const imageUrl = item.images?.web?.url || item.images?.print?.url

      return {
        id: String(item.id),
        title: item.title,
        artistTitle: item.creators?.[0]?.description ?? 'Artista do Acervo',
        dateDisplay: item.creation_date ?? null,
        mediumDisplay: item.technique ?? null,
        dimensions: item.measurements ?? null,
        imageId: String(item.id),
        imageUrl: imageUrl ?? null,
        isPublicDomain: true,
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export const artInstituteClient = new ArtInstituteClient()
