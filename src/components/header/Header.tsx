import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import DesktopLeftSection from './DesktopLeftSection';
import DesktopNavSection from './DesktopNavSection';
import DesktopRightSection from './DesktopRightSection';
import MobileHeaderBar from './MobileHeaderBar';
import MobileMenu from './MobileMenu';
import { getNavigation, supportLink } from './headerConfig';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { isDark, toggleTheme } = useThemeStore();
  const { user, signOut, role } = useAuthStore();

  const navigation = getNavigation(role, user);
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 z-30 bg-transparent transition-all duration-300 ${
        isScrolled ? 'top-0' : 'top-5'
      }`}
    >
      <nav className={`max-w-6xl mx-auto px-4 sm:px-5 lg:px-6 transition-all duration-300 ${isScrolled ? 'py-2.5' : 'py-4'}`}>
        <div className="flex items-center justify-center gap-3 lg:gap-4">
          <DesktopLeftSection
            isDark={isDark}
            toggleTheme={toggleTheme}
          />

          <DesktopNavSection navigation={navigation} isActive={isActive} />

          <DesktopRightSection itemCount={itemCount} user={user} signOut={signOut} />

          <MobileHeaderBar
            isDark={isDark}
            toggleTheme={toggleTheme}
            itemCount={itemCount}
            user={user}
            signOut={signOut}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
        </div>
      </nav>

      <MobileMenu
        mobileMenuOpen={mobileMenuOpen}
        navigation={navigation}
        isActive={isActive}
        setMobileMenuOpen={setMobileMenuOpen}
        supportLink={supportLink}
      />
    </header>
  );
};

export default Header;
