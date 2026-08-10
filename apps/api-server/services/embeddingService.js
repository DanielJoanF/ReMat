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
 * Example output:
 *  "Besi Beton - Logam, grade A, per KG, lokasi Jakarta: Besi beton ulir 10mm..."
 */
const composeEmbeddingText = (title, categoryName, description, unit, qualityGrade, location) => {
  const parts = [`${title} - ${categoryName}`];
  if (qualityGrade) parts.push(`grade ${qualityGrade}`);
  if (unit) parts.push(`per ${unit}`);
  if (location) parts.push(`lokasi ${location.trim()}`);

  const header = parts.join(", ");
  const body = description ? description.trim() : "";
  return body ? `${header}: ${body}` : header;
};

/**
 * Upsert a material embedding in the database.
 * Uses raw SQL because Prisma doesn't support vector type natively.
 *
 * This is designed to be called fire-and-forget — failures are logged
 * but do NOT block material CRUD operations.
 *
 * @param {string} materialId
 * @param {string} title
 * @param {string} categoryName
 * @param {string} description
 * @param {string} [unit]         - e.g. "KG", "TON"
 * @param {string} [qualityGrade] - e.g. "A", "B"
 * @param {string} [location]     - e.g. "Jakarta"
 */
const upsertMaterialEmbedding = async (
  materialId,
  title,
  categoryName,
  description,
  unit,
  qualityGrade,
  location
) => {
  try {
    const text = composeEmbeddingText(title, categoryName, description, unit, qualityGrade, location);
    const { embedding, model } = await generateEmbedding(text);

    // Format vector as PostgreSQL array literal: [0.1,0.2,...]
    const vectorStr = `[${embedding.join(",")}]`;

    // Upsert: insert or update on conflict (material_id is unique)
    await prisma.$executeRawUnsafe(
      `INSERT INTO material_embeddings (id, material_id, embedding, embedding_model, updated_at)
       VALUES (gen_random_uuid(), $1, $2::vector, $3, NOW())
       ON CONFLICT (material_id)
       DO UPDATE SET embedding = $2::vector, embedding_model = $3, updated_at = NOW()`,
      materialId,
      vectorStr,
      model
    );

    console.log(`[Embedding] Upserted embedding for material ${materialId} (model: ${model})`);
  } catch (err) {
    // Non-blocking: log error but don't throw
    console.error(`[Embedding] Failed to upsert embedding for material ${materialId}:`, err.message);
  }
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

module.exports = {
  upsertMaterialEmbedding,
  deleteMaterialEmbedding,
  composeEmbeddingText
};
