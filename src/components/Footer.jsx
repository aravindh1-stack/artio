import { Link } from 'react-router-dom';
import artioLightLogo from '../assets/artio-light-logo.png';
import artioDarkLogo from '../assets/artio-dark-logo.png';

const Footer = () => {
  // ...existing code...
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-start">
            <span className="relative w-12 h-12 mb-2">
              <img
                src={window.matchMedia('(prefers-color-scheme: dark)').matches ? artioDarkLogo : artioLightLogo}
                alt="Artio Logo"
                className="w-12 h-12 object-contain"
              />
            </span>
            <h3 className="text-xl font-bold text-black dark:text-white">Artio</h3>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Premium visual identities and museum-quality art prints.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Explore
            </h4>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link to="/store" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                Store
              </Link>
              <Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                Services
              </Link>
              <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                Contact
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Contact
            </h4>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>Email: hello@artio.gallery</p>
              <p>WhatsApp: +0000000000</p>
              <p>Hours: Mon-Sat, 10:00-18:00</p>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-500">
          <p>2026 Artio Redefined Gallery. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
