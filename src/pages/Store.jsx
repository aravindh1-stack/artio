import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Filter } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useCartStore } from '../store/cartStore';
import { getPublicCategories, getPublicProducts } from '../lib/firestoreDb';

const fallbackCategories = [
  {
    id: 'cat-featured',
    name: 'Featured',
    slug: 'featured',
    image_path:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'cat-abstract',
    name: 'Abstract',
    slug: 'abstract',
    image_path:
      'https://images.unsplash.com/photo-1577083552431-6e5fd01988f1?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'cat-minimal',
    name: 'Minimal',
    slug: 'minimal',
    image_path:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=120&q=70',
  },
];

const fallbackProducts = [
  {
    id: 'prd-1',
    category_id: 'cat-featured',
    name: 'Midnight Geometry',
    description: 'A bold geometric composition designed for statement interiors.',
    price: 149,
    image_path:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    dimensions: '24 x 36 in',
    stock_quantity: 14,
    categories: { name: 'Featured' },
  },
  {
    id: 'prd-2',
    category_id: 'cat-abstract',
    name: 'Amber Motion',
    description: 'Warm abstract gradients that bring depth and rhythm to modern spaces.',
    price: 179,
    image_path:
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
    dimensions: '30 x 40 in',
    stock_quantity: 9,
    categories: { name: 'Abstract' },
  },
  {
    id: 'prd-3',
    category_id: 'cat-minimal',
    name: 'Quiet Horizon',
    description: 'Minimal tonal artwork curated for calm and elevated environments.',
    price: 129,
    image_path:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
    dimensions: '20 x 30 in',
    stock_quantity: 18,
    categories: { name: 'Minimal' },
  },
  {
    id: 'prd-4',
    category_id: 'cat-featured',
    name: 'Studio Contrast',
    description: 'High-contrast visual print with gallery-grade detail and texture.',
    price: 199,
    image_path:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80',
    dimensions: '32 x 48 in',
    stock_quantity: 7,
    categories: { name: 'Featured' },
  },
];

const normalizeCategoryToken = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^cat[-_]/, '');

const Store = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [searchParams] = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);



  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const categorySlug = searchParams.get('category');
    if (!categorySlug || categorySlug === 'all') {
      setSelectedCategorySlug('all');
      return;
    }

    const match = categories.find((category) => category.slug === categorySlug);
    if (match) {
      setSelectedCategorySlug(match.slug);
    }
  }, [categories, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleVisibility = () => setIsBlurred(document.hidden);
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getPublicCategories();
      const mapped = Array.isArray(data) ? data : [];
      setCategories(mapped.length > 0 ? mapped : fallbackCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(fallbackCategories);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getPublicProducts();
      const mapped = Array.isArray(data) ? data : [];
      setAllProducts(mapped.length > 0 ? mapped : fallbackProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setAllProducts(fallbackProducts);
    }
  };

  const displayedProducts = useMemo(() => {
    if (selectedCategorySlug === 'all') {
      return allProducts;
    }

    const selectedCategory = categories.find((category) => category.slug === selectedCategorySlug);
    const selectedTokens = new Set(
      [selectedCategorySlug, selectedCategory?.id, selectedCategory?.name]
        .map((item) => normalizeCategoryToken(item))
        .filter(Boolean)
    );

    return allProducts.filter((product) => {
      const productTokens = [
        product.category_id,
        product.category_slug,
        product.category_name,
        product.category,
        product.categories?.name,
      ]
        .map((item) => normalizeCategoryToken(item))
        .filter(Boolean);

      return productTokens.some((token) => selectedTokens.has(token));
    });
  }, [allProducts, categories, selectedCategorySlug]);

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

  const handleAddToCart = (product) => {
    addItem(product);
    setQuickViewProduct(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen pt-36 relative font-space-grotesk bg-white dark:bg-black">
      {isBlurred && (
        <div className="fixed inset-0 z-40 artio-blur-overlay flex items-center justify-center text-white text-lg font-semibold">
          Preview hidden while inactive
        </div>
      )}
      <div className={isBlurred ? 'artio-blur' : ''}>
      <section className="py-8 bg-white/85 dark:bg-black/75 border-b border-gray-200/80 dark:border-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-amber-100/90">
            <Filter className="w-5 h-5" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">Filter by Category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategorySlug('all')}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-colors border ${
                selectedCategorySlug === 'all'
                  ? 'bg-slate-900 dark:bg-amber-300 text-white dark:text-black border-slate-900 dark:border-amber-300'
                  : 'bg-slate-100/85 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategorySlug(category.slug || 'all')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-colors border ${
                  selectedCategorySlug === category.slug
                    ? 'bg-slate-900 dark:bg-amber-300 text-white dark:text-black border-slate-900 dark:border-amber-300'
                    : 'bg-slate-100/85 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {displayedProducts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-xl text-slate-600 dark:text-gray-400">
                Products are currently unavailable in this category.
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {displayedProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <Card className="group h-full flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.02] shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.25)] overflow-hidden">
                    <div className="relative aspect-[3/4] overflow-hidden artio-no-select">
                      <img
                        src={getImageSrc(product.image_path)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        draggable={false}
                      />
                      <div className="absolute inset-0 artio-watermark pointer-events-none z-10" />
                      <div
                        className="absolute inset-0 artio-ghost z-20"
                        onContextMenu={(event) => event.preventDefault()}
                        onDragStart={(event) => event.preventDefault()}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center z-30">
                        <button
                          onClick={() => setQuickViewProduct(product)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-black/85 text-black dark:text-white px-4 py-2 rounded-full text-xs font-semibold tracking-[0.12em] uppercase flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Quick View
                        </button>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5">{product.name}</h3>
                      {product.categories && (
                        <p className="text-[11px] tracking-[0.12em] uppercase text-slate-500 dark:text-gray-400 mb-2">
                          {product.categories.name}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-semibold text-slate-900 dark:text-amber-200">${product.price}</span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          className="flex items-center gap-2 rounded-full px-4"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Modal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title="Product Details"
        size="xl"
      >
        {quickViewProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden artio-no-select">
              <img
                src={getImageSrc(quickViewProduct.image_path)}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 artio-watermark pointer-events-none z-10" />
              <div
                className="absolute inset-0 artio-ghost z-20"
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold mb-2">{quickViewProduct.name}</h2>
              {quickViewProduct.categories && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {quickViewProduct.categories.name}
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {quickViewProduct.description}
              </p>
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 dark:border-gray-800">
                  <span className="font-medium">Dimensions</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {quickViewProduct.dimensions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Stock</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {quickViewProduct.stock_quantity} available
                  </span>
                </div>
              </div>
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold">${quickViewProduct.price}</span>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => handleAddToCart(quickViewProduct)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
};

export default Store;
