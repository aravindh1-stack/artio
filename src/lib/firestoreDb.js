import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestoreDb, isFirebaseConfigured } from './firebase';

const nowIso = () => new Date().toISOString();

const requireDb = () => {
  if (!isFirebaseConfigured || !firestoreDb) {
    throw new Error('Firebase is not configured.');
  }
  return firestoreDb;
};

const isProbablyRawBase64 = (value) =>
  typeof value === 'string' && value.length > 120 && !value.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(value);

const normalizeImageValue = (value) => {
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

  return trimmed;
};

const normalizeCategoryToken = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^cat[-_]/, '');

const createArtioOrderId = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const stamp = `${y}${m}${d}`;
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `ARTIO-${stamp}-${token}`;
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const bytesToHex = (bytes) => Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');

const normalizeLegacyUserId = async (userId) => {
  const rawValue = String(userId ?? '').trim().toLowerCase();
  if (!rawValue) {
    return '';
  }

  if (uuidRegex.test(rawValue)) {
    return rawValue;
  }

  // Keep compatibility with earlier server-side ID normalization used in /api routes.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawValue));
  const hash = bytesToHex(new Uint8Array(digest));
  const version = `4${hash.slice(13, 16)}`;
  const variantNibble = ['8', '9', 'a', 'b'][parseInt(hash[16], 16) % 4];
  const variant = `${variantNibble}${hash.slice(17, 20)}`;
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${version}-${variant}-${hash.slice(20, 32)}`;
};

export const getPublicCategories = async () => {
  const db = requireDb();
  const snap = await getDocs(collection(db, 'categories'));

  return snap.docs
    .map((row) => ({ id: row.id, ...(row.data() || {}) }))
    .sort((a, b) => {
      if ((a.display_order || 0) !== (b.display_order || 0)) {
        return Number(a.display_order || 0) - Number(b.display_order || 0);
      }
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    })
    .map((row) => ({
      id: row.id,
      name: row.name || '',
      slug: row.slug || '',
      description: row.description || '',
      image_path: normalizeImageValue(row.image_url || row.image_path || ''),
      display_order: Number(row.display_order || 0),
    }));
};

export const getPublicProducts = async ({ categoryId, featured } = {}) => {
  const db = requireDb();
  const [productsSnap, categoriesSnap] = await Promise.all([
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'categories')),
  ]);

  const categoryById = new Map();
  const categorySlugById = new Map();
  categoriesSnap.docs.forEach((cat) => {
    const data = cat.data() || {};
    categoryById.set(cat.id, data.name || '');
    categorySlugById.set(cat.id, String(data.slug || '').trim().toLowerCase());
  });

  let rows = productsSnap.docs
    .map((row) => ({ id: row.id, ...(row.data() || {}) }))
    .filter((row) => row.is_active !== false);

  if (categoryId) {
    const selectedId = String(categoryId).trim();
    const selectedSlug = String(categorySlugById.get(selectedId) || '').trim().toLowerCase();
    const selectedName = String(categoryById.get(selectedId) || '').trim().toLowerCase();
    const selectedTokens = new Set(
      [selectedId, selectedSlug, selectedName]
        .map((item) => normalizeCategoryToken(item))
        .filter(Boolean)
    );

    rows = rows.filter((row) => {
      const rowCategoryId = String(row.category_id || '').trim();
      const rowCategorySlug = String(row.category_slug || '').trim().toLowerCase();
      const rowCategoryName = String(row.category_name || '').trim().toLowerCase();
      const rowCategoryTitle = String(row.category || '').trim().toLowerCase();

      const rowTokens = [rowCategoryId, rowCategorySlug, rowCategoryName, rowCategoryTitle]
        .map((item) => normalizeCategoryToken(item))
        .filter(Boolean);

      return rowTokens.some((token) => selectedTokens.has(token));
    });
  }

  if (featured) {
    rows = rows.filter((row) => Boolean(row.is_featured));
  }

  return rows
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map((row) => ({
      id: row.id,
      category_id: row.category_id || null,
      name: row.name || '',
      slug: row.slug || '',
      description: row.description || '',
      price: Number(row.price || 0),
      image_path: normalizeImageValue(row.image_url || row.image_path || ''),
      preview_image_url: row.preview_image_url || '',
      full_image_path: row.full_image_path || '',
      dimensions: row.dimensions || '',
      stock_quantity: Number(row.stock_quantity || 0),
      is_featured: Boolean(row.is_featured),
      is_active: row.is_active !== false,
      categories: categoryById.get(row.category_id) ? { name: categoryById.get(row.category_id) } : null,
    }));
};

export const getHeroProducts = async ({ max = 8 } = {}) => {
  const db = requireDb();
  const maxCount = Math.max(1, Number(max || 8));

  const featuredQuery = query(
    collection(db, 'products'),
    where('is_active', '==', true),
    where('is_featured', '==', true),
    limit(maxCount)
  );

  const featuredSnap = await getDocs(featuredQuery);
  let rows = featuredSnap.docs.map((row) => ({ id: row.id, ...(row.data() || {}) }));

  if (rows.length === 0) {
    const fallbackQuery = query(collection(db, 'products'), where('is_active', '==', true), limit(maxCount));
    const fallbackSnap = await getDocs(fallbackQuery);
    rows = fallbackSnap.docs.map((row) => ({ id: row.id, ...(row.data() || {}) }));
  }

  return rows
    .slice(0, maxCount)
    .map((row) => ({
      id: row.id,
      category_id: row.category_id || null,
      name: row.name || '',
      slug: row.slug || '',
      description: row.description || '',
      price: Number(row.price || 0),
      image_path: normalizeImageValue(row.image_url || row.image_path || ''),
      preview_image_url: row.preview_image_url || '',
      full_image_path: row.full_image_path || '',
      dimensions: row.dimensions || '',
      stock_quantity: Number(row.stock_quantity || 0),
      is_featured: Boolean(row.is_featured),
      is_active: row.is_active !== false,
    }));
};

export const getProfileByUser = async ({ userId, email }) => {
  const db = requireDb();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (userId) {
    const profileRef = doc(db, 'profiles', String(userId));
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() || {}) };
    }
  }

  if (!normalizedEmail) {
    return null;
  }

  const emailQuery = query(collection(db, 'profiles'), where('email', '==', normalizedEmail));
  const emailSnap = await getDocs(emailQuery);
  if (emailSnap.empty) {
    return null;
  }

  const top = emailSnap.docs
    .map((row) => ({ id: row.id, ...(row.data() || {}) }))
    .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))[0];

  return top || null;
};

export const upsertProfile = async ({ userId, email, fullName = '', phone = '' }) => {
  const db = requireDb();
  const id = String(userId || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!id || !normalizedEmail) {
    throw new Error('userId and email are required');
  }

  const ref = doc(db, 'profiles', id);
  const existing = await getDoc(ref);
  const now = nowIso();

  const payload = {
    id,
    email: normalizedEmail,
    full_name: fullName,
    phone,
    updated_at: now,
    role: existing.exists() ? existing.data().role || 'user' : 'user',
    created_at: existing.exists() ? existing.data().created_at || now : now,
  };

  await setDoc(ref, payload, { merge: true });
  return payload;
};

export const getAddressesByUser = async (userId) => {
  const db = requireDb();
  const canonicalUserId = String(userId || '').trim();
  if (!canonicalUserId) {
    return [];
  }

  const legacyUserId = await normalizeLegacyUserId(canonicalUserId);

  const [primarySnap, legacySnap] = await Promise.all([
    getDocs(query(collection(db, 'addresses'), where('user_id', '==', canonicalUserId))),
    legacyUserId && legacyUserId !== canonicalUserId
      ? getDocs(query(collection(db, 'addresses'), where('user_id', '==', legacyUserId)))
      : Promise.resolve({ docs: [] }),
  ]);

  const mergedRows = [...primarySnap.docs, ...legacySnap.docs];
  const uniqueRows = [...new Map(mergedRows.map((row) => [row.id, row])).values()];

  return uniqueRows
    .map((row) => ({ id: row.id, ...(row.data() || {}) }))
    .sort((a, b) => {
      if (Boolean(a.is_default) !== Boolean(b.is_default)) {
        return Boolean(b.is_default) ? 1 : -1;
      }
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    });
};

export const saveUserAddress = async ({
  userId,
  addressId,
  fullName,
  phone,
  line1,
  line2,
  city,
  state,
  postalCode,
  country,
  isDefault,
}) => {
  const db = requireDb();
  const now = nowIso();
  const basePayload = {
    user_id: String(userId),
    full_name: fullName,
    phone,
    address_line1: line1,
    address_line2: line2,
    city,
    state,
    postal_code: postalCode,
    country,
    is_default: Boolean(isDefault),
    updated_at: now,
  };

  let finalId = addressId;

  if (addressId) {
    const ref = doc(db, 'addresses', String(addressId));
    const existing = await getDoc(ref);
    await setDoc(
      ref,
      {
        ...basePayload,
        created_at: existing.exists() ? existing.data().created_at || now : now,
      },
      { merge: true }
    );
    finalId = ref.id;
  } else {
    const ref = await addDoc(collection(db, 'addresses'), {
      ...basePayload,
      created_at: now,
    });
    finalId = ref.id;
  }

  if (isDefault) {
    await setDefaultAddress(userId, finalId);
  }

  const snap = await getDoc(doc(db, 'addresses', finalId));
  return { id: finalId, ...(snap.data() || {}) };
};

export const setDefaultAddress = async (userId, addressId) => {
  const db = requireDb();
  const all = await getAddressesByUser(userId);
  const batch = writeBatch(db);

  all.forEach((row) => {
    const ref = doc(db, 'addresses', row.id);
    batch.update(ref, { is_default: row.id === addressId, updated_at: nowIso() });
  });

  await batch.commit();
};

export const deleteUserAddress = async (userId, addressId) => {
  const db = requireDb();
  const ref = doc(db, 'addresses', String(addressId));
  await deleteDoc(ref);

  const remaining = await getAddressesByUser(userId);
  if (remaining.length > 0 && !remaining.some((x) => x.is_default)) {
    await setDefaultAddress(userId, remaining[0].id);
  }
};

export const createOrder = async ({ userId, items, shippingAddress, totalAmount }) => {
  const db = requireDb();

  const ordersCol = collection(db, 'orders');
  const orderId = createArtioOrderId();
  const orderDocRef = doc(ordersCol, orderId);

  await runTransaction(db, async (tx) => {
    const orderItems = [];

    for (const item of items) {
      const productRef = doc(db, 'products', String(item.id));
      const productSnap = await tx.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Product not found: ${item.id}`);
      }

      const product = productSnap.data() || {};
      const nextStock = Math.max(Number(product.stock_quantity || 0) - Number(item.quantity || 0), 0);
      tx.update(productRef, { stock_quantity: nextStock, updated_at: nowIso() });

      orderItems.push({
        id: crypto.randomUUID(),
        product_id: String(item.id),
        quantity: Number(item.quantity || 0),
        price_at_purchase: Number(item.price || 0),
        product_name: item.name || '',
        product_image_url: item.image_path || item.image_url || '',
      });
    }

    const now = nowIso();
    tx.set(orderDocRef, {
      id: orderId,
      user_id: String(userId),
      status: 'pending',
      payment_status: 'unpaid',
      total_amount: Number(totalAmount || 0),
      shipping_address: shippingAddress,
      order_items: orderItems,
      created_at: now,
      updated_at: now,
    });
  });

  const snap = await getDoc(orderDocRef);
  return { id: orderId, ...(snap.data() || {}) };
};

