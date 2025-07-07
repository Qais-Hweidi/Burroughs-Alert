import {
  Search,
  MapPin,
  Bell,
  Shield,
  Clock,
  TrendingUp,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6">
              Find Your Perfect
              <span className="text-blue-600 block">NYC Apartment</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Stop missing out on great apartments. Get instant notifications
              for listings that match your criteria across all 5 NYC boroughs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/alerts/create"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Bell className="h-6 w-6 mr-3" />
                Create Alert
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl border border-gray-200"
              >
                <Search className="h-6 w-6 mr-3" />
                See How It Works
              </Link>
            </div>
            <div className="mt-6">
              <Link
                href="/alerts/manage"
                className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                <Settings className="h-4 w-4 mr-2" />
                Already have alerts? Manage them here
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose BurroughsAlert?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our smart system monitors thousands of listings daily and sends
              you only the apartments that match your exact requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Smart Location Filtering
              </h3>
              <p className="text-gray-600">
                Choose from 250+ NYC neighborhoods across all 5 boroughs. Set
                commute preferences to find apartments near your work.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Instant Notifications
              </h3>
              <p className="text-gray-600">
                Receive email alerts within minutes of new listings. Never miss
                a great apartment because you checked too late.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Scam Protection
              </h3>
              <p className="text-gray-600">
                Built-in filters detect and remove suspicious listings. Only get
                notifications for legitimate apartments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">5</div>
              <div className="text-gray-600">NYC Boroughs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">250+</div>
              <div className="text-gray-600">Neighborhoods</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Monitoring</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">Free</div>
              <div className="text-gray-600">To Use</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Find Your Next Home?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of NYC apartment hunters who never miss a great
            listing. Set up your alert in under 2 minutes.
          </p>
          <Link
            href="/alerts/create"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
          >
            <Bell className="h-6 w-6 mr-3" />
            Create Your First Alert
          </Link>
          <p className="text-blue-200 mt-4 flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2" />
            Setup takes less than 2 minutes • No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}
