const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/auth");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcryptjs");

// @route GET api/auth
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// @route POST api/auth - Authenticate a user and get token - Trying to Login
router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      // Check for a user
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          errors: [{ msg: "Invalid Credentials" }],
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          errors: [{ msg: "Invalid Credentials" }],
        });
      }

      const payload = { user: { id: user.id } };

      jwt.sign(payload, config.get("jwtsecret"), { expiresIn: "10 days" }, (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

module.exports = router;
