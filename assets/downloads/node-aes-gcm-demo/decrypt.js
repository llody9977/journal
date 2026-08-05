'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');

const passphrase = process.env.FILE_ENCRYPTION_PASSPHRASE;
if (!passphrase) {
  throw new Error('Set FILE_ENCRYPTION_PASSPHRASE before running this script.');
}
const packed = fs.readFileSync('secret.txt.enc');

const salt = packed.subarray(0, 16);
const nonce = packed.subarray(16, 28);
const tag = packed.subarray(28, 44);
const ciphertext = packed.subarray(44);

const key = crypto.scryptSync(passphrase, salt, 32);
const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
decipher.setAuthTag(tag);

// Do not save or use plaintext until final() authenticates the packet.
const plaintext = Buffer.concat([
  decipher.update(ciphertext),
  decipher.final()
]);

fs.writeFileSync('secret-decrypted.txt', plaintext);
console.log('tag verified: yes');
console.log('recovered:   ', JSON.stringify(plaintext.toString('utf8')));
