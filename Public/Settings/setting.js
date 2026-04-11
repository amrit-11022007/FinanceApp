import {renderProfile} from '../tools/render.js'

const token = localStorage.getItem("token");
const profileIcon = document.getElementById("dashboard-profile-icon");

let userName = "";
let userEmail = "";
let userCurrency = "USD";

// ─── Hamburger ───────────────────────────────────────────────
document.querySelector("nav > span:first-child").addEventListener("click", () => {
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

// ─── Fetch user ──────────────────────────────────────────────
async function getData() {
  try {
    const res = await fetch("http://localhost:5000/me", {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Failed to fetch user");
    userName = data.name;
    userEmail = data.email;
    userCurrency = data.currency || "USD";

    profileIcon.innerText = userName[0].toUpperCase();
    renderProfile(userName, userEmail)
    document.getElementById("display-name").innerText = userName;
    document.getElementById("display-email").innerText = userEmail;

    // Pre-select saved currency
    const savedRadio = document.querySelector(`input[name="currency"][value="${userCurrency}"]`);
    if (savedRadio) savedRadio.checked = true;
  } catch (err) {
    console.error(err);
  }
}

// ─── Currency change ─────────────────────────────────────────
document.querySelectorAll('input[name="currency"]').forEach((radio) => {
  radio.addEventListener("change", async () => {
    const currency = radio.value;
    try {
      await fetch("http://localhost:5000/me/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currency }),
      });
    } catch (err) {
      console.error("Failed to update currency:", err);
    }
  });
});

// ─── Modal open/close ────────────────────────────────────────
document.querySelectorAll(".change-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = document.getElementById(btn.dataset.modal);
    if (modal) modal.classList.add("open");
  });
});

document.querySelectorAll(".cancel-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest(".dialogue-box").classList.remove("open");
  });
});

document.querySelectorAll(".dialogue-box").forEach((box) => {
  box.addEventListener("click", (e) => {
    if (e.target === box) box.classList.remove("open");
  });
});

// ─── Change name ─────────────────────────────────────────────
document.getElementById("change-name-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newName = document.getElementById("new-name").value.trim();
  try {
    const res = await fetch("http://localhost:5000/me/name", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      userName = newName;
      document.getElementById("display-name").innerText = newName;
      profileIcon.innerText = newName[0].toUpperCase();
      document.getElementById("change-name-dialogue-box").classList.remove("open");
      e.target.reset();
    }
  } catch (err) { console.error(err); }
});

// ─── Change email ─────────────────────────────────────────────
document.getElementById("change-email-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newEmail = document.getElementById("new-email").value.trim();
  try {
    const res = await fetch("http://localhost:5000/me/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: newEmail }),
    });
    if (res.ok) {
      userEmail = newEmail;
      document.getElementById("display-email").innerText = newEmail;
      document.getElementById("change-email-dialogue-box").classList.remove("open");
      e.target.reset();
    }
  } catch (err) { console.error(err); }
});

// ─── Change password ──────────────────────────────────────────
document.getElementById("change-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById("current-password").value;
  const newPassword     = document.getElementById("new-password").value;
  try {
    const res = await fetch("http://localhost:5000/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      document.getElementById("change-password-dialogue-box").classList.remove("open");
      e.target.reset();
    }
  } catch (err) { console.error(err); }
});

// ─── Reset data button (backend wired by you) ────────────────
document.getElementById("reset-btn").addEventListener("click", () => {
  // Placeholder — wire your DELETE /transactions/all or similar endpoint here
  console.log("Reset triggered — wire your backend route here");
});

// ─── Init ────────────────────────────────────────────────────
if (!token) {
  window.location.href = "../login/index.html";
} else {
  getData();
}