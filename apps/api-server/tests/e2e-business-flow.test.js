import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.OPENAI_API_KEY = "mock-key-test";

const { mockDb, mockGenerateEmbedding, mockIsAvailable } = vi.hoisted(() => {
  const mock = {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    distributorProfile: {
      findUnique: vi.fn()
    },
    consumerProfile: {
      findUnique: vi.fn()
    },
    material: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    materialDocument: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn()
    },
    transactionItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn()
    },
    transaction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    payment: {
      create: vi.fn(),
      findUnique: vi.fn()
    },
    rating: {
      create: vi.fn(),
      findUnique: vi.fn()
    },
    materialAlert: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    circularReport: {
      create: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn()
  };

  // Set global.prisma before packages/database/index.js is ever required
  global.prisma = mock;

  const mockGenEmb = vi.fn().mockResolvedValue({
    embedding: new Array(1536).fill(0.1),
    model: "text-embedding-3-small"
  });
  const mockIsAvail = vi.fn().mockReturnValue(true);

  return {
    mockDb: mock,
    mockGenerateEmbedding: mockGenEmb,
    mockIsAvailable: mockIsAvail
  };
});

vi.mock("openai", () => {
  return {
    OpenAI: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      }
    }))
  };
});

vi.mock("@remat/database", () => {
  return {
    prisma: mockDb,
    PrismaClient: vi.fn()
  };
});

vi.mock("@remat/ai-core", () => {
  return {
    generateEmbedding: mockGenerateEmbedding,
    isEmbeddingAvailable: mockIsAvailable,
    embedding: {
      generateEmbedding: mockGenerateEmbedding,
      isAvailable: mockIsAvailable,
      EXPECTED_DIMENSIONS: 1536,
      DEFAULT_MODEL: "text-embedding-3-small"
    }
  };
});

vi.mock("openai", () => {
  return {
    OpenAI: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      }
    }))
  };
});

import request from "supertest";
import app from "../index.js";

