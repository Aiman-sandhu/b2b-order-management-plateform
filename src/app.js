const express = require("express");
const authRoutes = require("./routes/auth.route")
const productRoutes = require("./routes/product.route");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;