const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Users = require("../../models/Users");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// @routes POST api/users
// @des    register user
// @access Public

router.post(
  "/",
  [
    check("name", "Username is required").not().isEmpty(),
    check("email", "Enter a valid email").isEmail(),
    check("password", "Password is required").isLength({ min: 5 }),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      res.status(400).json({ error: error.array() });
    }
    try {
      const { name, email, password } = req.body;

      let user = await Users.findOne({ email });
      if (user) {
        res.status(400).json({ error: [{ msg: "user already exists" }] });
      }
      const avatar = gravatar.url(email, { s: "200", r: "pg", d: "mm" });
      user = new Users({
        name,
        email,
        password,
        avatar,
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      const payload = {
        users: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: 36000 },
        (error, token) => {
          if (error) {
            res.json(error.message);
          } else {
            res.json(token);
          }
        }
      );
    } catch (error) {
      res.json(error.message);
    }
  }
);

module.exports = router;
