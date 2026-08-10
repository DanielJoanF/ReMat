/**
 * Unit tests for embeddingService — Quality Validation, Status Tracking, Retries, and Reprocess Job.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, mockGenerateEmbedding } = vi.hoisted(() => {
  const executeRawUnsafe = vi.fn().mockResolvedValue(1);
  const queryRawUnsafe = vi.fn().mockResolvedValue([]);
  const db = {
    $executeRawUnsafe: executeRawUnsafe,
    $queryRawUnsafe: queryRawUnsafe
  };
  global.prisma = db;

  const mockGenEmb = vi.fn().mockResolvedValue({
    embedding: new Array(1536).fill(0.1),
    model: "text-embedding-3-small"
  });

  return { mockDb: db, mockGenerateEmbedding: mockGenEmb };
});

vi.mock("@remat/database", () => ({ prisma: mockDb }));

vi.mock("@remat/ai-core", () => ({
  generateEmbedding: mockGenerateEmbedding,
  isAvailable: () => true
}));

describe("embeddingService — Ingestion & Resilience", () => {
  let embeddingService;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    global.generateEmbeddingMock = mockGenerateEmbedding;
    mockGenerateEmbedding.mockResolvedValue({
      embedding: new Array(1536).fill(0.1),
      model: "text-embedding-3-small"
    });
    embeddingService = await import("../services/embeddingService.js");
  });

  it("marks material as 'low_quality' if text is too short (< 15 chars) without calling embedding API", async () => {
    // Title 'A', empty description & attributes -> text < 15 chars
    const res = await embeddingService.upsertMaterialEmbedding(
      "mat-short",
      "A",
      "",
      "",
      "",
      "",
      ""
    );

    expect(res.status).toBe("low_quality");
    expect(mockGenerateEmbedding).not.toHaveBeenCalled();
    expect(mockDb.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining("low_quality"),
      "mat-short",
      expect.any(String)
    );
  });

  it("successfully generates embedding and saves status 'success' when API calls succeed", async () => {
    mockGenerateEmbedding.mockResolvedValueOnce({
      embedding: new Array(1536).fill(0.05),
      model: "openai/text-embedding-3-small"
    });

    const res = await embeddingService.upsertMaterialEmbedding(
      "mat-good",
      "Besi Beton Heavy Duty 12mm",
      "Logam",
      "Besi beton kualitas grade A lokasi Jakarta",
      "KG",
      "A",
      "Jakarta"
    );

    expect(res.status).toBe("success");
    expect(mockGenerateEmbedding).toHaveBeenCalledTimes(1);
    expect(mockDb.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining("status = 'success'"),
      "mat-good",
      expect.stringContaining("[0.05,0.05"),
      "openai/text-embedding-3-small"
    );
  });

  it("retries up to maxRetries (3x) on transient API failures before marking status 'failed'", async () => {
    mockGenerateEmbedding.mockRejectedValue(new Error("API rate limit / network error"));

    const res = await embeddingService.upsertMaterialEmbedding(
      "mat-fail",
      "Material Tembaga Bekas",
      "Logam",
      "Tembaga murni bekas kabel industri",
      "KG",
      "A",
      "Surabaya",
      [],
      { maxRetries: 3 }
    );

    expect(res.status).toBe("failed");
    expect(mockGenerateEmbedding).toHaveBeenCalledTimes(3);
    expect(mockDb.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining("status = 'failed'"),
      "mat-fail",
      expect.stringContaining("Failed after 3 attempts")
    );
  });

  it("reprocessStaleEmbeddings fetches pending/failed materials and re-embeds them", async () => {
    mockDb.$queryRawUnsafe.mockResolvedValueOnce([
      {
        id: "mat-stale-1",
        title: "Kardus Bekas Pack",
        description: "Kardus bekas bersih 50kg",
        unit: "KG",
        qualityGrade: "B",
        location: "Bandung",
        categoryName: "Kertas",
        embeddingStatus: "failed"
      }
    ]);

    mockGenerateEmbedding.mockResolvedValueOnce({
      embedding: new Array(1536).fill(0.2),
      model: "openai/text-embedding-3-small"
    });

    const report = await embeddingService.reprocessStaleEmbeddings({ limit: 10 });

    expect(report.processed).toBe(1);
    expect(report.succeeded).toBe(1);
    expect(report.failed).toBe(0);
  });
});
