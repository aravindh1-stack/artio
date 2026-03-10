import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { homeContent } from './content';
import { getHeroProducts } from '../../lib/firestoreDb';

const HERO_PRODUCTS_CACHE_KEY = 'artio-hero-products-cache-v1';
const HERO_PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;

const HeroSection = () => {
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const canAutoSlide = products.length > 1;
  const videoId = 'AXF4WhoDLus';
  const videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&playlist=${videoId}&rel=0&iv_load_policy=3&playsinline=1&vq=hd2160`;
  useEffect(() => {
    const loadHeroProducts = async () => {
      setIsProductsLoading(true);
      setProductsError('');
      let hasShownCachedItems = false;

      const cachedRaw = sessionStorage.getItem(HERO_PRODUCTS_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          const isFresh = Date.now() - Number(cached?.ts || 0) < HERO_PRODUCTS_CACHE_TTL_MS;
          if (isFresh && Array.isArray(cached?.items) && cached.items.length > 0) {
            setProducts(cached.items);
            setIsProductsLoading(false);
            hasShownCachedItems = true;
          }
        } catch {
          sessionStorage.removeItem(HERO_PRODUCTS_CACHE_KEY);
        }
      }

      try {
        const data = await getHeroProducts({ max: 8 });
        const items = Array.isArray(data) ? data : [];

        setProducts(items);
        sessionStorage.setItem(
          HERO_PRODUCTS_CACHE_KEY,
          JSON.stringify({ ts: Date.now(), items })
        );
      } catch (error) {
        console.warn('Hero products are unavailable:', error?.message || error);
        if (!hasShownCachedItems) {
          setProducts([]);
        }
        setProductsError('Products are currently unavailable.');
      } finally {
        setIsProductsLoading(false);
      }
    };

    loadHeroProducts();
  }, []);

  const getImageSrc = (value) => {
    if (!value) return '/placeholder.svg';
    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('/') ||
      value.startsWith('data:')
    ) {
      return value;
    }
    return `/${value}`;
  };

  return (
    <section className="relative isolate min-h-screen overflow-hidden text-gray-900 dark:text-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2">
          <iframe
            src={videoSrc}
            title="Artio Hero Background Video"
            className="h-full w-full pointer-events-none opacity-45"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="absolute inset-0 bg-white/55 dark:bg-black/45" />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.18)_45%,rgba(255,255,255,0.58)_100%)] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_45%,rgba(0,0,0,0.52)_100%)]" />

      <div className="relative z-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16 flex items-center">
        <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.article
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="glass-effect rounded-3xl p-7 sm:p-9"
          >
            <p className="inline-flex items-center gap-3 text-[11px] tracking-[0.32em] uppercase text-slate-700 dark:text-amber-200/90">
              <span className="h-px w-10 bg-slate-700 dark:bg-amber-300/70" />
              {homeContent.eyebrow}
            </p>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.02] text-slate-900 dark:text-white">
              {homeContent.titleLineOne}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 dark:from-amber-200 dark:via-amber-300 dark:to-amber-500">
                {homeContent.titleAccent}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-700 dark:text-gray-200">
              {homeContent.subtitle}
            </p>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Artio builds visual identities and curated art experiences for modern brands,
              hospitality, and premium spaces.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to="/store"
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 border border-slate-800 dark:border-amber-300/40 bg-slate-900 dark:bg-transparent text-white dark:text-amber-200 text-xs font-semibold tracking-[0.14em] uppercase hover:bg-slate-700 dark:hover:bg-amber-300 dark:hover:text-black transition-colors"
              >
                Explore Collection
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 border border-slate-300 dark:border-white/20 bg-white/70 dark:bg-white/[0.03] text-gray-700 dark:text-white/90 text-xs font-semibold tracking-[0.14em] uppercase hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                About Artio
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ['250+', 'Projects'],
                ['60+', 'Partners'],
                ['98%', 'Satisfaction'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-300/70 dark:border-white/10 bg-white/65 dark:bg-white/[0.03] px-4 py-3">
                  <p className="text-xl font-semibold text-slate-900 dark:text-amber-200">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </motion.article>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="w-full max-w-[390px] lg:justify-self-end rounded-2xl border border-slate-300/50 dark:border-white/10 bg-white/85 dark:bg-[#0e1118]/85 p-3 sm:p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] tracking-[0.24em] uppercase text-slate-700 dark:text-slate-200">
                Featured Products
              </p>
              <Link
                to="/store"
                className="text-[11px] tracking-[0.18em] uppercase text-slate-600 dark:text-amber-200 hover:text-slate-900 dark:hover:text-amber-100 transition-colors"
              >
                View All
              </Link>
            </div>

            {isProductsLoading && (
              <div className="rounded-2xl border border-slate-300/60 dark:border-white/15 bg-white/70 dark:bg-white/[0.03] px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-300">
                Loading products...
              </div>
            )}

            {!isProductsLoading && productsError && (
              <div className="rounded-2xl border border-slate-300/60 dark:border-white/15 bg-white/70 dark:bg-white/[0.03] px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-300">
                {productsError}
              </div>
            )}

            {!isProductsLoading && !productsError && products.length === 0 && (
              <div className="rounded-2xl border border-slate-300/60 dark:border-white/15 bg-white/70 dark:bg-white/[0.03] px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-300">
                No featured products found.
              </div>
            )}

            {!isProductsLoading && !productsError && products.length > 0 && (
              <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1}
                spaceBetween={0}
                loop={false}
                rewind={canAutoSlide}
                autoplay={
                  canAutoSlide
                    ? { delay: 2800, disableOnInteraction: false }
                    : false
                }
                pagination={{ clickable: true }}
                breakpoints={{
                  640: { slidesPerView: 1, spaceBetween: 0 },
                  1024: { slidesPerView: 1, spaceBetween: 0 },
                }}
                className="hero-bg-swiper h-[470px] sm:h-[500px]"
              >
                {products.map((product) => (
                  <SwiperSlide key={product.id}>
                    <article className="h-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121722] flex flex-col">
                      <div className="h-[380px] sm:h-[405px] w-full bg-slate-100 dark:bg-slate-900 p-2">
                        <img
                          src={getImageSrc(product.image_path)}
                          alt={product.name}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">{product.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">${product.price}</p>
                      </div>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </motion.aside>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
