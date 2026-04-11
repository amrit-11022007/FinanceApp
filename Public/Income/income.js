import { renderProfile } from "../tools/render.js";

const profileIcon = document.getElementById("dashboard-profile-icon");
const disablePage = document.getElementById("overlay");
const failureText = document.getElementById("failureId");
const token = localStorage.getItem("token");
const addIncomeBtn = document.getElementById("add-income-btn");
const form = document.getElementById("income-form");

let transactions = [];
let chartInstance = null;

let userName = "";
let userEmail = "";

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

const dialogueBox = document.querySelector(".income-dailogue-box");
const addBtn = document.querySelector(".add-income-btn");
const cancelBtn = document.getElementById("cancel-btn");

addBtn.addEventListener("click", () => dialogueBox.classList.add("open"));
cancelBtn.addEventListener("click", () => dialogueBox.classList.remove("open"));

dialogueBox.addEventListener("click", (e) => {
  if (e.target === dialogueBox) dialogueBox.classList.remove("open");
});

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
    profileIcon.innerText = userName[0].toUpperCase();
    renderProfile(userName, userEmail)
  } catch (err) {
    showError(err.message || err);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const today = new Date().toISOString().split("T")[0];
  if (date > today) {
    showError("Date cannot be in the future");
    return;
  }
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  await fetch("http://localhost:5000/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      form.reset();
      dialogueBox.classList.remove("open");
    })
    .then(getTransactionData);
});

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
    renderList("income-list", transactions, "income");
    renderCategoryChart(transactions, "overview-chart");
  } catch (err) {
    showError(err.message || err);
  }
}

async function deleteData(id) {
  try {
    const res = await fetch(`http://localhost:5000/transactions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      getTransactionData();
    }
  } catch (err) {
    showError(err.message || err);
  }
}

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
    li.dataset.id = item.transaction_id;
    li.innerHTML = `
      <div class="logo">${item.icon ?? "💰"}</div>
      <span class="delete-item" id="delete-item">Del</span>
      <span class="transaction-title">${item.name}</span>
      <span class="amount ${amountClass}">${sign}$${Number(item.amount).toLocaleString()}</span>
    `;
    li.querySelector(".delete-item").addEventListener("click", () => deleteData(item.transaction_id));
    ul.appendChild(li);
  });
}

function showError(message) {
  disablePage.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  failureText.innerText = message;
}

function renderCategoryChart(transactions, id) {
  const ctx = document.getElementById(id).getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

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

  chartInstance = new Chart(ctx, {
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

if (!token) {
  window.location.href = "../login/index.html";
} else {
  getData();
  getTransactionData();
}
