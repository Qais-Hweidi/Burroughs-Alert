'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  ArrowLeft,
  Settings,
  Plus,
  Mail,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AlertCard, { AlertData } from '@/components/alerts/AlertCard';
import DeleteAlertDialog from '@/components/alerts/DeleteAlertDialog';
import { Spinner } from '@/components/ui/spinner';

interface AlertsResponse {
  success: boolean;
  user?: {
    id: number;
    email: string;
    created_at: string;
  };
  alerts?: AlertData[];
  error?: string;
  message?: string;
}

function ManageAlertsContent() {
  const [email, setEmail] = useState('');
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [user, setUser] = useState<AlertsResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    alertId: number | null;
    alertInfo?: any;
  }>({ isOpen: false, alertId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (emailParam) {
      setEmail(emailParam);
      fetchAlerts(emailParam);
    } else if (tokenParam) {
      fetchAlertsByToken(tokenParam);
    }
  }, [searchParams]);

  const fetchAlerts = async (emailAddress: string) => {
    if (!emailAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/alerts?email=${encodeURIComponent(emailAddress)}`);
      const data: AlertsResponse = await response.json();
      
      if (data.success && data.alerts && data.user) {
        setAlerts(data.alerts);
        setUser(data.user);
        setEmail(data.user.email);
      } else {
        setError(data.message || 'Failed to load alerts');
        setAlerts([]);
        setUser(null);
      }
    } catch (err) {
      setError('Failed to load alerts. Please try again.');
      setAlerts([]);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlertsByToken = async (token: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/alerts?token=${encodeURIComponent(token)}`);
      const data: AlertsResponse = await response.json();
      
      if (data.success && data.alerts && data.user) {
        setAlerts(data.alerts);
        setUser(data.user);
        setEmail(data.user.email);
      } else {
        setError(data.message || 'Failed to load alerts');
        setAlerts([]);
        setUser(null);
      }
    } catch (err) {
      setError('Failed to load alerts. Please try again.');
      setAlerts([]);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      fetchAlerts(email.trim());
    }
  };

  const handleCreateAlert = () => {
    const params = new URLSearchParams({ email });
    router.push(`/alerts/create?${params.toString()}`);
  };

  const handleEditAlert = (alertId: number) => {
    // Find the alert to edit
    const alertToEdit = alerts.find(alert => alert.id === alertId);
    if (!alertToEdit) return;

    // Navigate to create page with edit mode and alert data
    const params = new URLSearchParams({ 
      email,
      edit: alertId.toString(),
      mode: 'edit'
    });
    router.push(`/alerts/create?${params.toString()}`);
  };

  const handleDeleteAlert = (alertId: number) => {
    const alertToDelete = alerts.find(alert => alert.id === alertId);
    if (alertToDelete) {
      setDeleteDialog({
        isOpen: true,
        alertId,
        alertInfo: {
          neighborhoods: alertToDelete.neighborhoods,
          bedrooms: alertToDelete.bedrooms,
          priceRange: formatPriceRange(alertToDelete),
        },
      });
    }
  };

  const confirmDeleteAlert = async () => {
    if (!deleteDialog.alertId || !email) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/alerts/${deleteDialog.alertId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted alert from the list
        setAlerts(prev => prev.filter(alert => alert.id !== deleteDialog.alertId));
        setDeleteDialog({ isOpen: false, alertId: null });
      } else {
        setError(data.message || 'Failed to delete alert');
      }
    } catch (err) {
      setError('Failed to delete alert. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPriceRange = (alert: AlertData) => {
    if (!alert.min_price && !alert.max_price) {
      return 'Any price';
    }
    if (alert.min_price && !alert.max_price) {
      return `$${alert.min_price.toLocaleString()}+`;
    }
    if (!alert.min_price && alert.max_price) {
      return `Up to $${alert.max_price.toLocaleString()}`;
    }
    if (alert.min_price && alert.max_price) {
      return `$${alert.min_price.toLocaleString()} - $${alert.max_price.toLocaleString()}`;
    }
    return 'Any price';
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="w-full px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
      <main className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-white">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Settings className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Manage Your Alerts</h1>
              </div>
              <p className="text-blue-100 text-lg">
                View, edit, and manage your apartment search alerts
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {!user ? (
              /* Email Input Form */
              <div className="max-w-md mx-auto">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-base font-medium">
                      Enter your email address
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll show you all the alerts associated with this email address.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your-email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="text-base"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !email.trim()}
                      className="px-6"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Alerts Dashboard */
              <div className="space-y-6">
                {/* User Info & Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Alerts for {user.email}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {alerts.length === 0 
                        ? 'No active alerts found'
                        : `${alerts.length} active alert${alerts.length === 1 ? '' : 's'}`
                      }
                    </p>
                  </div>
                  <Button onClick={handleCreateAlert} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Alert
                  </Button>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                )}

                {/* Alerts Grid */}
                {alerts.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {alerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onEdit={handleEditAlert}
                        onDelete={handleDeleteAlert}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : !isLoading && (
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No alerts yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Create your first alert to start receiving apartment notifications.
                    </p>
                    <Button onClick={handleCreateAlert} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Your First Alert
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteAlertDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, alertId: null })}
        onConfirm={confirmDeleteAlert}
        alertInfo={deleteDialog.alertInfo}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function ManageAlertsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="w-12 h-12" />
        </div>
      }
    >
      <ManageAlertsContent />
    </Suspense>
  );
}