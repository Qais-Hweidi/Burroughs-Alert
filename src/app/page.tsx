import { ArrowRight, MapPin, Bell, Shield, Clock } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 section-spacing">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Never Miss Your Perfect
              <span className="text-primary block">NYC Apartment</span>
            </h1>
            <p className="lead mb-8 max-w-2xl mx-auto">
              Get instant notifications for apartment listings across all 5 boroughs 
              that match your exact criteria. Smart filtering, scam detection, and 
              real-time alerts included.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/alerts/create" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
                <Bell className="h-5 w-5 mr-2" />
                Create Free Alert
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center px-6 py-3 border border-border text-base font-medium rounded-md text-foreground bg-background hover:bg-accent transition-colors">
                <MapPin className="h-5 w-5 mr-2" />
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="section-spacing bg-muted/30">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How BurroughsAlert Works
            </h2>
            <p className="lead max-w-2xl mx-auto">
              Set your criteria once, and we&apos;ll handle the rest. Our system monitors 
              listings 24/7 and sends you instant notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Set Your Criteria
              </h3>
              <p className="text-muted-foreground">
                Choose your preferred neighborhoods, price range, apartment size, 
                and commute requirements. Cover all 5 NYC boroughs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Get Instant Alerts
              </h3>
              <p className="text-muted-foreground">
                Receive email notifications within minutes of new listings 
                that match your criteria. Never miss a great apartment again.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Smart Filtering
              </h3>
              <p className="text-muted-foreground">
                Built-in scam detection and duplicate removal ensure you only 
                see legitimate, high-quality apartment listings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-spacing-sm">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">5</div>
              <div className="text-sm text-muted-foreground">NYC Boroughs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">Free</div>
              <div className="text-sm text-muted-foreground">Basic Alerts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">&lt;5min</div>
              <div className="text-sm text-muted-foreground">Alert Speed</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="create-alert" className="section-spacing bg-primary/5">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Find Your Next Apartment?
            </h2>
            <p className="lead mb-8">
              Join thousands of NYC apartment hunters who never miss a great listing. 
              Set up your first alert in under 2 minutes.
            </p>
            <Link href="/alerts/create" className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
              <Bell className="h-6 w-6 mr-2" />
              Create Your First Alert
              <ArrowRight className="h-6 w-6 ml-2" />
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              <Clock className="h-4 w-4 inline mr-1" />
              Setup takes less than 2 minutes. No credit card required.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}