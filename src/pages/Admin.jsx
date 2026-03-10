// Utility: Add watermark to image file (returns a new File)
async function addWatermarkToImage(file, watermarkText) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // Watermark style
      const fontSize = Math.floor(canvas.width / 12);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.globalAlpha = 0.18; // Light watermark
      ctx.fillStyle = '#222';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      // Draw watermark at the top center
      ctx.fillText(watermarkText, canvas.width / 2, fontSize * 0.2);
      ctx.globalAlpha = 1;
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to create watermarked image'));
        resolve(new File([blob], file.name, { type: file.type }));
      }, file.type);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const MAX_IMAGE_DATA_URL_BYTES = 900000;

const estimateDataUrlBytes = (dataUrl) => {
  if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
    return 0;
  }

  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

async function optimizeImageToDataUrl(
  file,
  { maxWidth = 1400, maxHeight = 1400, quality = 0.78, outputType = 'image/jpeg' } = {}
) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to process image.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Image optimization failed.'));
            return;
          }

          try {
            const optimizedFile = new File([blob], file.name, { type: outputType });
            const dataUrl = await fileToDataUrl(optimizedFile);

            if (estimateDataUrlBytes(dataUrl) > MAX_IMAGE_DATA_URL_BYTES) {
              reject(new Error('Image is still too large. Please use a smaller image (under ~1MB).'));
              return;
            }

            resolve(dataUrl);
          } catch (error) {
            reject(error);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => reject(new Error('Invalid image file.'));
    img.src = URL.createObjectURL(file);
  });
}

const isDataUrlImage = (value) => typeof value === 'string' && value.startsWith('data:image/');
const isProbablyRawBase64 = (value) =>
  typeof value === 'string' && value.length > 120 && !value.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(value);
