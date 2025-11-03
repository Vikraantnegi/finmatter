/**
 * Script to copy payment network icons from svg-credit-card-payment-icons repo
 * and upload them to Supabase storage
 *
 * Usage:
 *   pnpm upload:network-icons
 *
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root (finmatter directory) - go up one level from scripts/ directory
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Network icons to upload (prioritized list)
const NETWORKS = [
  'amex',
  'diners',
  'maestro',
  'mastercard',
  'visa',
  'discover',
  // Note: RuPay is not available in this repo
];

// Paths
const NETWORK_ICONS_REPO = path.resolve(
  PROJECT_ROOT,
  '..',
  'svg-credit-card-payment-icons',
);
const TEMP_ICONS_DIR = path.resolve(PROJECT_ROOT, 'temp-network-icons');

// Supabase configuration
const supabaseUrl = 'https://gzjlausszwdrrpyzdjwl.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6amxhdXNzendkcnJweXpkandsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ0Njg5MCwiZXhwIjoyMDc2MDIyODkwfQ.0G06kvMXr9jDzIPCUEWhEgHZ4vGLPixeGmpSUumR3DA';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY environment variables.',
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = 'network';

/**
 * Ensure the network bucket exists, create if not
 */
async function ensureBucketExists() {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }

  const networkBucket = buckets?.find(bucket => bucket.name === BUCKET_NAME);

  if (!networkBucket) {
    console.log(`Creating bucket "${BUCKET_NAME}"...`);
    const { data, error } = await supabaseAdmin.storage.createBucket(
      BUCKET_NAME,
      {
        public: true, // Make bucket public for icon access
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'image/svg+xml',
          'image/png',
          'image/jpeg',
          'image/jpg',
        ],
      },
    );

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    console.log(`Bucket "${BUCKET_NAME}" created successfully`);
  } else {
    console.log(`Bucket "${BUCKET_NAME}" already exists`);
  }
}

/**
 * Copy icons from network icons repo to temp directory
 */
function copyIcons() {
  console.log('Copying icons from svg-credit-card-payment-icons repo...');

  // Create temp directory
  if (!fs.existsSync(TEMP_ICONS_DIR)) {
    fs.mkdirSync(TEMP_ICONS_DIR, { recursive: true });
  }

  for (const network of NETWORKS) {
    const logoPath = path.join(NETWORK_ICONS_REPO, 'logo', `${network}.svg`);
    const flatRoundedPath = path.join(
      NETWORK_ICONS_REPO,
      'flat-rounded',
      `${network}.svg`,
    );

    // Check if files exist
    if (!fs.existsSync(logoPath)) {
      console.warn(`⚠️  Logo not found for ${network}`);
      continue;
    }

    if (!fs.existsSync(flatRoundedPath)) {
      console.warn(`⚠️  Flat-rounded not found for ${network}`);
      continue;
    }

    // Copy to temp directory
    const destLogoPath = path.join(TEMP_ICONS_DIR, `${network}-logo.svg`);
    const destFlatRoundedPath = path.join(
      TEMP_ICONS_DIR,
      `${network}-flat-rounded.svg`,
    );

    fs.copyFileSync(logoPath, destLogoPath);
    fs.copyFileSync(flatRoundedPath, destFlatRoundedPath);

    console.log(`✓ Copied icons for ${network}`);
  }

  console.log('\n✅ All icons copied to temp directory');
}

/**
 * Upload a single icon file to Supabase storage
 */
