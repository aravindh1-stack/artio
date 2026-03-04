import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type NavItem = {
  name: string;
  href: string;
};

type MobileMenuProps = {
  mobileMenuOpen: boolean;
  navigation: NavItem[];
  isActive: (path: string) => boolean;
  setMobileMenuOpen: (value: boolean) => void;
  supportLink: string;
};

const MobileMenu = ({
  mobileMenuOpen,
  navigation,
  isActive,
  setMobileMenuOpen,
  supportLink,
}: MobileMenuProps) => {
  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white/95 dark:bg-black border-t border-black/10 dark:border-white/10 backdrop-blur-xl"
        >
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-black/8 dark:bg-white/10 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to={supportLink}
              onClick={() => setMobileMenuOpen(false)}
              className="block mt-2 px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium text-center"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
