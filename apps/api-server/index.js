require("dotenv").config();
const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/", healthRoutes);

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[ReMat API Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;
