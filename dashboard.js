// dashboard.js — CLEAN + STABLE + RBAC-SAFE

const API_BASE = "https://kiranregmi-com-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------
  // DOM refs
  // ---------------------------
  const searchInput = document.getElementById("searchInput");
  const totalDisplay = document.getElementById("totalCount");
  const categorySelect = document.getElementById("categorySelect");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const questionsContainer = document.getElementById("questionsContainer");
  const pageBox = document.getElementById("pageBox");
  const welcomeLine = document.getElementById("welcomeLine");
  const userChip = document.getElementById("userChip");
  const loginRedirectNotice = document.getElementById("loginRedirectNotice");
  const logoutBtn = document.getElementById("logoutBtn");
  const studyModeToggle = document.getElementById("studyModeToggle");
  const unreviewedOnlyCheckbox = document.getElementById("unreviewedOnly");
  const progressSummary = document.getElementById("progressSummary");

  // ---------------------------
  // State
  // ---------------------------
  let allQuestions = [];
  let currentPage = 1;
  const PAGE_SIZE = 12;
  let shuffled = false;
  let dataLoaded = false;

  // ---------------------------
  // Auth helpers
  // ---------------------------
  function getSession() {
    return {
      token: localStorage.getItem("token"),
      role: localStorage.getItem("role"),
      email: localStorage.getItem("email")
    };
  }

  function forceLogout(message) {
    ["token", "role", "email"].forEach(k => localStorage.removeItem(k));
    welcomeLine.textContent = message;
    setTimeout(() => (window.location.href = "/login.html"), 1200);
  }

  function requireAuthOrRedirect() {
    const { token, role, email } = getSession();
    if (!token || !role) {
      loginRedirectNotice.style.display = "block";
      welcomeLine.textContent = "No active session found. Redirecting...";
      setTimeout(() => (window.location.href = "/login.html"), 1200);
      return false;
    }
    welcomeLine.textContent = `Welcome back, ${email || "User"}`;
    userChip.textContent = role === "admin" ? "Admin" : "User";
    return true;
  }

  logoutBtn.addEventListener("click", () => {
    ["token", "role", "email"].forEach(k => localStorage.removeItem(k));
    window.location.href = "/login.html";
  });

  // ---------------------------
  // Secure Docs (ADMIN ONLY)
  // ---------------------------
  function openSecureDoc(filename) {
    const { token } = getSession();
    if (!token) {
      forceLogout("Session expired.");
      return;
    }

    fetch(`${API_BASE}/secure-doc/${filename}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          forceLogout("Access denied.");
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch document");
        return res.blob();
      })
      .then(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      })
      .catch(err => console.error("Secure doc error:", err));
  }

  function applyRoleBasedUI() {
    const { role } = getSession();
    const menu = document.getElementById("securityDocsMenu");
    if (!menu) return;
    if (role !== "admin") menu.style.display = "none";
  }

  function wireSecureDocLinks() {
    const menu = document.getElementById("securityDocsMenu");
    if (!menu) return;

    menu.querySelectorAll("a[data-doc]").forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        openSecureDoc(link.dataset.doc);
      });
    });
  }

  // ---------------------------
  // Questions
  // ---------------------------
  async function loadQuestions() {
    try {
      const { token } = getSession();
      if (!token) {
        forceLogout("Session expired.");
        return;
      }

      const res = await fetch(`${API_BASE}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) return forceLogout("Session expired.");
      if (res.status === 403) return forceLogout("Access denied.");

      const data = await res.json();
      allQuestions = data.questions || [];
      dataLoaded = true;

      updateCategoryCounts();
      currentPage = 1;
      renderQuestions();
    } catch (err) {
      console.error("Failed to load questions", err);
      welcomeLine.textContent = "Failed to load questions.";
    }
  }

  // ---------------------------
  // Helpers
  // ---------------------------
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function getFilteredQuestions() {
    const category = categorySelect.value;
    const term = searchInput.value.toLowerCase();
    return allQuestions.filter(q => {
      if (category !== "All" && q.category !== category) return false;
      if (term && !q.question.toLowerCase().includes(term)) return false;
      if (studyModeToggle.checked && unreviewedOnlyCheckbox.checked && q.reviewed)
        return false;
      return true;
    });
  }

  function updateCategoryCounts() {
    const counts = allQuestions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {});

    categorySelect.querySelectorAll("option").forEach(opt => {
      opt.textContent =
        opt.value === "All"
          ? `All Categories (${allQuestions.length})`
          : `${opt.value} (${counts[opt.value] || 0})`;
    });
  }

  function renderQuestions() {
    if (!dataLoaded) return;

    let filtered = getFilteredQuestions();
    totalDisplay.textContent = filtered.length;

    if (shuffled) {
      filtered = [...filtered];
      shuffleArray(filtered);
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    questionsContainer.innerHTML = "";
    pageItems.forEach(q => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.innerHTML = `<h4>${q.question}</h4><p>${q.answer}</p>`;
      questionsContainer.appendChild(card);
    });
  }

  // ---------------------------
  // Events
  // ---------------------------
  [searchInput, categorySelect].forEach(el =>
    el.addEventListener("input", () => {
      currentPage = 1;
      renderQuestions();
    })
  );

  shuffleBtn.addEventListener("click", () => {
    shuffled = true;
    currentPage = 1;
    renderQuestions();
  });

  // ---------------------------
  // INIT
  // ---------------------------
  if (requireAuthOrRedirect()) {
    applyRoleBasedUI();
    wireSecureDocLinks();
    loadQuestions();
  }
});
