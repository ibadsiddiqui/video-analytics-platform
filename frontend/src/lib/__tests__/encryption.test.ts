import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptionService, EncryptedData } from '../encryption';
import * as crypto from 'crypto';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    // Create a new instance for each test
    // Using the test encryption key from setup.ts
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
    encryptionService = new EncryptionService();
  });

  describe('Constructor', () => {
    it('should throw error if ENCRYPTION_KEY is not provided', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => new EncryptionService()).toThrow(
        'ENCRYPTION_KEY environment variable is required'
      );

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error if ENCRYPTION_KEY is invalid base64', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'not-valid-base64!!!';

      expect(() => new EncryptionService()).toThrow('Invalid ENCRYPTION_KEY format');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error if ENCRYPTION_KEY is not 32 bytes', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      // 16 bytes instead of 32
      process.env.ENCRYPTION_KEY = crypto.randomBytes(16).toString('base64');

      expect(() => new EncryptionService()).toThrow(
        'ENCRYPTION_KEY must be exactly 32 bytes'
      );

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should successfully create instance with valid key', () => {
      expect(() => new EncryptionService()).not.toThrow();
    });
  });

  describe('encrypt', () => {
    it('should encrypt a valid API key', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(apiKey);

      expect(encrypted).toHaveProperty('encryptedKey');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('salt');

      expect(encrypted.encryptedKey).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();
      expect(encrypted.salt).toBeTruthy();
    });

    it('should throw error for empty API key', () => {
      expect(() => encryptionService.encrypt('')).toThrow(
        'API key cannot be empty'
      );
    });

    it('should throw error for whitespace-only API key', () => {
      expect(() => encryptionService.encrypt('   ')).toThrow(
        'API key cannot be empty'
      );
    });

    it('should produce different IV for each encryption', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const encrypted1 = encryptionService.encrypt(apiKey);
      const encrypted2 = encryptionService.encrypt(apiKey);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encryptedKey).not.toBe(encrypted2.encryptedKey);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should produce different encrypted output for same key', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const encrypted1 = encryptionService.encrypt(apiKey);
      const encrypted2 = encryptionService.encrypt(apiKey);

      // Even though input is the same, output should differ due to random IV and salt
      expect(encrypted1.encryptedKey).not.toBe(encrypted2.encryptedKey);
    });

    it('should handle special characters in API key', () => {
      const apiKey = 'key-with-special!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptionService.encrypt(apiKey);

      expect(encrypted.encryptedKey).toBeTruthy();
    });

    it('should handle long API keys', () => {
      const apiKey = 'a'.repeat(500); // Very long key
      const encrypted = encryptionService.encrypt(apiKey);

      expect(encrypted.encryptedKey).toBeTruthy();
    });

    it('should return base64-encoded values', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(apiKey);

      // Test that values are valid base64
      expect(() => Buffer.from(encrypted.encryptedKey, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.iv, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.authTag, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.salt, 'base64')).not.toThrow();
    });
  });

  describe('decrypt', () => {
    it('should decrypt previously encrypted data', () => {
      const originalKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(originalKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalKey);
    });

    it('should handle multiple encrypt/decrypt cycles', () => {
      const originalKey = 'AIzaSyDtest123456789';

      for (let i = 0; i < 5; i++) {
        const encrypted = encryptionService.encrypt(originalKey);
        const decrypted = encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(originalKey);
      }
    });

    it('should throw error for missing encryptedKey', () => {
      const invalidData = {
        encryptedKey: '',
        iv: 'validIV',
        authTag: 'validTag',
        salt: 'validSalt',
      };

      expect(() => encryptionService.decrypt(invalidData)).toThrow(
        'Invalid encrypted data: missing required fields'
      );
    });

    it('should throw error for missing iv', () => {
      const invalidData = {
        encryptedKey: 'validKey',
        iv: '',
        authTag: 'validTag',
        salt: 'validSalt',
      };

      expect(() => encryptionService.decrypt(invalidData)).toThrow(
        'Invalid encrypted data: missing required fields'
      );
    });

    it('should throw error for missing authTag', () => {
      const invalidData = {
        encryptedKey: 'validKey',
        iv: 'validIV',
        authTag: '',
        salt: 'validSalt',
      };

      expect(() => encryptionService.decrypt(invalidData)).toThrow(
        'Invalid encrypted data: missing required fields'
      );
    });

    it('should throw error for missing salt', () => {
      const invalidData = {
        encryptedKey: 'validKey',
        iv: 'validIV',
        authTag: 'validTag',
        salt: '',
      };

      expect(() => encryptionService.decrypt(invalidData)).toThrow(
        'Invalid encrypted data: missing required fields'
      );
    });

    it('should throw error for invalid IV length', () => {
      const originalKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(originalKey);

      // Corrupt IV with wrong length
      const corruptedData = {
        ...encrypted,
        iv: crypto.randomBytes(8).toString('base64'), // Wrong length (8 instead of 16)
      };

      expect(() => encryptionService.decrypt(corruptedData)).toThrow('Decryption failed');
    });

    it('should throw error for invalid authTag length', () => {
      const originalKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(originalKey);

      // Corrupt authTag with wrong length
      const corruptedData = {
        ...encrypted,
        authTag: crypto.randomBytes(8).toString('base64'), // Wrong length
      };

      expect(() => encryptionService.decrypt(corruptedData)).toThrow('Decryption failed');
    });

    it('should throw error for invalid salt length', () => {
      const originalKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(originalKey);

      // Corrupt salt with wrong length
      const corruptedData = {
        ...encrypted,
        salt: crypto.randomBytes(16).toString('base64'), // Wrong length (16 instead of 32)
      };

      expect(() => encryptionService.decrypt(corruptedData)).toThrow('Decryption failed');
    });

    it('should throw error for tampered encrypted data', () => {
      const originalKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(originalKey);

      // Tamper with encrypted data
      const tamperedData = {
        ...encrypted,
        encryptedKey: encrypted.encryptedKey.slice(0, -5) + 'xxxxx',
      };

      expect(() => encryptionService.decrypt(tamperedData)).toThrow('Decryption failed');
    });

    it('should throw error when using wrong authTag', () => {
      const originalKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(originalKey);
      const encrypted2 = encryptionService.encrypt('different-key');

      // Use authTag from different encryption
      const corruptedData = {
        ...encrypted,
        authTag: encrypted2.authTag,
      };

      expect(() => encryptionService.decrypt(corruptedData)).toThrow('Decryption failed');
    });

    it('should preserve special characters after decrypt', () => {
      const originalKey = 'key!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptionService.encrypt(originalKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalKey);
    });

    it('should handle long keys correctly', () => {
      const originalKey = 'a'.repeat(500);
      const encrypted = encryptionService.encrypt(originalKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalKey);
      expect(decrypted.length).toBe(500);
    });
  });

  describe('maskKey', () => {
    it('should mask keys with length >= 8 correctly', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const masked = encryptionService.maskKey(apiKey);

      expect(masked).toBe('AIza...6789');
      expect(masked).toContain('...');
      expect(masked.startsWith('AIza')).toBe(true);
      expect(masked.endsWith('6789')).toBe(true);
    });

    it('should return **** for short keys', () => {
      const shortKey = 'short';
      const masked = encryptionService.maskKey(shortKey);

      expect(masked).toBe('****');
    });

    it('should return **** for empty string', () => {
      const masked = encryptionService.maskKey('');
      expect(masked).toBe('****');
    });

    it('should mask exactly 8-character keys correctly', () => {
      const apiKey = '12345678';
      const masked = encryptionService.maskKey(apiKey);

      expect(masked).toBe('1234...5678');
    });

    it('should mask very long keys correctly', () => {
      const longKey = 'a'.repeat(100);
      const masked = encryptionService.maskKey(longKey);

      expect(masked).toBe('aaaa...aaaa');
      expect(masked.length).toBe(11); // 4 + 3 + 4
    });
  });

  describe('testEncryption', () => {
    it('should return true for successful round-trip', () => {
      const result = encryptionService.testEncryption();
      expect(result).toBe(true);
    });

    it('should verify encryption/decryption consistency', () => {
      // Run test multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        expect(encryptionService.testEncryption()).toBe(true);
      }
    });
  });

  describe('Security Properties', () => {
    it('should produce different output for same input (non-deterministic)', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const results = new Set();

      for (let i = 0; i < 10; i++) {
        const encrypted = encryptionService.encrypt(apiKey);
        results.add(encrypted.encryptedKey);
      }

      // All encryptions should be unique
      expect(results.size).toBe(10);
    });

    it('should not expose original key in encrypted data', () => {
      const apiKey = 'MySecretKey12345';
      const encrypted = encryptionService.encrypt(apiKey);

      // None of the encrypted fields should contain the original key
      expect(encrypted.encryptedKey).not.toContain(apiKey);
      expect(encrypted.iv).not.toContain(apiKey);
      expect(encrypted.authTag).not.toContain(apiKey);
      expect(encrypted.salt).not.toContain(apiKey);
    });

    it('should produce IV of correct length (16 bytes)', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(apiKey);
      const ivBuffer = Buffer.from(encrypted.iv, 'base64');

      expect(ivBuffer.length).toBe(16);
    });

    it('should produce authTag of correct length (16 bytes)', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(apiKey);
      const authTagBuffer = Buffer.from(encrypted.authTag, 'base64');

      expect(authTagBuffer.length).toBe(16);
    });

    it('should produce salt of correct length (32 bytes)', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(apiKey);
      const saltBuffer = Buffer.from(encrypted.salt, 'base64');

      expect(saltBuffer.length).toBe(32);
    });

    it('should fail decryption with wrong master key', () => {
      const apiKey = 'AIzaSyDtest123456789';
      const encrypted = encryptionService.encrypt(apiKey);

      // Create new service with different key
      process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
      const differentService = new EncryptionService();

      expect(() => differentService.decrypt(encrypted)).toThrow('Decryption failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters', () => {
      const apiKey = 'key-with-unicode-🔑-emojis-中文';
      const encrypted = encryptionService.encrypt(apiKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle newlines and special whitespace', () => {
      const apiKey = 'key\nwith\tnewlines\rand\rcarriage\rreturns';
      const encrypted = encryptionService.encrypt(apiKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle keys with only numbers', () => {
      const apiKey = '1234567890123456';
      const encrypted = encryptionService.encrypt(apiKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle single character keys', () => {
      const apiKey = 'a';
      const encrypted = encryptionService.encrypt(apiKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle base64-like strings as keys', () => {
      const apiKey = 'SGVsbG8gV29ybGQh'; // base64 string
      const encrypted = encryptionService.encrypt(apiKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });
  });
});
