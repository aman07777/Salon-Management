// IMPORT DEPENDENCIES
import express from "express";
import path from "path";
import url from "url";
import cors from "cors";



// IMPORT DATABASE
import connectDatabase from "./config/db.js";


// IMPORT MIDDLEWARES
import { errorHandler, notFound } from "./middlewares/error.js";

// IMPORT ROUTES
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";


import bodyParser from 'body-parser';

// INITIALIZE APP
const app = express();
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

// MIDDLEWARE
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// STATIC FILE MIDDLEWARE
app.use("/public", express.static(path.join(__dirname, "public")));



// ROUTES
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

// CONNECT TO DATABASE
await connectDatabase;

// ERROR HANDLER
app.use(notFound);
app.use(errorHandler);

// LISTEN ON PORT 8080
app.listen(8082, () => {
  console.log("Server running on port 8080");
});
