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
      "SELECT user_id, name, email, currency FROM users WHERE user_id = ?",
      [req.user.user_id],
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
      `SELECT u.user_id,t.transaction_id, t.category_id, t.amount, t.type, t.date, c.name, c.icon 
       FROM transactions t 
       INNER JOIN categories c ON t.category_id = c.category_id 
       INNER JOIN users u ON t.user_id = u.user_id 
       WHERE u.user_id = ?`,
      [req.user.user_id],
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
    let transactionType = "";
    switch (type) {
      case "salary":
        categoryId = 1;
        break;
      case "freelance":
        categoryId = 2;
        break;
      case "other income":
        categoryId = 3;
        break;
      case "food":
        categoryId = 4;
        break;
      case "transport":
        categoryId = 5;
        break;
      case "housing":
        categoryId = 6;
        break;
      case "health":
        categoryId = 7;
        break;
      case "entertainment":
        categoryId = 8;
        break;
      case "shopping":
        categoryId = 9;
        break;
      case "education":
        categoryId = 10;
        break;
      case "other expenses":
        categoryId = 11;
        break;

      default:
        break;
    }
    if (categoryId <= 3) transactionType = "income";
    else transactionType = "expense";

    console.log({ categoryId, amount, date, type });

    await pool.query(
      "INSERT INTO transactions (user_id, category_id, amount, type, date) VALUES (?, ?, ?, ?, ?)",
      [req.user.user_id, categoryId, amount, transactionType, date],
    );
    res.json({ success: true, message: "Transaction added succesfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const [result] = await pool.query(
      "DELETE FROM transactions WHERE transaction_id = ? AND user_id = ?",
      [id, userId],
    );
    res.json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const change = async (req, res) => {
  try {
    const { name, email, currentPassword } = req.body;
    let values = [];
    let updates = [];
    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (currentPassword) {
      const hashed = await bcrypt.hash(currentPassword, 10);
      updates.push("password = ?");
      values.push(hashed);
    }
    const [rows] = await pool.query(
      `UPDATE users SET ${updates} WHERE user_id = ?`,
      [values[0], req.user.user_id],
    );
    if (rows.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteAllTransaction = async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM transactions WHERE user_id = ?", [
      req.user.user_id
    ]);
    res.json({ success: true, message: "Done" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const changeCurrency = async (req, res) => {
  const { currency } = req.body;

  const allowed = ['INR', 'USD', 'EUR', 'GBP'];
  if (!allowed.includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  try {
    await pool.execute(
      'UPDATE users SET currency = ? WHERE user_id = ?',
      [currency, req.user.user_id]
    );
    res.json({ success: true, currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};