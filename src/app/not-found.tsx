'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Search className="h-16 w-16 text-gray-400" />
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              !
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>

        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Looks like this apartment listing has moved or doesn't exist. Don't
          worry, there are plenty more great places to discover!
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Home
          </Link>

          <div className="flex justify-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go Back
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            Looking for apartments?
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Set up an alert and we'll notify you when new listings match your
            criteria.
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
          >
            Create an apartment alert →
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Still having trouble? Contact us at{' '}
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
