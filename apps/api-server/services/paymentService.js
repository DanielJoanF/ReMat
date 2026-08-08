const { prisma } = require("@remat/database");
const { getConsumerProfileId } = require("../utils/profile");

/**
 * Consumer creates/processes payment for a transaction.
 */
const createPayment = async (transactionId, userId, data) => {
  const consumerId = await getConsumerProfileId(userId);
  const { method = "TRANSFER", providerRefId } = data;

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { payment: true }
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }

  if (transaction.consumerId !== consumerId) {
    const err = new Error("You can only pay for your own transactions");
    err.statusCode = 403;
    throw err;
  }

  if (transaction.status !== "CONFIRMED") {
    const err = new Error(`Transaction must be in CONFIRMED status to pay. Current status: ${transaction.status}`);
    err.statusCode = 400;
    throw err;
  }

  if (transaction.payment) {
    const err = new Error("Payment already exists for this transaction");
    err.statusCode = 400;
    throw err;
  }

  // Allowed methods: TRANSFER, VA, EWALLET
  const validMethods = ["TRANSFER", "VA", "EWALLET"];
  const paymentMethod = method.toUpperCase();
  if (!validMethods.includes(paymentMethod)) {
    const err = new Error(`Invalid payment method. Allowed: ${validMethods.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  // Create payment record and update transaction status to PAID
  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        transactionId,
        method: paymentMethod,
        providerRefId: providerRefId || `REF-${Date.now()}`,
        status: "SUCCESS",
        amount: transaction.totalAmount,
        paidAt: new Date()
      }
    }),
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "PAID" }
    })
  ]);

  return payment;
};

/**
 * Get payment details by transaction ID.
 */
const getPaymentByTransactionId = async (transactionId, user) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      consumer: { select: { userId: true } },
      distributor: { select: { userId: true } },
      payment: true
    }
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }

  if (
    user.role !== "ADMIN" &&
    transaction.consumer.userId !== user.id &&
    transaction.distributor.userId !== user.id
  ) {
    const err = new Error("Not authorized to view this payment");
    err.statusCode = 403;
    throw err;
  }

  return transaction.payment;
};

module.exports = {
  createPayment,
  getPaymentByTransactionId
};