const toRenderableImageSrc = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  if (isProbablyRawBase64(trimmed)) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed}`;
};
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DragDropImage from '../components/ui/DragDropImage';
import Modal from '../components/ui/Modal';
import {
  deleteCategoryAdmin,
  deleteProductAdmin,
  getCategoriesAdmin,
  getOrders,
  getProductsAdmin,
  getUserAddressesAdmin,
  getUsersAdmin,
  saveCategoryAdmin,
  saveProductAdmin,
  updateOrderAdmin,
  updateUserRoleAdmin,
} from '../lib/firestoreDb';

const slugify = (value) => {
  if (!value) return '';
  return value
    .toLowerCase()
    // import { pool } from '../lib/db';
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

const emptyProduct = {
  id: '',
  name: '',
  slug: '',
  category_id: '',
  description: '',
  price: '',
  image_path: '',
  preview_image_url: '',
  full_image_path: '',
  dimensions: '',
  stock_quantity: 0,
  is_featured: false,
  is_active: true,
};

const emptyCategory = {
  id: '',
  name: '',
  slug: '',
  description: '',
  display_order: 0,
};

const toCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const Admin = () => {
    const [productImageFiles, setProductImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [users, setUsers] = useState([]);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState(emptyProduct);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  const tabs = [
    { id: 'orders', label: 'Orders' },
    { id: 'products', label: 'Products' },
    { id: 'users', label: 'Users' },
  ];

  const paidOrders = orders.filter((order) => String(order.payment_status || '').toLowerCase() === 'paid').length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const summaryCards = [
    { label: 'Total Orders', value: String(orders.length), hint: `${paidOrders} paid` },
    { label: 'Live Products', value: String(products.filter((item) => item.is_active).length), hint: `${products.length} total` },
    { label: 'Categories', value: String(categories.length), hint: 'Catalog structure' },
    { label: 'Revenue', value: toCurrency(totalRevenue), hint: 'Across all orders' },
  ];

  const loadOrders = async () => {
    const data = await getOrders();
    setOrders(Array.isArray(data) ? data : []);
  };

  const loadUsers = async () => {
    const data = await getUsersAdmin();
    setUsers(Array.isArray(data) ? data : []);
  };

  const loadProducts = async () => {
    const data = await getProductsAdmin();
    setProducts(Array.isArray(data) ? data : []);
  };

  const loadCategories = async () => {
    const data = await getCategoriesAdmin();
    setCategories(Array.isArray(data) ? data : []);
  };

  const refreshAll = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadOrders(), loadUsers(), loadProducts(), loadCategories()]);
    } catch (err) {
      setError(err.message || 'Failed to refresh admin data.');
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const openProductModal = (product) => {
    if (product) {
      setProductForm({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category_id: product.category_id ?? '',
        description: product.description ?? '',
        price: product.price ?? '',
        image_path: product.image_path ?? '',
        preview_image_url: product.preview_image_url ?? '',
        full_image_path: product.full_image_path ?? '',
        dimensions: product.dimensions ?? '',
        stock_quantity: product.stock_quantity ?? 0,
        is_featured: Boolean(product.is_featured),
        is_active: Boolean(product.is_active),
      });
    } else {
      setProductForm(emptyProduct);
    }
    setProductModalOpen(true);
    setProductImageFiles([]);
    setImagePreviews([]);
  };

  const saveProduct = async () => {
    setUploading(true);
    try {
      await saveProductAdmin(productForm);
      setProductModalOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setUploading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProductAdmin(productId);
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
    }
  };

  const openCategoryModal = (category) => {
    if (category) {
      setCategoryForm({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        display_order: category.display_order ?? 0,
      });
    } else {
      setCategoryForm(emptyCategory);
    }
    setCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    try {
      await saveCategoryAdmin(categoryForm);
      setCategoryModalOpen(false);
      await loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategoryAdmin(categoryId);
      await loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to delete category.');
    }
  };

  const loadUserAddresses = async (userId) => {
    try {
      const data = await getUserAddressesAdmin(userId);
      setUserAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load addresses.');
      setUserAddresses([]);
    }
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    await loadUserAddresses(user.id);
  };

  const updateUserRole = async (userId, nextRole) => {
    try {
      await updateUserRoleAdmin(userId, nextRole);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
    }
  };

  const updateOrder = async (orderId, payload) => {
    try {
      await updateOrderAdmin(orderId, payload);
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order.');
    }
  };

  const getCustomerName = (order) => {
    const shippingName = String(order?.shipping_address?.full_name || '').trim();
    if (shippingName) {
      return shippingName;
    }

    const matchedUser = users.find((row) => String(row.id || '').trim() === String(order?.user_id || '').trim());
    if (matchedUser?.full_name) {
      return matchedUser.full_name;
    }
    if (matchedUser?.email) {
      return matchedUser.email;
    }

    return 'Customer name unavailable';
  };

  return (
    <div className="min-h-screen pt-36 lg:pt-40 pb-16 font-space-grotesk bg-gradient-to-br from-[#eef7f6] via-[#f7fbfb] to-[#e9f0f6] dark:from-[#03050a] dark:via-[#02040a] dark:to-[#050910]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl px-6 py-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[11px] tracking-[0.24em] uppercase text-slate-500 dark:text-slate-300">Artio Control Center</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Manage orders, products, categories, and customer accounts.
              </p>
            </div>
            <Button variant="outline" className="rounded-full px-5" onClick={refreshAll}>
              Refresh Data
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] tracking-[0.16em] uppercase text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.hint}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50/95 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40">
            <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-colors border ${
                activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-amber-300 text-white dark:text-black border-slate-900 dark:border-amber-300 shadow-[0_8px_20px_rgba(15,23,42,0.2)]'
                  : 'bg-white/90 dark:bg-white/[0.03] border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Card className="p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
            <p className="text-slate-600 dark:text-slate-300">Loading data...</p>
          </Card>
        ) : (
          <>
            {activeTab === 'orders' && (
              <Card className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
                <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Orders</h2>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-300">No orders yet.</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)] dark:hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">Order {order.id}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Customer: {getCustomerName(order)}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Total: ${Number(order.total_amount).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              className="border border-slate-200 dark:border-white/15 bg-white dark:bg-black/50 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                              value={order.status}
                              onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                            >
                              <option value="pending">pending</option>
                              <option value="processing">processing</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                            <select
                              className="border border-slate-200 dark:border-white/15 bg-white dark:bg-black/50 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                              value={order.payment_status || 'unpaid'}
                              onChange={(e) => updateOrder(order.id, { payment_status: e.target.value })}
                            >
                              <option value="unpaid">unpaid</option>
                              <option value="paid">paid</option>
                              <option value="refunded">refunded</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <Card className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Products</h2>
                    <Button size="sm" className="rounded-full" onClick={() => openProductModal(null)}>
                      Add Product
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {products.length === 0 ? (
                      <p className="text-slate-600 dark:text-slate-300">No products yet.</p>
                    ) : (
                      products.map((product) => (
                        <div key={product.id} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)] dark:hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {product.categories?.name || 'Uncategorized'} · ${Number(product.price).toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {product.is_active ? 'Active' : 'Inactive'} · Stock {product.stock_quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => openProductModal(product)}>
                                Edit
                              </Button>
                              <button
                                type="button"
                                onClick={() => deleteProduct(product.id)}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Categories</h2>
                    <Button size="sm" className="rounded-full" onClick={() => openCategoryModal(null)}>
                      Add Category
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {categories.length === 0 ? (
                      <p className="text-slate-600 dark:text-slate-300">No categories yet.</p>
                    ) : (
                      categories.map((category) => (
                        <div key={category.id} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)] dark:hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{category.name}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Slug: {category.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => openCategoryModal(category)}>
                                Edit
                              </Button>
                              <button
                                type="button"
                                onClick={() => deleteCategory(category.id)}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'users' && (
              <Card className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
                <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Users</h2>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-300">No users yet.</p>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)] dark:hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{user.phone || 'No phone'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              className="border border-slate-200 dark:border-white/15 bg-white dark:bg-black/50 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                              value={user.role || 'user'}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={() => openUserModal(user)}>
                              View addresses
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={productForm.id ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={productForm.name}
            onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Slug"
            value={productForm.slug}
            onChange={(e) => setProductForm((prev) => ({ ...prev, slug: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={productForm.category_id}
              onChange={(e) => setProductForm((prev) => ({ ...prev, category_id: e.target.value }))}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Price"
            type="number"
            min="0"
            step="0.01"
            value={productForm.price}
            onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
          <Input
            label="Stock"
            type="number"
            min="0"
            value={productForm.stock_quantity}
            onChange={(e) => setProductForm((prev) => ({ ...prev, stock_quantity: e.target.value }))}
          />
          <Input
            label="Dimensions"
            value={productForm.dimensions}
            onChange={(e) => setProductForm((prev) => ({ ...prev, dimensions: e.target.value }))}
          />
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Image</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setUploading(true);
                setError('');
                try {
                  const dataUrl = await optimizeImageToDataUrl(file, {
                    maxWidth: 1600,
                    maxHeight: 1600,
                    quality: 0.78,
                  });
                  setProductImageFiles([file]);
                  setProductForm((prev) => ({ ...prev, image_path: dataUrl }));
                } catch (err) {
                  setError(err?.message || 'Failed to process image file.');
                } finally {
                  setUploading(false);
                }
              }}
            />
            {uploading && (
              <span className="text-xs text-primary mt-1">Uploading image...</span>
            )}
            {productForm.image_path && !uploading && (
              <div className="mt-2 flex items-center gap-2">
                {toRenderableImageSrc(productForm.image_path) ? (
                  <>
                    <img
                      src={toRenderableImageSrc(productForm.image_path)}
                      alt="Product preview"
                      className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 object-cover"
                    />
                    <span className="text-xs text-gray-500">Image ready to save</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">Image value attached</span>
                )}
              </div>
            )}
          </div>
          <Input
            label="Preview Image URL"
            value={productForm.preview_image_url}
            onChange={(e) => setProductForm((prev) => ({ ...prev, preview_image_url: e.target.value }))}
          />
          <Input
            label="Full Image Path"
            value={productForm.full_image_path}
            onChange={(e) => setProductForm((prev) => ({ ...prev, full_image_path: e.target.value }))}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={productForm.description}
            onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={productForm.is_active}
              onChange={(e) => setProductForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={productForm.is_featured}
              onChange={(e) => setProductForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
            />
            Featured
          </label>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={saveProduct}
            disabled={(!productForm.image_path && !productForm.id) || uploading}
          >
            {uploading ? 'Uploading...' : 'Save Product'}
          </Button>
          <Button variant="outline" onClick={() => setProductModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={categoryForm.id ? 'Edit Category' : 'Add Category'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Slug"
            value={categoryForm.slug}
            onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
          />
          <Input
            label="Display Order"
            type="number"
            min="0"
            value={categoryForm.display_order}
            onChange={(e) => setCategoryForm((prev) => ({ ...prev, display_order: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={saveCategory} disabled={!categoryForm.name.trim() || uploading}>
            {uploading ? 'Uploading...' : 'Save Category'}
          </Button>
          <Button variant="outline" onClick={() => setCategoryModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-50 to-white dark:from-white/[0.05] dark:to-white/[0.02] p-4">
              <p className="text-[11px] tracking-[0.16em] uppercase text-slate-500 dark:text-slate-400">Order Overview</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-black/40 px-3 py-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order ID</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white break-all">{selectedOrder.id}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-black/40 px-3 py-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Customer</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-all">{getCustomerName(selectedOrder)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-black/40 px-3 py-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order Status</p>
                  <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{selectedOrder.status || 'pending'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-black/40 px-3 py-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Payment</p>
                  <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{selectedOrder.payment_status || 'unpaid'}</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900 dark:bg-amber-300 px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs tracking-[0.14em] uppercase text-white/70 dark:text-black/70">Total Amount</span>
                <span className="text-lg font-semibold text-white dark:text-black">{toCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Shipping Address</h3>
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] p-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                <p><span className="font-medium text-slate-900 dark:text-white">Name:</span> {selectedOrder.shipping_address?.full_name || '-'}</p>
                <p><span className="font-medium text-slate-900 dark:text-white">Phone:</span> {selectedOrder.shipping_address?.phone || '-'}</p>
                <p><span className="font-medium text-slate-900 dark:text-white">Address 1:</span> {selectedOrder.shipping_address?.address_line1 || '-'}</p>
                {selectedOrder.shipping_address?.address_line2 ? (
                  <p><span className="font-medium text-slate-900 dark:text-white">Address 2:</span> {selectedOrder.shipping_address.address_line2}</p>
                ) : null}
                <p>
                  <span className="font-medium text-slate-900 dark:text-white">City / State:</span>{' '}
                  {selectedOrder.shipping_address?.city || '-'}{selectedOrder.shipping_address?.state ? `, ${selectedOrder.shipping_address.state}` : ''}
                </p>
                <p><span className="font-medium text-slate-900 dark:text-white">Postal:</span> {selectedOrder.shipping_address?.postal_code || '-'}</p>
                <p><span className="font-medium text-slate-900 dark:text-white">Country:</span> {selectedOrder.shipping_address?.country || '-'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Items</h3>
              <div className="space-y-2">
                {(selectedOrder.order_items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/75 dark:bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.products?.image_path ? (
                        <img
                          src={toRenderableImageSrc(item.products.image_path)}
                          alt={item.products?.name || 'Product'}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-white/10"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.products?.name || 'Product'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Qty {item.quantity} x {toCurrency(item.price_at_purchase)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {toCurrency(Number(item.quantity || 0) * Number(item.price_at_purchase || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="User Addresses"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold">{selectedUser.full_name || 'No name'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
            </div>
            <div className="space-y-3">
              {userAddresses.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No addresses saved.</p>
              ) : (
                userAddresses.map((address) => (
                  <div key={address.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <p className="font-semibold">{address.full_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{address.phone}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {address.address_line1} {address.address_line2}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{address.country}</p>
                    {address.is_default && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Default</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Admin;
