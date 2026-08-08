const { prisma } = require("@remat/database");

/**
 * Get consumer profile ID from user ID, creating one if user exists but profile is missing.
 */
const getConsumerProfileId = async (userId) => {
  if (!userId) {
    const err = new Error("User ID is required");
    err.statusCode = 400;
    throw err;
  }

  let profile = await prisma.consumerProfile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === "CONSUMER") {
      profile = await prisma.consumerProfile.create({
        data: {
          userId: user.id,
          companyName: user.name,
          industryType: "Umum"
        },
        select: { id: true }
      });
    } else {
      const err = new Error("Consumer profile not found");
      err.statusCode = 404;
      throw err;
    }
  }
  return profile.id;
};

/**
 * Get distributor profile ID from user ID, creating one if user exists but profile is missing.
 */
const getDistributorProfileId = async (userId) => {
  if (!userId) {
    const err = new Error("User ID is required");
    err.statusCode = 400;
    throw err;
  }

  let profile = await prisma.distributorProfile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === "DISTRIBUTOR") {
      profile = await prisma.distributorProfile.create({
        data: {
          userId: user.id,
          companyName: user.name,
          address: "Alamat belum diisi",
          city: "Semarang",
          isVerified: true
        },
        select: { id: true }
      });
    } else {
      const err = new Error("Distributor profile not found");
      err.statusCode = 404;
      throw err;
    }
  }
  return profile.id;
};

module.exports = {
  getConsumerProfileId,
  getDistributorProfileId
};
