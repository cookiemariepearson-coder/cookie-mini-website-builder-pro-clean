import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const productionProjectRef = 'ghugpztxhrrdonaerwms';
const cookieConnectProjectRef = 'bxwcyrhnesqajlxopvzy';
const inputFlag = process.argv.indexOf('--input');
const inputDirectory = inputFlag >= 0 ? process.argv[inputFlag + 1] : '';
const targetUrl = String(process.env.RESTORE_TARGET_SUPABASE_URL || '').trim();
const targetServiceRoleKey = String(process.env.RESTORE_TARGET_SERVICE_ROLE_KEY || '').trim();
const targetProjectRef = String(process.env.RESTORE_TARGET_PROJECT_REF || '').trim();

if (process.env.ALLOW_ISOLATED_RESTORE !== 'YES') {
  throw new Error('Set ALLOW_ISOLATED_RESTORE=YES only for an approved isolated test project.');
}
if (!inputDirectory || !targetUrl || !targetServiceRoleKey || !targetProjectRef) {
  throw new Error('Storage restore requires --input and all RESTORE_TARGET_* environment variables.');
}
if ([productionProjectRef, cookieConnectProjectRef].includes(targetProjectRef) || [productionProjectRef, cookieConnectProjectRef].some(ref => targetUrl.includes(ref))) {
  throw new Error('Refusing to restore Storage objects into a protected live project.');
}

const inputRoot = path.resolve(inputDirectory);
const inventory = JSON.parse(await readFile(path.join(inputRoot, 'inventory.json'), 'utf8'));
const supabase = createClient(targetUrl, targetServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function safeObjectSource(bucketRoot, objectName) {
  const source = path.resolve(bucketRoot, objectName);
  if (!source.startsWith(`${bucketRoot}${path.sep}`)) {
    throw new Error('Storage object path escaped the restore directory.');
  }
  return source;
}

function safeBucketDirectory(root, bucketId) {
  const directory = path.resolve(root, 'objects', String(bucketId || ''));
  const objectsRoot = path.resolve(root, 'objects');
  if (!bucketId || !directory.startsWith(`${objectsRoot}${path.sep}`)) {
    throw new Error('Storage bucket path escaped the restore directory.');
  }
  return directory;
}

let restoredObjects = 0;
for (const bucket of inventory.buckets || []) {
  const { data: existingBucket, error: getError } = await supabase.storage.getBucket(bucket.id);
  if (getError && !String(getError.message || '').toLowerCase().includes('not found')) throw getError;
  if (!existingBucket) {
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: Boolean(bucket.public),
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes
    });
    if (error) throw new Error(`Target bucket creation failed: ${error.message}`);
  }

  const bucketRoot = safeBucketDirectory(inputRoot, bucket.id);
  for (const object of bucket.objects || []) {
    const bytes = await readFile(safeObjectSource(bucketRoot, object.path));
    const localChecksum = createHash('sha256').update(bytes).digest('hex');
    if (localChecksum !== object.sha256) throw new Error('A Storage object failed its pre-upload checksum.');

    const { error: uploadError } = await supabase.storage.from(bucket.id).upload(object.path, bytes, {
      upsert: false,
      contentType: object.contentType || undefined,
      cacheControl: object.cacheControl || undefined
    });
    if (uploadError) throw new Error(`Target Storage upload failed: ${uploadError.message}`);

    const { data: restored, error: downloadError } = await supabase.storage.from(bucket.id).download(object.path);
    if (downloadError || !restored) throw new Error(`Target Storage verification failed: ${downloadError?.message || 'no data'}`);
    const restoredChecksum = createHash('sha256').update(Buffer.from(await restored.arrayBuffer())).digest('hex');
    if (restoredChecksum !== object.sha256) throw new Error('A restored Storage object failed checksum verification.');
    restoredObjects += 1;
  }
}

console.log(`Isolated Storage restore verified: ${inventory.bucketCount || 0} bucket(s), ${restoredObjects} object(s).`);
