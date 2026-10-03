const express = require("express");
const authRoutes = require("./routes/auth.route")
const productRoutes = require("./routes/product.route");
const cartRoutes = require("./routes/cart.route");
const orderRoutes = require("./routes/order.routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");



const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/orders", orderRoutes);
app.use(notFound);
app.use(errorHandler);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;