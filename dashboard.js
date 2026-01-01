// dashboard.js
// Frontend logic for login + interview practice

const BACKEND_URL = "https://kiranregmi-com-backend.onrender.com";
const API_BASE = `${BACKEND_URL}/api`;

// -------- Session helpers --------
function saveSession(email, role, token) {
  localStorage.setItem(
    "portalSession",
    JSON.stringify({ email, role, token })
  );
}

function getSession() {
  try {
    const raw = localStorage.getItem("portalSession");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("portalSession");
}

// -------- Login page --------
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");

  if (!loginForm || !emailInput || !passwordInput || !loginError) {
    return; // not on login.html
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      loginError.textContent = "Please enter email and password.";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      saveSession(data.email, data.role, data.token);

      // Go to the dashboard
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login error:", err);
      loginError.textContent =
        err.message || "Network error. Please try again.";
    }
  });
}

// -------- Dashboard (questions) --------
let allQuestions = [];
let currentQuestions = [];

function renderQuestions() {
  const container = document.getElementById("questionsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!currentQuestions.length) {
    const empty = document.createElement("p");
    empty.textContent = "No questions found.";
    container.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  currentQuestions.forEach((q, idx) => {
    const card = document.createElement("article");
    card.className = "question-card";

    const number =
      typeof q.id === "number" ? q.id : idx + 1;
    const numberLabel = String(number).padStart(2, "0");

    card.innerHTML = `
      <header class="question-card__header">
        <span class="question-card__qnum">Q${numberLabel}</span>
        <span class="question-card__tag">${q.category || ""}</span>
      </header>
      <div class="question-card__body">
        <h3 class="question-card__question">
          ${q.question}
        </h3>
        <p class="question-card__answer">
          ${q.answer}
        </p>
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

async function loadQuestions() {
  try {
    const res = await fetch(`${API_BASE}/questions`);
    if (!res.ok) throw new Error("Failed to load questions");

    const data = await res.json();
    allQuestions = Array.isArray(data) ? data : [];
    currentQuestions = [...allQuestions];
    renderQuestions();
  } catch (err) {
    console.error("Error loading questions:", err);
    const container = document.getElementById("questionsContainer");
    if (container) {
      container.innerHTML =
        '<p style="color:#b91c1c;">Failed to load questions. Please try again later.</p>';
    }
  }
}

function initDashboardPage() {
  const container = document.getElementById("questionsContainer");
  if (!container) return; // not on dashboard.html

  // Optional: if you want to force login first
  // const session = getSession();
  // if (!session) {
  //   window.location.href = "login.html";
  //   return;
  // }

  const shuffleBtn = document.getElementById("shuffleBtn");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      if (!allQuestions.length) return;
      currentQuestions = [...allQuestions];

      // Fisher–Yates shuffle
      for (let i = currentQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentQuestions[i], currentQuestions[j]] = [
          currentQuestions[j],
          currentQuestions[i],
        ];
      }
      renderQuestions();
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "login.html";
    });
  }

  loadQuestions();
}

// -------- Bootstrapping --------
document.addEventListener("DOMContentLoaded", () => {
  initLoginPage();
  initDashboardPage();
});

<script src="dashboard.js"></script>