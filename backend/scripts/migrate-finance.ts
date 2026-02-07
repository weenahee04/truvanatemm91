/**
 * Migrate financial collections from USER Firestore -> FINANCE Firestore.
 *
 * Usage (run from backend/):
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json \
 *   FIREBASE_FINANCE_SERVICE_ACCOUNT_PATH=./financeServiceAccountKey.json \
 *   npx ts-node scripts/migrate-finance.ts
 */

import { db as userDb, financeDb } from '../src/config/firebase';

type CollectionSpec = { name: string; docIds?: string[] };

const COLLECTIONS: CollectionSpec[] = [
  // Financial / transactional
  { name: 'orders' },
  { name: 'payments' },
  { name: 'lottoOrders' },
  { name: 'lottoTickets' },

  // Financial configs
  { name: 'payment_settings', docIds: ['payment_settings'] },
  { name: 'settings', docIds: ['lotto-pricing'] },
];

async function copyCollection(spec: CollectionSpec) {
  if (!userDb || !financeDb) {
    throw new Error('Missing db initialization. Check FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_FINANCE_SERVICE_ACCOUNT_PATH.');
  }

  const src = userDb.collection(spec.name);
  const dst = financeDb.collection(spec.name);

  if (spec.docIds?.length) {
    for (const id of spec.docIds) {
      const snap = await src.doc(id).get();
      if (!snap.exists) {
        console.log(`[SKIP] ${spec.name}/${id} (not found in user db)`);
        continue;
      }
      await dst.doc(id).set(snap.data(), { merge: true });
      console.log(`[OK]   ${spec.name}/${id}`);
    }
    return;
  }

  console.log(`\n== Copying collection: ${spec.name} ==`);
  const snapshot = await src.get();
  console.log(`Found ${snapshot.size} docs`);

  const bulk = financeDb.bulkWriter();
  let count = 0;

  snapshot.docs.forEach((d: any) => {
    bulk.set(dst.doc(d.id), d.data(), { merge: true });
    count += 1;
  });

  await bulk.close();
  console.log(`[DONE] ${spec.name}: copied ${count} docs`);
}

async function main() {
  if (!userDb) {
    throw new Error('USER db not initialized. Set FIREBASE_SERVICE_ACCOUNT_PATH (truvamate-9e0fa).');
  }
  if (!financeDb) {
    throw new Error('FINANCE db not initialized. Set FIREBASE_FINANCE_SERVICE_ACCOUNT_PATH (truvamate-finance).');
  }

  console.log('Starting migration USER -> FINANCE');
  for (const c of COLLECTIONS) {
    await copyCollection(c);
  }
  console.log('\n✅ Migration complete');
  console.log('Next: deploy backend with finance credentials, and stop using old financial collections in user project.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

