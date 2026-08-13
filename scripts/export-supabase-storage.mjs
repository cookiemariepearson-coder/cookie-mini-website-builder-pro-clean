import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const outputFlag = process.argv.indexOf('--output');
const outputDirectory = outputFlag >= 0 ? process.argv[outputFlag + 1] : '';
const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!outputDirectory || !supabaseUrl || !serviceRoleKey) {
  throw new Error('Storage export requires --output, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY.');
}

const outputRoot = path.resolve(outputDirectory);
await mkdir(outputRoot, { recursive: true, mode: 0o700 });

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function listAllObjects(bucketId, prefix = '') {
  const objects = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucketId).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error) throw new Error(`Storage inventory failed for a bucket: ${error.message}`);
    const entries = data || [];
    for (const entry of entries) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.metadata) objects.push({ fullPath, metadata: entry.metadata });
      else objects.push(...await listAllObjects(bucketId, fullPath));
    }
    if (entries.length < 1000) break;
  }
  return objects;
}

function safeObjectDestination(bucketRoot, objectName) {
  const destination = path.resolve(bucketRoot, objectName);
  if (!destination.startsWith(`${bucketRoot}${path.sep}`)) {
    throw new Error('Storage object path escaped the backup directory.');
  }
  return destination;
}

function safeBucketDirectory(root, bucketId) {
  const directory = path.resolve(root, 'objects', String(bucketId || ''));
  const objectsRoot = path.resolve(root, 'objects');
  if (!bucketId || !directory.startsWith(`${objectsRoot}${path.sep}`)) {
    throw new Error('Storage bucket path escaped the backup directory.');
  }
  return directory;
}

const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
if (bucketError) throw new Error(`Storage bucket inventory failed: ${bucketError.message}`);

const inventory = { generatedAt: new Date().toISOString(), bucketCount: 0, objectCount: 0, knownBytes: 0, buckets: [] };

for (const bucket of buckets || []) {
  const bucketRoot = safeBucketDirectory(outputRoot, bucket.id);
  await mkdir(bucketRoot, { recursive: true, mode: 0o700 });
  const objects = await listAllObjects(bucket.id);
  const bucketInventory = {
    id: bucket.id,
    name: bucket.name,
    public: Boolean(bucket.public),
    fileSizeLimit: bucket.file_size_limit ?? null,
    allowedMimeTypes: bucket.allowed_mime_types ?? null,
    objects: []
  };

  for (const object of objects) {
    const { data, error } = await supabase.storage.from(bucket.id).download(object.fullPath);
    if (error || !data) throw new Error(`Storage object download failed: ${error?.message || 'no data'}`);
    const bytes = Buffer.from(await data.arrayBuffer());
    const destination = safeObjectDestination(bucketRoot, object.fullPath);
    await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await writeFile(destination, bytes, { mode: 0o600 });
    bucketInventory.objects.push({
      path: object.fullPath,
      size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      contentType: object.metadata?.mimetype || null,
      cacheControl: object.metadata?.cacheControl || null
    });
    inventory.objectCount += 1;
    inventory.knownBytes += bytes.length;
  }

  inventory.buckets.push(bucketInventory);
}

inventory.bucketCount = inventory.buckets.length;
await writeFile(path.join(outputRoot, 'inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`, { mode: 0o600 });
console.log(`Storage inventory complete: ${inventory.bucketCount} bucket(s), ${inventory.objectCount} object(s).`);
