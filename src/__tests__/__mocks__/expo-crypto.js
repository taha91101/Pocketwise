const crypto = require('crypto');

module.exports = {
  CryptoDigestAlgorithm: {
    SHA1: 'SHA-1',
    SHA256: 'SHA-256',
    SHA384: 'SHA-384',
    SHA512: 'SHA-512',
  },
  digestStringAsync: jest.fn(async (algo, str) => {
    return crypto.createHash('sha256').update(str).digest('hex');
  }),
};

