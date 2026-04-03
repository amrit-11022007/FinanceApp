import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { loginSchema, registerSchema } from "./authValidator.js";
import jwt from "jsonwebtoken";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const authLogin = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors
        .map((e) => e.message)
        .join(", ");
      return res.json({ success: false, message: errorMessages });
    }
    const { email, password } = parsed.data;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email.trim(),
    ]);
    if (rows.length > 0) {
      const isValid = await bcrypt.compare(password.trim(), rows[0].password);
      if (isValid) {
        const token = jwt.sign({ mail: email }, process.env.JWT_SECRET_KEY, {
          expiresIn: "7d",
        });
        return res.json({
          token,
          name: rows[0].name,
          success: true,
          message: "Login Successful",
        });
      } else {
        return res.json({ success: false, message: "Invalid credentials" });
      }
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
};

export const authRegister = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors
        .map((e) => e.message)
        .join(", ");
      return res.json({ success: false, message: errorMessages });
    }
    const { name, email, password } = parsed.data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [rows] = await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), email.trim(), hashedPassword],
    );
    if (rows.affectedRows > 0) {
      const token = jwt.sign({ mail: email }, process.env.JWT_SECRET_KEY, {
        expiresIn: "7d",
      });
      return res.json({
        token,
        name: name,
        success: true,
        message: "Registration Successful",
      });
    } else {
      res.json({ success: false, message: "Registration failed" });
    }
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.json({ success: false, message: "Email already exists" });
    } else {
      res.json({ success: false, message: "Server error" });
    }
  }
};

export const authMe = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT name, email FROM users WHERE email = ?",
    [req.user.mail],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(rows[0]);
};
