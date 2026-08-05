'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');

const passphrase = process.env.FILE_ENCRYPTION_PASSPHRASE;
if (!passphrase) {
  throw new Error('Set FILE_ENCRYPTION_PASSPHRASE before running this script.');
}
const input = fs.readFileSync('secret.txt');

const salt = crypto.randomBytes(16);
const nonce = crypto.randomBytes(12);

const key = crypto.scryptSync(passphrase, salt, 32);
const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
const ciphertext = Buffer.concat([
  cipher.update(input),
  cipher.final()
]);
const tag = cipher.getAuthTag();
const packed = Buffer.concat([salt, nonce, tag, ciphertext]);

fs.writeFileSync('secret.txt.enc', packed);

console.log('salt:       ', salt.toString('hex'));
console.log('nonce:      ', nonce.toString('hex'));
console.log('tag:        ', tag.toString('hex'));
console.log('ciphertext: ', ciphertext.toString('hex'));
console.log('wrote:       secret.txt.enc (' + packed.length + ' bytes)');
