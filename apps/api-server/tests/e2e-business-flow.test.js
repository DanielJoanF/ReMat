import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb } = vi.hoisted(() => {
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
    $transaction: vi.fn((promises) => Promise.all(promises))
  };

  // Set global.prisma before packages/database/index.js is ever required
  global.prisma = mock;

  return { mockDb: mock };
});

vi.mock("@remat/database", () => {
  return {
    prisma: mockDb,
    PrismaClient: vi.fn()
  };
});

import request from "supertest";
import app from "../index.js";

describe("E2E Business Flow Verification (Non-AI)", () => {
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
        status: "ACTIVE"
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
});
