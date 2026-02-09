import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Store from './pages/Store';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import Admin from './pages/Admin';
import Orders from './pages/Orders';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import AdminRoute from './components/AdminRoute';

function App() {
  const { isDark, setTheme } = useThemeStore();
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const savedTheme = localStorage.getItem('artio-theme-storage');
    if (savedTheme) {
      const { state } = JSON.parse(savedTheme);
      setTheme(state.isDark);
    }

    initialize();
  }, [setTheme, initialize]);

  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const isCtrl = event.ctrlKey || event.metaKey;

      if (
        event.key === 'F12' ||
        (isCtrl && event.shiftKey && key === 'i') ||
        (isCtrl && key === 'u') ||
        (isCtrl && key === 's')
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/store" element={<Store />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
