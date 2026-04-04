# Testing & Verification Checklist

## Pre-Deployment Testing

### Setup Verification
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with all required variables
- [ ] Supabase project created and credentials added
- [ ] Encryption key generated and added (64 hex characters)
- [ ] Database URL configured
- [ ] All other environment variables from `.env.example` set

### Build & Startup
- [ ] Server starts without errors: `npm start`
- [ ] Database migrations run automatically
- [ ] Supabase bucket created/verified
- [ ] No "DOCUMENT_ENCRYPTION_KEY not set" error
- [ ] No database connection errors
- [ ] Server listens on correct port (5000)

### Endpoint Tests

#### 1. User Registration
```bash
POST http://localhost:5000/api/auth/register
{
  "username": "testuser@example.com",
  "password": "TestPassword123!"
}
```
✅ Expected: User created with tokens

#### 2. User Login
```bash
POST http://localhost:5000/api/auth/login
{
  "username": "testuser@example.com",
  "password": "TestPassword123!"
}
```
✅ Expected: Session established, token returned

#### 3. Get Current User
```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer {token_from_login}
```
✅ Expected: User profile returned with token count

#### 4. Upload & Analyze Document (with Encryption)
```bash
POST http://localhost:5000/api/documents/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- document: sample_document.pdf (or .docx, .txt)
- documentType: pdf
- summaryLength: standard
- language: en
```

**Verify Response:**
```json
{
  "document": {
    "id": "uuid-string",
    "filename": "sample_document.pdf",
    "isEncrypted": true,
    "encryptedStoragePath": "documents/{userId}/{documentId}/...",
    "uploadedAt": "2024-04-04T...",
    "documentType": "pdf"
  },
  "analysis": {
    "id": "uuid",
    "summary": "... summary text ...",
    "riskLevel": "medium|low|high",
    "keyTerms": ["term1", "term2"],
    "riskItems": [...],
    "clauses": [...],
    "recommendations": [...]
  },
  "remainingTokens": 2
}
```

✅ Verification Points:
- [ ] `isEncrypted` is `true`
- [ ] `encryptedStoragePath` contains "documents/"
- [ ] Analysis results present
- [ ] Remaining tokens decreased by 1
- [ ] No database errors
- [ ] No Supabase upload errors

#### 5. List User's Documents
```bash
GET http://localhost:5000/api/documents
Authorization: Bearer {token}
```

**Verify Response:**
```json
[
  {
    "id": "uuid",
    "filename": "sample_document.pdf",
    "isEncrypted": true,
    "encryptedStoragePath": "documents/...",
    "uploadedAt": "2024-04-04T...",
    "documentType": "pdf"
  }
]
```

✅ Verification Points:
- [ ] Array returned
- [ ] Contains uploaded document
- [ ] Correct metadata included

#### 6. Get Document Metadata
```bash
GET http://localhost:5000/api/documents/{documentId}
Authorization: Bearer {token}
```

**Verify Response:**
```json
{
  "id": "uuid",
  "filename": "sample_document.pdf",
  "isEncrypted": true,
  "encryptedStoragePath": "documents/...",
  "uploadedAt": "2024-04-04T...",
  "documentType": "pdf"
}
```

✅ Verification Points:
- [ ] Correct document returned
- [ ] Encryption metadata present
- [ ] Storage path accessible

#### 7. Download & Decrypt Document
```bash
GET http://localhost:5000/api/documents/{documentId}/download
Authorization: Bearer {token}
```

**Verify Response:**
```json
{
  "id": "uuid",
  "filename": "sample_document.pdf",
  "content": "... original decrypted document content ...",
  "uploadedAt": "2024-04-04T..."
}
```

✅ Verification Points:
- [ ] Content returned (decrypted properly)
- [ ] Content matches original file
- [ ] No decryption errors
- [ ] Correct file metadata

### Database Verification

#### Check Documents Table
```sql
SELECT * FROM documents WHERE user_id = 'test_user_id' LIMIT 1;
```

✅ Expected Columns:
- [ ] `id`
- [ ] `user_id`
- [ ] `filename`
- [ ] `content` (original content)
- [ ] `document_type`
- [ ] `encrypted_storage_path` (populated)
- [ ] `is_encrypted` (true)
- [ ] `uploaded_at`

### Supabase Verification

#### Check Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Verify bucket `documents` exists
3. Check folder structure:
   ```
   documents/
   └── {userId}/
       └── {documentId}/
           └── timestamp_filename.pdf
   ```

✅ Expected Files:
- [ ] Bucket `documents` exists
- [ ] Files organized by userId/documentId
- [ ] Files are not human-readable (encrypted)
- [ ] File size ≤ 50MB

### Encryption Verification

