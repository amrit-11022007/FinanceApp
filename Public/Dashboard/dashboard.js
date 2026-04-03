const token = localStorage.getItem("token");
const profileIcon = document.getElementById('dashboard-profile-icon');

if (!token) {
    window.location.href = "../login/login.html"
}
let userName = '';
let userEmail = '';

async function getData() {
    try {
        const res = await fetch('http://localhost:5000/me', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json()
        userName = data.name;
        userEmail = data.email;
        profileIcon.innerText = userName[0]

    } catch (err) {
        console.error(err)
    }
}
getData();