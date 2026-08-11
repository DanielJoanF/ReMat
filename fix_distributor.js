const fs = require('fs');
const { PrismaClient } = require("./packages/database/node_modules/@prisma/client");
const prisma = new PrismaClient();

const danielDistributorProfileId = '6042c93c-f9d4-478f-a9a7-bbcb5e8b8273'; // Belongs to user 8e72ce27-f933-476d-a425-0a576528db76 (Daniel Joan)

async function run() {
  console.log("Updating database records to correct distributor...");
  const updateRes = await prisma.material.updateMany({
    where: { distributorId: '4d7a04ee-6142-4ccc-98ab-81a81d57b35c' },
    data: { distributorId: danielDistributorProfileId }
  });
  console.log(`Updated ${updateRes.count} materials in DB to distributorId = ${danielDistributorProfileId}`);
  await prisma.$disconnect();
}

run().catch(console.error);

// Update CSV file
const csvContent = fs.readFileSync('/home/niel/Documents/ReMat/remat_seed_materials_distributor.csv', 'utf8');
const updatedCsv = csvContent.replace(/4d7a04ee-6142-4ccc-98ab-81a81d57b35c/g, danielDistributorProfileId);
fs.writeFileSync('/home/niel/Documents/ReMat/remat_seed_materials_distributor.csv', updatedCsv);
console.log("CSV file updated with correct distributor_id (6042c93c-f9d4-478f-a9a7-bbcb5e8b8273).");

// Update SQL file
const sqlContent = fs.readFileSync('/home/niel/Documents/ReMat/remat_seed_materials_distributor.sql', 'utf8');
const updatedSql = sqlContent.replace(/4d7a04ee-6142-4ccc-98ab-81a81d57b35c/g, danielDistributorProfileId);
fs.writeFileSync('/home/niel/Documents/ReMat/remat_seed_materials_distributor.sql', updatedSql);
console.log("SQL file updated with correct distributor_id (6042c93c-f9d4-478f-a9a7-bbcb5e8b8273).");
