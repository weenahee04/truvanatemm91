/**
 * Helper script to format Firebase private key for Railway environment variables
 * 
 * Usage:
 * 1. Copy your private key from serviceAccountKey.json
 * 2. Run: node scripts/format-private-key.js
 * 3. Paste the private key when prompted
 * 4. Copy the output to FIREBASE_PRIVATE_KEY in Railway
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📋 Firebase Private Key Formatter for Railway');
console.log('============================================\n');
console.log('Paste your private key (from serviceAccountKey.json):');
console.log('(Press Enter twice when done)\n');

let privateKey = '';

rl.on('line', (line) => {
  if (line.trim() === '' && privateKey !== '') {
    // Empty line after content means done
    formatPrivateKey(privateKey.trim());
    rl.close();
    return;
  }
  privateKey += line + '\n';
});

function formatPrivateKey(key) {
  // Remove any existing escape sequences
  let formatted = key.trim();
  
  // Replace actual newlines with \n (literal backslash + n)
  formatted = formatted.replace(/\n/g, '\\n');
  
  // Remove any double escaping
  formatted = formatted.replace(/\\\\n/g, '\\n');
  
  console.log('\n✅ Formatted Private Key (copy this to FIREBASE_PRIVATE_KEY in Railway):');
  console.log('==========================================\n');
  console.log(formatted);
  console.log('\n==========================================\n');
  console.log('📝 Instructions:');
  console.log('1. Copy the formatted key above');
  console.log('2. Go to Railway Dashboard → Your Service → Variables');
  console.log('3. Add/Update FIREBASE_PRIVATE_KEY variable');
  console.log('4. Paste the formatted key');
  console.log('5. Add other variables:');
  console.log('   - FIREBASE_PROJECT_ID = truvamate-9e0fa');
  console.log('   - FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@truvamate-9e0fa.iam.gserviceaccount.com');
  console.log('   - FIREBASE_STORAGE_BUCKET = truvamate-9e0fa.appspot.com (optional)');
  console.log('6. Redeploy the service\n');
}
