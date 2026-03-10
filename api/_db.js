import { createHash } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

let db;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getFirebaseCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY');
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
  };
}

export function getPool() {
  if (!db) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(getFirebaseCredential()),
      });
    }
    db = getFirestore();
  }

  return db;
}

export function normalizeUserId(userId) {
  const rawValue = String(userId ?? '').trim().toLowerCase();
  if (!rawValue) {
    return '';
  }

  if (uuidRegex.test(rawValue)) {
    return rawValue;
  }

  const hash = createHash('sha256').update(rawValue).digest('hex');
  const version = `4${hash.slice(13, 16)}`;
  const variantNibble = ['8', '9', 'a', 'b'][parseInt(hash[16], 16) % 4];
  const variant = `${variantNibble}${hash.slice(17, 20)}`;
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${version}-${variant}-${hash.slice(20, 32)}`;
}

export async function ensureAddressesTable() {
  return;
}

export async function ensureAdminSchema() {
  return;
}

export async function ensureProfileSchema() {
  return;
}

export function nowIso() {
  return new Date().toISOString();
}

export function toIso(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return null;
}
