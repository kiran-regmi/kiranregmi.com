const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://kiranregmi-com-backend.onrender.com/api";

// Login form
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const errorMsg = document.getElementById("loginError");
    errorMsg.textContent = "";

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        errorMsg.textContent = "Invalid email or password";
        return;
      }

      const data = await res.json();

      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userRole", data.role);

      window.location.href = "portal.html"; // redirect to dashboard
    } catch (err) {
      errorMsg.textContent = "Network error. Try again.";
      console.error(err);
    }
  });
}

// Load questions when logged in
async function loadQuestions() {
  const qContainer = document.getElementById("questionsContainer");
  if (!qContainer) return;

  const email = localStorage.getItem("userEmail");
  if (!email) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/questions`);
    const data = await res.json();

    qContainer.innerHTML = "";
    data.forEach((q, i) => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.innerHTML = `
        <h4>Q${i + 1}: ${q.question}</h4>
        <p>${q.answer}</p>
      `;
      qContainer.appendChild(card);
    });
  } catch (err) {
    qContainer.innerHTML = `<p style="color:red">Unable to load questions.</p>`;
    console.error(err);
  }
}

// Auto-load questions if on correct page
document.addEventListener("DOMContentLoaded", loadQuestions);
