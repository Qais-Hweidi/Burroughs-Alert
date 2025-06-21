import Link from 'next/link';
import { Home, Mail, Shield, FileText, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">Burroughs</span>
                <span className="text-xl font-bold text-primary">Alert</span>
              </div>
            </div>
            <p className="text-muted-foreground max-w-md">
              Get instant notifications for NYC apartment listings that match your criteria. 
              Never miss your perfect apartment again.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>NYC-focused " Privacy-first " No spam</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="#how-it-works" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  How it Works
                </Link>
              </li>
              <li>
                <Link 
                  href="/create-alert" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Create Alert
                </Link>
              </li>
              <li>
                <Link 
                  href="#pricing" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/unsubscribe" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Unsubscribe
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@burroughsalert.com" 
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              � {currentYear} BurroughsAlert. All rights reserved.
            </div>
            
            {/* NYC Disclaimer */}
            <div className="text-sm text-muted-foreground text-center md:text-right max-w-md">
              <p className="inline-flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                NYC apartment hunting service. Not affiliated with any real estate companies.
              </p>
            </div>
          </div>
          
          {/* Data Sources Attribution */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              <p className="inline-flex items-center justify-center">
                Listings sourced from public rental platforms. 
                <ExternalLink className="h-3 w-3 ml-1" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}