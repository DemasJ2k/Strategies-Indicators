import crypto from 'crypto';

const RAW_KEY = process.env.ENCRYPTION_KEY;

if (!RAW_KEY) {
  console.warn('[Flowrex] ENCRYPTION_KEY not set. Secrets will not be safe!');
}

// Derive 32-byte key using SHA-256
const KEY = crypto
  .createHash('sha256')
  .update(RAW_KEY || 'flowrex-dev-key-fallback')
  .digest();

/**
 * Encrypt a JSON object using AES-256-GCM
 * Returns Buffer in format: [iv][tag][ciphertext]
 */
export function encryptJSON(obj: any): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);

  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Store as: [iv][tag][ciphertext]
  return Buffer.concat([iv, tag, enc]);
}

/**
 * Decrypt a Buffer back to JSON object
 * Expects format: [iv][tag][ciphertext]
 */
export function decryptJSON(buf: Buffer | null): any {
  if (!buf || buf.length < 12 + 16) return null;

  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);

  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString('utf8'));
}
