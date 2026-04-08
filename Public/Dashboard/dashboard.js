const token = localStorage.getItem("token");
const profileIcon = document.getElementById("dashboard-profile-icon");
const disablePage = document.getElementById("overlay");
const failureText = document.getElementById("failureId");

let userName = "";
let userEmail = "";
let transactions = [];

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
    if (!res.ok) {
      throw new Error(
        data.message || data.error || "Failed to fetch user data",
      );
    }
    userName = data.name;
    userEmail = data.email;
    profileIcon.innerText = userName[0];
  } catch (err) {
    showError(err);
  }
}

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
    if (!res.ok) {
      throw new Error(
        data.message || data.error || "Failed to fetch transactions",
      );
    }
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
    showError(err);
  }
}

function renderList(ulId, transactions, listType) {
  const renderList = document.getElementById(ulId);
  renderList.innerHTML = "";
  let arr = [];
  if (listType === "all") {
    arr = transactions;
  } else if (listType === "expense") {
    arr = transactions.filter((t) => t.type === "expense");
  } else {
    arr = transactions.filter((t) => t.type === "income");
  }
  arr.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
    <div class="logo">${item.icon}</div>
    <span class="transaction-title">${item.name}</span>
    <span class="amount">${item.type === "expense" ? -item.amount : item.amount}</span>
  `;
    renderList.appendChild(li);
  });
}

function renderTotalIncome(transactions) {
  const total = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  document.getElementById("total-income").innerText = total;
}

function renderTotalExpenses(transactions) {
  const total = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  document.getElementById("total-expense").innerText = total;
}

function renderTotalSavings(transactions) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const saving = income - expenses;
  document.getElementById("total-saving").innerText = saving;
}

function showError(message) {
  disablePage.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  failureText.innerText = message;
}
let pieChartInstance = null;

function renderPieChart(transactions) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const saving = income - expense;

  const ctx = document.getElementById("expense-pie-chart").getContext("2d");

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Expense", "Saving"],
      datasets: [
        {
          data: [expense, saving],
          backgroundColor: ["#f87171", "#4ade80"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
function renderCategoryChart(transactions, id) {
  let expenses = "";
  let label = "";
  let color = "";
  if (id.startsWith("expense")) {
    expenses = transactions.filter((t) => t.type === "expense");
    label = "Spending by category";
    color = '#f87171'

  } else {
    expenses = transactions.filter((t) => t.type === "income");
    label = "Income by category";
    color = '#4ade80'
  }

  // group by category name and sum amounts
  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.name] = (acc[t.name] || 0) + Number(t.amount);
    return acc;
  }, {});

  const ctx = document.getElementById(id).getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label: label,
          data: Object.values(categoryTotals),
          backgroundColor: color,
        },
      ],
    },
  });
}
if (!token) {
  window.location.href = "../login/index.html";
} else {
  getData();
  getTransactionData();
}
