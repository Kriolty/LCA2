import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useState } from 'react';

interface LandingLayoutProps {
  children: ReactNode;
}

export const LandingLayout = ({ children }: LandingLayoutProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Solar Leads', path: '/solar' },
    { label: 'Property Leads', path: '/property' },
    { label: 'Finance Leads', path: '/finance' },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'Pricing', path: '/#pricing' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Leads Club Australia</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className="block text-gray-600 hover:text-gray-900 font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">Leads Club</span>
              </div>
              <p className="text-gray-400 text-sm">
                Australia's premier B2B lead marketplace. Connecting businesses with
                high-quality, exclusive leads across multiple verticals.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Verticals</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/solar" className="hover:text-white">Solar Energy</a></li>
                <li><a href="/property" className="hover:text-white">Property Investment</a></li>
                <li><a href="/finance" className="hover:text-white">Finance & Loans</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="/#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/register" className="hover:text-white">Get Started</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Leads Club Australia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
