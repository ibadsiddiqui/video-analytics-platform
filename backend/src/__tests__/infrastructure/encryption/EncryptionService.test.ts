/**
 * EncryptionService Unit Tests
 */

import { EncryptionService } from '@infrastructure/encryption/EncryptionService';
import { ConfigService } from '@shared/config/ConfigService';
import * as crypto from 'crypto';

// Mock ConfigService
jest.mock('@shared/config/ConfigService');

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  let mockConfigService: jest.Mocked<ConfigService>;
  const validEncryptionKey = crypto.randomBytes(32).toString('base64');

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock config service
    mockConfigService = new ConfigService() as jest.Mocked<ConfigService>;
    mockConfigService.get = jest.fn().mockReturnValue(validEncryptionKey);

    // Create encryption service instance
    encryptionService = new EncryptionService(mockConfigService);
  });

  describe('constructor', () => {
    it('should initialize successfully with valid encryption key', () => {
      expect(encryptionService).toBeDefined();
      expect(mockConfigService.get).toHaveBeenCalledWith('ENCRYPTION_KEY');
    });

    it('should throw error if ENCRYPTION_KEY is not provided', () => {
      mockConfigService.get = jest.fn().mockReturnValue(undefined);

      expect(() => new EncryptionService(mockConfigService)).toThrow(
        'ENCRYPTION_KEY environment variable is required'
      );
    });

    it('should throw error if ENCRYPTION_KEY is not base64 encoded', () => {
      mockConfigService.get = jest.fn().mockReturnValue('not-base64!!!');

      expect(() => new EncryptionService(mockConfigService)).toThrow(
        'Invalid ENCRYPTION_KEY format'
      );
    });

    it('should throw error if ENCRYPTION_KEY is wrong length', () => {
      const shortKey = crypto.randomBytes(16).toString('base64'); // 16 bytes instead of 32
      mockConfigService.get = jest.fn().mockReturnValue(shortKey);

      expect(() => new EncryptionService(mockConfigService)).toThrow(
        'ENCRYPTION_KEY must be exactly 32 bytes'
      );
    });
  });

  describe('encrypt', () => {
    it('should encrypt an API key successfully', () => {
      const apiKey = 'AIzaSyDTestKey123456789';
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

    it('should produce different IV and salt for each encryption', () => {
      const apiKey = 'AIzaSyDTestKey123456789';
      const encrypted1 = encryptionService.encrypt(apiKey);
      const encrypted2 = encryptionService.encrypt(apiKey);

      // Same plaintext should produce different ciphertext due to random IV and salt
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.encryptedKey).not.toBe(encrypted2.encryptedKey);
    });

    it('should throw error for empty API key', () => {
      expect(() => encryptionService.encrypt('')).toThrow('API key cannot be empty');
    });

    it('should throw error for whitespace-only API key', () => {
      expect(() => encryptionService.encrypt('   ')).toThrow('API key cannot be empty');
    });

    it('should handle long API keys', () => {
      const longKey = 'A'.repeat(500);
      const encrypted = encryptionService.encrypt(longKey);

      expect(encrypted.encryptedKey).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted API key successfully', () => {
      const originalKey = 'AIzaSyDTestKey123456789';
      const encrypted = encryptionService.encrypt(originalKey);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalKey);
    });

    it('should handle round-trip encryption/decryption for various keys', () => {
      const testKeys = [
        'AIzaSyDTestKey123456789',
        'short',
        'very-long-key-with-special-chars-!@#$%^&*()',
        '12345',
        'key with spaces',
      ];

      testKeys.forEach((key) => {
        const encrypted = encryptionService.encrypt(key);
        const decrypted = encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(key);
      });
    });

    it('should throw error for missing encrypted data fields', () => {
      const invalidData: any = {
        encryptedKey: 'test',
        iv: 'test',
        authTag: 'test',
        // missing salt
      };

      expect(() => encryptionService.decrypt(invalidData)).toThrow(
        'Invalid encrypted data: missing required fields'
      );
    });

    it('should throw error for invalid base64 IV', () => {
      const encrypted = encryptionService.encrypt('test-key');
      const invalidData = {
        ...encrypted,
        iv: 'not-valid-base64!!!',
      };

      expect(() => encryptionService.decrypt(invalidData)).toThrow('Decryption failed');
    });

    it('should throw error for wrong IV length', () => {
      const encrypted = encryptionService.encrypt('test-key');
      const invalidData = {
        ...encrypted,
        iv: crypto.randomBytes(8).toString('base64'), // Wrong length
      };

      expect(() => encryptionService.decrypt(invalidData)).toThrow('Invalid IV length');
    });

    it('should throw error for wrong auth tag', () => {
      const encrypted = encryptionService.encrypt('test-key');
      const invalidData = {
        ...encrypted,
        authTag: crypto.randomBytes(16).toString('base64'), // Wrong auth tag
      };

      expect(() => encryptionService.decrypt(invalidData)).toThrow('Decryption failed');
    });

    it('should throw error for wrong salt', () => {
      const encrypted = encryptionService.encrypt('test-key');
      const invalidData = {
        ...encrypted,
        salt: crypto.randomBytes(32).toString('base64'), // Wrong salt
      };

      // Decryption should fail because derived key will be different
      expect(() => encryptionService.decrypt(invalidData)).toThrow('Decryption failed');
    });
  });

  describe('maskKey', () => {
    it('should mask a normal API key correctly', () => {
      const apiKey = 'AIzaSyDTestKey123456789';
      const masked = encryptionService.maskKey(apiKey);

      expect(masked).toBe('AIza...6789');
      expect(masked.length).toBeLessThan(apiKey.length);
    });

    it('should return **** for short keys', () => {
      const shortKey = 'abc';
      const masked = encryptionService.maskKey(shortKey);

      expect(masked).toBe('****');
    });

    it('should handle exactly 8 character keys', () => {
      const key = '12345678';
      const masked = encryptionService.maskKey(key);

      expect(masked).toBe('1234...5678');
    });

    it('should return **** for empty string', () => {
      const masked = encryptionService.maskKey('');
      expect(masked).toBe('****');
    });

    it('should mask long keys consistently', () => {
      const longKey = 'A'.repeat(100);
      const masked = encryptionService.maskKey(longKey);

      expect(masked).toBe('AAAA...AAAA');
    });
  });

  describe('isValidEncryptedData', () => {
    it('should return true for valid encrypted data', () => {
      const encrypted = encryptionService.encrypt('test-key');
      const isValid = encryptionService.isValidEncryptedData(encrypted);

      expect(isValid).toBe(true);
    });

    it('should return false for null', () => {
      const isValid = encryptionService.isValidEncryptedData(null);
      expect(isValid).toBe(false);
    });

    it('should return false for undefined', () => {
      const isValid = encryptionService.isValidEncryptedData(undefined);
      expect(isValid).toBe(false);
    });

    it('should return false for missing fields', () => {
      const invalidData = {
        encryptedKey: 'test',
        iv: 'test',
        // missing authTag and salt
      };

      const isValid = encryptionService.isValidEncryptedData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should return false for empty string fields', () => {
      const invalidData = {
        encryptedKey: '',
        iv: 'test',
        authTag: 'test',
        salt: 'test',
      };

      const isValid = encryptionService.isValidEncryptedData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(encryptionService.isValidEncryptedData('string')).toBe(false);
      expect(encryptionService.isValidEncryptedData(123)).toBe(false);
      expect(encryptionService.isValidEncryptedData([])).toBe(false);
    });
  });

  describe('testEncryption', () => {
    it('should return true for working encryption/decryption', () => {
      const result = encryptionService.testEncryption();
      expect(result).toBe(true);
    });

    it('should return false if encryption fails', () => {
      // Mock encrypt to throw an error
      jest.spyOn(encryptionService, 'encrypt').mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const result = encryptionService.testEncryption();
      expect(result).toBe(false);
    });
  });

  describe('security properties', () => {
    it('should use unique salt for each encryption', () => {
      const key = 'test-key';
      const encrypted1 = encryptionService.encrypt(key);
      const encrypted2 = encryptionService.encrypt(key);

      // Verify salts are different
      expect(encrypted1.salt).not.toBe(encrypted2.salt);

      // Verify both can be decrypted
      expect(encryptionService.decrypt(encrypted1)).toBe(key);
      expect(encryptionService.decrypt(encrypted2)).toBe(key);
    });

    it('should use unique IV for each encryption', () => {
      const key = 'test-key';
      const encrypted1 = encryptionService.encrypt(key);
      const encrypted2 = encryptionService.encrypt(key);

      // Verify IVs are different
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const key = 'test-key';
      const encrypted1 = encryptionService.encrypt(key);
      const encrypted2 = encryptionService.encrypt(key);

      // Same plaintext should produce different ciphertext
      expect(encrypted1.encryptedKey).not.toBe(encrypted2.encryptedKey);
    });

    it('should maintain data integrity with auth tag', () => {
      const key = 'test-key';
      const encrypted = encryptionService.encrypt(key);

      // Tamper with the encrypted data
      const tamperedData = {
        ...encrypted,
        encryptedKey: encrypted.encryptedKey.slice(0, -1) + 'X',
      };

      // Decryption should fail due to auth tag mismatch
      expect(() => encryptionService.decrypt(tamperedData)).toThrow('Decryption failed');
    });
  });
});
