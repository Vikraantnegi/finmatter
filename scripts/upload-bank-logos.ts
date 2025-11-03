/**
 * Script to copy logos from indian-banks repo and upload them to Supabase storage
 *
 * Usage:
 *   pnpm upload:bank-logos
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

// Bank name mapping: finmatter bank name -> indian-banks slug
const BANK_MAPPING: Record<string, string> = {
  hdfc: 'hdfc',
  icici: 'icic',
  sbi: 'sbin',
  axis: 'utib',
  yes: 'yesb',
  indusind: 'indb',
  idfc: 'idfb',
  kotak: 'kkbk',
  rbl: 'ratn',
  au: 'aubl',
  federal: 'fdrl',
  bob: 'barb',
  union: 'ubin',
  pnb: 'punb',
  scb: 'scbl',
  csb: 'csbk',
};

// Paths
const INDIAN_BANKS_REPO = path.resolve(PROJECT_ROOT, '..', 'indian-banks');
const TEMP_LOGO_DIR = path.resolve(PROJECT_ROOT, 'temp-bank-logos');
const BANKS_JSON_PATH = path.resolve(PROJECT_ROOT, 'data', 'banks.json');

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

const BUCKET_NAME = 'banks';

/**
 * Ensure the banks bucket exists, create if not
 */
