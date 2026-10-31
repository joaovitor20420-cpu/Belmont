'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  apiRequest,
  getStoredSession,
  setStoredSession,
  UserSession,
} from '@/lib/api'

interface AuthContextType {
  user: UserSession | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserSession>
  register: (data: {
    name: string
    email: string
    password: string
    document: string
    role?: 'AUCTIONEER' | 'BIDDER'
  }) => Promise<UserSession>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const session = getStoredSession()
    if (!session?.token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const data = await apiRequest<{
        user: {
          id: string
          name: string
          email: string
          role: 'AUCTIONEER' | 'BIDDER'
          publicCode: string
          maskedName: string
        }
      }>('/me')

      const updated: UserSession = {
        ...data.user,
        token: session.token,
      }
      setUser(updated)
      setStoredSession(updated)
    } catch (err) {
      console.warn('Sessão expirada ou inválida:', err)
      setUser(null)
      setStoredSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    // Salva token temporário para permitir o /me
    const tempSession: UserSession = {
      id: '',
      name: '',
      email,
      role: 'BIDDER',
      publicCode: '',
      maskedName: '',
      token: data.token,
    }
    setStoredSession(tempSession)

    // Busca dados do usuário logado
    const meData = await apiRequest<{
      user: {
        id: string
        name: string
        email: string
        role: 'AUCTIONEER' | 'BIDDER'
        publicCode: string
        maskedName: string
      }
    }>('/me')

    const fullSession: UserSession = {
      ...meData.user,
      token: data.token,
    }
    setUser(fullSession)
    setStoredSession(fullSession)
    return fullSession
  }

  const register = async (userData: {
    name: string
    email: string
    password: string
    document: string
    role?: 'AUCTIONEER' | 'BIDDER'
  }) => {
    await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    return login(userData.email, userData.password)
  }

  const logout = () => {
    setUser(null)
    setStoredSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
