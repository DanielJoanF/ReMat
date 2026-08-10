/**
 * Embedding Ingestion Service
 *
 * Handles upserting material embeddings into the material_embeddings table
 * using Prisma raw SQL (Prisma doesn't support pgvector natively).
 */
const { prisma } = require("@remat/database");
const { generateEmbedding } = require("@remat/ai-core");

/**
 * Compose the text to embed from material fields.
 *
 * Format uses a structured template so the embedding captures:
 *  - What the material IS   (title, category)
 *  - What it's LIKE        (qualityGrade)
 *  - How it's MEASURED     (unit)
 *  - Where it IS           (location)
 *  - Additional context    (description)
 *
 * If description is empty or < 20 chars, attributes are automatically expanded
 * into the text to ensure the embedding vector has sufficient entropy.
 */
const composeEmbeddingText = (
  title,
  categoryName,
  description,
  unit,
  qualityGrade,
  location,
  tags = []
) => {
  const cleanTitle = (title || "").trim();
  const cleanCategory = (categoryName || "").trim();
  let body = (description || "").trim();
  const cleanUnit = (unit || "").trim();
  const cleanGrade = (qualityGrade || "").trim();
  const cleanLoc = (location || "").trim();

  // If description is empty or too short (< 20 chars), supplement with attribute fallback
  if (!body || body.length < 20) {
    const fallbackAttrs = [];
    if (cleanCategory) fallbackAttrs.push(`kategori: ${cleanCategory}`);
    if (cleanGrade) fallbackAttrs.push(`grade: ${cleanGrade}`);
    if (cleanUnit) fallbackAttrs.push(`satuan: ${cleanUnit}`);
    if (cleanLoc) fallbackAttrs.push(`lokasi: ${cleanLoc}`);
    if (Array.isArray(tags) && tags.length > 0) fallbackAttrs.push(`tags: ${tags.join(", ")}`);

    if (body) {
      body = `${body}. Detail: ${fallbackAttrs.join("; ")}`;
    } else {
      body = `Detail material: ${fallbackAttrs.join("; ")}`;
    }
  }

  const parts = [`${cleanTitle} - ${cleanCategory}`];
  if (cleanGrade) parts.push(`grade ${cleanGrade}`);
  if (cleanUnit) parts.push(`per ${cleanUnit}`);
  if (cleanLoc) parts.push(`lokasi ${cleanLoc}`);

  const header = parts.join(", ");
  return body ? `${header}: ${body}` : header;
};

/**
 * Validate embedding text length.
 * Minimum text length requirement: total text must be >= 15 chars and title >= 2 chars.
 */
const validateEmbeddingText = (title, text) => {
  if (!title || title.trim().length < 2) {
    return { isValid: false, reason: "Title too short (< 2 chars)" };
  }
  if (!text || text.trim().length < 15) {
    return { isValid: false, reason: "Composed embedding text too short (< 15 chars)" };
  }
  return { isValid: true };
};

/**
 * Helper to pause execution for backoff delay.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Upsert a material embedding in the database with status tracking and retry.
 *
 * @param {string} materialId
 * @param {string} title
 * @param {string} categoryName
 * @param {string} description
 * @param {string} [unit]
 * @param {string} [qualityGrade]
 * @param {string} [location]
 * @param {Array<string>} [tags]
 * @param {object} [options] { maxRetries: 3 }
 * @returns {Promise<{ status: string, model?: string, error?: string }>}
 */
