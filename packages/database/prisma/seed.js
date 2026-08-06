const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting Complete ReMat Database Seeding...");

  // ==========================================
  // 1. CLEAN EXISTING DATA (Reverse Order)
  // ==========================================
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.materialAlert.deleteMany();
  await prisma.circularReport.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.materialDocument.deleteMany();
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM material_embeddings;`);
  } catch (err) {
    console.log("Skipped cleaning material_embeddings table or table is empty");
  }
  await prisma.material.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.distributorProfile.deleteMany();
  await prisma.consumerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleaned existing data.");

  // ==========================================
  // 2. USERS & PROFILES (Total: 21 Users)
  // ==========================================

  // Admin User (1)
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@remat.id",
      passwordHash: "$2b$10$e8w8Gk7r...dummyhash",
      role: "ADMIN",
      name: "Super Admin ReMat",
      phone: "+6281100000000",
      isVerified: true,
    },
  });

  // Distributors Data (8 Profiles)
  const distributorData = [
    { name: "Budi Santoso", email: "dist1@remat.id", company: "PT Daur Ulang Nusantara", type: "Pabrik Pengolahan", city: "Semarang", lat: -6.966667, lng: 110.416664 },
    { name: "Siti Rahma", email: "dist2@remat.id", company: "CV Plastik Jaya Solo", type: "Pengepul Limbah", city: "Surakarta", lat: -7.566667, lng: 110.816667 },
    { name: "Hendra Wijaya", email: "dist3@remat.id", company: "PT Logam Makmur Abadi", type: "Pengolahan Metal", city: "Surabaya", lat: -7.257472, lng: 112.752088 },
    { name: "Dewi Kartika", email: "dist4@remat.id", company: "CV Kertas Nusantara", type: "Pengepul Kertas", city: "Bandung", lat: -6.917464, lng: 107.619123 },
    { name: "Rian Pratama", email: "dist5@remat.id", company: "PT Eco Kaca Indonesia", type: "Pengolahan Kaca", city: "Tangerang", lat: -6.178306, lng: 106.631889 },
    { name: "Maya Putri", email: "dist6@remat.id", company: "CV Tekstil Lestari", type: "Pengepul Kain", city: "Cimahi", lat: -6.872222, lng: 107.542500 },
    { name: "Agus Widodo", email: "dist7@remat.id", company: "PT Karet Sukses Mandiri", type: "Pengolahan Karet", city: "Sidoarjo", lat: -7.4478, lng: 112.7183 },
    { name: "Eko Prasetyo", email: "dist8@remat.id", company: "CV E-Waste Solusindo", type: "Pengepul Elektronik", city: "Bekasi", lat: -6.2383, lng: 106.9756 }
  ];

  const createdDistributors = [];
  for (let i = 0; i < distributorData.length; i++) {
    const d = distributorData[i];
    const user = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash: "$2b$10$e8w8Gk7r...dummyhash",
        role: "DISTRIBUTOR",
        name: d.name,
        phone: `+628120000000${i + 1}`,
        isVerified: true,
        distributorProfile: {
          create: {
            companyName: d.company,
            companyType: d.type,
            address: `Jl. Industri Utama No. ${i + 10}`,
            city: d.city,
            latitude: d.lat,
            longitude: d.lng,
            businessLicenseUrl: `https://gfvfwuybqscjdngtllrw.supabase.co/storage/v1/object/public/materials/licenses/siup-${i + 1}.pdf`,
            isVerified: true,
          },
        },
      },
      include: { distributorProfile: true },
    });
    createdDistributors.push(user);
  }

  // Consumers Data (12 Profiles)
  const consumerData = [
    { name: "Agus Setiawan", email: "cons1@remat.id", company: "PT Manufaktur Hijau Utama", type: "Daur Ulang Plastik", city: "Semarang", lat: -6.95, lng: 110.45 },
    { name: "Dewi Lestari", email: "cons2@remat.id", company: "EkoDaur Kreatif UMKM", type: "Kerajinan Daur Ulang", city: "Surakarta", lat: -7.56, lng: 110.82 },
    { name: "Fajar Nugraha", email: "cons3@remat.id", company: "PT Botol Daur Ulang", type: "Industri Kemasan", city: "Surabaya", lat: -7.26, lng: 112.74 },
    { name: "Nina Marlina", email: "cons4@remat.id", company: "CV Paper Box Mandiri", type: "Industri Karton", city: "Bandung", lat: -6.92, lng: 107.60 },
    { name: "Rudi Hermawan", email: "cons5@remat.id", company: "PT Metalindo Karya", type: "Peleburan Logam", city: "Tangerang", lat: -6.18, lng: 106.62 },
    { name: "Siska Putri", email: "cons6@remat.id", company: "CV Majun Bersama", type: "Industri Tekstil", city: "Cimahi", lat: -6.88, lng: 107.53 },
    { name: "Bambang Tri", email: "cons7@remat.id", company: "PT Vulkanisir Ban Jaya", type: "Industri Karet", city: "Sidoarjo", lat: -7.45, lng: 112.70 },
    { name: "Indah Permata", email: "cons8@remat.id", company: "PT Solder & Tembaga Utama", type: "Pengolahan Logam Presisi", city: "Bekasi", lat: -6.24, lng: 106.98 },
    { name: "Toni Sucipto", email: "cons9@remat.id", company: "CV Kerajinan Kaca Unik", type: "Kerajinan Kaca", city: "Yogyakarta", lat: -7.79, lng: 110.36 },
    { name: "Anita Rahayu", email: "cons10@remat.id", company: "PT Pupuk Organik Nusantara", type: "Pengolahan Kompos", city: "Magelang", lat: -7.47, lng: 110.21 },
    { name: "Hadi Kusuma", email: "cons11@remat.id", company: "PT Daur Ulang Elektronik", type: "Ekstraksi PCB", city: "Jakarta Utara", lat: -6.13, lng: 106.88 },
    { name: "Yulia Farida", email: "cons12@remat.id", company: "CV Eco Fashion Indonesia", type: "Fashion Berkelanjutan", city: "Denpasar", lat: -8.67, lng: 115.21 }
  ];

  const createdConsumers = [];
  for (let i = 0; i < consumerData.length; i++) {
    const c = consumerData[i];
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: "$2b$10$e8w8Gk7r...dummyhash",
        role: "CONSUMER",
        name: c.name,
        phone: `+62813000000${i < 9 ? '0' + (i + 1) : (i + 1)}`,
        isVerified: true,
        consumerProfile: {
          create: {
            companyName: c.company,
            industryType: c.type,
            address: `Kawasan Industri Sentra No. ${i + 1}`,
            city: c.city,
            latitude: c.lat,
            longitude: c.lng,
          },
        },
      },
      include: { consumerProfile: true },
    });
    createdConsumers.push(user);
  }

  console.log("Users & Profiles created (1 Admin, 8 Distributors, 12 Consumers).");

  // ==========================================
  // 3. CATEGORIES (Total: 10)
  // ==========================================
  const categoriesDef = [
    { name: "Plastik", slug: "plastik" },
    { name: "Kertas & Kardus", slug: "kertas-kardus" },
    { name: "Logam", slug: "logam" },
    { name: "Kaca", slug: "kaca" },
    { name: "Elektronik", slug: "elektronik" },
    { name: "Tekstil", slug: "tekstil" },
    { name: "Limbah Organik", slug: "limbah-organik" },
    { name: "Minyak Jelantah", slug: "minyak-jelantah" },
    { name: "Kayu", slug: "kayu" },
    { name: "Makanan", slug: "makanan" }
  ];

  const createdCategories = [];

  for (const cat of categoriesDef) {
    const createdCat = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
      },
    });
    createdCategories.push(createdCat);
  }

  console.log(`Categories created (Total: ${createdCategories.length} items).`);

  // ==========================================
  // 4. MATERIALS & EMBEDDINGS (Total: 47)
  // ==========================================
  const materialsToSeed = [
    // Plastik (Index 0)
    { title: "Cacahan Plastik PET Bening Grade A", catIdx: 0, unit: "KG" },
    { title: "Cacahan PET Warna Mix", catIdx: 0, unit: "KG" },
    { title: "Bijih Plastik HDPE Putih", catIdx: 0, unit: "KG" },
    { title: "HDPE Biru Crush", catIdx: 0, unit: "KG" },
    { title: "HDPE Hitam Industri", catIdx: 0, unit: "KG" },
    { title: "Pellet PP Injection Grade", catIdx: 0, unit: "KG" },
    { title: "LDPE Film Bening Press", catIdx: 0, unit: "KG" },
    { title: "Pipa PVC Scrap Potongan", catIdx: 0, unit: "KG" },
    { title: "Cacahan ABS Plastik Otomotif", catIdx: 0, unit: "KG" },
    { title: "Plastik Kemasan Sisa Pabrik", catIdx: 0, unit: "KG" },
    
    // Kertas & Kardus (Index 1)
    { title: "Kardus Bekas Box Packing Press", catIdx: 1, unit: "KG" },
    { title: "Kertas HVS Kantor Potongan", catIdx: 1, unit: "KG" },
    { title: "Koran Bekas Ikat Bersih", catIdx: 1, unit: "KG" },
    { title: "Buku Bekas Campuran", catIdx: 1, unit: "KG" },
    { title: "Kertas Duplex Sisa Cetak", catIdx: 1, unit: "KG" },
    { title: "Kertas Kraft Shredded", catIdx: 1, unit: "KG" },
    
    // Logam (Index 2)
    { title: "Scrap Alumunium Potongan Pabrik", catIdx: 2, unit: "TON" },
    { title: "Kawat Tembaga Stripped Super", catIdx: 2, unit: "KG" },
    { title: "Scrap Besi Berat H-Beam", catIdx: 2, unit: "TON" },
    { title: "Potongan Stainless Steel 304", catIdx: 2, unit: "KG" },
    { title: "Scrap Kuningan Brass Fitting", catIdx: 2, unit: "KG" },
    { title: "Kaleng Alumunium Press Baled", catIdx: 2, unit: "TON" },
    { title: "Plat Besi Scrap Sisa Potong", catIdx: 2, unit: "TON" },
    
    // Kaca (Index 3)
    { title: "Cullet Kaca Bening Siap Lebur", catIdx: 3, unit: "TON" },
    { title: "Botol Kaca Bening Utuh", catIdx: 3, unit: "PCS" },
    { title: "Botol Kaca Hijau Pecahan", catIdx: 3, unit: "TON" },
    { title: "Botol Kaca Coklat Cacahan", catIdx: 3, unit: "TON" },
    
    // Elektronik (Index 4)
    { title: "HP Bekas Rusak Mainboard", catIdx: 4, unit: "PCS" },
    { title: "Laptop Bekas Mati Part", catIdx: 4, unit: "PCS" },
    { title: "Kabel Tembaga Kupas", catIdx: 4, unit: "KG" },
    { title: "Charger Adapter Bekas Mix", catIdx: 4, unit: "PCS" },
    { title: "Scrap PCB Server Grade A", catIdx: 4, unit: "KG" },
    
    // Tekstil (Index 5)
    { title: "Pakaian Bekas Layak Pakai", catIdx: 5, unit: "KG" },
    { title: "Kain Perca Katun Putih", catIdx: 5, unit: "KG" },
    { title: "Sisa Denim Offcuts Garment", catIdx: 5, unit: "KG" },
    { title: "Limbah Kain Denim Cut-offs", catIdx: 5, unit: "KG" },
    
    // Limbah Organik (Index 6)
    { title: "Bahan Kompos Organik Matang", catIdx: 6, unit: "KG" },
    { title: "Limbah Pertanian Sekam Padi", catIdx: 6, unit: "TON" },
    { title: "Daun Kering Bahan Kompos", catIdx: 6, unit: "KG" },
    
    // Minyak Jelantah (Index 7)
    { title: "Minyak Jelantah Rumah Tangga", catIdx: 7, unit: "LITER" },
    { title: "Minyak Goreng Bekas UMKM", catIdx: 7, unit: "LITER" },
    { title: "Minyak Jelantah Catering Clean", catIdx: 7, unit: "LITER" },
    
    // Kayu (Index 8)
    { title: "Palet Kayu Pinus Bekas", catIdx: 8, unit: "PCS" },
    { title: "Potongan Kayu Sisa Mebel", catIdx: 8, unit: "KG" },
    { title: "Furnitur Kayu Bekas Kantor", catIdx: 8, unit: "PCS" },

    // Makanan (Index 9)
    { title: "Sisa Makanan Catering", catIdx: 9, unit: "KG" },
    { title: "Sisa Sayur & Buah Supermarket", catIdx: 9, unit: "KG" }
  ];

  const units = ["TON", "KG", "LITER", "PCS"];
  const statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "DRAFT", "SOLD_OUT"];
  const createdMaterials = [];

  for (let i = 0; i < materialsToSeed.length; i++) {
    const item = materialsToSeed[i];
    const distUser = createdDistributors[i % createdDistributors.length];
    const category = createdCategories[item.catIdx];
    const status = statuses[i % statuses.length];
    const unit = item.unit;

    const mat = await prisma.material.create({
      data: {
        distributorId: distUser.distributorProfile.id,
        categoryId: category.id,
        materialCode: `MAT-${(i + 1).toString().padStart(3, '0')}`,
        title: item.title,
        description: `Stok material daur ulang ${item.title} berkualitas tinggi dari ${distUser.distributorProfile.companyName}, siap diolah kembali.`,
        qualityGrade: i % 2 === 0 ? "Grade A" : "Grade B",
        quantity: Math.floor(Math.random() * 50) + 5,
        unit: unit,
        price: (Math.floor(Math.random() * 20) + 2) * 10000,
        currency: "IDR",
        location: `${distUser.distributorProfile.city}, Indonesia`,
        latitude: distUser.distributorProfile.latitude,
        longitude: distUser.distributorProfile.longitude,
        status: status,
        requiresMsds: i % 3 === 0,
      },
    });
    createdMaterials.push(mat);

    // Create corresponding pgvector embedding via raw SQL
    try {
      const dummyVector = JSON.stringify(Array.from({ length: 1536 }, () => (Math.random() * 2 - 1).toFixed(4)));
      await prisma.$executeRawUnsafe(
        `INSERT INTO material_embeddings (id, material_id, embedding, embedding_model, updated_at) 
         VALUES (gen_random_uuid(), '${mat.id}', '${dummyVector}'::vector, 'text-embedding-3-small', NOW());`
      );
    } catch (e) {
      // Ignore if pgvector extension is not fully loaded
    }
  }

  console.log(`${createdMaterials.length} Materials created.`);

  // ==========================================
  // 5. MATERIAL DOCUMENTS (Total: 90)
  // ==========================================
  const docTypes = ["MSDS", "CERTIFICATE", "PHOTO"];
  for (let i = 0; i < 90; i++) {
    const mat = createdMaterials[i % createdMaterials.length];
    const docType = docTypes[i % docTypes.length];
    
    await prisma.materialDocument.create({
      data: {
        materialId: mat.id,
        type: docType,
        fileUrl: docType === "PHOTO" 
          ? "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80"
          : `https://gfvfwuybqscjdngtllrw.supabase.co/storage/v1/object/public/materials/documents/doc-${mat.materialCode}-${i + 1}.pdf`,
      }
    });
  }

  console.log("90 Material Documents created.");

  // ==========================================
  // 6. BANNERS (Total: 5)
  // ==========================================
  const bannerTitles = [
    "Gerakan Industri Bebas Limbah 2026",
    "Solusi Ekonomi Sirkular Industri Indonesia",
    "Pasar Digital Limbah Industri Terverifikasi",
    "Program Pengurangan Jejak Karbon Industri",
    "Kemitraan Daur Ulang & Simbiosis Industri"
  ];

  for (let i = 0; i < bannerTitles.length; i++) {
    await prisma.banner.create({
      data: {
        title: bannerTitles[i],
        imageUrl: `https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80`,
        linkUrl: `/marketplace`,
        isActive: true,
        order: i + 1,
        managedBy: adminUser.id,
      }
    });
  }

  console.log("5 Banners created.");

  // ==========================================
  // 7. MATERIAL ALERTS (Total: 10)
  // ==========================================
  const alertQueries = ["Cacahan PET Bening", "HDPE Granules", "Tembaga Stripped", "Alumunium Scrap", "Kardus Press", "Kaca Cullet", "Kain Majun", "Karet Ban Truk", "PCB Server", "Besi Berat"];
  for (let i = 0; i < 10; i++) {
    const consumer = createdConsumers[i % createdConsumers.length];
    const category = createdCategories[i % createdCategories.length];

    await prisma.materialAlert.create({
      data: {
        consumerId: consumer.consumerProfile.id,
        categoryId: category.id,
        queryText: alertQueries[i],
        locationFilter: "Jawa Tengah",
        isActive: true,
      }
    });
  }

  console.log("10 Material Alerts created.");

  // ==========================================
  // 8. TRANSACTIONS, ITEMS & PAYMENTS (30 Tx)
  // ==========================================
  const txStatuses = ["PENDING", "CONFIRMED", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
  const paymentMethods = ["TRANSFER", "VIRTUAL_ACCOUNT", "EWALLET"];
  const paymentStatuses = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];

  const createdTransactions = [];

  for (let i = 0; i < 30; i++) {
    const consumer = createdConsumers[i % createdConsumers.length];
    const distributor = createdDistributors[i % createdDistributors.length];
    const txStatus = txStatuses[i % txStatuses.length];

    const transaction = await prisma.transaction.create({
      data: {
        consumerId: consumer.consumerProfile.id,
        distributorId: distributor.distributorProfile.id,
        totalAmount: 0,
        status: txStatus,
        shippingAddress: `${consumer.consumerProfile.address}, ${consumer.consumerProfile.city}`,
      }
    });

    let currentTotal = 0;
    for (let j = 0; j < 2; j++) {
      const mat = createdMaterials[(i * 2 + j) % createdMaterials.length];
      const qty = Math.floor(Math.random() * 5) + 1;
      const price = mat.price;
      const subtotal = qty * price;
      currentTotal += subtotal;

      await prisma.transactionItem.create({
        data: {
          transactionId: transaction.id,
          materialId: mat.id,
          quantity: qty,
          unitPrice: price,
          subtotal: subtotal,
        }
      });
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { totalAmount: currentTotal }
    });

    createdTransactions.push(transaction);

    await prisma.payment.create({
      data: {
        transactionId: transaction.id,
        method: paymentMethods[i % paymentMethods.length],
        status: paymentStatuses[i % paymentStatuses.length],
        amount: currentTotal,
        providerRefId: `PAY-REF-2026-${(i + 1).toString().padStart(4, '0')}`,
        paidAt: paymentStatuses[i % paymentStatuses.length] === "SUCCESS" ? new Date() : null,
      }
    });
  }

  console.log("30 Transactions, 60 Items, and 30 Payments created.");

  // ==========================================
  // 9. RATINGS (Total: 20)
  // ==========================================
  for (let i = 0; i < 20; i++) {
    const tx = createdTransactions[i];
    const distributor = createdDistributors[i % createdDistributors.length];

    await prisma.rating.create({
      data: {
        transactionId: tx.id,
        consumerId: tx.consumerId,
        distributorId: distributor.distributorProfile.id,
        score: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
        comment: "Material berkualitas sangat baik, pengiriman tepat waktu, respon penjual cepat & profesional!",
      }
    });
  }

  console.log("20 Ratings created.");

  // ==========================================
  // 10. CIRCULAR REPORTS (Total: 12 - Monthly)
  // ==========================================
  const periods = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];

  for (let i = 0; i < createdDistributors.length; i++) {
    const dist = createdDistributors[i];
    const period = periods[i % periods.length];

    await prisma.circularReport.create({
      data: {
        distributorId: dist.distributorProfile.id,
        period: period,
        totalWasteUtilizedKg: (i + 1) * 1500.5,
        wasteDiversionRate: 85.5 + (i % 10),
        carbonSavingKg: (i + 1) * 450.2,
        economicValue: (i + 1) * 50000000,
        transactionCount: 15 + i,
        circularScore: 8.5 + (i * 0.1),
        aiSummary: `Laporan Ekonomi Sirkular untuk ${dist.distributorProfile.companyName} periode ${period}. Diversi limbah mencapai ${(85.5 + (i % 10)).toFixed(1)}% dengan reduksi jejak karbon signifikan.`,
      }
    });
  }

  console.log("Circular Reports created.");

  // ==========================================
  // 11. CHAT CONVERSATIONS & MESSAGES (10 Convs, 20 Messages)
  // ==========================================
  for (let i = 0; i < 10; i++) {
    const consumer = createdConsumers[i];

    const conv = await prisma.chatConversation.create({
      data: {
        consumerId: consumer.consumerProfile.id,
      }
    });

    await prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        role: "USER",
        content: "Halo AI ReMat, tolong rekomendasikan cacahan plastik PET bening di Jawa Tengah.",
      }
    });

    await prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        role: "ASSISTANT",
        content: "Halo! Berdasarkan pencarian ketersediaan stok, kami merekomendasikan Cacahan Plastik PET Bening Grade A dari PT Daur Ulang Nusantara di Semarang.",
        contextUsed: { materialCode: "MAT-001" },
      }
    });
  }

  console.log("10 Chat Conversations & 20 Messages created.");

  console.log("All ReMat Seed Data Populated Successfully to Supabase!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });