'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, ArrowLeft } from 'lucide-react'
import { APP_CONFIG } from '@/lib/utils/constants'
import AlertForm, { AlertFormData } from '@/components/forms/AlertForm'

function CreateAlertContent() {
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

  const handleFormSuccess = (formData: AlertFormData) => {
    // Redirect to success page with form data in query params
    const searchParams = new URLSearchParams({
      email: formData.email,
      neighborhoods: formData.neighborhoods.join(','),
      success: 'true'
    })
    
    router.push(`/success?${searchParams.toString()}`)
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="w-full px-4 py-4">
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
      <main className="max-w-4xl mx-auto px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Set Up Your Apartment Alert
            </h1>
            <p className="text-gray-600">
              Tell us what you're looking for and we'll notify you when matching apartments become available.
            </p>
          </div>

          {/* Alert Creation Form */}
          <div className="max-w-2xl mx-auto">
            <AlertForm 
              onSuccess={handleFormSuccess}
              initialData={{ email }}
              className="space-y-4"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CreateAlertPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateAlertContent />
    </Suspense>
  )
}