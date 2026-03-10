import 'dotenv/config';
import { initializeApp, getApps } from 'firebase/app';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
for (const key of required) {
  if (!firebaseConfig[key]) {
    throw new Error(`Missing Firebase config: ${key}. Fill VITE_FIREBASE_* in .env`);
  }
}

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();
const now = new Date().toISOString();
const adminEmail = String(process.argv[2] || process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();

const categories = [
  {
    id: 'cat-featured',
    name: 'Featured',
    slug: 'featured',
    description: 'Handpicked premium works.',
    image_url:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    display_order: 1,
  },
  {
    id: 'cat-abstract',
    name: 'Abstract',
    slug: 'abstract',
    description: 'Expressive abstract compositions.',
    image_url:
      'https://images.unsplash.com/photo-1577083552431-6e5fd01988f1?auto=format&fit=crop&w=1200&q=80',
    display_order: 2,
  },
  {
    id: 'cat-minimal',
    name: 'Minimal',
    slug: 'minimal',
    description: 'Clean forms and quiet tones.',
    image_url:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    display_order: 3,
  },
];

const products = [
  {
    id: 'prd-1',
    category_id: 'cat-featured',
    name: 'Midnight Geometry',
    slug: 'midnight-geometry',
    description: 'A bold geometric composition designed for statement interiors.',
    price: 149,
    image_url:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    dimensions: '24 x 36 in',
    stock_quantity: 14,
    is_featured: true,
    is_active: true,
  },
  {
    id: 'prd-2',
    category_id: 'cat-abstract',
    name: 'Amber Motion',
    slug: 'amber-motion',
    description: 'Warm abstract gradients that bring depth and rhythm to modern spaces.',
    price: 179,
    image_url:
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
    dimensions: '30 x 40 in',
    stock_quantity: 9,
    is_featured: true,
    is_active: true,
  },
  {
    id: 'prd-3',
    category_id: 'cat-minimal',
    name: 'Quiet Horizon',
    slug: 'quiet-horizon',
    description: 'Minimal tonal artwork curated for calm and elevated environments.',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
    dimensions: '20 x 30 in',
    stock_quantity: 18,
    is_featured: false,
    is_active: true,
  },
];

const ensureDoc = async (path, payload) => {
  await setDoc(doc(db, path), payload, { merge: true });
};

const run = async () => {
  for (const category of categories) {
    await ensureDoc(`categories/${category.id}`, {
      ...category,
      created_at: now,
      updated_at: now,
    });
  }

  for (const product of products) {
    await ensureDoc(`products/${product.id}`, {
      ...product,
      created_at: now,
      updated_at: now,
    });
  }

  if (adminEmail) {
    await ensureDoc(`profiles/bootstrap-${adminEmail.replace(/[^a-z0-9]/g, '-')}`, {
      email: adminEmail,
      full_name: 'Admin User',
      phone: '',
      role: 'admin',
      created_at: now,
      updated_at: now,
    });
  }

  await ensureDoc('__meta/migrations', {
    firestore_client_migrated_at: now,
    seeded_categories: categories.length,
    seeded_products: products.length,
  });

  console.log('Migration complete: categories, products, and migration metadata created.');
  if (adminEmail) {
    console.log(`Admin profile ensured for: ${adminEmail}`);
  }
};

run().catch((error) => {
  console.error('Migration failed:', error.message || error);
  process.exit(1);
});
