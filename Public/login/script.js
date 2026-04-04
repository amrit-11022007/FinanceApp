const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const card = document.querySelector(".card");

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

function setCardHeight() {
  const card = document.querySelector(".card");
  const front = document.querySelector(".card-front");
  const back = document.querySelector(".card-back");

  // Measure the actual form height inside the hidden/visible faces
  const activeFace = card.classList.contains("flipped") ? back : front;
  const height = activeFace.offsetHeight;

  card.style.height = `${height}px`;
}

// Call this inside your flip functions
const flipToBack = () => {
  card.classList.add("flipped");
  setCardHeight(); // Update height for the back content
};

const flipToFront = () => {
  card.classList.remove("flipped");
  setCardHeight(); // Update height for the front content
};

document.getElementById("registerLink").addEventListener("click", (e) => {
  e.preventDefault();
  flipToBack();
});

document.getElementById("loginLink").addEventListener("click", (e) => {
  e.preventDefault();
  flipToFront();
});

// ensure height is correct when form elements change
["name", "regEmail", "regPassword", "email", "password"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", setCardHeight);
});
