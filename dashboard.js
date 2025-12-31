// portal.js – minimal, working v1 to get login + questions going

const backendURL = "https://kiranregmi-com-backend.onrender.com/api";

let allQuestions = [];
let filteredQuestions = [];
let currentCategory = "All";
let currentPage = 1;
const PAGE_SIZE = 8;

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginForm) {
    wireLoginForm(loginForm);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
    initDashboard();
  }
});

// ========== AUTH ==========

function saveSession(email, role) {
  localStorage.setItem("portalEmail", email);
  localStorage.setItem("portalRole", role);
}

function getSession() {
  const email = localStorage.getItem("portalEmail");
  const role = localStorage.getItem("portalRole");
  if (!email || !role) return null;
  return { email, role };
}

function clearSession() {
  localStorage.removeItem("portalEmail");
  localStorage.removeItem("portalRole");
}

function handleLogout() {
  clearSession();
  window.location.href = "login.html";
}

// ========== LOGIN PAGE LOGIC ==========

function wireLoginForm(form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailEl = document.getElementById("loginEmail");
    const passEl = document.getElementById("loginPassword");
    const errorEl = document.getElementById("loginError");

    errorEl.textContent = "";

    const email = emailEl.value.trim();
    const password = passEl.value;

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST", "GET";
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        errorEl.textContent = "Invalid email or password.";
        return;
      }

      const data = await res.json();
      saveSession(data.email, data.role);

      errorEl.style.color = "#16a34a";
      errorEl.textContent = "Login successful. Redirecting…";

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } catch (err) {
      console.error("Login error:", err);
      errorEl.textContent = "Network error. Please try again.";
    }
  });
}

// ========== DASHBOARD / QUESTIONS LOGIC ==========

async function initDashboard() {
  const session = getSession();
  const notice = document.getElementById("loginRedirectNotice");
  const userChip = document.getElementById("userChip");
  const welcomeLine = document.getElementById("welcomeLine");
  const categorySelect = document.getElementById("categorySelect");
  const shuffleBtn = document.getElementById("shuffleBtn");

  if (!session) {
    if (notice) {
      notice.style.display = "block";
      notice.textContent = "You must sign in. Redirecting to login…";
    }
    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
    return;
  }

  if (userChip) {
    userChip.textContent = `${session.email} • ${session.role.toUpperCase()}`;
  }
  if (welcomeLine) {
    welcomeLine.textContent = `Practicing as ${session.role.toUpperCase()}. Use filters to focus on SOC, GRC, or IAM.`;
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      currentCategory = categorySelect.value;
      applyFiltersAndRender();
    });
  }

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      filteredQuestions.sort(() => Math.random() - 0.5);
      currentPage = 1;
      renderQuestions();
    });
  }

  await fetchQuestions();
}

async function fetchQuestions() {
  const container = document.getElementById("questionsContainer");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/questions`);
    if (!res.ok) {
      throw new Error("Failed to load questions");
    }
    const data = await res.json();
    allQuestions = Array.isArray(data) ? data : [];
    applyFiltersAndRender();
  } catch (err) {
    console.error("Fetch questions error:", err);
    container.innerHTML = `<p style="color:#b91c1c;">Unable to load questions from backend.</p>`;
  }
}

function applyFiltersAndRender() {
  if (currentCategory === "All") {
    filteredQuestions = [...allQuestions];
  } else {
    filteredQuestions = allQuestions.filter(q => q.category === currentCategory);
  }
  currentPage = 1;
  updateStats();
  renderQuestions();
}

function updateStats() {
  const totalEl = document.getElementById("totalCount");
  if (totalEl) {
    totalEl.textContent = filteredQuestions.length.toString();
  }
}

function renderQuestions() {
  const container = document.getElementById("questionsContainer");
  const pageBox = document.getElementById("pageBox");
  if (!container || !pageBox) return;

  container.innerHTML = "";
  pageBox.innerHTML = "";

  if (!filteredQuestions.length) {
    container.innerHTML = `<p style="font-size:0.9rem; color:#6b7280;">No questions found for this filter.</p>`;
    return;
  }

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredQuestions.slice(startIdx, startIdx + PAGE_SIZE);

  pageItems.forEach((q, idx) => {
    const globalIndex = startIdx + idx + 1;
    const card = document.createElement("div");
    card.className = "question-card";
    card.innerHTML = `
      <h4>Q${globalIndex}: ${q.question}</h4>
      <p>${q.answer}</p>
    `;
    container.appendChild(card);
  });

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderQuestions();
    }
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderQuestions();
    }
  };

  pageBox.appendChild(prevBtn);
  const label = document.createElement("span");
  label.textContent = ` Page ${currentPage} of ${totalPages} `;
  pageBox.appendChild(label);
  pageBox.appendChild(nextBtn);
}
