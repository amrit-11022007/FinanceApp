// ─── Tab switching ───────────────────────────────────────────
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

function showLogin() {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.add("active");
  registerForm.classList.remove("active");
}

function showRegister() {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.add("active");
  loginForm.classList.remove("active");
}

tabLogin.addEventListener("click", showLogin);
tabRegister.addEventListener("click", showRegister);
document.getElementById("registerLink").addEventListener("click", (e) => {
  e.preventDefault();
  showRegister();
});
document.getElementById("loginLink").addEventListener("click", (e) => {
  e.preventDefault();
  showLogin();
});

// ─── Eye toggle ──────────────────────────────────────────────
document.querySelectorAll(".eye-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const showIcon = btn.querySelector(".eye-show");
    const hideIcon = btn.querySelector(".eye-hide");
    if (input.type === "password") {
      input.type = "text";
      showIcon.style.display = "none";
      hideIcon.style.display = "block";
    } else {
      input.type = "password";
      showIcon.style.display = "block";
      hideIcon.style.display = "none";
    }
  });
});

// ─── Login submit ─────────────────────────────────────────────
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  if (res.ok && data.success) {
    localStorage.setItem("token", data.token);
    window.location.href = "../Dashboard/dashboard.html";
  } else {
    alert(data.message || "Login failed");
  }
});

// ─── Register submit ──────────────────────────────────────────
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch("http://localhost:5000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  document.getElementById("name").value = "";
  document.getElementById("regEmail").value = "";
  document.getElementById("regPassword").value = "";

  if (res.ok && data.success) {
    localStorage.setItem("token", data.token);
    window.location.href = "../Dashboard/dashboard.html";
  } else {
    alert(data.message || "Registration failed");
  }
});

// ─── Slider ───────────────────────────────────────────────────
const slides = document.querySelectorAll(".slide");
const dotsContainer = document.getElementById("slideDots");
let current = 0;
let autoTimer;

// Build dots
slides.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.className = "dot" + (i === 0 ? " active" : "");
  dot.setAttribute("aria-label", `Slide ${i + 1}`);
  dot.addEventListener("click", () => goTo(i));
  dotsContainer.appendChild(dot);
});

function goTo(index) {
  slides[current].classList.remove("active");
  dotsContainer.children[current].classList.remove("active");
  current = (index + slides.length) % slides.length;
  slides[current].classList.add("active");
  dotsContainer.children[current].classList.add("active");
  resetAuto();
}

document
  .getElementById("nextSlide")
  .addEventListener("click", () => goTo(current + 1));
document
  .getElementById("prevSlide")
  .addEventListener("click", () => goTo(current - 1));

function resetAuto() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => goTo(current + 1), 4000);
}

// Init
slides[0].classList.add("active");
resetAuto();
