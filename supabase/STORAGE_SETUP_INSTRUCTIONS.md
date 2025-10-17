# Supabase Storage Setup Instructions

## Setup Storage Bucket for PDF Statements

### 1. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Bucket name: `statements`
4. Make it **Private** (not public)
5. File size limit: 5MB
6. Allowed MIME types: `application/pdf`

### 2. Setup Storage Policies (RLS)

Run these policies in SQL Editor:

```sql
-- Policy: Users can upload their own statements
CREATE POLICY "Users can upload own statements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'statements'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own statements
CREATE POLICY "Users can view own statements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'statements'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own statements
CREATE POLICY "Users can delete own statements"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'statements'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Service role has full access
CREATE POLICY "Service role full access to statements"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'statements');
```

### 3. Verify Setup

Test that:

- Users can only access files in their own folder: `{user_id}/...`
- Files are organized: `{user_id}/{card_id}/{timestamp}-{filename}.pdf`
- Maximum file size is enforced (5MB)
- Only PDF files are accepted

### 4. Environment Variables

Ensure these are set in your `.env.local`:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

## File Structure

```
statements/
├── {user_id_1}/
│   ├── {card_id_1}/
│   │   ├── 1697123456789-statement-oct-2023.pdf
│   │   └── 1697234567890-statement-nov-2023.pdf
│   └── {card_id_2}/
│       └── 1697345678901-statement-oct-2023.pdf
└── {user_id_2}/
    └── {card_id_3}/
        └── 1697456789012-statement-sep-2023.pdf
```

## Testing

After setup, test with:

```bash
# Upload a test PDF
curl -X POST http://localhost:3000/api/statements/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-statement.pdf" \
  -F "cardId=YOUR_CARD_ID" \
  -F "bankName=hdfc"
```

## Troubleshooting

- **403 Forbidden**: Check RLS policies are correctly applied
- **413 Payload Too Large**: File exceeds 5MB limit
- **415 Unsupported Media Type**: File is not a PDF
- **Storage full**: Check your Supabase plan storage limits
