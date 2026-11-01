const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export interface UserSession {
  id: string
  name: string
  email: string
  role: 'AUCTIONEER' | 'BIDDER'
  publicCode: string
  maskedName: string
  token: string
}

export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem('belmont_session')
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function setStoredSession(session: UserSession | null) {
  if (typeof window === 'undefined') return
  if (!session) {
    localStorage.removeItem('belmont_session')
  } else {
    localStorage.setItem('belmont_session', JSON.stringify(session))
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = getStoredSession()
  const headers = new Headers(options.headers || {})

  if (
    options.body !== undefined &&
    !headers.has('Content-Type') &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json')
  }

  if (session?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    let errorMessage = `Erro HTTP ${res.status}`
    try {
      const errData = await res.json()
      errorMessage = errData.message || errorMessage
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage)
  }

  // Tratamento para 204 No Content
  if (res.status === 204) return null as T
  return res.json()
}

export { API_BASE_URL }
