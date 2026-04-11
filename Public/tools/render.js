export function renderProfile(name, email) {
  document.getElementById("profile-name").innerText = name;
  document.getElementById("profile-email").innerText = email;
  console.log("loaded")
}