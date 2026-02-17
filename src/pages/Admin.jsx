import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FileDropInput from '../components/ui/FileDropInput';
import Modal from '../components/ui/Modal';

const slugify = (value) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

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
    const [productImageFile, setProductImageFile] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);

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
    const { data, error } = await supabase
      .from('orders')
      .select('id, user_id, status, payment_status, total_amount, created_at, shipping_address, order_items(id, quantity, price_at_purchase, products(name))')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setOrders(data || []);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setUsers(data || []);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, price, image_path, preview_image_url, full_image_path, category_id, is_active, is_featured, stock_quantity, dimensions, description, categories(name)')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setProducts(data || []);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_path, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setCategories(data || []);
  };

  const refreshAll = async () => {
    setLoading(true);
    setError('');
    await Promise.all([loadOrders(), loadUsers(), loadProducts(), loadCategories()]);
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
  };

  const saveProduct = async () => {
    let imagePath = productForm.image_path;
    if (productImageFile) {
      const fileExt = productImageFile.name.split('.').pop();
      const fileName = `${slugify(productForm.name)}-${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage.from('products').upload(fileName, productImageFile, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      imagePath = data.path;
    }
    const payload = {
      name: productForm.name,
      slug: productForm.slug || slugify(productForm.name),
      category_id: productForm.category_id || null,
      description: productForm.description,
      price: Number(productForm.price),
      image_path: imagePath,
      preview_image_url: productForm.preview_image_url,
      full_image_path: productForm.full_image_path,
      dimensions: productForm.dimensions,
      stock_quantity: Number(productForm.stock_quantity),
      is_featured: productForm.is_featured,
      is_active: productForm.is_active,
    };

    const { error } = productForm.id
      ? await supabase.from('products').update(payload).eq('id', productForm.id)
      : await supabase.from('products').insert(payload);

    if (error) {
      setError(error.message);
      return;
    }

    setProductModalOpen(false);
    await loadProducts();
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadProducts();
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
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug || slugify(categoryForm.name),
      description: categoryForm.description,
      image_path: categoryForm.image_path,
      display_order: Number(categoryForm.display_order),
    };

    const { error } = categoryForm.id
      ? await supabase.from('categories').update(payload).eq('id', categoryForm.id)
      : await supabase.from('categories').insert(payload);

    if (error) {
      setError(error.message);
      return;
    }

    setCategoryModalOpen(false);
    await loadCategories();
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadCategories();
  };

  const loadUserAddresses = async (userId) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setUserAddresses(data || []);
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    await loadUserAddresses(user.id);
  };

  const updateUserRole = async (userId, nextRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', userId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadUsers();
  };

  const updateOrder = async (orderId, payload) => {
    const { error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', orderId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadOrders();
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
          <FileDropInput
            label="Product Image"
            accept="image/*"
            value={productImageFile || productForm.image_path}
            onFileChange={setProductImageFile}
          />
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
          <Button onClick={saveProduct}>
            Save Product
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
            label="Image URL"
            value={categoryForm.image_url}
            onChange={(e) => setCategoryForm((prev) => ({ ...prev, image_url: e.target.value }))}
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
          <Button onClick={saveCategory}>Save Category</Button>
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
                  <div key={item.id} className="text-sm text-gray-600 dark:text-gray-400">
                    {item.products?.name || 'Product'} · {item.quantity} × ${item.price_at_purchase}
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
};

export default Admin;
