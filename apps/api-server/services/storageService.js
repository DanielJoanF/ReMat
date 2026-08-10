/**
 * Supabase Storage service for file uploads.
 * Uses service role key for server-side uploads.
 */
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const BUCKET_NAME = "materials";

let supabase = null;

const getSupabaseClient = () => {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("[StorageService] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. File uploads will fail.");
    return null;
  }

  supabase = createClient(url, key, {
    realtime: { transport: WebSocket },
  });
  return supabase;
};

/**
 * Upload a file buffer to Supabase Storage.
 * @param {Buffer} fileBuffer
 * @param {string} fileName - Original file name
 * @param {string} contentType - MIME type
 * @param {string} folder - Sub-folder path (e.g. "material-id/photos")
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, contentType, folder) => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${folder}/${timestamp}-${safeName}`;

  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false
    });

  if (error) {
    const err = new Error(`Storage upload failed: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  // Get public URL
  const { data: urlData } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

/**
 * Delete a file from Supabase Storage by its public URL.
 * @param {string} publicUrl
 */
const deleteFile = async (publicUrl) => {
  const client = getSupabaseClient();
  if (!client) return;

  // Extract path from public URL
  const bucketPath = publicUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
  if (bucketPath.length < 2) return;

  const filePath = bucketPath[1];
  await client.storage.from(BUCKET_NAME).remove([filePath]);
};

module.exports = { uploadFile, deleteFile };
