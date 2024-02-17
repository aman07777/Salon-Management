import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.js";
import { protect, permission } from "../middlewares/auth.js";

const router = express.Router();

// router.use(protect);
// router.use();

router.route("/").get(getUsers).post(createUser);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

export default router;
