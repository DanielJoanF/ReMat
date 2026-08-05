const transactionService = require("../services/transactionService");

const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.user.id, req.body);
    res.status(201).json({ data: transaction });
  } catch (err) {
    next(err);
  }
};

const listConsumerTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.listConsumerTransactions(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const listDistributorOrders = async (req, res, next) => {
  try {
    const result = await transactionService.listDistributorOrders(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, req.user);
    if (!transaction) {
      return res.status(404).json({ error: { message: "Transaction not found", statusCode: 404 } });
    }
    res.json({ data: transaction });
  } catch (err) {
    next(err);
  }
};

const confirmOrder = async (req, res, next) => {
  try {
    const transaction = await transactionService.confirmOrder(req.params.id, req.user.id);
    res.json({ data: transaction, message: "Order confirmed" });
  } catch (err) {
    next(err);
  }
};

const markShipped = async (req, res, next) => {
  try {
    const transaction = await transactionService.markShipped(req.params.id, req.user.id);
    res.json({ data: transaction, message: "Order marked as shipped" });
  } catch (err) {
    next(err);
  }
};

const confirmReceived = async (req, res, next) => {
  try {
    const transaction = await transactionService.confirmReceived(req.params.id, req.user.id);
    res.json({ data: transaction, message: "Order completed" });
  } catch (err) {
    next(err);
  }
};

const cancelTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.cancelTransaction(req.params.id, req.user.id);
    res.json({ data: transaction, message: "Transaction cancelled" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction,
  listConsumerTransactions,
  listDistributorOrders,
  getTransactionById,
  confirmOrder,
  markShipped,
  confirmReceived,
  cancelTransaction
};
