'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');

const MAGIC = Buffer.from('JRN1');
const KEY_WRAP_IV = Buffer.alloc(8, 0xA6);
const encodedKey = process.env.FILE_KEK_BASE64;
if (!encodedKey) {
  throw new Error('Set FILE_KEK_BASE64 before running this script.');
}

let keyEncryptionKey;
let dataKey;
try {
  keyEncryptionKey = Buffer.from(encodedKey, 'base64');
  if (keyEncryptionKey.length !== 32 || keyEncryptionKey.toString('base64') !== encodedKey) {
    throw new Error('FILE_KEK_BASE64 must contain exactly 32 Base64-encoded bytes.');
  }

  const packed = fs.readFileSync('secret.txt.enc');
  if (packed.length < 72 || !packed.subarray(0, 4).equals(MAGIC)) {
    throw new Error('Unsupported or truncated encrypted file.');
  }
  const wrappedDataKey = packed.subarray(4, 44);
  const nonce = packed.subarray(44, 56);
  const tag = packed.subarray(56, 72);
  const ciphertext = packed.subarray(72);
  const aad = Buffer.concat([MAGIC, wrappedDataKey, nonce]);

  const unwrapper = crypto.createDecipheriv('id-aes256-wrap', keyEncryptionKey, KEY_WRAP_IV);
  dataKey = Buffer.concat([unwrapper.update(wrappedDataKey), unwrapper.final()]);

  const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, nonce);
  decipher.setAuthTag(tag);
  decipher.setAAD(aad);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  fs.writeFileSync('secret-decrypted.txt', plaintext);
  console.log('tag verified: yes');
  console.log('recovered:   ', JSON.stringify(plaintext.toString('utf8')));
} catch {
  console.error('decryption failed: authentication or envelope validation error');
  process.exitCode = 1;
} finally {
  if (dataKey) dataKey.fill(0);
  if (keyEncryptionKey) keyEncryptionKey.fill(0);
}
