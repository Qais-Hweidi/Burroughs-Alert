'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, ArrowLeft } from 'lucide-react'
import { APP_CONFIG } from '@/lib/utils/constants'

export default function CreateAlertPage() {
  const [email, setEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="w-full px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_CONFIG.name}</span>
          </div>
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Set Up Your Apartment Alert
            </h1>
            <p className="text-gray-600">
              Tell us what you're looking for and we'll notify you when matching apartments become available.
            </p>
          </div>

          {/* Alert Creation Form - Placeholder for MVP */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <Bell className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Alert Setup Coming Soon!
              </h2>
              <p className="text-gray-600 mb-4">
                We're building an amazing alert creation experience for you. For now, 
                we've saved your email address: <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You'll be among the first to know when we launch the full alert system.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleBack} variant="outline">
                  Return to Home
                </Button>
                <Button onClick={() => router.push('/success')}>
                  Continue to Success Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}