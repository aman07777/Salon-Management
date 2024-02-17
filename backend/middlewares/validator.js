import { body } from "express-validator";
import User from "../models/User.js";

export const validateSignup = [
  // Validate firstName and LastName and sanitize them
  body(["firstName", "lastName"])
    .isLength({ min: 2 })
    .withMessage("Please enter a longer name.")
    .trim()
    .escape(),

  // Validate email and sanitize it
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email.")
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      if (user) {
        return Promise.reject("Email address already exists.");
      }
    })
    .normalizeEmail()
    .trim()
    .escape(),

  // Validate password and sanitize it
  body("password")
    .isLength({ min: 5, max: 25 })
    .withMessage("Password must be alteast 5 characters long.")
    .matches("[0-9]")
    .withMessage("Password must contain a number.")
    .matches("[A-Z]")
    .withMessage("Password must contain an uppercase letter.")
    .trim(),

  // Validate confirmPassword
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Please enter a matching password.");
    }
    return true;
  }),
];
