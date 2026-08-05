const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting ReMat Database Seeding...");

  // 1. Clean existing data (in reverse dependency order)
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.materialAlert.deleteMany();
  await prisma.circularReport.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.materialEmbedding.deleteMany();
  await prisma.materialDocument.deleteMany();
  await prisma.material.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.distributorProfile.deleteMany();
  await prisma.consumerProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Users & Profiles
  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@remat.id",
      passwordHash: "$2b$10$e8w8Gk7r...dummyhash",
      role: "ADMIN",
      name: "Super Admin ReMat",
      phone: "+6281100000001",
      isVerified: true
    }
  });

  // Distributor 1
  const dist1User = await prisma.user.create({
    data: {
      email: "distributor1@remat.id",
      passwordHash: "$2b$10$e8w8Gk7r...dummyhash",
      role: "DISTRIBUTOR",
      name: "Budi Santoso",
      phone: "+6281200000001",
      isVerified: true,
      distributorProfile: {
        create: {
          companyName: "PT Daur Ulang Nusantara",
          companyType: "Pabrik Pengolahan Limbah",
          address: "Jl. Industri Raya No. 45",
          city: "Semarang",
          latitude: -6.966667,
          longitude: 110.416664,
          isVerified: true
        }
      }
    },
    include: { distributorProfile: true }
  });

  // Distributor 2
  const dist2User = await prisma.user.create({
    data: {
      email: "distributor2@remat.id",
      passwordHash: "$2b$10$e8w8Gk7r...dummyhash",
      role: "DISTRIBUTOR",
      name: "Siti Rahma",
      phone: "+6281300000002",
      isVerified: true,
      distributorProfile: {
        create: {
          companyName: "CV Plastik Jaya Solo",
          companyType: "Pengepul Limbah Industri",
          address: "Jl. Veteran No. 12",
          city: "Surakarta",
          latitude: -7.566667,
          longitude: 110.816667,
          isVerified: true
        }
      }
    },
    include: { distributorProfile: true }
  });

  // Consumer 1
  const cons1User = await prisma.user.create({
    data: {
      email: "consumer1@remat.id",
      passwordHash: "$2b$10$e8w8Gk7r...dummyhash",
      role: "CONSUMER",
      name: "Agus Setiawan",
      phone: "+6281400000001",
      isVerified: true,
      consumerProfile: {
        create: {
          companyName: "PT Manufaktur Hijau Utama",
          industryType: "Daur Ulang Plastik",
          address: "Kawasan Industri Terboyo",
          city: "Semarang",
          latitude: -6.95,
          longitude: 110.45
        }
      }
    },
    include: { consumerProfile: true }
  });

  // Consumer 2
  const cons2User = await prisma.user.create({
    data: {
      email: "consumer2@remat.id",
      passwordHash: "$2b$10$e8w8Gk7r...dummyhash",
      role: "CONSUMER",
      name: "Dewi Lestari",
      phone: "+6281500000002",
      isVerified: true,
      consumerProfile: {
        create: {
          companyName: "EkoDaur Kreatif UMKM",
          industryType: "Kerajinan Daur Ulang",
          address: "Jl. Slamet Riyadi No. 88",
          city: "Surakarta",
          latitude: -7.56,
          longitude: 110.82
        }
      }
    },
    include: { consumerProfile: true }
  });

  console.log("✅ Users & Profiles created!");

  // 3. Categories
  const catPlastik = await prisma.category.create({
    data: { name: "Plastik Industri", slug: "plastik-industri" }
  });

  const catPET = await prisma.category.create({
    data: { name: "PET (Polyethylene Terephthalate)", slug: "pet", parentId: catPlastik.id }
  });

  const catLogam = await prisma.category.create({
    data: { name: "Logam & Alumunium", slug: "logam-alumunium" }
  });

  const catKaca = await prisma.category.create({
    data: { name: "Kaca & Sisa Botol", slug: "kaca-sisa-botol" }
  });

  const catTekstil = await prisma.category.create({
    data: { name: "Tekstil & Kain Majun", slug: "tekstil-kain-majun" }
  });

  console.log("✅ Categories created!");

  // 4. Materials
  const mat1 = await prisma.material.create({
    data: {
      distributorId: dist1User.distributorProfile.id,
      categoryId: catPET.id,
      materialCode: "MAT-PET-001",
      title: "Cacahan Plastik PET Bening Grade A",
      description: "Cacahan botol PET bersih cuci dingin, kadar air < 1%, tanpa tutup dan etiket.",
      qualityGrade: "Grade A",
      quantity: 15.5,
      unit: "TON",
      price: 11500000,
      currency: "IDR",
      location: "Semarang, Jawa Tengah",
      latitude: -6.966667,
      longitude: 110.416664,
      status: "ACTIVE",
      requiresMsds: false
    }
  });

  const mat2 = await prisma.material.create({
    data: {
      distributorId: dist2User.distributorProfile.id,
      categoryId: catLogam.id,
      materialCode: "MAT-LGM-002",
      title: "Scrap Alumunium Potongan Pabrik",
      description: "Sisa pemotongan plat alumunium tebal 2mm, bersih tanpa minyak berlebih.",
      qualityGrade: "Grade B",
      quantity: 5.0,
      unit: "TON",
      price: 24000000,
      currency: "IDR",
      location: "Surakarta, Jawa Tengah",
      latitude: -7.566667,
      longitude: 110.816667,
      status: "ACTIVE",
      requiresMsds: true
    }
  });

  const mat3 = await prisma.material.create({
    data: {
      distributorId: dist1User.distributorProfile.id,
      categoryId: catKaca.id,
      materialCode: "MAT-KCA-003",
      title: "Pecahan Kaca Bening Industri",
      description: "Pecahan botol kaca bening siap lebur untuk industri kemasan kaca.",
      qualityGrade: "Grade A",
      quantity: 20.0,
      unit: "TON",
      price: 4500000,
      currency: "IDR",
      location: "Semarang, Jawa Tengah",
      latitude: -6.966667,
      longitude: 110.416664,
      status: "ACTIVE",
      requiresMsds: false
    }
  });

  console.log("✅ Materials created!");

  // 5. Banners
  await prisma.banner.create({
    data: {
      title: "Gerakan Industri Bebas Limbah 2026",
      imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b",
      linkUrl: "/marketplace",
      isActive: true,
      order: 1,
      managedBy: adminUser.id
    }
  });

  // 6. Material Alerts
  await prisma.materialAlert.create({
    data: {
      consumerId: cons1User.consumerProfile.id,
      categoryId: catPET.id,
      queryText: "PET botol cacahan bening",
      locationFilter: "Jawa Tengah",
      isActive: true
    }
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
