'use strict';

const crypto = require('node:crypto');

process.stdout.write(crypto.randomBytes(32).toString('base64'));
