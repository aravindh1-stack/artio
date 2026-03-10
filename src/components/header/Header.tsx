import { useState } from 'react';
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
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { isDark, toggleTheme } = useThemeStore();
  const { user, signOut, role } = useAuthStore();

  const navigation = getNavigation(role, user);
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-16 left-0 right-0 z-30 bg-transparent">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-2 lg:gap-3">
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
