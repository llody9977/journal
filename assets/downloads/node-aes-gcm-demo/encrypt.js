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

  const input = fs.readFileSync('secret.txt');
  dataKey = crypto.randomBytes(32);
  const nonce = crypto.randomBytes(12);
  const wrapper = crypto.createCipheriv('id-aes256-wrap', keyEncryptionKey, KEY_WRAP_IV);
  const wrappedDataKey = Buffer.concat([wrapper.update(dataKey), wrapper.final()]);
  const aad = Buffer.concat([MAGIC, wrappedDataKey, nonce]);

  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, nonce);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([MAGIC, wrappedDataKey, nonce, tag, ciphertext]);

  fs.writeFileSync('secret.txt.enc', packed);
  console.log('format:      ', MAGIC.toString());
  console.log('wrapped key: ', wrappedDataKey.toString('hex'));
  console.log('nonce:       ', nonce.toString('hex'));
  console.log('tag:         ', tag.toString('hex'));
  console.log('ciphertext:  ', ciphertext.toString('hex'));
  console.log('wrote:        secret.txt.enc (' + packed.length + ' bytes)');
} finally {
  if (dataKey) dataKey.fill(0);
  if (keyEncryptionKey) keyEncryptionKey.fill(0);
}