export const getOrders = async ({ userId } = {}) => {
  const db = requireDb();
  const canonicalUserId = String(userId || '').trim();
  const legacyUserId = canonicalUserId ? await normalizeLegacyUserId(canonicalUserId) : '';

  const userOrderPromises = canonicalUserId
    ? [
        getDocs(query(collection(db, 'orders'), where('user_id', '==', canonicalUserId))),
        legacyUserId && legacyUserId !== canonicalUserId
          ? getDocs(query(collection(db, 'orders'), where('user_id', '==', legacyUserId)))
          : Promise.resolve({ docs: [] }),
      ]
    : [getDocs(collection(db, 'orders')), Promise.resolve({ docs: [] })];

  const [ordersSnap, productsSnap] = await Promise.all([
    Promise.all(userOrderPromises),
    getDocs(collection(db, 'products')),
  ]);

  const [primaryOrdersSnap, legacyOrdersSnap] = ordersSnap;
  const mergedOrderDocs = [...primaryOrdersSnap.docs, ...legacyOrdersSnap.docs];
  const uniqueOrderDocs = [...new Map(mergedOrderDocs.map((row) => [row.id, row])).values()];

  const productById = new Map(
    productsSnap.docs.map((row) => {
      const data = row.data() || {};
      return [row.id, { id: row.id, name: data.name || '', image_path: data.image_url || data.image_path || '' }];
    })
  );

  return uniqueOrderDocs
    .map((row) => ({ id: row.id, ...(row.data() || {}) }))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map((order) => ({
      id: order.id,
      user_id: order.user_id,
      status: order.status || 'pending',
      payment_status: order.payment_status || 'unpaid',
      total_amount: Number(order.total_amount || 0),
      shipping_address: order.shipping_address || null,
      created_at: order.created_at || null,
      order_items: Array.isArray(order.order_items)
        ? order.order_items.map((item, index) => ({
            id: item.id || `${order.id}-${index + 1}`,
            order_id: order.id,
            product_id: item.product_id,
            quantity: Number(item.quantity || 0),
            price_at_purchase: Number(item.price_at_purchase || 0),
            products: {
              id: item.product_id,
              name: productById.get(item.product_id)?.name || item.product_name || '',
              image_path: productById.get(item.product_id)?.image_path || item.product_image_url || '',
            },
          }))
        : [],
    }));
};

