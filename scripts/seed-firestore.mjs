import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'crypto';

const normalizeUserId = (userId) => {
  const rawValue = String(userId ?? '').trim().toLowerCase();
  if (!rawValue) {
    return '';
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(rawValue)) {
    return rawValue;
  }

  const hash = createHash('sha256').update(rawValue).digest('hex');
  const version = `4${hash.slice(13, 16)}`;
  const variantNibble = ['8', '9', 'a', 'b'][parseInt(hash[16], 16) % 4];
  const variant = `${variantNibble}${hash.slice(17, 20)}`;
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${version}-${variant}-${hash.slice(20, 32)}`;
};

const getFirebaseCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
  };
};

const sampleCategories = [
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

const sampleProducts = [
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

const nowIso = () => new Date().toISOString();

const bootstrap = async () => {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(getFirebaseCredential()),
    });
  }

  const db = getFirestore();
  const now = nowIso();

  for (const category of sampleCategories) {
    await db.collection('categories').doc(category.id).set(
      {
        ...category,
        updated_at: now,
        created_at: now,
      },
      { merge: true }
    );
  }

  for (const product of sampleProducts) {
    await db.collection('products').doc(product.id).set(
      {
        ...product,
        updated_at: now,
        created_at: now,
      },
      { merge: true }
    );
  }

  const adminEmailRaw = process.argv[2] || process.env.SEED_ADMIN_EMAIL;
  const adminEmail = String(adminEmailRaw || '').trim().toLowerCase();

  if (adminEmail) {
    const profileId = normalizeUserId(adminEmail);
    await db.collection('profiles').doc(profileId).set(
      {
        id: profileId,
        email: adminEmail,
        full_name: '',
        phone: '',
        role: 'admin',
        updated_at: now,
        created_at: now,
      },
      { merge: true }
    );
    console.log(`Admin profile ensured for ${adminEmail}`);
  }

  console.log('Firestore seed complete: categories, products, and optional admin profile.');
};

bootstrap().catch((error) => {
  console.error('Firestore seed failed:', error.message || error);
  process.exit(1);
});
