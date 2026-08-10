const { prisma } = require("./index.js");

async function verifyModels() {
  console.log("🔍 Checking Prisma Client models...");
  
  const models = [
    "user",
    "distributorProfile",
    "consumerProfile",
    "category",
    "material",
    "materialDocument",
    "materialEmbedding",
    "transaction",
    "transactionItem",
    "payment",
    "circularReport",
    "chatConversation",
    "chatMessage",
    "materialAlert",
    "banner"
  ];

  for (const model of models) {
    if (typeof prisma[model] === "undefined") {
      throw new Error(`Missing model delegate in Prisma Client: ${model}`);
    }
  }

  console.log(`All ${models.length} models from ERD.md & SCHEMA.md exist in Prisma Client!`);
}

verifyModels()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
