# Encrypted Document Storage Implementation

This document describes the encrypted document storage system that securely stores user-uploaded documents in Supabase after encryption.

## Architecture Overview

The system implements a multi-layer security approach:

1. **Client-side**: Documents are uploaded via HTTP multipart/form-data
2. **Server-side Processing**: 
   - Documents are parsed and analyzed
   - Content is encrypted using AES-256-GCM
   - Encrypted content is uploaded to Supabase Storage
   - Reference to the encrypted file is stored in the database
3. **Database**: Stores metadata about the document including the encrypted storage path
4. **Supabase Storage**: Stores the encrypted document content

## Components

### 1. Encryption Service (`services/encryption.ts`)

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- Provides authenticated encryption (detects tampering)
- 256-bit key derived from `DOCUMENT_ENCRYPTION_KEY` environment variable
- Random 128-bit IV (initialization vector) for each encryption
- Random 32-byte salt for key derivation

**Methods**:
- `encryptDocument(content: string)`: Encrypts document content and returns base64-encoded encrypted data
- `decryptDocument(encryptedData: string)`: Decrypts encrypted content
- `generateEncryptionKey()`: Generates a new random encryption key for setup

**Format**: 
```
Base64(salt + IV + encryptedData + authTag)
- salt (32 bytes): Random salt for key derivation
- IV (16 bytes): Random initialization vector
- encryptedData: Variable length encrypted content
- authTag (16 bytes): Authentication tag to detect tampering
```

### 2. Supabase Storage Service (`services/supabase.ts`)

**Bucket Structure**: `documents/{userId}/{documentId}/{filename}`

**Methods**:
- `uploadEncryptedDocument()`: Uploads encrypted content to Supabase Storage
- `downloadEncryptedDocument()`: Downloads encrypted content from Supabase
- `deleteDocument()`: Deletes document from Supabase Storage
- `ensureBucketExists()`: Creates bucket if it doesn't exist
- `getPublicUrl()`: Gets public URL for a document (if enabled)

**Configuration**:
- Bucket name: `documents`
- Access level: Private (authenticated users only)
- File size limit: 50MB per file

### 3. Database Schema Updates

**Documents Table**:
```sql
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS encrypted_storage_path TEXT;
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;
```

**Fields**:
- `encrypted_storage_path`: Path to encrypted file in Supabase Storage (e.g., `documents/{userId}/{documentId}/{filename}`)
- `is_encrypted`: Boolean flag indicating if document is encrypted
- `content`: Original content (kept for analysis, not stored in Supabase)

## Setup Instructions

### Prerequisites
1. Supabase project created
2. Service account credentials available
3. Node.js and npm installed

### Step 1: Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it for `DOCUMENT_ENCRYPTION_KEY`.

### Step 2: Set Environment Variables

Copy `.env.example` to `.env` and update:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption Key (from Step 1)
DOCUMENT_ENCRYPTION_KEY=your-32-byte-hex-encoded-key
```

### Step 3: Install Dependencies

```bash
cd server
npm install
```

### Step 4: Start Server

```bash
npm start
```

The system will automatically:
- Create the `documents` bucket if it doesn't exist
- Add new columns to the documents table if they don't exist
- Begin encrypting and storing documents in Supabase

## API Flow

### Document Upload Process

```
1. Client uploads file to POST /api/documents/upload
   ↓
2. Server validates file and consumes user token
   ↓
3. File is parsed (PDF/DOCX/TXT)
   ↓
4. Content is encrypted using AES-256-GCM
   ↓
5. Encrypted content uploaded to Supabase Storage
   ↓
6. Encryption path stored in database
   ↓
7. Original content analyzed using Groq API
   ↓
8. Analysis results returned to client
```

### Response Structure

```json
{
  "document": {
    "id": "uuid",
    "filename": "document.pdf",
    "isEncrypted": true,
    "encryptedStoragePath": "documents/{userId}/{documentId}/document.pdf",
    "uploadedAt": "2024-04-04T10:00:00Z"
  },
  "analysis": {
    "id": "uuid",
    "summary": "...",
    "riskLevel": "medium",
    "keyTerms": [...],
    "riskItems": [...],
    "recommendations": [...]
  },
  "remainingTokens": 2
}
```

## Data Flow for Document Retrieval

When retrieving an encrypted document:

1. Query database for document with `encryptedStoragePath`
2. Download encrypted file from Supabase using the stored path
3. Decrypt using `EncryptionService.decryptDocument()`
4. Return decrypted content to authenticated user

## Security Features

1. **Encryption at Rest**: All documents encrypted before storage
2. **Authenticated Encryption**: GCM mode detects tampering
3. **Random Salt & IV**: Each document uniquely encrypted
4. **Access Control**: Only authenticated users can access their documents
5. **Supabase RLS**: Row-level security policies (recommended to configure)
6. **Secure Key Derivation**: Encryption key derived from environment variable

## Backup & Recovery

1. **Encrypted Content**: Stored in Supabase Storage (implement backup policy at Supabase level)
2. **Metadata**: Stored in database with reference to encrypted file
3. **Recovery**: As long as both database metadata and encrypted file exist, document can be retrieved

## Monitoring & Troubleshooting

### Enable Debug Logging

Set environment variable:
```bash
DEBUG=*
```

### Common Issues

**"DOCUMENT_ENCRYPTION_KEY not set"**
- Ensure `DOCUMENT_ENCRYPTION_KEY` is set in `.env`
- Key should be 64 characters (32 bytes hex-encoded)

**"Supabase bucket creation failed"**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase project permissions

**"Failed to upload to Supabase"**
- Verify network connectivity
- Check file size doesn't exceed 50MB limit
- Ensure Supabase quota not exceeded

## Future Enhancements

1. **Decryption on Retrieval**: Add endpoint to retrieve and decrypt documents
2. **Encryption Key Rotation**: Implement key rotation strategy
3. **Audit Logging**: Log all access to encrypted documents
4. **Compression**: Compress documents before encryption to reduce storage
5. **Backup Keys**: Store backup recovery keys securely
6. **Role-Based Access**: Implement document-level access control

## References

- [AES-256-GCM Documentation](https://en.wikipedia.org/wiki/Authenticated_encryption)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
