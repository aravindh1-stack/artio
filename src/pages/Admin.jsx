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

const isDataUrlImage = (value) => typeof value === 'string' && value.startsWith('data:image/');
import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DragDropImage from '../components/ui/DragDropImage';
import Modal from '../components/ui/Modal';

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
  image_path: '',
  display_order: 0,
};

const Admin = () => {
    const [productImageFiles, setProductImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

              // TODO: Replace with Neon upload logic
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

  const loadOrders = async () => {
    const response = await fetch('/api/admin/orders');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to load orders');
    }
    setOrders(Array.isArray(data) ? data : []);
  };

  const loadUsers = async () => {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to load users');
    }
    setUsers(Array.isArray(data) ? data : []);
  };

  const loadProducts = async () => {
    const response = await fetch('/api/admin/products');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to load products');
    }
    setProducts(Array.isArray(data) ? data : []);
  };

  const loadCategories = async () => {
    const response = await fetch('/api/admin/categories');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to load categories');
    }
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
      const response = await fetch('/api/admin/products', {
        method: productForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product.');
      }
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
      const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product.');
      }
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
        image_path: category.image_path ?? '',
        display_order: category.display_order ?? 0,
      });
    } else {
      setCategoryForm(emptyCategory);
    }
    setCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: categoryForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category.');
      }
      setCategoryModalOpen(false);
      await loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const response = await fetch(`/api/admin/categories?id=${encodeURIComponent(categoryId)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category.');
      }
      await loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to delete category.');
    }
  };

  const loadUserAddresses = async (userId) => {
    try {
      const response = await fetch(`/api/admin/user-addresses?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load addresses.');
      }
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
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role.');
      }
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
    }
  };

  const updateOrder = async (orderId, payload) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order.');
      }
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order.');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage orders, products, and users.
            </p>
          </div>
          <Button variant="outline" onClick={refreshAll}>
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Card className="p-8">
            <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
          </Card>
        ) : (
          <>
            {activeTab === 'orders' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Orders</h2>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">Order {order.id}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              User: {order.user_id}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total: ${Number(order.total_amount).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
                              value={order.status}
                              onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                            >
                              <option value="pending">pending</option>
                              <option value="processing">processing</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                            <select
                              className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
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
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Products</h2>
                    <Button size="sm" onClick={() => openProductModal(null)}>
                      Add Product
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {products.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">No products yet.</p>
                    ) : (
                      products.map((product) => (
                        <div key={product.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {product.categories?.name || 'Uncategorized'} · ${Number(product.price).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
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

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Categories</h2>
                    <Button size="sm" onClick={() => openCategoryModal(null)}>
                      Add Category
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {categories.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">No categories yet.</p>
                    ) : (
                      categories.map((category) => (
                        <div key={category.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold">{category.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Slug: {category.slug}</p>
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
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Users</h2>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No users yet.</p>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.phone || 'No phone'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
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
                try {
                  const dataUrl = await fileToDataUrl(file);
                  setProductImageFiles([file]);
                  setProductForm((prev) => ({ ...prev, image_path: dataUrl }));
                } catch {
                  alert('Failed to process image file.');
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
                {isDataUrlImage(productForm.image_path) ? (
                  <>
                    <img
                      src={productForm.image_path}
                      alt="Product preview"
                      className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 object-cover"
                    />
                    <span className="text-xs text-gray-500">Image embedded and ready to save</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 break-all">{productForm.image_path}</span>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Image</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setUploading(true);
                try {
                  const dataUrl = await fileToDataUrl(file);
                  setCategoryForm((prev) => ({ ...prev, image_path: dataUrl }));
                } catch {
                  alert('Failed to process image file.');
                } finally {
                  setUploading(false);
                }
              }}
            />
            {categoryForm.image_path && (
              <div className="mt-2 flex items-center gap-2">
                {isDataUrlImage(categoryForm.image_path) ? (
                  <>
                    <img
                      src={categoryForm.image_path}
                      alt="Category preview"
                      className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 object-cover"
                    />
                    <span className="text-xs text-gray-500">Image embedded and ready to save</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 break-all">{categoryForm.image_path}</span>
                )}
              </div>
            )}
          </div>
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
          <Button onClick={saveCategory} disabled={!categoryForm.image_path || uploading}>
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
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
              <p className="font-semibold break-all">{selectedOrder.id}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">User: {selectedOrder.user_id}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total: ${Number(selectedOrder.total_amount).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status: {selectedOrder.status}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Payment: {selectedOrder.payment_status || 'unpaid'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {JSON.stringify(selectedOrder.shipping_address, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-2">
                {(selectedOrder.order_items || []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {item.products?.image_path && (
                      <img
                        src={`/gallery/${item.products.image_path}`}
                        alt={item.products?.name || 'Product'}
                        className="w-12 h-12 object-cover rounded border"
                        style={{ aspectRatio: '1/1' }}
                      />
                    )}
                    <span>{item.products?.name || 'Product'} · {item.quantity} × ${item.price_at_purchase}</span>
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
