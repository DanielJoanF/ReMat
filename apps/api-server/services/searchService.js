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
 * Perform hybrid search combining PostgreSQL tsvector/tsquery (lexical)
 * and pgvector cosine similarity (semantic).
 *
 * Scoring Formula (ARCHITECTURE.md §3.1 & Phase 3.3):
 *   finalScore = (lexicalScore * wLexical) + (semanticScore * wSemantic) + categoryIntentBoost
 *
 * Short Query Rule (1 word):
 *   wLexical = 0.7, wSemantic = 0.3 (lexical match priority to eliminate semantic noise)
 * Multi-word Query:
 *   wLexical = 0.4, wSemantic = 0.6
 *
 * @param {string} queryText - User's search query
 * @param {object} filters - Optional filters { categoryId, location, limit }
 * @returns {object} { data, pagination, searchType, message?, showAlert? }
 */
const smartSearch = async (queryText, filters = {}) => {
  const { categoryId, location, limit = DEFAULT_LIMIT } = filters;
  const take = Math.min(parseInt(limit) || DEFAULT_LIMIT, 50);

  const queryWords = (queryText || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (queryWords.length === 0) {
    return { data: [], searchType: "hybrid", total: 0 };
  }

  // Short query special handling (single word)
  const isShortQuery = queryWords.length <= 1;
  const weightLexical = isShortQuery ? 0.7 : 0.4;
  const weightSemantic = isShortQuery ? 0.3 : 0.6;

  // Try AI-powered hybrid search
  try {
    if (!isEmbeddingAvailable()) {
      throw new Error("Embedding API not configured");
    }

    // Fetch categories for category intent re-ranking
    let categories = [];
    try {
      if (prisma.category && typeof prisma.category.findMany === "function") {
        categories = (await prisma.category.findMany({ select: { id: true, name: true, slug: true } })) || [];
      }
    } catch (e) {
      categories = [];
    }

    const matchedCategoryIds = categories
      .filter((c) =>
        queryWords.some((w) => c.name.toLowerCase().includes(w) || c.slug.toLowerCase().includes(w))
      )
      .map((c) => c.id);

    const { embedding } = await generateEmbedding(queryText);
    const vectorStr = `[${embedding.join(",")}]`;

    // SQL query params: $1 = vectorStr, $2 = queryText, $3 = minimum semantic threshold for recall
    const params = [vectorStr, queryText, 0.25];
    let paramIdx = 4;
    let extraWhere = "";

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

    // Raw SQL: Hybrid PostgreSQL Full-Text Search (tsvector/tsquery) + pgvector Cosine Similarity
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
        COALESCE(1 - (me.embedding <=> $1::vector), 0) AS "semanticScore",
        ts_rank(
          to_tsvector('simple', COALESCE(m.title, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(c.name, '')),
          plainto_tsquery('simple', $2)
        ) AS "rawLexicalRank"
      FROM materials m
      INNER JOIN categories c ON c.id = m.category_id
      INNER JOIN distributor_profiles dp ON dp.id = m.distributor_id
      LEFT JOIN material_embeddings me ON me.material_id = m.id AND (me.status IS NULL OR me.status = 'success') AND me.embedding IS NOT NULL
      WHERE m.status = 'ACTIVE'
        AND (
          (me.embedding IS NOT NULL AND 1 - (me.embedding <=> $1::vector) >= $3)
          OR
          to_tsvector('simple', COALESCE(m.title, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(c.name, '')) @@ plainto_tsquery('simple', $2)
        )
        ${extraWhere}
    `;

    const results = await prisma.$queryRawUnsafe(sql, ...params);

    // Hybrid Re-ranking & Score Fusion
    const scoredCandidates = results.map((r) => {
      const semScore = Number(r.semanticScore ?? r.similarity ?? 0);
      const rawLex = Number(r.rawLexicalRank ?? r.lexicalScore ?? 0);

      // Normalize lexical score: ts_rank scaling + exact title token match bonus
      let lexScore = Math.min(rawLex * 5.0, 1.0);
      const titleLower = (r.title || "").toLowerCase();

      // Bonus if title contains exact query word boundary match
      if (queryWords.some((w) => new RegExp(`\\b${w}\\b`, "i").test(titleLower))) {
        lexScore = Math.max(lexScore, 0.7) + 0.2;
      }
      lexScore = Math.min(lexScore, 1.0);

      // Base hybrid score
      let finalScore = (lexScore * weightLexical) + (semScore * weightSemantic);

      // Category Intent Re-ranking boost (+0.15)
      if (matchedCategoryIds.includes(r.categoryId)) {
        finalScore += 0.15;
      }

      return {
        ...r,
        semanticScore: Number(semScore.toFixed(4)),
        lexicalScore: Number(lexScore.toFixed(4)),
        finalScore: Number(finalScore.toFixed(4))
      };
    });

    // Hard cutoff: filter candidates below SIMILARITY_THRESHOLD
    const validResults = scoredCandidates.filter((r) => r.finalScore >= SIMILARITY_THRESHOLD);
    validResults.sort((a, b) => b.finalScore - a.finalScore);

    if (validResults.length === 0) {
      console.log(
        `[Search] No relevant results for "${queryText}" (threshold: ${SIMILARITY_THRESHOLD}). Returning empty.`
      );
      return {
        data: [],
        searchType: "semantic",
        message: "Tidak ada hasil relevan untuk pencarian ini.",
        showAlert: true
      };
    }

    const limited = validResults.slice(0, take);

    // Format results
    const formatted = limited.map((r) => ({
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
      similarity: r.finalScore,
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
