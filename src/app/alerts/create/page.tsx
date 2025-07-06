'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  ArrowLeft,
  Mail,
  MapPin,
  DollarSign,
  Home,
  Heart,
  Clock,
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/utils/constants';
import AlertForm, { AlertFormData } from '@/components/forms/AlertForm';

function CreateAlertContent() {
  const [email, setEmail] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [alertId, setAlertId] = useState<number | null>(null);
  const [initialAlertData, setInitialAlertData] = useState<any>(null);
  const [isLoadingAlert, setIsLoadingAlert] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const editParam = searchParams.get('edit');
    const modeParam = searchParams.get('mode');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (editParam && modeParam === 'edit') {
      setIsEditMode(true);
      setAlertId(parseInt(editParam, 10));
      fetchAlertForEdit(parseInt(editParam, 10));
    }
  }, [searchParams]);

  const fetchAlertForEdit = async (id: number) => {
    setIsLoadingAlert(true);
    try {
      const response = await fetch(`/api/alerts/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.alert) {
          const alert = data.alert;
          // Transform the API response to match AlertFormData format
          setInitialAlertData({
            email: alert.email,
            neighborhoods: alert.neighborhoods,
            minPrice: alert.min_price,
            maxPrice: alert.max_price,
            bedrooms: alert.bedrooms,
            petFriendly: alert.pet_friendly === true,
            commuteDestination: alert.commute_destination,
            maxCommuteMinutes: alert.max_commute_minutes,
            commuteDestinationPlaceId: null, // These may not be available
            commuteDestinationCoordinates: alert.commute_destination_lat && alert.commute_destination_lng
              ? { lat: alert.commute_destination_lat, lng: alert.commute_destination_lng }
              : null,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch alert for editing:', error);
    } finally {
      setIsLoadingAlert(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleFormSuccess = (formData: AlertFormData, alertIdFromResponse?: number) => {
    if (isEditMode) {
      // Redirect back to manage page after successful edit
      const params = new URLSearchParams({ email: formData.email });
      router.push(`/alerts/manage?${params.toString()}`);
    } else if (alertIdFromResponse) {
      const searchParams = new URLSearchParams({
        alertId: alertIdFromResponse.toString(),
      });
      router.push(`/listings?${searchParams.toString()}`);
    } else {
      // Fallback to success page if no alert ID
      router.push('/success');
    }
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
                {isEditMode ? 'Edit Your Apartment Alert' : 'Create Your Apartment Alert'}
              </h1>
              <p className="text-blue-100 text-lg">
                {isEditMode 
                  ? 'Update your alert criteria to receive better apartment matches'
                  : 'Fill out the form below to get notified about apartments that match your criteria'
                }
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            {isLoadingAlert ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading alert data...</span>
              </div>
            ) : (
              <AlertForm
                onSuccess={handleFormSuccess}
                initialData={isEditMode ? initialAlertData : { email }}
                className="space-y-6"
                isEditMode={isEditMode}
                alertId={alertId || undefined}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateAlertPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <CreateAlertContent />
    </Suspense>
  );
}
