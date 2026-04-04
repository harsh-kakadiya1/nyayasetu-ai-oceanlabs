import crypto from 'crypto';

/**
 * Encryption service for securing documents
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits

  /**
   * Get encryption key from environment
   */
  private static getEncryptionKey(): Buffer {
    const key = process.env.DOCUMENT_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('DOCUMENT_ENCRYPTION_KEY environment variable is not set');
    }
    
    // Ensure the key is 32 bytes (256 bits) for AES-256
    const hash = crypto.createHash('sha256');
    hash.update(key);
    return hash.digest();
  }

  /**
   * Encrypt document content
   * Returns a base64-encoded string containing: salt + iv + encryptedData + authTag
   */
  static encryptDocument(content: string): { encrypted: string; metadata: EncryptionMetadata } {
    try {
      const key = this.getEncryptionKey();
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);

      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      
      // Encrypt the content
      const encrypted = Buffer.concat([
        cipher.update(content, 'utf8'),
        cipher.final(),
      ]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine: salt + iv + encrypted + authTag
      const result = Buffer.concat([salt, iv, encrypted, authTag]);
      
      return {
        encrypted: result.toString('base64'),
        metadata: {
          algorithm: this.ALGORITHM,
          ivLength: this.IV_LENGTH,
          saltLength: this.SALT_LENGTH,
          authTagLength: this.AUTH_TAG_LENGTH,
        },
      };
    } catch (error) {
      throw new Error(`Failed to encrypt document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt document content
   * Expects base64-encoded string containing: salt + iv + encryptedData + authTag
   */
  static decryptDocument(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const buffer = Buffer.from(encryptedData, 'base64');

      // Extract components
      const saltLength = this.SALT_LENGTH;
      const ivLength = this.IV_LENGTH;
      const authTagLength = this.AUTH_TAG_LENGTH;

      const salt = buffer.slice(0, saltLength);
      const iv = buffer.slice(saltLength, saltLength + ivLength);
      const encrypted = buffer.slice(saltLength + ivLength, buffer.length - authTagLength);
      const authTag = buffer.slice(buffer.length - authTagLength);

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Failed to decrypt document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a random encryption key (for setup purposes)
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export interface EncryptionMetadata {
  algorithm: string;
  ivLength: number;
  saltLength: number;
  authTagLength: number;
}