async function uploadIconFile(
  network: string,
  filePath: string,
  storagePath: string,
  contentType?: string,
): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath);

    // Determine content type from file extension if not provided
    let mimeType = contentType || 'image/svg+xml';
    if (!contentType) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileContent, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`❌ Failed to upload ${storagePath}:`, error.message);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${storagePath}:`, error);
    return null;
  }
}

/**
 * Upload icons to Supabase storage
 */
async function uploadIcons(): Promise<
  Record<string, { logoUrl: string; flatRoundedUrl: string }>
> {
  console.log('\nUploading icons to Supabase storage...');

  const uploadedUrls: Record<
    string,
    { logoUrl: string; flatRoundedUrl: string }
  > = {};

  for (const network of NETWORKS) {
    const logoPath = path.join(TEMP_ICONS_DIR, `${network}-logo.svg`);
    const flatRoundedPath = path.join(
      TEMP_ICONS_DIR,
      `${network}-flat-rounded.svg`,
    );

    // Check if files exist
    if (!fs.existsSync(logoPath) || !fs.existsSync(flatRoundedPath)) {
      console.warn(`⚠️  Skipping ${network} - files not found`);
      continue;
    }

    try {
      // Upload logo
      const logoStoragePath = `${network}/logo.svg`;
      const logoUrl = await uploadIconFile(network, logoPath, logoStoragePath);

      // Upload flat-rounded
      const flatRoundedStoragePath = `${network}/flat-rounded.svg`;
      const flatRoundedUrl = await uploadIconFile(
        network,
        flatRoundedPath,
        flatRoundedStoragePath,
      );

      if (logoUrl && flatRoundedUrl) {
        uploadedUrls[network] = {
          logoUrl,
          flatRoundedUrl,
        };
        console.log(`✓ Uploaded icons for ${network}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${network}:`, error);
    }
  }

  // Upload RuPay logos from project root (PNG/JPEG)
  const RUPAY_LOGO_PATH = path.resolve(PROJECT_ROOT, 'rupay-logo.png');
  const RUPAY_FLAT_ROUNDED_PATH = path.resolve(
    PROJECT_ROOT,
    'rupay-flat-rounded.jpeg',
  );

  if (
    fs.existsSync(RUPAY_LOGO_PATH) &&
    fs.existsSync(RUPAY_FLAT_ROUNDED_PATH)
  ) {
    console.log('\nUploading RuPay logos...');

    try {
      // Upload logo (PNG)
      const logoStoragePath = 'rupay/logo.png';
      const logoUrl = await uploadIconFile(
        'rupay',
        RUPAY_LOGO_PATH,
        logoStoragePath,
        'image/png',
      );

      // Upload flat-rounded (convert JPEG to PNG extension for compatibility)
      // Upload as PNG but keep JPEG content type - some storage systems handle this
      const flatRoundedStoragePath = 'rupay/flat-rounded.png';
      const flatRoundedUrl = await uploadIconFile(
        'rupay',
        RUPAY_FLAT_ROUNDED_PATH,
        flatRoundedStoragePath,
        'image/png',
      );

      if (logoUrl && flatRoundedUrl) {
        uploadedUrls['rupay'] = {
          logoUrl,
          flatRoundedUrl,
        };
        console.log('✓ Uploaded RuPay logos');
      }
    } catch (error) {
      console.error('❌ Error uploading RuPay logos:', error);
    }
  } else {
    console.warn('⚠️  RuPay logo files not found');
    console.warn(`   Looking for: ${RUPAY_LOGO_PATH}`);
    console.warn(`   Looking for: ${RUPAY_FLAT_ROUNDED_PATH}`);
  }

  return uploadedUrls;
}

/**
 * Clean up temp directory
 */
function cleanup() {
  console.log('\nCleaning up temp directory...');
  if (fs.existsSync(TEMP_ICONS_DIR)) {
    fs.rmSync(TEMP_ICONS_DIR, { recursive: true, force: true });
    console.log('✅ Temp directory cleaned');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting payment network icon upload process...\n');

    // Check if repo exists
    if (!fs.existsSync(NETWORK_ICONS_REPO)) {
      throw new Error(
        `Network icons repository not found at: ${NETWORK_ICONS_REPO}\n` +
          'Please ensure svg-credit-card-payment-icons is in the parent directory.',
      );
    }

    // Ensure bucket exists
    await ensureBucketExists();

    // Copy icons from network icons repo
    copyIcons();

    // Upload to Supabase
    const uploadedUrls = await uploadIcons();

    // Display results
    console.log('\n📊 Upload Summary:');
    console.log('==================');
    Object.entries(uploadedUrls).forEach(([network, urls]) => {
      console.log(`\n${network}:`);
      console.log(`  Logo URL: ${urls.logoUrl}`);
      console.log(`  Flat Rounded URL: ${urls.flatRoundedUrl}`);
    });

    // Note about uploaded networks
    if (uploadedUrls['rupay']) {
      console.log('\n✅ RuPay logos uploaded successfully (from local files)');
    }

    // Cleanup
    cleanup();

    console.log('\n✅ Process completed successfully!');
    console.log('\nIcons uploaded to Supabase storage bucket: "network"');
    console.log(
      'Storage structure: network/{network-name}/logo.svg and flat-rounded.svg',
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
