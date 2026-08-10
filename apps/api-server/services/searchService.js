/**
 * Smart Search Service — AI-powered semantic search with keyword fallback.
 *
 * Architecture (ARCHITECTURE.md §3.1):
 *   Query text → Embedding API → pgvector cosine similarity → ACTIVE materials
 *   Fallback: if Embedding API fails → keyword search via Prisma `contains`
 *
 * Threshold: configurable via SIMILARITY_THRESHOLD env var (default 0.55).
 *   Only candidates with cosine similarity >= threshold are returned.
 *   Filtered at query level (pgvector index-friendly) AND enforced at
 *   application level as a hard cutoff.
 */
const { prisma } = require("@remat/database");
const { generateEmbedding, isEmbeddingAvailable } = require("@remat/ai-core");

/**
 * Minimum cosine similarity score required for a search result to be returned.
 * Sourced from the SIMILARITY_THRESHOLD environment variable.
 * Default: 0.45 — empirically chosen to capture short single-word queries
 * (e.g. "besi" ~0.47) while rejecting truly unrelated terms (< 0.40).
 */
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD ?? "0.45");
const DEFAULT_LIMIT = 10;

/**
 * Perform semantic vector search using pgvector cosine similarity.
 * Falls back to keyword search if embedding API is unavailable.
 *
 * @param {string} queryText - User's search query
 * @param {object} filters - Optional filters { categoryId, location, limit }
 * @returns {object} { data, pagination, searchType, message?, showAlert? }
 */
const smartSearch = async (queryText, filters = {}) => {
  const { categoryId, location, limit = DEFAULT_LIMIT } = filters;
  const take = Math.min(parseInt(limit) || DEFAULT_LIMIT, 50);

  // Try AI-powered semantic search first
  try {
    if (!isEmbeddingAvailable()) {
      throw new Error("Embedding API not configured");
    }

    const { embedding } = await generateEmbedding(queryText);
    const vectorStr = `[${embedding.join(",")}]`;

    // Build WHERE clauses for additional filters
    let extraWhere = "";
    const params = [vectorStr, SIMILARITY_THRESHOLD, take];
    let paramIdx = 4; // $1=vector, $2=threshold, $3=limit

    if (categoryId) {
      extraWhere += ` AND m.category_id = $${paramIdx}`;
      params.push(categoryId);
      paramIdx++;
    }

    if (location) {
      extraWhere += ` AND m.location ILIKE $${paramIdx}`;
      params.push(`%${location}%`);
      paramIdx++;
    }

    // Raw SQL: cosine similarity search with JOIN to materials
    const sql = `
      SELECT
        m.id,
        m.title,
        m.description,
        m.material_code AS "materialCode",
        m.quality_grade AS "qualityGrade",
        m.quantity,
        m.unit,
        m.price,
        m.currency,
        m.location,
        m.latitude,
        m.longitude,
        m.status,
        m.created_at AS "createdAt",
        c.id AS "categoryId",
        c.name AS "categoryName",
        c.slug AS "categorySlug",
        dp.id AS "distributorId",
        dp.company_name AS "distributorName",
        dp.city AS "distributorCity",
        dp.is_verified AS "distributorVerified",
        1 - (me.embedding <=> $1::vector) AS similarity
      FROM material_embeddings me
      INNER JOIN materials m ON m.id = me.material_id
      INNER JOIN categories c ON c.id = m.category_id
      INNER JOIN distributor_profiles dp ON dp.id = m.distributor_id
      WHERE m.status = 'ACTIVE'
        AND (me.status IS NULL OR me.status = 'success')
        AND me.embedding IS NOT NULL
        AND 1 - (me.embedding <=> $1::vector) >= $2
        ${extraWhere}
      ORDER BY similarity DESC
      LIMIT $3
    `;

    const results = await prisma.$queryRawUnsafe(sql, ...params);

    // Hard cutoff: even if the SQL WHERE already filters, enforce the threshold
    // at the application layer as defense-in-depth. The top result (already
    // ORDER BY similarity DESC) determines relevance for the entire response.
    const topScore = results.length > 0 ? Number(results[0].similarity) : 0;
    if (results.length === 0 || topScore < SIMILARITY_THRESHOLD) {
      console.log(
        `[Search] No relevant results for "${queryText}" (top score: ${topScore.toFixed(4)}, threshold: ${SIMILARITY_THRESHOLD}). Returning empty.`
      );
      return {
        data: [],
        searchType: "semantic",
        message: "Tidak ada hasil relevan untuk pencarian ini.",
        showAlert: true
      };
    }

    // Format results
    const formatted = results.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      materialCode: r.materialCode,
      qualityGrade: r.qualityGrade,
      quantity: Number(r.quantity),
      unit: r.unit,
      price: Number(r.price),
      currency: r.currency,
      location: r.location,
      latitude: r.latitude ? Number(r.latitude) : null,
      longitude: r.longitude ? Number(r.longitude) : null,
      status: r.status,
      createdAt: r.createdAt,
      similarity: Number(Number(r.similarity).toFixed(4)),
      category: {
        id: r.categoryId,
        name: r.categoryName,
        slug: r.categorySlug
      },
      distributor: {
        id: r.distributorId,
        companyName: r.distributorName,
        city: r.distributorCity,
        isVerified: r.distributorVerified
      }
    }));

    return {
      data: formatted,
      searchType: "semantic",
      total: formatted.length
    };
  } catch (err) {
    // Fallback to keyword search
    console.warn(`[Search] AI search failed, falling back to keyword search: ${err.message}`);
    return keywordSearch(queryText, { categoryId, location, limit: take });
  }
};

/**
 * Keyword-based fallback search using Prisma `contains`.
 * Used when embedding API is unavailable or fails.
 */
const keywordSearch = async (queryText, filters = {}) => {
  const { categoryId, location, limit = DEFAULT_LIMIT } = filters;

  const where = { status: "ACTIVE" };

  // Text search on title, description, location, category, and distributor city
  if (queryText) {
    where.OR = [
      { title: { contains: queryText, mode: "insensitive" } },
      { description: { contains: queryText, mode: "insensitive" } },
      { location: { contains: queryText, mode: "insensitive" } },
      { category: { name: { contains: queryText, mode: "insensitive" } } },
      { distributor: { city: { contains: queryText, mode: "insensitive" } } },
      { distributor: { companyName: { contains: queryText, mode: "insensitive" } } }
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (location) where.location = { contains: location, mode: "insensitive" };

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        distributor: {
          select: {
            id: true,
            companyName: true,
            city: true,
            isVerified: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit) || DEFAULT_LIMIT
    }),
    prisma.material.count({ where })
  ]);

  if (materials.length === 0) {
    return {
      data: [],
      searchType: "keyword",
      fallback: true,
      message: "Maaf, material spesifik yang Anda cari belum tersedia saat ini.",
      showAlert: true
    };
  }

  return {
    data: materials,
    searchType: "keyword",
    fallback: true,
    fallbackReason: "Pencarian AI sedang dalam pemeliharaan, menampilkan hasil pencarian standar.",
    total
  };
};

module.exports = {
  smartSearch,
  keywordSearch,
  SIMILARITY_THRESHOLD
};
