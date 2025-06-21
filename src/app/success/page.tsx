import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Alert Created Successfully!
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your apartment search alert has been set up. We'll start monitoring listings and send you email notifications when we find apartments that match your criteria.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• We'll check for new listings every 15 minutes</li>
            <li>• You'll receive email notifications for matching apartments</li>
            <li>• We'll filter out potential scams automatically</li>
            <li>• You can unsubscribe anytime using the link in our emails</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Link 
            href="/"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Create Another Alert
          </Link>
          
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@burroughs-alert.com" className="text-blue-600 hover:underline">
              support@burroughs-alert.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
