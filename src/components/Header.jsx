import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Moon, Sun, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { isDark, toggleTheme } = useThemeStore();
  const { user, signOut, role } = useAuthStore();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Store', href: '/store' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
    ...(role === 'admin' ? [{ name: 'Admin', href: '/admin' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  // Import logo images
  import artioLightLogo from '../assets/artio-light-logo.png';
  import artioDarkLogo from '../assets/artio-dark-logo.png';
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="relative w-10 h-10 flex items-center">
              <img
                src={isDark ? artioDarkLogo : artioLightLogo}
                alt="Artio Logo"
                className="w-10 h-10 object-contain transition-all duration-200 group-hover:scale-105"
              />
            </span>
            <span className="text-2xl font-bold text-black dark:text-white">Artio</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Redefined</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-black dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {user ? (
              <div className="relative group">
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    Orders
                  </Link>
                  <button
                    onClick={signOut}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