describe("E2E Business Flow Verification (Non-AI + AI RAG)", () => {
  const adminHeaders = {
    "x-user-id": "admin-123",
    "x-user-role": "ADMIN"
  };

  const dist1Headers = {
    "x-user-id": "dist-user-1",
    "x-user-role": "DISTRIBUTOR"
  };

  const dist2Headers = {
    "x-user-id": "dist-user-2",
    "x-user-role": "DISTRIBUTOR"
  };

  const cons1Headers = {
    "x-user-id": "cons-user-1",
    "x-user-role": "CONSUMER"
  };

  const cons2Headers = {
    "x-user-id": "cons-user-2",
    "x-user-role": "CONSUMER"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.$transaction.mockImplementation((promises) => Promise.all(promises));
    global.isEmbeddingAvailableMock = true;
    global.generateEmbeddingMock = vi.fn().mockResolvedValue({
      embedding: new Array(1536).fill(0.1),
      model: "text-embedding-3-small"
    });
    mockDb.$queryRawUnsafe.mockReset();
    mockDb.material.findMany.mockReset();
  });

  describe("Phase 1: Category Management (Admin)", () => {
    it("Admin can create category", async () => {
      mockDb.category.findUnique.mockResolvedValue(null);
      mockDb.category.create.mockResolvedValue({
        id: "cat-1",
        name: "Plastik PET",
        slug: "plastik-pet",
        parentId: null
      });

      const res = await request(app)
        .post("/categories")
        .set(adminHeaders)
        .send({ name: "Plastik PET", slug: "plastik-pet" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Plastik PET");
    });

    it("Non-admin cannot create category (403)", async () => {
      const res = await request(app)
        .post("/categories")
        .set(dist1Headers)
        .send({ name: "Plastik PET", slug: "plastik-pet" });

      expect(res.status).toBe(403);
    });
  });

  describe("Phase 2: Distributor Uploads Material & Workflow", () => {
    it("Distributor creates material -> status = DRAFT", async () => {
      mockDb.distributorProfile.findUnique.mockResolvedValue({ id: "dist-prof-1" });
      mockDb.category.findUnique.mockResolvedValue({ id: "cat-1", name: "Plastik PET" });
      mockDb.material.findUnique.mockResolvedValue(null); // code check
      mockDb.material.create.mockResolvedValue({
        id: "mat-100",
        distributorId: "dist-prof-1",
        categoryId: "cat-1",
        materialCode: "MAT-260805-ABCDEF",
        title: "Cacahan PET Bening",
        description: "Limbah cacahan botol plastik bening",
        quantity: 10,
        unit: "TON",
        price: 5000000,
        location: "Semarang",
        status: "DRAFT"
      });

      const res = await request(app)
        .post("/materials")
        .set(dist1Headers)
        .send({
          title: "Cacahan PET Bening",
          description: "Limbah cacahan botol plastik bening",
          categoryId: "cat-1",
          quantity: 10,
          unit: "TON",
          price: 5000000,
          location: "Semarang"
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("DRAFT");
    });

    it("Distributor submits material for review -> status = PENDING_REVIEW", async () => {
      mockDb.material.findUnique.mockResolvedValue({
        id: "mat-100",
        status: "DRAFT",
        distributor: { userId: "dist-user-1" }
      });
      mockDb.material.update.mockResolvedValue({
        id: "mat-100",
        status: "PENDING_REVIEW"
      });

      const res = await request(app)
        .patch("/materials/mat-100/submit")
        .set(dist1Headers);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("PENDING_REVIEW");
    });

    it("Admin approves material -> status = ACTIVE", async () => {
      mockDb.material.findUnique.mockResolvedValue({
        id: "mat-100",
        status: "PENDING_REVIEW"
      });
      mockDb.material.update.mockResolvedValue({
        id: "mat-100",
        title: "Cacahan PET Bening",
        description: "Limbah cacahan botol",
        status: "ACTIVE",
        category: { name: "Plastik PET" }
      });

      const res = await request(app)
        .patch("/admin/materials/mat-100/review")
        .set(adminHeaders)
        .send({ action: "approve" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ACTIVE");
    });
  });

  describe("Phase 3: Public Listing & Filtering", () => {
    it("Consumer lists ACTIVE materials with filters", async () => {
      mockDb.material.findMany.mockResolvedValue([
        {
          id: "mat-100",
          title: "Cacahan PET Bening",
          status: "ACTIVE",
          price: 5000000,
          quantity: 10,
          unit: "TON",
          location: "Semarang"
        }
      ]);
      mockDb.material.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/materials?location=Semarang&minPrice=1000000&maxPrice=10000000");

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe("ACTIVE");
    });
  });

  describe("Phase 4: Order Transaction Lifecycle", () => {
    it("Consumer creates order -> status = PENDING", async () => {
      mockDb.consumerProfile.findUnique.mockResolvedValue({ id: "cons-prof-1" });
      mockDb.material.findMany.mockResolvedValue([
        {
          id: "mat-100",
          title: "Cacahan PET Bening",
          price: 5000000,
          quantity: 10,
          status: "ACTIVE",
          distributor: { id: "dist-prof-1" }
        }
      ]);
      mockDb.transaction.create.mockResolvedValue({
        id: "tx-1",
        consumerId: "cons-prof-1",
        distributorId: "dist-prof-1",
        status: "PENDING",
        totalAmount: 10000000,
        items: [{ materialId: "mat-100", quantity: 2, unitPrice: 5000000, subtotal: 10000000 }]
      });

      const res = await request(app)
        .post("/transactions")
        .set(cons1Headers)
        .send({
          items: [{ materialId: "mat-100", quantity: 2 }],
          shippingAddress: "Jl. Pemuda No. 1, Semarang"
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.totalAmount).toBe(10000000);
    });

    it("Distributor confirms order -> status = CONFIRMED", async () => {
      mockDb.distributorProfile.findUnique.mockResolvedValue({ id: "dist-prof-1" });
      mockDb.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        status: "PENDING",
        distributorId: "dist-prof-1"
      });
      mockDb.transaction.update.mockResolvedValue({
        id: "tx-1",
        status: "CONFIRMED"
      });

      const res = await request(app)
        .patch("/transactions/tx-1/confirm")
        .set(dist1Headers);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("CONFIRMED");
    });

    it("Consumer pays -> status = PAID", async () => {
      mockDb.consumerProfile.findUnique.mockResolvedValue({ id: "cons-prof-1" });
      mockDb.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        status: "CONFIRMED",
        consumerId: "cons-prof-1",
        totalAmount: 10000000,
        payment: null
      });

      const mockPayment = {
        id: "pay-1",
        transactionId: "tx-1",
        amount: 10000000,
        method: "TRANSFER",
        status: "SUCCESS"
      };

      mockDb.$transaction.mockResolvedValue([
        mockPayment,
        { id: "tx-1", status: "PAID" }
      ]);

      const res = await request(app)
        .post("/transactions/tx-1/pay")
        .set(cons1Headers)
        .send({ method: "TRANSFER" });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("SUCCESS");
    });

    it("Distributor marks shipped -> status = SHIPPED", async () => {
      mockDb.distributorProfile.findUnique.mockResolvedValue({ id: "dist-prof-1" });
      mockDb.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        status: "PAID",
        distributorId: "dist-prof-1"
      });
      mockDb.transaction.update.mockResolvedValue({
        id: "tx-1",
        status: "SHIPPED"
      });

      const res = await request(app)
        .patch("/transactions/tx-1/ship")
        .set(dist1Headers);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("SHIPPED");
    });

    it("Consumer confirms receipt -> status = COMPLETED", async () => {
      mockDb.consumerProfile.findUnique.mockResolvedValue({ id: "cons-prof-1" });
      mockDb.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        status: "SHIPPED",
        consumerId: "cons-prof-1"
      });
      mockDb.transaction.update.mockResolvedValue({
        id: "tx-1",
        status: "COMPLETED"
      });

      const res = await request(app)
        .patch("/transactions/tx-1/receive")
        .set(cons1Headers);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("COMPLETED");
    });

    it("Consumer submits rating for completed transaction", async () => {
      mockDb.consumerProfile.findUnique.mockResolvedValue({ id: "cons-prof-1" });
      mockDb.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        status: "COMPLETED",
        consumerId: "cons-prof-1",
        distributorId: "dist-prof-1",
        rating: null
      });
      mockDb.rating.create.mockResolvedValue({
        id: "rate-1",
        transactionId: "tx-1",
        consumerId: "cons-prof-1",
        distributorId: "dist-prof-1",
        score: 5,
        comment: "Material berkualitas tinggi dan pengiriman cepat!"
      });

      const res = await request(app)
        .post("/transactions/tx-1/rate")
        .set(cons1Headers)
        .send({ score: 5, comment: "Material berkualitas tinggi dan pengiriman cepat!" });

      expect(res.status).toBe(201);
      expect(res.body.data.score).toBe(5);
    });
  });

  describe("Phase 5: Cross-Tenant & Role Security Controls", () => {
    it("Distributor 2 cannot edit Distributor 1's material (403)", async () => {
      mockDb.material.findUnique.mockResolvedValue({
        id: "mat-100",
        status: "DRAFT",
        distributor: { userId: "dist-user-1" }
      });

      const res = await request(app)
        .put("/materials/mat-100")
        .set(dist2Headers)
        .send({ title: "Hack Title" });

      expect(res.status).toBe(403);
    });

    it("Distributor 2 cannot confirm Consumer 1's order for Distributor 1 (403)", async () => {
      mockDb.distributorProfile.findUnique.mockResolvedValue({ id: "dist-prof-2" });
      mockDb.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        status: "PENDING",
        distributorId: "dist-prof-1"
      });

      const res = await request(app)
        .patch("/transactions/tx-1/confirm")
        .set(dist2Headers);

      expect(res.status).toBe(403);
    });

    it("Consumer 2 cannot pay for Consumer 1's order (403)", async () => {
      mockDb.consumerProfile.findUnique.mockResolvedValue({ id: "cons-prof-2" });
      mockDb.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        status: "CONFIRMED",
        consumerId: "cons-prof-1",
        totalAmount: 10000000,
        payment: null
      });

      const res = await request(app)
        .post("/transactions/tx-1/pay")
        .set(cons2Headers)
        .send({ method: "TRANSFER" });

      expect(res.status).toBe(403);
    });

    it("Consumer cannot rate uncompleted order (400)", async () => {
      mockDb.consumerProfile.findUnique.mockResolvedValue({ id: "cons-prof-1" });
      mockDb.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        status: "SHIPPED",
        consumerId: "cons-prof-1",
        distributorId: "dist-prof-1",
        rating: null
      });

      const res = await request(app)
        .post("/transactions/tx-1/rate")
        .set(cons1Headers)
        .send({ score: 5 });

      expect(res.status).toBe(400);
    });

    it("Distributor cannot make consumer purchase (403)", async () => {
      const res = await request(app)
        .post("/transactions")
        .set(dist1Headers)
        .send({ items: [{ materialId: "mat-100", quantity: 1 }] });

      expect(res.status).toBe(403);
    });
  });

  describe("Phase 6: AI Smart Search & Alerts", () => {
    it("Search requires query parameter", async () => {
      const res = await request(app)
        .get("/search");

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("'q' is required");
    });

    it("Semantic search returns results above threshold", async () => {
      mockIsAvailable.mockReturnValue(true);
      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        model: "text-embedding-3-small"
      });

      mockDb.$queryRawUnsafe.mockResolvedValue([
        {
          id: "mat-100",
          title: "Cacahan PET Bening",
          description: "Cacahan botol PET bersih",
          materialCode: "MAT-PET-001",
          qualityGrade: "Grade A",
          quantity: 15.5,
          unit: "TON",
          price: 11500000,
          currency: "IDR",
          location: "Semarang",
          latitude: -6.96,
          longitude: 110.41,
          status: "ACTIVE",
          createdAt: new Date(),
          categoryId: "cat-1",
          categoryName: "PET",
          categorySlug: "pet",
          distributorId: "dist-1",
          distributorName: "PT Daur Ulang",
          distributorCity: "Semarang",
          distributorVerified: true,
          similarity: 0.85
        }
      ]);

      const res = await request(app)
        .get("/search?q=plastik PET bening");

      expect(res.status).toBe(200);
      expect(res.body.searchType).toBe("semantic");
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].similarity).toBeGreaterThanOrEqual(0.6);
    });

    it("Semantic search returns empty + showAlert when below threshold", async () => {
      mockIsAvailable.mockReturnValue(true);
      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        model: "text-embedding-3-small"
      });

      mockDb.$queryRawUnsafe.mockResolvedValue([]);

      const res = await request(app)
        .get("/search?q=material yang tidak ada");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.showAlert).toBe(true);
      expect(res.body.message).toContain("belum tersedia");
    });

    it("Falls back to keyword search when Embedding API is unavailable", async () => {
      global.isEmbeddingAvailableMock = false;

      // Keyword search mock
      mockDb.material.findMany.mockResolvedValue([
        {
          id: "mat-100",
          title: "Cacahan PET Bening",
          description: "Cacahan botol PET bersih",
          status: "ACTIVE",
          category: { id: "cat-1", name: "PET", slug: "pet" },
          distributor: { id: "dist-1", companyName: "PT Daur Ulang", city: "Semarang", isVerified: true }
        }
      ]);
      mockDb.material.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/search?q=PET");

      expect(res.status).toBe(200);
      expect(res.body.searchType).toBe("keyword");
      expect(res.body.fallback).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it("Consumer can create material alert", async () => {
      mockDb.consumerProfile.findUnique.mockResolvedValue({ id: "cons-prof-1" });
      mockDb.materialAlert.create.mockResolvedValue({
        id: "alert-1",
        consumerId: "cons-prof-1",
        queryText: "kaca bening limbah",
        categoryId: null,
        locationFilter: "Jawa Tengah",
        isActive: true,
        category: null
      });

      const res = await request(app)
        .post("/alerts")
        .set(cons1Headers)
        .send({ queryText: "kaca bening limbah", locationFilter: "Jawa Tengah" });

      expect(res.status).toBe(201);
      expect(res.body.data.queryText).toBe("kaca bening limbah");
      expect(res.body.data.isActive).toBe(true);
    });

    it("Non-consumer cannot create alert (403)", async () => {
      const res = await request(app)
        .post("/alerts")
        .set(dist1Headers)
        .send({ queryText: "test" });

      expect(res.status).toBe(403);
    });
  });

  describe("Phase 7: Analytics Engine & Dashboard Insights", () => {
    it("Distributor fetches tenant-isolated dashboard insight with LLM narration", async () => {
      mockDb.distributorProfile.findUnique.mockResolvedValue({
        id: "dist-prof-1",
        companyName: "PT Daur Ulang Nusantara"
      });
      mockDb.transaction.findMany.mockResolvedValue([
        { id: "tx-1", status: "COMPLETED", totalAmount: 10000000, createdAt: new Date() },
        { id: "tx-2", status: "PENDING", totalAmount: 5000000, createdAt: new Date() }
      ]);
      mockDb.material.findMany.mockResolvedValue([
        { id: "mat-1", title: "Cacahan PET", price: 5000000, quantity: 10, unit: "TON", status: "ACTIVE", categoryId: "cat-1", category: { name: "Plastik PET" } }
      ]);
      mockDb.transactionItem.findMany.mockResolvedValue([
        { materialId: "mat-1", quantity: 2, subtotal: 10000000, material: { title: "Cacahan PET", unit: "TON" } }
      ]);

      global.isLlmAvailableMock = true;
      global.generateTextMock = vi.fn().mockResolvedValue("Perusahaan PT Daur Ulang Nusantara memiliki tren penjualan positif dengan total pendapatan Rp 10.000.000.");

      const res = await request(app)
        .get("/analytics/dashboard")
        .set(dist1Headers);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.companyName).toBe("PT Daur Ulang Nusantara");
      expect(res.body.data.metrics.summary.completedRevenue).toBe(10000000);
      expect(res.body.data.metrics.summary.pendingRevenue).toBe(5000000);
      expect(res.body.data.aiSummary).toContain("PT Daur Ulang Nusantara");
    });

    it("LLM Failure Fallback: Dashboard returns 200 OK with raw SQL metrics when LLM fails", async () => {
      mockDb.distributorProfile.findUnique.mockResolvedValue({
        id: "dist-prof-1",
        companyName: "PT Daur Ulang Nusantara"
      });
      mockDb.transaction.findMany.mockResolvedValue([]);
      mockDb.material.findMany.mockResolvedValue([]);
      mockDb.transactionItem.findMany.mockResolvedValue([]);

      global.isLlmAvailableMock = false; // Simulated LLM downtime/unconfigured API

      const res = await request(app)
        .get("/analytics/dashboard")
        .set(dist1Headers);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.aiSummary).toBeNull();
      expect(res.body.data.fallbackMessage).toContain("pemeliharaan");
    });

    it("Consumer cannot access distributor dashboard (403)", async () => {
      mockDb.consumerProfile.findUnique.mockResolvedValue({ id: "cons-prof-1" });

      const res = await request(app)
        .get("/analytics/dashboard")
        .set(cons1Headers);

      expect(res.status).toBe(403);
    });
  });

  describe("Phase 8: Circular Economy Report Engine", () => {
    it("Admin triggers manual circular report generation with verified mathematical formulas", async () => {
      mockDb.distributorProfile.findUnique.mockResolvedValue({
        id: "dist-prof-1",
        companyName: "PT Daur Ulang Nusantara",
        userId: "dist-user-1"
      });

      // Mock 1 completed transaction of 2 TONs (= 2000 KG)
      mockDb.transaction.findMany.mockResolvedValue([
        {
          id: "tx-10",
          distributorId: "dist-prof-1",
          status: "COMPLETED",
          totalAmount: 23000000,
          createdAt: new Date("2026-08-10T10:00:00Z"),
          items: [
            {
              materialId: "mat-100",
              quantity: 2,
              material: { id: "mat-100", unit: "TON" }
            }
          ]
        }
      ]);

      mockDb.material.findMany.mockResolvedValue([
        { quantity: 1, unit: "TON" } // 1000 kg unutilized inventory
      ]);

      mockDb.circularReport.upsert.mockImplementation(({ create }) => Promise.resolve({ id: "report-2026-08", ...create }));

      const res = await request(app)
        .post("/circular-reports/generate")
        .set(adminHeaders)
        .send({ distributorId: "dist-prof-1", period: "2026-08" });

      expect(res.status).toBe(201);
      const data = res.body.data;
      expect(data.period).toBe("2026-08");
      // 2 TON = 2000 KG
      expect(data.totalWasteUtilizedKg).toBe(2000);
      // Carbon saving: 2000 * 1.8 = 3600 KG CO2e
      expect(data.carbonSavingKg).toBe(3600);
      expect(data.economicValue).toBe(23000000);
      expect(data.transactionCount).toBe(1);
      // Diversion rate: 2000 / (2000 + 1000) * 100 = 66.67%
      expect(data.wasteDiversionRate).toBe(66.67);
      expect(data.circularScore).toBeGreaterThan(0);
    });

    it("Distributor lists historical circular reports for their own profile", async () => {
      mockDb.distributorProfile.findUnique.mockResolvedValue({ id: "dist-prof-1" });
      mockDb.circularReport.findMany.mockResolvedValue([
        { id: "rep-1", period: "2026-08", distributorId: "dist-prof-1", totalWasteUtilizedKg: 2000 }
      ]);

      const res = await request(app)
        .get("/circular-reports/my")
        .set(dist1Headers);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].period).toBe("2026-08");
    });

    it("Distributor 2 cannot access Distributor 1's circular report (403)", async () => {
      mockDb.circularReport.findUnique.mockResolvedValue({
        id: "rep-1",
        period: "2026-08",
        distributorId: "dist-prof-1",
        distributor: { id: "dist-prof-1", userId: "dist-user-1" }
      });

      const res = await request(app)
        .get("/circular-reports/rep-1")
        .set(dist2Headers);

      expect(res.status).toBe(403);
    });
  });
});
