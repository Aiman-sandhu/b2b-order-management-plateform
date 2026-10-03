const express = require("express");
const authenticate = require("../middleware/auth");
const { addToCart, getCart, updateCartItem, removeCartItem } = require("../controllers/cart.controller");

const router = express.Router();

router.post("/", authenticate, addToCart);
router.get("/", authenticate, getCart);
router.put("/:productId", authenticate, updateCartItem);
router.delete("/:productId", authenticate, removeCartItem);

module.exports = router;