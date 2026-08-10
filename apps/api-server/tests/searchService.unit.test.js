/**
 * Unit tests for searchService — SIMILARITY_THRESHOLD hard cutoff.
 *
 * What we verify:
 *  1. All candidates below threshold  → empty data[], showAlert: true
 *  2. Top candidate exactly at threshold → results returned
 *  3. Top candidate above threshold → results returned
 *  4. $queryRawUnsafe receives SIMILARITY_THRESHOLD as $2 parameter
 *  5. SIMILARITY_THRESHOLD env var overrides the default
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted so they run before any import) ──────────────────────────

const { mockDb, mockGenerateEmbedding, mockIsAvailable } = vi.hoisted(() => {
  const queryRawUnsafe = vi.fn();
  const materialFindMany = vi.fn();
  const materialCount = vi.fn().mockResolvedValue(0);

  const db = {
    material: { findMany: materialFindMany, count: materialCount },
    $queryRawUnsafe: queryRawUnsafe
  };
  global.prisma = db;

  const mockGenEmb = vi.fn().mockResolvedValue({
    embedding: new Array(1536).fill(0.1),
    model: "text-embedding-3-small"
  });
  const mockIsAvail = vi.fn().mockReturnValue(true);

  return { mockDb: db, mockGenerateEmbedding: mockGenEmb, mockIsAvailable: mockIsAvail };
});

vi.mock("@remat/database", () => ({ prisma: mockDb }));
vi.mock("@remat/ai-core", () => ({
  generateEmbedding: mockGenerateEmbedding,
  isEmbeddingAvailable: mockIsAvailable
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeRow = (score = 0.5, title = "Material Ummi", rawLexicalRank = 0) => ({
  id: "mat-1",
  title,
  description: "Material deskripsi umum",
  materialCode: "BB-001",
  qualityGrade: "A",
  quantity: 100,
  unit: "kg",
  price: 15000,
  currency: "IDR",
  location: "Jakarta",
  latitude: -6.2,
  longitude: 106.8,
  status: "ACTIVE",
  createdAt: new Date(),
  categoryId: "cat-1",
  categoryName: "Lainnya",
  categorySlug: "lainnya",
  distributorId: "dist-1",
  distributorName: "PT. Jaya",
  distributorCity: "Jakarta",
  distributorVerified: true,
  semanticScore: score,
  rawLexicalRank
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("searchService — SIMILARITY_THRESHOLD hard cutoff", () => {
  let smartSearch;
  let SIMILARITY_THRESHOLD;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("../services/searchService.js");
    smartSearch = mod.smartSearch;
    SIMILARITY_THRESHOLD = mod.SIMILARITY_THRESHOLD;
  });

  // ── 1. All results below threshold (SQL filters them out) ──────────────────
  it("returns empty data[] when SQL returns 0 rows (all below threshold)", async () => {
    mockDb.$queryRawUnsafe.mockResolvedValue([]);

    const result = await smartSearch("besi");

    expect(result.data).toEqual([]);
    expect(result.showAlert).toBe(true);
    expect(result.message).toMatch(/tidak ada hasil relevan/i);
  });

  // ── 2. App-level hard cutoff when top score < threshold ────────────────────
  it("returns empty data[] via app-level cutoff when top row score < threshold", async () => {
    const belowScore = SIMILARITY_THRESHOLD - 0.001;
    mockDb.$queryRawUnsafe.mockResolvedValue([makeRow(belowScore)]);

    const result = await smartSearch("kayu");

    expect(result.data).toEqual([]);
    expect(result.showAlert).toBe(true);
    expect(result.message).toMatch(/tidak ada hasil relevan/i);
  });

  // ── 3. Exactly at threshold is accepted ────────────────────────────────────
  it("returns results when top score equals threshold exactly", async () => {
    mockDb.$queryRawUnsafe.mockResolvedValue([makeRow(SIMILARITY_THRESHOLD, "Besi Beton")]);

    const result = await smartSearch("besi beton");

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.searchType).toBe("semantic");
  });

  // ── 4. Above threshold is accepted ─────────────────────────────────────────
  it("returns results when top score is above threshold", async () => {
    const highScore = Math.min(SIMILARITY_THRESHOLD + 0.15, 1.0);
    mockDb.$queryRawUnsafe.mockResolvedValue([makeRow(highScore, "Besi Beton")]);

    const result = await smartSearch("besi beton");

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.searchType).toBe("semantic");
    expect(result.showAlert).toBeUndefined();
  });

  // ── 5. queryText is passed as $2 to raw SQL ──────────────────────────────
  it("passes queryText as $2 parameter to raw SQL", async () => {
    mockDb.$queryRawUnsafe.mockResolvedValue([makeRow(SIMILARITY_THRESHOLD + 0.1)]);

    await smartSearch("besi");

    expect(mockDb.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    const callArgs = mockDb.$queryRawUnsafe.mock.calls[0];
    // callArgs[0]=sql, callArgs[1]=vectorStr, callArgs[2]=queryText, callArgs[3]=recallThreshold
    expect(callArgs[2]).toBe("besi");
  });

  // ── 6. Multi-row noise — all below threshold → empty ──────────────────────
  it("rejects all rows when every row has similarity < threshold (noise scenario)", async () => {
    const noiseRows = [
      { ...makeRow(SIMILARITY_THRESHOLD - 0.05), id: "m1", title: "Kayu" },
      { ...makeRow(SIMILARITY_THRESHOLD - 0.10), id: "m2", title: "Botol" },
      { ...makeRow(SIMILARITY_THRESHOLD - 0.20), id: "m3", title: "Plastik" }
    ];
    mockDb.$queryRawUnsafe.mockResolvedValue(noiseRows);

    const result = await smartSearch("besi");

    expect(result.data).toHaveLength(0);
    expect(result.showAlert).toBe(true);
    expect(result.message).toMatch(/tidak ada hasil relevan/i);
  });

  // ── 7. Default threshold is 0.45 ──────────────────────────────────────────
  it("uses 0.45 as the default when SIMILARITY_THRESHOLD env is not set", async () => {
    const original = process.env.SIMILARITY_THRESHOLD;
    delete process.env.SIMILARITY_THRESHOLD;
    vi.resetModules();

    const mod = await import("../services/searchService.js");
    expect(mod.SIMILARITY_THRESHOLD).toBe(0.45);

    if (original !== undefined) process.env.SIMILARITY_THRESHOLD = original;
  });

  // ── 8. Env var override is respected ──────────────────────────────────────
  it("reads SIMILARITY_THRESHOLD from the SIMILARITY_THRESHOLD env var", async () => {
    process.env.SIMILARITY_THRESHOLD = "0.70";
    vi.resetModules();

    const mod = await import("../services/searchService.js");
    expect(mod.SIMILARITY_THRESHOLD).toBe(0.70);

    delete process.env.SIMILARITY_THRESHOLD;
  });
});
