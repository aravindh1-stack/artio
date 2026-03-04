import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';

type DesktopLeftSectionProps = {
  isDark: boolean;
  toggleTheme: () => void;
  user: unknown;
  signOut: () => void;
};

const DesktopLeftSection = ({ isDark, toggleTheme, user, signOut }: DesktopLeftSectionProps) => {
  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full border border-black/10 dark:border-white/15 bg-white/85 dark:bg-black/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] min-w-[230px]">
      <Link to="/" className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/25 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <img
          src={isDark ? '/artio-dark-theme.png' : '/artio-light-theme.png'}
          alt="Artio Logo"
          className="w-7 h-7 object-contain"
        />
      </Link>

      <button
        onClick={toggleTheme}
        className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/25 text-gray-700 dark:text-white/75 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {user ? (
        <button
          onClick={signOut}
          className="px-4 py-2.5 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/25 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors"
        >
          Sign Out
        </button>
      ) : (
        <Link
          to="/auth"
          className="px-4 py-2.5 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/25 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors"
        >
          Login / Signup
        </Link>
      )}
    </div>
  );
};

export default DesktopLeftSection;
