const express = require("express");
const {register, login} = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");

const router = express.Router();

router.get("/me", authenticate,(req,res)=> res.json(req.user));


router.get("/admin-test", authenticate, authorize("ADMIN"),(req,res)=>{
    res.json({ok:true})
})
router.post("/register", register)


const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, try again after 15 minutes" },
});

router.post("/login", loginLimiter, login);

module.exports = router;







