const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/createProduct.controller");

const router = express.Router();

// sab dekh sakte hain
router.get("/", getProducts);
router.get("/:id", getProduct);

// sirf admin
router.post("/", authenticate, authorize("ADMIN"), createProduct);
router.put("/:id", authenticate, authorize("ADMIN"), updateProduct);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteProduct);

module.exports = router;