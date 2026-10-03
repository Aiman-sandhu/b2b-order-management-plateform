const express = require("express");
const authenticate = require("../middleware/auth");
const {placeOrder, getMyOrders, getAllOrders, updateOrderStatus, getAuditLogs } = require("../controllers/order.controller");

const router = express.Router();
const authorize = require("../middleware/role");

router.post("/", authenticate, placeOrder);
router.get("/", authenticate, getMyOrders);
router.get("/all", authenticate, authorize("ADMIN"), getAllOrders);
router.get("/audit-logs", authenticate, authorize("ADMIN"), getAuditLogs);
router.patch("/:id/status", authenticate, authorize("ADMIN"), updateOrderStatus);

module.exports = router;