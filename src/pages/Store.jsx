import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Filter } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';

const Store = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [searchParams] = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);

  const ProtectedImage = ({ src, alt, className }) => {
    const [objectUrl, setObjectUrl] = useState('');

    useEffect(() => {
      if (!src) {
        setObjectUrl('');
        return undefined;
      }

      const controller = new AbortController();
      let active = true;

      const loadImage = async () => {
        try {
          const response = await fetch(src, { signal: controller.signal });
          if (!response.ok) {
            throw new Error('Image fetch failed');
          }
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          if (active) {
            setObjectUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return url;
            });
          } else {
            URL.revokeObjectURL(url);
          }
        } catch {
          if (active) {
            setObjectUrl('');
          }
        }
      };

      loadImage();

      return () => {
        active = false;
        controller.abort();
        setObjectUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return '';
        });
      };
    }, [src]);

    return (
      <img
        src={objectUrl || src}
        alt={alt}
        className={className}
        draggable={false}
      />
    );
  };

  useEffect(() => {
    fetchCategories();
  }, [searchParams]);

  useEffect(() => {
    const categorySlug = searchParams.get('category');
    if (!categorySlug) {
      setSelectedCategoryId(null);
      return;
    }

    const match = categories.find((category) => category.slug === categorySlug);
    if (match) {
      setSelectedCategoryId(match.id);
    }
  }, [categories, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategoryId]);

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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchProducts = async () => {
    let query = supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('is_active', true);

    if (selectedCategoryId) {
      query = supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .eq('category_id', selectedCategoryId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setProducts(data);
    }
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
    <div className="min-h-screen pt-16 relative">
      {isBlurred && (
        <div className="fixed inset-0 z-40 artio-blur-overlay flex items-center justify-center text-white text-lg font-semibold">
          Preview hidden while inactive
        </div>
      )}
      <div className={isBlurred ? 'artio-blur' : ''}>
      <section className="py-12 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-4 text-gradient">Premium Collection</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Discover museum-quality prints for your space
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium">Filter by Category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategoryId === null
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategoryId === category.id
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
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
          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-xl text-gray-600 dark:text-gray-400">
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
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <Card className="group h-full flex flex-col">
                    <div className="relative aspect-[3/4] overflow-hidden artio-no-select">
                      <ProtectedImage
                        src={product.preview_image_url || product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white dark:bg-black text-black dark:text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Quick View
                        </button>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      {product.categories && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {product.categories.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">${product.price}</span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          className="flex items-center gap-2"
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
              <ProtectedImage
                src={quickViewProduct.preview_image_url || quickViewProduct.image_url}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
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
