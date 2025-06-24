'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, Clock, Shield } from 'lucide-react';

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Check Your Email
          </h1>
          <p className="text-blue-100">
            We've sent you a confirmation link
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-600 mb-6 leading-relaxed text-center">
            We've sent a confirmation email to verify your address. Please click
            the confirmation link in the email to activate your apartment search alert.
          </p>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Don't see the email?
            </h3>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Check your spam or junk folder
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Make sure you entered your email correctly
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                The email may take a few minutes to arrive
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Add us to your contacts to avoid future issues
              </li>
            </ul>
          </div>

          {/* Security Note */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Security First</h4>
                <p className="text-sm text-green-800">
                  We require email verification to protect you from spam and ensure
                  you receive your apartment alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Resend Confirmation Email
            </button>

            <Link
              href="/alerts/create"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-center"
            >
              Try a Different Email
            </Link>

            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
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
