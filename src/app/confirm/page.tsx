'use client';

import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <Mail className="h-16 w-16 text-blue-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Check Your Email
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          We've sent a confirmation email to verify your address. Please click
          the confirmation link in the email to activate your apartment search
          alert.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2">
            Don't see the email?
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1 text-left">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered your email correctly</li>
            <li>• The email may take a few minutes to arrive</li>
            <li>• Add us to your contacts to avoid future issues</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Resend Confirmation Email
          </button>

          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Having trouble? Contact us at{' '}
            <a
              href="mailto:support@burroughs-alert.com"
              className="text-blue-600 hover:underline"
            >
              support@burroughs-alert.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
