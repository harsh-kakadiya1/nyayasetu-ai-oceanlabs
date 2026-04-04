import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Supabase storage service for managing encrypted documents
 */
export class SupabaseStorageService {
  private client: SupabaseClient | null = null;
  private bucketName = 'documents';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[SUPABASE] Supabase not configured. Encrypted documents will not be uploaded to cloud storage.');
      console.warn('[SUPABASE] To enable: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
      return;
    }

    this.client = createClient(supabaseUrl, supabaseKey);
    console.log('[SUPABASE] Supabase configured and ready');
  }

  /**
   * Check if Supabase client is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Upload encrypted document to Supabase Storage
   * Returns the file path for later retrieval, or null if Supabase not configured
   */
  async uploadEncryptedDocument(
    userId: string,
    documentId: string,
    encryptedContent: string,
    filename: string,
  ): Promise<string | null> {
    try {
      if (!this.client) {
        console.log('[SUPABASE] Supabase not configured, skipping encrypted document upload');
        return null;
      }

      // Create a path: documents/{userId}/{documentId}/{filename}
      const filePath = `documents/${userId}/${documentId}/${filename}`;

      // Convert base64 to buffer for upload
      const buffer = Buffer.from(encryptedContent, 'utf8');

      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .upload(filePath, buffer, {
          contentType: 'application/octet-stream',
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
      }

      return filePath;
    } catch (error) {
      console.error('[SUPABASE] Upload error:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download encrypted document from Supabase Storage
   */
  async downloadEncryptedDocument(filePath: string): Promise<string> {
    try {
      if (!this.client) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        throw new Error(`Failed to download from Supabase: ${error.message}`);
      }

      // Convert blob to string
      const content = await data.text();
      return content;
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete document from Supabase Storage
   */
  async deleteDocument(filePath: string): Promise<void> {
    try {
      if (!this.client) {
        console.log('[SUPABASE] Supabase not configured, skipping document deletion');
        return;
      }

      const { error } = await this.client.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Failed to delete from Supabase: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if bucket exists, create if it doesn't
   */
  async ensureBucketExists(): Promise<void> {
    try {
      if (!this.client) {
        console.log('[SUPABASE] Supabase not configured, skipping bucket setup');
        return;
      }

      const { data: buckets, error: listError } = await this.client.storage.listBuckets();

      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      const bucketExists = buckets.some((b) => b.name === this.bucketName);

      if (!bucketExists) {
        const { error: createError } = await this.client.storage.createBucket(
          this.bucketName,
          {
            public: false,
            fileSizeLimit: 52428800, // 50MB limit per file
          },
        );

        if (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }

        console.log(`[SUPABASE] Created bucket: ${this.bucketName}`);
      }
    } catch (error) {
      throw new Error(`Bucket setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get public URL for a document (if public access is enabled)
   */
  getPublicUrl(filePath: string): string | null {
    if (!this.client) {
      return null;
    }
    const url = this.client.storage.from(this.bucketName).getPublicUrl(filePath);
    return url.data.publicUrl;
  }
}

// Export singleton instance
let storageService: SupabaseStorageService | null = null;

export function getSupabaseStorageService(): SupabaseStorageService {
  if (!storageService) {
    storageService = new SupabaseStorageService();
  }
  return storageService;
}
