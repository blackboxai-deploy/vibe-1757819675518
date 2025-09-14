"use client"

import { useEffect, useState } from 'react'
import { chatStore } from '@/lib/chatStore'
import { User } from '@/types/chat'
import { ChatInterface } from '@/components/ChatInterface'
import LoginPage from '@/components/LoginPage'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing user session
    const checkUserSession = () => {
      try {
        const storedUser = localStorage.getItem('chatUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          chatStore.setCurrentUser(user)
          setCurrentUser(user)
        }
      } catch (error) {
        console.error('Failed to load user session:', error)
        localStorage.removeItem('chatUser')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserSession()

    // Subscribe to chat store changes
    const unsubscribe = chatStore.subscribe(() => {
      const user = chatStore.getCurrentUser()
      setCurrentUser(user)
      
      // Save user session
      if (user) {
        localStorage.setItem('chatUser', JSON.stringify(user))
      } else {
        localStorage.removeItem('chatUser')
      }
    })

    return unsubscribe
  }, [])

  const handleLogin = async (user: User) => {
    try {
      chatStore.setCurrentUser(user)
      setCurrentUser(user)
      
      // Make API call to update user status
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          username: user.username
        })
      })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const handleLogout = async () => {
    try {
      if (currentUser) {
        // Update user status to offline
        await fetch(`/api/users?userId=${currentUser.id}&action=logout`, {
          method: 'DELETE'
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear user session
      chatStore.setCurrentUser(null)
      setCurrentUser(null)
      localStorage.removeItem('chatUser')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        {/* Sidebar skeleton */}
        <div className="w-80 border-r bg-muted/30">
          <div className="p-4">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="border-b p-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-16 w-80" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="h-screen overflow-hidden">
      <ChatInterface 
        user={currentUser} 
        onLogout={handleLogout}
      />
    </div>
  )
}