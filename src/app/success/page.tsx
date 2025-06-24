import Link from 'next/link';
import { CheckCircle, Bell, Mail, Clock, Shield } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Alert Created Successfully!
          </h1>
          <p className="text-green-100 text-lg">
            Your NYC apartment search is now active
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg leading-relaxed">
              We're now monitoring thousands of apartment listings across all 5 NYC boroughs.
              You'll receive instant email notifications when we find apartments that match your criteria.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Real-time Monitoring</h3>
                <p className="text-sm text-gray-600">We check for new listings every 15 minutes</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mt-1">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Instant Notifications</h3>
                <p className="text-sm text-gray-600">Get emailed within minutes of new matches</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mt-1">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Scam Protection</h3>
                <p className="text-sm text-gray-600">Suspicious listings filtered out automatically</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mt-1">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Easy Unsubscribe</h3>
                <p className="text-sm text-gray-600">Cancel anytime with one click</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/alerts/create"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-center"
            >
              Create Another Alert
            </Link>

            <Link
              href="/"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-center"
            >
              Back to Home
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              Questions? Contact us at{' '}
              <a
                href="mailto:support@burroughs-alert.com"
                className="text-blue-600 hover:underline font-medium"
              >
                support@burroughs-alert.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
