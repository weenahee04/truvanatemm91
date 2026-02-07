/**
 * Set user role in Firestore
 * Usage: npx ts-node scripts/set-user-role.ts <email> <role>
 * Roles: super_admin | accounting | admin_limited
 *
 * Examples:
 *   npx ts-node scripts/set-user-role.ts master@truvamate.com super_admin
 *   npx ts-node scripts/set-user-role.ts account@truvamate.com accounting
 *   npx ts-node scripts/set-user-role.ts staff@truvamate.com admin_limited
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const VALID_ROLES = ['super_admin', 'accounting', 'admin_limited'];

async function main() {
  const email = process.argv[2];
  const role = process.argv[3];

  if (!email || !role) {
    console.log(`
Usage: npx ts-node scripts/set-user-role.ts <email> <role>

Roles:
  super_admin  - Master Admin (เต็มสิทธิ์)
  accounting   - Account / เจ้าหน้าที่บัญชี
  admin_limited - Admin (Order, OCR, ลูกค้า เท่านั้น)

Examples:
  npx ts-node scripts/set-user-role.ts master@truvamate.com super_admin
  npx ts-node scripts/set-user-role.ts account@truvamate.com accounting
  npx ts-node scripts/set-user-role.ts staff@truvamate.com admin_limited
`);
    process.exit(1);
  }

  const roleLower = role.toLowerCase();
  if (!VALID_ROLES.includes(roleLower)) {
    console.error(`❌ Invalid role. Use: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  try {
    const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);

    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }

    const auth = admin.auth();
    const db = admin.firestore();

    // Get user by email from Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        console.error(`❌ User not found in Firebase Auth: ${email}`);
        console.log('   Create the user in Firebase Console first, or use the main site to register.');
        process.exit(1);
      }
      throw e;
    }

    const uid = userRecord.uid;
    const userRef = db.collection('users').doc(uid);

    const doc = await userRef.get();
    const existing = doc.exists ? doc.data() : {};

    await userRef.set(
      {
        ...existing,
        id: uid,
        email: email,
        name: existing?.name || userRecord.displayName || email.split('@')[0],
        role: roleLower,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`✅ Role updated successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${uid}`);
    console.log(`   Role: ${roleLower}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