async function ensureBucketExists() {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }

  const bankBucket = buckets?.find(bucket => bucket.name === BUCKET_NAME);

  if (!bankBucket) {
    console.log(`Creating bucket "${BUCKET_NAME}"...`);
    const { data, error } = await supabaseAdmin.storage.createBucket(
      BUCKET_NAME,
      {
        public: true, // Make bucket public for logo access
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/svg+xml', 'image/png'],
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
 * Copy logos from indian-banks repo to temp directory
 */
function copyLogos() {
  console.log('Copying logos from indian-banks repo...');

  // Create temp directory
  if (!fs.existsSync(TEMP_LOGO_DIR)) {
    fs.mkdirSync(TEMP_LOGO_DIR, { recursive: true });
  }

  const uploadedUrls: Record<
    string,
    { logoUrl: string; logoWithNameUrl: string }
  > = {};

  for (const [finmatterName, indianBanksSlug] of Object.entries(BANK_MAPPING)) {
    const sourceSymbolPath = path.join(
      INDIAN_BANKS_REPO,
      'assets',
      'logos',
      indianBanksSlug,
      'symbol.svg',
    );
    const sourceLogoPath = path.join(
      INDIAN_BANKS_REPO,
      'assets',
      'logos',
      indianBanksSlug,
      'logo.svg',
    );

    // Check if files exist
    if (!fs.existsSync(sourceSymbolPath)) {
      console.warn(
        `⚠️  Symbol not found for ${finmatterName} (${indianBanksSlug})`,
      );
      continue;
    }

    if (!fs.existsSync(sourceLogoPath)) {
      console.warn(
        `⚠️  Logo not found for ${finmatterName} (${indianBanksSlug})`,
      );
      continue;
    }

    // Copy to temp directory with finmatter name
    const destSymbolPath = path.join(
      TEMP_LOGO_DIR,
      `${finmatterName}-symbol.svg`,
    );
    const destLogoPath = path.join(TEMP_LOGO_DIR, `${finmatterName}-logo.svg`);

    fs.copyFileSync(sourceSymbolPath, destSymbolPath);
    fs.copyFileSync(sourceLogoPath, destLogoPath);

    console.log(`✓ Copied logos for ${finmatterName}`);
  }

  console.log('\n✅ All logos copied to temp directory');
}

/**
 * Upload a single logo file to Supabase storage
 */
async function uploadLogoFile(
  bankName: string,
  filePath: string,
  storagePath: string,
): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileContent, {
        contentType: 'image/svg+xml',
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
 * Upload logos to Supabase storage
 */
async function uploadLogos(): Promise<
  Record<string, { logoUrl: string; logoWithNameUrl: string }>
> {
  console.log('\nUploading logos to Supabase storage...');

  const uploadedUrls: Record<
    string,
    { logoUrl: string; logoWithNameUrl: string }
  > = {};

  // Upload logos from indian-banks repo
  for (const [finmatterName, indianBanksSlug] of Object.entries(BANK_MAPPING)) {
    const symbolPath = path.join(TEMP_LOGO_DIR, `${finmatterName}-symbol.svg`);
    const logoPath = path.join(TEMP_LOGO_DIR, `${finmatterName}-logo.svg`);

    // Check if files exist
    if (!fs.existsSync(symbolPath) || !fs.existsSync(logoPath)) {
      console.warn(`⚠️  Skipping ${finmatterName} - files not found`);
      continue;
    }

    try {
      // Upload symbol (logoUrl)
      const symbolStoragePath = `${finmatterName}/symbol.svg`;
      const symbolUrl = await uploadLogoFile(
        finmatterName,
        symbolPath,
        symbolStoragePath,
      );

      // Upload logo (logoWithNameUrl)
      const logoStoragePath = `${finmatterName}/logo.svg`;
      const logoUrl = await uploadLogoFile(
        finmatterName,
        logoPath,
        logoStoragePath,
      );

      if (symbolUrl && logoUrl) {
        uploadedUrls[finmatterName] = {
          logoUrl: symbolUrl,
          logoWithNameUrl: logoUrl,
        };
        console.log(`✓ Uploaded logos for ${finmatterName}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${finmatterName}:`, error);
    }
  }

  // Upload Amex logos from network icons repo
  const NETWORK_ICONS_REPO = path.resolve(
    PROJECT_ROOT,
    '..',
    'svg-credit-card-payment-icons',
  );

  if (fs.existsSync(NETWORK_ICONS_REPO)) {
    console.log('\nUploading Amex logos from network icons repo...');

    // Use Amex network icons as bank logos
    const amexFlatRoundedPath = path.join(
      NETWORK_ICONS_REPO,
      'flat-rounded',
      'amex.svg',
    );
    const amexLogoPath = path.join(NETWORK_ICONS_REPO, 'logo', 'amex.svg');

    if (fs.existsSync(amexFlatRoundedPath) && fs.existsSync(amexLogoPath)) {
      const symbolStoragePath = 'amex/symbol.svg';
      const logoStoragePath = 'amex/logo.svg';

      const symbolUrl = await uploadLogoFile(
        'amex',
        amexFlatRoundedPath,
        symbolStoragePath,
      );
      const logoUrl = await uploadLogoFile(
        'amex',
        amexLogoPath,
        logoStoragePath,
      );

      if (symbolUrl && logoUrl) {
        uploadedUrls['amex'] = {
          logoUrl: symbolUrl,
          logoWithNameUrl: logoUrl,
        };
        console.log('✓ Uploaded Amex logos from network icons');
      }
    } else {
      console.warn('⚠️  Amex network icons not found');
    }
  } else {
    console.warn('⚠️  Network icons repository not found');
  }

  // Upload HSBC logo from project root
  const HSBC_LOGO_PATH = path.resolve(PROJECT_ROOT, 'hsbc-rect.svg');

  if (fs.existsSync(HSBC_LOGO_PATH)) {
    console.log('\nUploading HSBC logo...');

    // Use the same file for both symbol and logo (it's rectangular, works for both)
    const symbolStoragePath = 'hsbc/symbol.svg';
    const logoStoragePath = 'hsbc/logo.svg';

    const symbolUrl = await uploadLogoFile(
      'hsbc',
      HSBC_LOGO_PATH,
      symbolStoragePath,
    );
    const logoUrl = await uploadLogoFile(
      'hsbc',
      HSBC_LOGO_PATH,
      logoStoragePath,
    );

    if (symbolUrl && logoUrl) {
      uploadedUrls['hsbc'] = {
        logoUrl: symbolUrl,
        logoWithNameUrl: logoUrl,
      };
      console.log('✓ Uploaded HSBC logo');
    }
  } else {
    console.warn('⚠️  HSBC logo file not found at:', HSBC_LOGO_PATH);
  }

  return uploadedUrls;
}

/**
 * Update banks.json with uploaded URLs
 */
function updateBanksJson(
  uploadedUrls: Record<string, { logoUrl: string; logoWithNameUrl: string }>,
) {
  console.log('\nUpdating banks.json...');

  try {
    // Read current banks.json
    const banksJson = JSON.parse(fs.readFileSync(BANKS_JSON_PATH, 'utf-8'));

    // Update each bank with URLs
    for (const bank of banksJson) {
      if (uploadedUrls[bank.name]) {
        bank.logoUrl = uploadedUrls[bank.name].logoUrl;
        bank.logoWithNameUrl = uploadedUrls[bank.name].logoWithNameUrl;
        console.log(`✓ Updated ${bank.name}`);
      } else {
        console.warn(`⚠️  No URLs found for ${bank.name}, skipping update`);
      }
    }

    // Write back to file
    fs.writeFileSync(
      BANKS_JSON_PATH,
      JSON.stringify(banksJson, null, 2),
      'utf-8',
    );
    console.log('✅ banks.json updated successfully');
  } catch (error) {
    console.error('❌ Failed to update banks.json:', error);
    throw error;
  }
}

/**
 * Clean up temp directory
 */
function cleanup() {
  console.log('\nCleaning up temp directory...');
  if (fs.existsSync(TEMP_LOGO_DIR)) {
    fs.rmSync(TEMP_LOGO_DIR, { recursive: true, force: true });
    console.log('✅ Temp directory cleaned');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting bank logo upload process...\n');

    // Ensure bucket exists
    await ensureBucketExists();

    // Copy logos from indian-banks repo
    copyLogos();

    // Upload to Supabase
    const uploadedUrls = await uploadLogos();

    // Display results
    console.log('\n📊 Upload Summary:');
    console.log('==================');
    Object.entries(uploadedUrls).forEach(([name, urls]) => {
      console.log(`\n${name}:`);
      console.log(`  Symbol URL: ${urls.logoUrl}`);
      console.log(`  Logo URL: ${urls.logoWithNameUrl}`);
    });

    // Update banks.json with URLs
    updateBanksJson(uploadedUrls);

    // Cleanup
    cleanup();

    console.log('\n✅ Process completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
