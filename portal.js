const API_BASE_URL = "https://kiranregmi-com-backend.onrender.com/api";

// LOGIN
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      showAuthError("Invalid credentials");
      return;
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.role);
    window.location.reload();

  } catch (err) {
    showAuthError("Network error. Try again.");
  }
}

// LOAD QUESTIONS
async function loadQuestions() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await fetch(`${API_BASE_URL}/questions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const list = await res.json();
  renderQuestions(list);
}

// CALL ON LOAD if logged in
if (localStorage.getItem("token")) {
  loadQuestions();
}

// LOGOUT
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "portal.html";
});

// UTILITY
function showAuthError(msg) {
  const el = document.getElementById("authError");
  el.textContent = msg;
  el.classList.remove("hidden");
}