const upsertMaterialEmbedding = async (
  materialId,
  title,
  categoryName,
  description,
  unit,
  qualityGrade,
  location,
  tags = [],
  options = {}
) => {
  const maxRetries = options.maxRetries ?? 3;
  const text = composeEmbeddingText(title, categoryName, description, unit, qualityGrade, location, tags);
  const validation = validateEmbeddingText(title, text);

  // If text quality is insufficient, record status as low_quality without calling embedding API
  if (!validation.isValid) {
    console.warn(`[Embedding] Material ${materialId} embedding skipped (${validation.reason}). Marking status as 'low_quality'.`);
    await prisma.$executeRawUnsafe(
      `INSERT INTO material_embeddings (id, material_id, embedding, embedding_model, status, error_message, updated_at)
       VALUES (gen_random_uuid(), $1, NULL, 'none', 'low_quality', $2, NOW())
       ON CONFLICT (material_id)
       DO UPDATE SET embedding = NULL, embedding_model = 'none', status = 'low_quality', error_message = $2, updated_at = NOW()`,
      materialId,
      validation.reason
    );
    return { status: "low_quality", reason: validation.reason };
  }

  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const { embedding, model } = await generateEmbedding(text);
      const vectorStr = `[${embedding.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO material_embeddings (id, material_id, embedding, embedding_model, status, error_message, updated_at)
         VALUES (gen_random_uuid(), $1, $2::vector, $3, 'success', NULL, NOW())
         ON CONFLICT (material_id)
         DO UPDATE SET embedding = $2::vector, embedding_model = $3, status = 'success', error_message = NULL, updated_at = NOW()`,
        materialId,
        vectorStr,
        model
      );

      console.log(`[Embedding] Upserted embedding for material ${materialId} (model: ${model}, attempt: ${attempt})`);
      return { status: "success", model };
    } catch (err) {
      lastError = err;
      console.warn(`[Embedding] Attempt ${attempt}/${maxRetries} failed for material ${materialId}: ${err.message}`);
      if (attempt < maxRetries) {
        const backoffMs = 500 * Math.pow(2, attempt - 1);
        await sleep(backoffMs);
      }
    }
  }

  // Record failure status if all retries exhausted
  const failureMsg = `Failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`;
  console.error(`[Embedding] [CRITICAL] Ingest failed for material ${materialId}: ${failureMsg}`);

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO material_embeddings (id, material_id, embedding, embedding_model, status, error_message, updated_at)
       VALUES (gen_random_uuid(), $1, NULL, 'failed_retry', 'failed', $2, NOW())
       ON CONFLICT (material_id)
       DO UPDATE SET status = 'failed', error_message = $2, updated_at = NOW()`,
      materialId,
      failureMsg
    );
  } catch (dbErr) {
    console.error(`[Embedding] Failed to update failure status in DB for material ${materialId}:`, dbErr.message);
  }

  return { status: "failed", error: failureMsg };
};

/**
 * Delete a material embedding.
 */
const deleteMaterialEmbedding = async (materialId) => {
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM material_embeddings WHERE material_id = $1`,
      materialId
    );
  } catch (err) {
    console.error(`[Embedding] Failed to delete embedding for material ${materialId}:`, err.message);
  }
};

/**
 * Re-process stale or failed embeddings (Job/Cron/Manual function).
 * Finds materials with missing or failed/pending/low_quality embeddings and re-processes them.
 *
 * @param {object} [options] { limit: 50, includeLowQuality: false }
 * @returns {Promise<{ processed: number, succeeded: number, failed: number, lowQuality: number }>}
 */
const reprocessStaleEmbeddings = async (options = {}) => {
  const { limit = 50, includeLowQuality = false } = options;

  const statusesToFetch = includeLowQuality
    ? ['failed', 'pending', 'low_quality']
    : ['failed', 'pending'];

  const rawMaterials = await prisma.$queryRawUnsafe(
    `SELECT m.id, m.title, m.description, m.unit, m.quality_grade AS "qualityGrade", m.location,
            c.name AS "categoryName", me.status AS "embeddingStatus"
     FROM materials m
     INNER JOIN categories c ON c.id = m.category_id
     LEFT JOIN material_embeddings me ON me.material_id = m.id
     WHERE m.status IN ('ACTIVE', 'PENDING_REVIEW')
       AND (me.id IS NULL OR me.status = ANY($1::text[]))
     LIMIT $2`,
    statusesToFetch,
    limit
  );

  console.log(`[Embedding Job] Found ${rawMaterials.length} materials requiring embedding re-process.`);

  let succeeded = 0;
  let failed = 0;
  let lowQuality = 0;

  for (const m of rawMaterials) {
    const res = await upsertMaterialEmbedding(
      m.id,
      m.title,
      m.categoryName,
      m.description,
      m.unit,
      m.qualityGrade,
      m.location
    );

    if (res.status === "success") succeeded++;
    else if (res.status === "low_quality") lowQuality++;
    else failed++;
  }

  return {
    processed: rawMaterials.length,
    succeeded,
    failed,
    lowQuality
  };
};

module.exports = {
  upsertMaterialEmbedding,
  deleteMaterialEmbedding,
  composeEmbeddingText,
  validateEmbeddingText,
  reprocessStaleEmbeddings
};