export const updateOrderAdmin = async (orderId, payload) => {
  const db = requireDb();
  const ref = doc(db, 'orders', String(orderId));
  await updateDoc(ref, { ...payload, updated_at: nowIso() });
};

export const getUsersAdmin = async () => {
  const db = requireDb();
  const snap = await getDocs(collection(db, 'profiles'));
  return snap.docs
    .map((row) => ({ id: row.id, ...(row.data() || {}) }))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map((row) => ({
      id: row.id,
      email: row.email || '',
      full_name: row.full_name || '',
      phone: row.phone || '',
      role: row.role || 'user',
      created_at: row.created_at || null,
    }));
};

export const updateUserRoleAdmin = async (userId, role) => {
  const db = requireDb();
  const ref = doc(db, 'profiles', String(userId));
  await updateDoc(ref, { role, updated_at: nowIso() });
};

export const getUserAddressesAdmin = async (userId) => getAddressesByUser(userId);

export const getProductsAdmin = async () => getPublicProducts();

export const saveProductAdmin = async (payload) => {
  const db = requireDb();
  const id = String(payload.id || '').trim();
  const now = nowIso();
  const record = {
    category_id: payload.category_id || null,
    name: payload.name || '',
    slug: payload.slug || '',
    description: payload.description || '',
    price: Number(payload.price || 0),
    image_url: normalizeImageValue(payload.image_path || payload.image_url || ''),
    preview_image_url: payload.preview_image_url || '',
    full_image_path: payload.full_image_path || '',
    dimensions: payload.dimensions || '',
    stock_quantity: Number(payload.stock_quantity || 0),
    is_featured: Boolean(payload.is_featured),
    is_active: payload.is_active !== false,
    updated_at: now,
  };

  if (id) {
    const ref = doc(requireDb(), 'products', id);
    const existing = await getDoc(ref);
    await setDoc(ref, { ...record, created_at: existing.exists() ? existing.data().created_at || now : now }, { merge: true });
    return id;
  }

  const ref = await addDoc(collection(db, 'products'), {
    ...record,
    created_at: now,
  });
  return ref.id;
};

export const deleteProductAdmin = async (productId) => {
  const db = requireDb();
  await deleteDoc(doc(db, 'products', String(productId)));
};

export const getCategoriesAdmin = async () => getPublicCategories();

export const saveCategoryAdmin = async (payload) => {
  const db = requireDb();
  const id = String(payload.id || '').trim();
  const now = nowIso();
  const record = {
    name: payload.name || '',
    slug: payload.slug || '',
    description: payload.description || '',
    image_url: normalizeImageValue(payload.image_path || payload.image_url || ''),
    display_order: Number(payload.display_order || 0),
    updated_at: now,
  };

  if (id) {
    const ref = doc(db, 'categories', id);
    const existing = await getDoc(ref);
    await setDoc(ref, { ...record, created_at: existing.exists() ? existing.data().created_at || now : now }, { merge: true });
    return id;
  }

  const ref = await addDoc(collection(db, 'categories'), {
    ...record,
    created_at: now,
  });
  return ref.id;
};

export const deleteCategoryAdmin = async (categoryId) => {
  const db = requireDb();
  await deleteDoc(doc(db, 'categories', String(categoryId)));
};
