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
        const token = jwt.sign(
          { user_id: rows[0].user_id, email: rows[0].email },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "7d",
          },
        );
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
      const token = jwt.sign(
        { user_id: rows.insertId, email: email.trim() },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "7d",
        },
      );
      return res.json({
        token,
        name: name.trim(),
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
  try {
    const [rows] = await pool.query(
      "SELECT user_id, name, email FROM users WHERE email = ?",
      [req.user.email]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const transactionData = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, t.category_id, t.amount, t.type, t.date, c.name, c.icon 
       FROM transactions t 
       INNER JOIN categories c ON t.category_id = c.category_id 
       INNER JOIN users u ON t.user_id = u.user_id 
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
export const addTransaction = async (req, res) => {
  try {
    const { amount, date, type } = req.body;
    let categoryId = null;
    switch (type) {
      case "salary":
        categoryId = 1;
        break;
      case "freelance":
        categoryId = 2;
        break;
      case "other":
        categoryId = 3;
        break;
    
      default:
        break;
    }

    await pool.query(
      'INSERT INTO transactions (user_id, category_id, amount, date) VALUES (?, ?, ?, ?)',
      [req.user.user_id, categoryId, amount, date]
    );
    res.json({ success: true, message: "Transaction added succesfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}