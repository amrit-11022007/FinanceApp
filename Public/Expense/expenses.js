import { renderProfile } from "../tools/render.js";

const profileIcon = document.getElementById("expense-profile-icon");
const token = localStorage.getItem("token");
const form = document.getElementById("expense-form");

let transactions = [];
let chartInstance = null;

let userName = "";
let userEmail = "";

// ─── Hamburger ───────────────────────────────────────────────
document
  .querySelector("nav > span:first-child")
  .addEventListener("click", () => {
    document.querySelector("nav").classList.toggle("nav-open");
  });

// ─── Modal ───────────────────────────────────────────────────
const dialogueBox = document.querySelector(".expense-dialogue-box");
const addBtn = document.querySelector(".add-expense-btn");
const cancelBtn = document.getElementById("cancel-btn");

addBtn.addEventListener("click", () => dialogueBox.classList.add("open"));
cancelBtn.addEventListener("click", () => dialogueBox.classList.remove("open"));
dialogueBox.addEventListener("click", (e) => {
  if (e.target === dialogueBox) dialogueBox.classList.remove("open");
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
    profileIcon.innerText = userName[0].toUpperCase();
    renderProfile(userName, userEmail)
  } catch (err) {
    showError(err.message || err);
  }
}

// ─── Form submit ─────────────────────────────────────────────
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
    renderList("expense-list", transactions, "expense");
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
    li.dataset.id = item.transaction_id;
    li.innerHTML = `
      <div class="logo">${item.icon ?? "💸"}</div>
      <span class="delete-item" id="delete-item">Del</span>
      <span class="transaction-title">${item.name}</span>
      <span class="amount ${amountClass}">${sign}$${Number(item.amount).toLocaleString()}</span>
    `;
        li.querySelector(".delete-item").addEventListener("click", () => deleteData(item.transaction_id));
    ul.appendChild(li);
  });
}

// ─── Error display ───────────────────────────────────────────
function showError(message) {
  // disablePage.classList.remove("hidden");
  // document.body.style.overflow = "hidden";
  // failureText.innerText = message;
  console.error("Error:", message);
}

// ─── Chart ───────────────────────────────────────────────────
function renderCategoryChart(transactions, id) {
  const ctx = document.getElementById(id).getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  const filtered = transactions.filter((t) => t.type === "expense");

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
          label: "Spending by category",
          data: Object.values(categoryTotals),
          backgroundColor: "rgba(248, 113, 113, 0.75)",
          borderColor: "#f87171",
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
          grid: { color: "rgba(248, 113, 113, 0.06)" },
        },
        y: {
          ticks: { color: "rgba(148, 185, 220, 0.5)" },
          grid: { color: "rgba(248, 113, 113, 0.06)" },
        },
      },
    },
  });
}

// ─── Download CSV ─────────────────────────────────────────────
document.getElementById("download-btn").addEventListener("click", () => {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) return;
  const header = "Name,Amount,Date";
  const rows = expenses.map((e) => `"${e.name}",${e.amount},${e.date ?? ""}`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// ─── Init ────────────────────────────────────────────────────
if (!token) {
  window.location.href = "../login/index.html";
} else {
  getData();
  getTransactionData();
}
