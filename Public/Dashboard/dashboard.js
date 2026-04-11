import { renderProfile } from "../tools/render.js";

const token = localStorage.getItem("token");
const profileIcon = document.getElementById("dashboard-profile-icon");
const disablePage = document.getElementById("overlay");
const failureText = document.getElementById("failureId");

let userName = "";
let userEmail = "";
let currency = "USD";
let transactions = [];

// ─── Hamburger toggle ────────────────────────────────────────
document
  .querySelector("nav > span:first-child")
  .addEventListener("click", () => {
    document.querySelector("nav").classList.toggle("nav-open");
  });

profileIcon.addEventListener("click", () => {
  document.querySelector(".profile").classList.remove("hidden");
});

document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem(token);
  window.location.href = "../login/index.html";
});
document.getElementById("close").addEventListener("click", () => {
  document.querySelector(".profile").classList.add("hidden");
});
document.getElementById("manage-profile").addEventListener("click", () => {
  window.location.href = "../Settings/setting.html"
});


// ─── Chart.js global dark defaults ──────────────────────────
Chart.defaults.color = "rgba(148, 185, 220, 0.6)";
Chart.defaults.borderColor = "rgba(56, 189, 248, 0.1)";
Chart.defaults.font.family = "'DM Mono', monospace";
Chart.defaults.font.size = 11;

// ─── Fetch user ──────────────────────────────────────────────
async function getData() {
  try {
    const res = await fetch("http://localhost:5000/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        data.message || data.error || "Failed to fetch user data",
      );
    userName = data.name;
    userEmail = data.email;
    currency = data.currency || "USD";
    profileIcon.innerText = userName[0].toUpperCase();
    renderProfile(userName, userEmail);
  } catch (err) {
    showError(err.message || err);
  }
}

// ─── Fetch transactions ──────────────────────────────────────
async function getTransactionData() {
  try {
    const res = await fetch("http://localhost:5000/transactions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        data.message || data.error || "Failed to fetch transactions",
      );
    transactions = data;
    renderList("transaction-list", transactions, "all");
    renderList("expense-list", transactions, "expense");
    renderList("income-list", transactions, "income");
    renderTotalIncome(transactions);
    renderTotalExpenses(transactions);
    renderTotalSavings(transactions);
    renderPieChart(transactions);
    renderCategoryChart(transactions, "expense-bar-chart");
    renderCategoryChart(transactions, "income-bar-chart");
  } catch (err) {
    showError(err.message || err);
  }
}

// ─── Render list ─────────────────────────────────────────────
function renderList(ulId, transactions, listType) {
  const ul = document.getElementById(ulId);
  ul.innerHTML = "";

  let arr = transactions;
  if (listType === "expense")
    arr = transactions.filter((t) => t.type === "expense");
  else if (listType === "income")
    arr = transactions.filter((t) => t.type === "income");

  arr.forEach((item) => {
    const isExpense = item.type === "expense";
    const sign = isExpense ? "-" : "+";
    const amountClass = isExpense ? "amount-expense" : "amount-income";

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="logo">${item.icon ?? "💰"}</div>
      <span class="transaction-title">${item.name}</span>
      <span class="amount ${amountClass}">${sign}${`${formatAmount(item.amount)}`}</span>
    `;
    ul.appendChild(li);
  });
}

// ─── Totals ──────────────────────────────────────────────────
function renderTotalIncome(transactions) {
  const total = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  document.getElementById("total-income").innerText = formatAmount(total);
}

function renderTotalExpenses(transactions) {
  const total = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  document.getElementById("total-expense").innerText = formatAmount(total);
}

function renderTotalSavings(transactions) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  document.getElementById("total-saving").innerText = formatAmount(income - expenses);
}

// ─── Pie chart ───────────────────────────────────────────────
let pieChartInstance = null;

function renderPieChart(transactions) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const saving = income - expense;

  if (pieChartInstance) pieChartInstance.destroy();

  pieChartInstance = new Chart(
    document.getElementById("expense-pie-chart").getContext("2d"),
    {
      type: "pie",
      data: {
        labels: ["Expense", "Saving"],
        datasets: [
          {
            data: [expense, saving],
            backgroundColor: ["#f87171", "#4ade80"],
            borderColor: "rgba(10, 22, 40, 0.8)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "rgba(148, 185, 220, 0.7)",
              font: { family: "'DM Mono', monospace", size: 11 },
              boxWidth: 10,
              padding: 14,
            },
          },
        },
      },
    },
  );
}

// ─── Bar chart ───────────────────────────────────────────────
function renderCategoryChart(transactions, id) {
  const isExpense = id.startsWith("expense");
  const filtered = transactions.filter(
    (t) => t.type === (isExpense ? "expense" : "income"),
  );
  const label = isExpense ? "Spending by category" : "Income by category";
  const color = isExpense
    ? "rgba(248, 113, 113, 0.75)"
    : "rgba(74, 222, 128, 0.75)";
  const borderColor = isExpense ? "#f87171" : "#4ade80";

  const categoryTotals = filtered.reduce((acc, t) => {
    acc[t.name] = (acc[t.name] || 0) + Number(t.amount);
    return acc;
  }, {});

  new Chart(document.getElementById(id).getContext("2d"), {
    type: "bar",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label,
          data: Object.values(categoryTotals),
          backgroundColor: color,
          borderColor: borderColor,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "rgba(148, 185, 220, 0.7)",
            font: { family: "'DM Mono', monospace", size: 11 },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "rgba(148, 185, 220, 0.5)" },
          grid: { color: "rgba(56, 189, 248, 0.06)" },
        },
        y: {
          ticks: { color: "rgba(148, 185, 220, 0.5)" },
          grid: { color: "rgba(56, 189, 248, 0.06)" },
        },
      },
    },
  });
}

// ─── Error display ───────────────────────────────────────────
function showError(message) {
  disablePage.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  failureText.innerText = message;
}

function formatAmount(amount) {
  return Number(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: currency,         // uses the variable fetched from /me
    maximumFractionDigits: 2,
  });
}

// ─── Init ────────────────────────────────────────────────────
if (!token) {
  window.location.href = "../login/index.html";
} else {
  getData();
  getTransactionData();
}