#### Test Encryption/Decryption
```bash
node -e "
const { EncryptionService } = require('./services/encryption.js');
const testContent = 'This is a test document';
const { encrypted } = EncryptionService.encryptDocument(testContent);
const decrypted = EncryptionService.decryptDocument(encrypted);
console.log('Original:', testContent);
console.log('Decrypted:', decrypted);
console.log('Match:', testContent === decrypted);
"
```

✅ Expected:
- [ ] Original and Decrypted match
- [ ] No errors during encryption/decryption

### Load & Stress Testing

#### Multiple Uploads
1. Upload 10 documents with varying sizes
2. Verify all are encrypted and stored
3. Check no token deduction issues

✅ Verification:
- [ ] All 10 documents encrypted
- [ ] All 10 stored in Supabase
- [ ] User tokens correctly decremented
- [ ] No database or Supabase errors

### Error Handling Verification

#### Missing Encryption Key
1. Remove/comment `DOCUMENT_ENCRYPTION_KEY` from `.env`
2. Try to upload document
```bash
POST http://localhost:5000/api/documents/upload
```

✅ Expected:
- [ ] Error message: "DOCUMENT_ENCRYPTION_KEY not set"
- [ ] Graceful error handling

#### Invalid Supabase Credentials
1. Update `SUPABASE_KEY` to invalid value
2. Try to upload document

✅ Expected:
- [ ] Error message about Supabase upload
- [ ] Token refunded (not consumed)
- [ ] Database not updated with invalid path

#### Large File (> 50MB)
1. Try to upload file > 50MB

✅ Expected:
- [ ] Supabase rejects upload
- [ ] Token refunded
- [ ] Error message about file size

#### Unauthorized Access
1. Try to access another user's document
```bash
GET http://localhost:5000/api/documents/{other_user_documentId}/download
Authorization: Bearer {your_token}
```

✅ Expected:
- [ ] 403 Forbidden error
- [ ] "Access denied" message

### Data Integrity Tests

#### Re-Encrypt Test
1. Upload document
2. Download and decrypt
3. Verify content exactly matches original

```bash
# Upload
POST /api/documents/upload → document_id = "abc123"

# Download
GET /api/documents/abc123/download → content should match original file
```

✅ Expected:
- [ ] Downloaded content identical to uploaded
- [ ] No data corruption

#### Tampering Detection
1. Manually modify encrypted file in Supabase
2. Try to download document

✅ Expected:
- [ ] Decryption fails
- [ ] Error: "Failed to decrypt" or "Authentication tag mismatch"

### Performance Benchmarks

#### Encryption Speed
- [ ] < 100ms for 1MB document
- [ ] < 500ms for 5MB document

#### Upload Speed
- [ ] < 2 seconds for 1MB (depends on network)
- [ ] < 10 seconds for 5MB

#### Decryption Speed
- [ ] < 100ms for 1MB document
- [ ] < 500ms for 5MB document

### Analytics & Monitoring

#### Check Logs
```bash
npm start 2>&1 | grep -i "supabase\|encrypt\|document"
```

✅ Expected Log Messages:
- [ ] "[SUPABASE] Document uploaded: documents/..."
- [ ] No ERROR level entries for encryption
- [ ] Proper API request/response logging

### Security Verification

#### Token Format
- [ ] User token present in auth response
- [ ] Token valid across multiple requests
- [ ] Token expires after configured time

#### Encryption Key Rotation Readiness
- [ ] Can generate new encryption key
- [ ] Old documents still decryptable (non-rotated)

### Browser/Client Testing

#### Upload via Browser
1. Use the frontend application
2. Upload a document through UI
3. Verify analysis appears
4. Download document if UI supports it

✅ Expected:
- [ ] Upload succeeds
- [ ] No console errors
- [ ] Analysis data displayed correctly
- [ ] Document marked as encrypted

### Cleanup & Verification

#### Delete Document
1. Upload document → get `documentId`
2. Delete via API or UI
3. Verify removed from all locations

```bash
# After deletion:
GET /api/documents → document not in list
GET /api/documents/{documentId} → 404 error
```

✅ Expected:
- [ ] Document removed from database
- [ ] Encrypted file removed from Supabase

## Deployment Checklist

Before going to production:
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Error handling working
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place
- [ ] Recovery procedures tested
- [ ] TLS/SSL configured
- [ ] Environment variables secured

## Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Decryption fails after key change | Key must remain same; implement key rotation if needed |
| Document uploads slow | Check network, file size, Supabase quota |
| Database migration fails | Ensure database connection, proper permissions |
| Supabase bucket not created | Check service role permissions in Supabase |

## Success Criteria

✅ All tests passing
✅ Documents encrypted before storage
✅ Encrypted files stored in Supabase
✅ Metadata stored in PostgreSQL
✅ Decryption works correctly
✅ Error handling graceful
✅ Performance acceptable
✅ Security verified
✅ Ready for production

---

**Last Updated**: April 4, 2026
**Status**: Ready for Production Deployment ✅
