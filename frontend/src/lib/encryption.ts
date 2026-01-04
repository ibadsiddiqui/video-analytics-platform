/**
 * EncryptionService - Secure API Key Encryption
 *
 * Implements AES-256-GCM encryption for user API keys with:
 * - Random IV (initialization vector) per encryption
 * - Authentication tag for integrity verification
 * - Secure key derivation using scrypt with random salt
 * - Key masking for display purposes
 */

import * as crypto from "crypto";
import { configService } from "./config";

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encryptedKey: string;
  iv: string;
  authTag: string;
  salt: string;
}

export class EncryptionService {
  private readonly ALGORITHM = "aes-256-gcm";
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly SALT_LENGTH = 32; // 256 bits
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private readonly SCRYPT_N = 16384; // CPU/memory cost parameter
  private readonly SCRYPT_R = 8; // Block size parameter
  private readonly SCRYPT_P = 1; // Parallelization parameter

  private masterKey: Buffer;

  constructor() {
    const encryptionKey = configService.getEncryptionKey();

    if (!encryptionKey) {
      throw new Error(
        "ENCRYPTION_KEY environment variable is required. Generate one with: " +
          "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
      );
    }

    try {
      // Decode base64 master key
      this.masterKey = Buffer.from(encryptionKey, "base64");

      if (this.masterKey.length !== this.KEY_LENGTH) {
        throw new Error(
          `ENCRYPTION_KEY must be exactly ${this.KEY_LENGTH} bytes (base64 encoded)`,
        );
      }
    } catch (error) {
      throw new Error(
        `Invalid ENCRYPTION_KEY format: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Encrypt an API key with AES-256-GCM
   */
  encrypt(apiKey: string): EncryptedData {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error("API key cannot be empty");
    }

    try {
      // Generate random salt for key derivation
      const salt = crypto.randomBytes(this.SALT_LENGTH);

      // Derive encryption key from master key using scrypt
      const derivedKey = crypto.scryptSync(
        this.masterKey,
        salt,
        this.KEY_LENGTH,
        {
          N: this.SCRYPT_N,
          r: this.SCRYPT_R,
          p: this.SCRYPT_P,
        },
      );

      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);

      // Encrypt the API key
      let encrypted = cipher.update(apiKey, "utf8", "base64");
      encrypted += cipher.final("base64");

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encryptedKey: encrypted,
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        salt: salt.toString("base64"),
      };
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Decrypt an encrypted API key
   */
  decrypt(encryptedData: EncryptedData): string {
    const { encryptedKey, iv, authTag, salt } = encryptedData;

    if (!encryptedKey || !iv || !authTag || !salt) {
      throw new Error("Invalid encrypted data: missing required fields");
    }

    try {
      // Decode base64 values
      const ivBuffer = Buffer.from(iv, "base64");
      const authTagBuffer = Buffer.from(authTag, "base64");
      const saltBuffer = Buffer.from(salt, "base64");

      // Validate buffer lengths
      if (ivBuffer.length !== this.IV_LENGTH) {
        throw new Error("Invalid IV length");
      }
      if (authTagBuffer.length !== this.AUTH_TAG_LENGTH) {
        throw new Error("Invalid auth tag length");
      }
      if (saltBuffer.length !== this.SALT_LENGTH) {
        throw new Error("Invalid salt length");
      }

      // Derive the same encryption key using stored salt
      const derivedKey = crypto.scryptSync(
        this.masterKey,
        saltBuffer,
        this.KEY_LENGTH,
        {
          N: this.SCRYPT_N,
          r: this.SCRYPT_R,
          p: this.SCRYPT_P,
        },
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        derivedKey,
        ivBuffer,
      );
      decipher.setAuthTag(authTagBuffer);

      // Decrypt the API key
      let decrypted = decipher.update(encryptedKey, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Mask an API key for display purposes
   * Shows first 4 and last 4 characters, masks the middle
   */
  maskKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return "****";
    }

    const firstChars = apiKey.substring(0, 4);
    const lastChars = apiKey.substring(apiKey.length - 4);

    return `${firstChars}...${lastChars}`;
  }

  /**
   * Test encryption/decryption round-trip
   */
  testEncryption(): boolean {
    try {
      const testData = "test-api-key-12345";
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      return decrypted === testData;
    } catch (error) {
      console.error("Encryption test failed:", error);
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();
