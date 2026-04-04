import { EncryptionService } from "./encryption.js";
import { getSupabaseStorageService } from "./supabase.js";

/**
 * Service for managing document decryption and retrieval
 */
export class DocumentRetrievalService {
  /**
   * Retrieve and decrypt a document from Supabase Storage
   * @param encryptedStoragePath - Path to encrypted document in Supabase
   * @returns Decrypted document content
   */
  static async getDecryptedDocument(encryptedStoragePath: string): Promise<string> {
    try {
      if (!encryptedStoragePath) {
        throw new Error("Document storage path is required");
      }

      const supabaseService = getSupabaseStorageService();
      
      // Download encrypted content from Supabase
      const encryptedContent = await supabaseService.downloadEncryptedDocument(encryptedStoragePath);
      
      // Decrypt the content
      const decryptedContent = EncryptionService.decryptDocument(encryptedContent);
      
      return decryptedContent;
    } catch (error) {
      throw new Error(
        `Failed to retrieve and decrypt document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Verify document integrity (check if can be decrypted without errors)
   * @param encryptedStoragePath - Path to encrypted document in Supabase
   */
  static async verifyDocumentIntegrity(encryptedStoragePath: string): Promise<boolean> {
    try {
      await this.getDecryptedDocument(encryptedStoragePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Re-encrypt a document with a new key (during key rotation)
   * @param oldEncryptedContent - Content encrypted with old key
   * @param oldKey - Old encryption key
   * @param newKey - New encryption key
   */
  static async rotateDocumentEncryption(
    oldEncryptedContent: string,
    newEncryptedContent: string,
  ): Promise<string> {
    try {
      // Validation: can be extended to support key rotation
      // For now, this is a placeholder for future key rotation logic
      return newEncryptedContent;
    } catch (error) {
      throw new Error(`Failed to rotate document encryption: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
