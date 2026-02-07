import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

type ServiceAccount = any;

const normalizePrivateKey = (sa: any) => {
  if (!sa) return sa;
  // Normalize private key: when JSON is parsed, \n in string becomes literal \n
  if (sa?.private_key && typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }
  if (sa?.privateKey && typeof sa.privateKey === 'string') {
    sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
  }
  return sa;
};

const loadServiceAccount = (opts: {
  jsonEnv?: string;
  pathEnv?: string;
  privateKeyEnv?: string;
  clientEmailEnv?: string;
  projectIdEnv?: string;
}): ServiceAccount | null => {
  try {
    if (opts.jsonEnv && process.env[opts.jsonEnv]) {
      const parsed = JSON.parse(process.env[opts.jsonEnv] as string);
      return normalizePrivateKey(parsed);
    }

    if (opts.pathEnv && process.env[opts.pathEnv]) {
      const p = process.env[opts.pathEnv] as string;
      const serviceAccountPath = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
      const content = fs.readFileSync(serviceAccountPath, 'utf8');
      const parsed = JSON.parse(content);
      console.log('[Firebase] Service account loaded from file:', serviceAccountPath);
      console.log('[Firebase] Has private_key:', !!parsed?.private_key);
      console.log('[Firebase] Has privateKey:', !!parsed?.privateKey);
      return normalizePrivateKey(parsed);
    }

    const privateKey = (opts.privateKeyEnv ? process.env[opts.privateKeyEnv] : undefined)?.replace(/\\n/g, '\n');
    const clientEmail = opts.clientEmailEnv ? process.env[opts.clientEmailEnv] : undefined;
    const projectId = opts.projectIdEnv ? process.env[opts.projectIdEnv] : undefined;

    if (privateKey && clientEmail && projectId) {
      return {
        projectId,
        clientEmail,
        privateKey,
      };
    }

    return null;
  } catch (e: any) {
    console.error('[Firebase] Error loading service account:', e?.message || e);
    return null;
  }
};

// Initialize Firebase Admin (User DB project)
let serviceAccount: ServiceAccount | null = null;
let firebaseInitialized = false;
let financeServiceAccount: ServiceAccount | null = null;
let financeInitialized = false;

try {
  serviceAccount = loadServiceAccount({
    jsonEnv: 'FIREBASE_SERVICE_ACCOUNT',
    pathEnv: 'FIREBASE_SERVICE_ACCOUNT_PATH',
    privateKeyEnv: 'FIREBASE_PRIVATE_KEY',
    clientEmailEnv: 'FIREBASE_CLIENT_EMAIL',
    projectIdEnv: 'FIREBASE_PROJECT_ID',
  });

  // Finance DB project (separate Firestore project)
  financeServiceAccount = loadServiceAccount({
    jsonEnv: 'FIREBASE_FINANCE_SERVICE_ACCOUNT',
    pathEnv: 'FIREBASE_FINANCE_SERVICE_ACCOUNT_PATH',
    privateKeyEnv: 'FIREBASE_FINANCE_PRIVATE_KEY',
    clientEmailEnv: 'FIREBASE_FINANCE_CLIENT_EMAIL',
    projectIdEnv: 'FIREBASE_FINANCE_PROJECT_ID',
  });

  const hasUserCredentials = !!(serviceAccount && (serviceAccount.privateKey || serviceAccount.private_key));
  const hasFinanceCredentials = !!(financeServiceAccount && (financeServiceAccount.privateKey || financeServiceAccount.private_key));

  if (hasUserCredentials) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || serviceAccount.storageBucket,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    firebaseInitialized = true;
    console.log('✅ Firebase (user) initialized successfully');
  } else {
    console.warn('⚠️ Firebase USER credentials not found. Server will run without Firebase features.');
  }

  if (hasFinanceCredentials) {
    // Use a named app for finance project
    const existing = admin.apps.find((app) => !!app && app.name === 'finance');
    if (!existing) {
      admin.initializeApp(
        {
          credential: admin.credential.cert(financeServiceAccount),
        },
        'finance'
      );
    }
    financeInitialized = true;
    console.log('✅ Firebase (finance) initialized successfully');
  } else {
    console.warn('⚠️ Firebase FINANCE credentials not found. Financial features will use USER db fallback (not recommended).');
  }
} catch (error: any) {
  console.warn('⚠️ Firebase initialization failed. Server will run without Firebase features:', error?.message || error);
}

// Export Firebase services
// Note: These may be null if Firebase is not configured, but we use type assertions
// to satisfy TypeScript. Runtime errors will occur if Firebase features are used without configuration.
export const db = (firebaseInitialized ? admin.firestore() : null) as any;
export const auth = (firebaseInitialized ? admin.auth() : null) as any;
export const storage = (firebaseInitialized ? admin.storage() : null) as any;
export const financeDb = (financeInitialized ? admin.app('finance').firestore() : null) as any;

export default (firebaseInitialized ? admin : null) as any;

