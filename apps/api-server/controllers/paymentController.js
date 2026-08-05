const paymentService = require("../services/paymentService");

const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(req.params.transactionId, req.user.id, req.body);
    res.status(201).json({ data: payment, message: "Payment processed successfully" });
  } catch (err) {
    next(err);
  }
};

const getPaymentByTransactionId = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByTransactionId(req.params.transactionId, req.user);
    if (!payment) {
      return res.status(404).json({ error: { message: "Payment not found", statusCode: 404 } });
    }
    res.json({ data: payment });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPayment,
  getPaymentByTransactionId
};
