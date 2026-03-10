import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, Moon, Sun, User, LogOut } from 'lucide-react';

type MobileHeaderBarProps = {
  isDark: boolean;
  toggleTheme: () => void;
  itemCount: number;
  user: unknown;
  signOut: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
};

const MobileHeaderBar = ({
  isDark,
  toggleTheme,
  itemCount,
  user,
  signOut,
  mobileMenuOpen,
  setMobileMenuOpen,
}: MobileHeaderBarProps) => {
  return (
    <div className="md:hidden flex items-center gap-2">
      <Link to="/" className="flex items-center">
        <img
          src={isDark ? '/artio-dark-theme.png' : '/artio-light-theme.png'}
          alt="Artio Logo"
          className="w-11 h-11 object-contain"
        />
      </Link>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full border border-black/10 dark:border-white/15 text-gray-700 dark:text-white/80 bg-white/70 dark:bg-black/25"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      {user ? (
        <button
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
          className="p-2 rounded-full border border-black/10 dark:border-white/15 text-gray-700 dark:text-white/80 bg-white/70 dark:bg-black/25"
        >
          <LogOut className="w-4 h-4" />
        </button>
      ) : (
        <Link
          to="/auth"
          aria-label="Sign in or sign up"
          title="Sign in / Sign up"
          className="p-2 rounded-full border border-black/10 dark:border-white/15 text-gray-700 dark:text-white/80 bg-white/70 dark:bg-black/25"
        >
          <User className="w-4 h-4" />
        </Link>
      )}
      <Link
        to="/cart"
        className="relative p-2 rounded-full border border-black/10 dark:border-white/15 text-gray-700 dark:text-white/80 bg-white/70 dark:bg-black/25"
      >
        <ShoppingCart className="w-4 h-4" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-teal-400 text-black text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Link>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="p-2 rounded-full border border-black/10 dark:border-white/15 text-gray-700 dark:text-white/80 bg-white/70 dark:bg-black/25"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default MobileHeaderBar;
