// Standalone Gmail SMTP diagnostic.
// Run: node test-gmail.js
//
// This bypasses Next.js entirely and talks straight to Gmail's SMTP server
// with explicit, clearly-printed credentials. It will tell you exactly which
// part is failing.

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// ---- 1. Read .env.local manually so we know EXACTLY what's in it ----
const envPath = path.join(process.cwd(), '.env.local');
console.log('\n=== STEP 1: Reading .env.local ===');
console.log('Path:', envPath);

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local DOES NOT EXIST at this path.');
  console.error('   Make sure you run this script from your project root (where package.json lives).');
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf-8');
console.log('File size:', raw.length, 'bytes');
console.log('--- raw contents (with visible whitespace) ---');
// Show whitespace explicitly so we catch any weird characters
console.log(raw.replace(/ /g, '·').replace(/\t/g, '→').replace(/\r/g, '<CR>'));
console.log('--- end ---');

// ---- 2. Parse it the same way dotenv does ----
const env = {};
raw.split('\n').forEach((line) => {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2];
});

const user = (env.EMAIL_USER || '').trim();
const passRaw = env.EMAIL_PASSWORD || '';
const pass = passRaw.replace(/\s+/g, '');

console.log('\n=== STEP 2: Parsed values ===');
console.log('EMAIL_USER       =', JSON.stringify(user));
console.log('EMAIL_PASSWORD   =', JSON.stringify(passRaw));
console.log('  -> after strip =', JSON.stringify(pass));
console.log('  -> length      =', pass.length, '(should be 16)');
console.log('  -> first 2     =', pass.slice(0, 2));
console.log('  -> last 2      =', pass.slice(-2));

if (pass.length !== 16) {
  console.error('\n⚠️  Password length is NOT 16. Gmail app passwords are always 16 chars.');
  console.error('   You may have copied extra/missing characters.');
}

// Hidden-character check
const visibleLen = pass.length;
const byteLen = Buffer.byteLength(pass, 'utf-8');
if (visibleLen !== byteLen) {
  console.error('\n⚠️  HIDDEN CHARACTERS DETECTED.');
  console.error(`   Visible length=${visibleLen} but UTF-8 byte length=${byteLen}.`);
  console.error('   This means your editor pasted invisible Unicode (NBSP, zero-width, etc).');
  console.error('   Open .env.local, DELETE the password line entirely, retype it by hand.');
}

// ---- 3. Try to log in to Gmail ----
console.log('\n=== STEP 3: Attempting Gmail SMTP login ===');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
  logger: true,   // ← prints the full SMTP conversation
  debug: true,
});

transporter.verify((err, success) => {
  if (err) {
    console.error('\n❌ LOGIN FAILED');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    if (err.response) console.error('Gmail response:', err.response);
    console.error('\nMost likely causes (in order of likelihood):');
    console.error('  1. App password was generated from a DIFFERENT Google account');
    console.error('     (not connectwithvexar@gmail.com).');
    console.error('  2. App password got revoked, regenerated, or is stale.');
    console.error('  3. 2-Step Verification was turned off (kills all app passwords).');
    console.error('  4. The account is locked / suspended / under unusual-activity hold.');
    process.exit(1);
  }
  console.log('\n✅ LOGIN SUCCESSFUL — credentials are valid.');
  console.log('   If this works but Next.js still fails, the issue is env loading,');
  console.log('   not credentials. Make sure you Ctrl+C and restart pnpm dev.');
  process.exit(0);
});
