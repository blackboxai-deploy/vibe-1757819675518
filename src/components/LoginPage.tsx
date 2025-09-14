"use client"

import { useState } from 'react'
import { User } from '@/types/chat'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
// Using Unicode symbols instead of lucide icons for compatibility
const BotIcon = () => <span className="text-white">🤖</span>
const MessageIcon = () => <span className="text-white">💬</span>
const SparklesIcon = () => <span className="text-white">✨</span>
const GlobeIcon = () => <span className="text-white">🌐</span>

// Simple toast implementation
const toast = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.log('ERROR:', message)
}

interface LoginPageProps {
  onLogin: (user: User) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: '',
    username: ''
  })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    avatar: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          username: loginForm.username
        })
      })

      const data = await response.json()
      
      if (data.success && data.user) {
        toast.success('Welcome back!')
        onLogin(data.user)
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          avatar: registerForm.avatar || undefined
        })
      })

      const data = await response.json()
      
      if (data.success && data.user) {
        toast.success('Account created successfully!')
        onLogin(data.user)
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (demoUser: { username: string; email: string; avatar: string }) => {
    setIsLoading(true)
    
    // Simulate demo login
    const user: User = {
      id: `demo_${Date.now()}`,
      username: demoUser.username,
      email: demoUser.email,
      avatar: demoUser.avatar,
      status: 'online',
      lastSeen: new Date(),
      aiPreferences: {
        preferredModel: 'blenderbot',
        autoTranslate: false,
        showSentiment: true,
        enableSuggestions: true
      }
    }
    
    setTimeout(() => {
      toast.success(`Welcome, ${user.username}!`)
      onLogin(user)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
        <div className="max-w-lg">
          <div className="mb-8">
            <img
              src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/9688d6ab-a610-4948-9568-1d5bf291b79a.png"
              alt="AI Chat App"
              className="w-24 h-24 rounded-2xl shadow-lg"
            />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            AI-Powered Chat Experience
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Connect with intelligent AI assistants powered by Hugging Face models. 
            Experience real-time conversations, sentiment analysis, and smart translations.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <BotIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistants</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Multiple AI models</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <MessageIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Chat</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Instant messaging</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <SparklesIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Smart Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sentiment & insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <GlobeIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Translation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Multi-language support</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">GPT-2</Badge>
            <Badge variant="secondary">BlenderBot</Badge>
            <Badge variant="secondary">CodeT5</Badge>
            <Badge variant="secondary">FLAN-T5</Badge>
            <Badge variant="secondary">RoBERTa</Badge>
          </div>
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to AI Chat
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to your account or create a new one
            </p>
          </div>

          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email or Username</Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="Enter email or username"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join the AI chat community today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        placeholder="Choose a username"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Demo Users */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Try Demo Users</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="flex items-center justify-start space-x-3 h-auto p-3"
                onClick={() => handleDemoLogin({
                  username: 'Alex Chen',
                  email: 'alex@demo.com',
                  avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/26e88da3-71fa-456d-ab53-306693ff712a.png'
                })}
                disabled={isLoading}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/9dad63ec-c4ca-474c-8bf6-5b7b43ef6451.png" />
                  <AvatarFallback>AC</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-medium">Alex Chen</div>
                  <div className="text-xs text-muted-foreground">AI Enthusiast</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-start space-x-3 h-auto p-3"
                onClick={() => handleDemoLogin({
                  username: 'Sarah Wilson',
                  email: 'sarah@demo.com',
                  avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/e0ec7254-5fcd-4c27-a2a5-8a22714b992a.png'
                })}
                disabled={isLoading}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/7fba8a60-9ad5-4f5c-bee2-133d1c36f68c.png" />
                  <AvatarFallback>SW</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-medium">Sarah Wilson</div>
                  <div className="text-xs text-muted-foreground">Creative Designer</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}