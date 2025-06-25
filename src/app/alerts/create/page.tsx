'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, ArrowLeft, Mail, MapPin, DollarSign, Home, Heart, Clock } from 'lucide-react';
import { APP_CONFIG } from '@/lib/utils/constants';
import AlertForm, { AlertFormData } from '@/components/forms/AlertForm';

function CreateAlertContent() {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push('/');
  };

  const handleFormSuccess = (formData: AlertFormData) => {
    const searchParams = new URLSearchParams({
      alertId: 'mock-alert-123',
    });

    router.push(`/listings?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="w-full px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {APP_CONFIG.name}
            </span>
          </div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-white">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">
                Create Your Apartment Alert
              </h1>
              <p className="text-blue-100 text-lg">
                Fill out the form below to get notified about apartments that match your criteria
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <AlertForm
              onSuccess={handleFormSuccess}
              initialData={{ email }}
              className="space-y-6"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateAlertPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <CreateAlertContent />
    </Suspense>
  );
}
