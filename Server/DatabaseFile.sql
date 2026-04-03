use finance_tracker;

CREATE TABLE users (
user_id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

select * from users;

insert into users (name, email, password) values ("Amrit", "rajamrit4a09@gmail.com", "testing");

CREATE TABLE categories (
  category_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT DEFAULT NULL,
  name         VARCHAR(100) NOT NULL,
  type         ENUM('income', 'expense') NOT NULL,
  icon         VARCHAR(10) DEFAULT '💰',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Transactions
CREATE TABLE transactions (
  transaction_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  category_id     INT NOT NULL,
  amount          DECIMAL(10, 2) NOT NULL,
  type            ENUM('income', 'expense') NOT NULL,
  note            VARCHAR(255) DEFAULT NULL,
  date            DATE NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id)         ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

-- Budgets (one per category per month per user)
CREATE TABLE budgets (
  budget_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  category_id   INT NOT NULL,
  month         DATE NOT NULL,               
  limit_amount  DECIMAL(10, 2) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_budget (user_id, category_id, month),
  FOREIGN KEY (user_id)     REFERENCES users(user_id)          ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Seed default categories (global, not tied to any user)
INSERT INTO categories (user_id, name, type, icon) VALUES
  (NULL, 'Salary',        'income',  '💼'),
  (NULL, 'Freelance',     'income',  '💻'),
  (NULL, 'Other Income',  'income',  '💰'),
  (NULL, 'Food',          'expense', '🍜'),
  (NULL, 'Transport',     'expense', '🚇'),
  (NULL, 'Housing',       'expense', '🏠'),
  (NULL, 'Health',        'expense', '💊'),
  (NULL, 'Entertainment', 'expense', '🎬'),
  (NULL, 'Shopping',      'expense', '🛍️'),
  (NULL, 'Education',     'expense', '📚'),
  (NULL, 'Other Expense', 'expense', '📦');

select * from categories;

SELECT name, email FROM users WHERE email = 'rajamrit4a09@gmail.com';