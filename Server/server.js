import express from "express";
import path from "path";
import url from "url";
import cors from "cors";
import { authLogin, authRegister, authMe, transactionData } from "./auth.js";
import dotenv from "dotenv";
import { requireAuth } from "./middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.post("/login", authLogin);

app.post("/register", authRegister);

app.get("/me", requireAuth, authMe);
app.get("/transactions", requireAuth, transactionData);

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
