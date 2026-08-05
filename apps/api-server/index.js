require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { attachUser } = require("./middlewares/auth");
const errorHandler = require("./middlewares/errorHandler");

// Route modules
const healthRoutes = require("./routes/health");
const categoryRoutes = require("./routes/categories");
const materialRoutes = require("./routes/materials");
const uploadRoutes = require("./routes/uploads");
const adminRoutes = require("./routes/admin");
const transactionRoutes = require("./routes/transactions");
const paymentRoutes = require("./routes/payments");
const ratingRoutes = require("./routes/ratings");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Attach user context from headers on every request
app.use(attachUser);

// Routes
app.use("/", healthRoutes);
app.use("/categories", categoryRoutes);
app.use("/materials", materialRoutes);
app.use("/materials", uploadRoutes); // /materials/:materialId/documents
app.use("/admin", adminRoutes);
app.use("/transactions", transactionRoutes);
app.use("/transactions/:transactionId", paymentRoutes); // /transactions/:transactionId/pay & /payment
app.use("/transactions/:transactionId", ratingRoutes);  // /transactions/:transactionId/rate & /rating

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[ReMat API Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;
