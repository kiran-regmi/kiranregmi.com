// v1.1 - dashboard.js — STABLE + STUDY MODE + PROGRESS SUMMARY (HARDENED)

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000/api"
    : "https://kiranregmi-com-backend.onrender.com/api";


document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------
  // DOM references
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
  let dataLoaded = false; // 🔑 important

  // ---------------------------
  // Reviewed storage
  // ---------------------------
  const reviewedStoreKey = "reviewedQuestions";

  function getReviewedMap() {
    try {
      return JSON.parse(localStorage.getItem(reviewedStoreKey) || "{}");
    } catch {
      return {};
    }
  }

  function isReviewed(id) {
    return !!getReviewedMap()[id];
  }

  function setReviewed(id, value) {
    const map = getReviewedMap();
    value ? (map[id] = true) : delete map[id];
    localStorage.setItem(reviewedStoreKey, JSON.stringify(map));
  }

  // File Order 
  // 1. getSession
  // 2. requireAuthOrRedirect
  // 3. forceLogout
  // 4. loadQuestions
  // 5. openSecureDoc
  // 6. updateCategoryCounts
  // 7. renderQuestions
  // 8. wireSecureDocLinks
  // 9. applyRoleBasedUI  
  // ---------------------------


  // Auth ---------------------------
  function getSession() {
    return {
      token: localStorage.getItem("token"),
      role: localStorage.getItem("role"),
      email: localStorage.getItem("email")
    };
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


// auth helper  
function forceLogout(message) {
  ["token", "role", "email"].forEach(k => localStorage.removeItem(k));

  welcomeLine.textContent = message;

  setTimeout(() => {
    window.location.href = "/login.html";
  }, 1200);
}

// open secure doc helper
function openSecureDoc(filename) {
  const { token } = getSession();

  if (!token) {
    forceLogout("Session expired. Please log in again.");
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
    .catch(err => {
      console.error("Secure doc error:", err);
    });
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

}



  // ---------------------------
  // Fetch questions
  // ---------------------------
async function loadQuestions() {
  try {
    const { token } = getSession();

    if (!token) {
      forceLogout("Session missing. Please log in again.");
      return;
    }
    const res = await fetch(`${API_BASE}/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 🔥 EXPLICIT AUTHENTICATION HANDLING
    if (res.status === 401) {
      forceLogout("Session expired. Please log in again.");
      return;
    }

    // 🚫 AUTHORIZATION
    if (res.status === 403) {
      forceLogout("Access denied. Your account is not authorized.");
      return;
    }

    // ❌ REAL ERRORS
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    // ✅ data is ONLY used here
    allQuestions = data.questions || [];
    dataLoaded = true;

    // ✅ category counts use allQuestions, NOT data
    if (typeof updateCategoryCounts === "function") {
      updateCategoryCounts();
    }

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

  function updateProgressSummary() {
    // 🔒 HARD GUARDS
    if (!progressSummary) return;
    if (!dataLoaded) return;

    const category = categorySelect.value;
    const scoped =
      category === "All"
        ? allQuestions
        : allQuestions.filter(q => q.category === category);

    const total = scoped.length;
    const reviewed = scoped.reduce(
      (acc, q) => acc + (isReviewed(q.id) ? 1 : 0),
      0
    );

    const pct = total ? Math.round((reviewed / total) * 100) : 0;
    progressSummary.innerHTML = `Reviewed: <strong>${reviewed}</strong> / <strong>${total}</strong> (${pct}%)`;
  }

  function getFilteredQuestions() {
    const category = categorySelect.value;
    const searchTerm = searchInput.value.trim().toLowerCase();
    const studyModeOn = studyModeToggle?.checked;
    const unreviewedOnly = unreviewedOnlyCheckbox?.checked;

    return allQuestions.filter(q => {
      if (category !== "All" && q.category !== category) return false;

      if (searchTerm) {
        const qt = (q.question || "").toLowerCase();
        const at = (q.answer || "").toLowerCase();
        if (!qt.includes(searchTerm) && !at.includes(searchTerm)) return false;
      }

      if (studyModeOn && unreviewedOnly && isReviewed(q.id)) return false;

      return true;
    });
  }




  // category count logic
  function updateCategoryCounts() {
  if (!allQuestions.length) return;

  const counts = allQuestions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});

  const options = categorySelect.querySelectorAll("option");

  options.forEach(opt => {
    const value = opt.value;

    if (value === "All") {
      opt.textContent = `All Categories (${allQuestions.length})`;
    } else {
      const count = counts[value] || 0;
      opt.textContent = `${value} (${count})`;
    }
  });
}

  // ---------------------------
  // Render
  // ---------------------------
  function renderQuestions() {
    if (!dataLoaded) return;

    updateProgressSummary();

    let filtered = getFilteredQuestions();
    totalDisplay.textContent = filtered.length;

    if (shuffled) {
      filtered = [...filtered];
      shuffleArray(filtered);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    questionsContainer.innerHTML = "";

    pageItems.forEach(q => {
      const card = document.createElement("div");
      card.className = "question-card";

     // adding a title attribute for better accessibility
      card.innerHTML = `
        ${q.title ? `<div class="question-title">${q.title}</div>` : ""}
        <h4>${q.question}</h4>
        <p><strong>Category:</strong> ${q.category}</p>
        <button class="answer-btn">Show Answer</button>
        <div class="answer hidden">
          <strong>Answer:</strong>
          <div class="answer-text">${q.answer || "No answer provided."}</div>
        </div>
      `;

      const btn = card.querySelector(".answer-btn");
      const ans = card.querySelector(".answer");

      btn.addEventListener("click", () => {
        ans.classList.toggle("hidden");
        btn.textContent = ans.classList.contains("hidden")
          ? "Show Answer"
          : "Hide Answer";
      });

      if (studyModeToggle?.checked) {
        const reviewed = isReviewed(q.id);
        const reviewBtn = document.createElement("button");
        reviewBtn.textContent = reviewed ? "Mark Unreviewed" : "Mark Reviewed";
        reviewBtn.style.marginTop = "0.5rem";
        reviewBtn.style.fontSize = "0.75rem";
        reviewBtn.onclick = () => {
          setReviewed(q.id, !reviewed);
          renderQuestions();
        };
        card.appendChild(reviewBtn);
      }

      questionsContainer.appendChild(card);
    });

    pageBox.innerHTML = `Page ${currentPage} of ${totalPages}`;
    if (totalPages > 1) {
      const prev = document.createElement("button");
      const next = document.createElement("button");
      prev.textContent = "Prev";
      next.textContent = "Next";
      prev.disabled = currentPage === 1;
      next.disabled = currentPage === totalPages;
      prev.onclick = () => { currentPage--; renderQuestions(); };
      next.onclick = () => { currentPage++; renderQuestions(); };
      pageBox.prepend(prev);
      pageBox.append(next);
    }
  }

  // Security Posture Dropdown ---------------------------
function wireSecureDocLinks() {
  const menu = document.getElementById("securityDocsMenu");
  if (!menu) return;

  menu.querySelectorAll("a[data-doc]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const filename = link.dataset.doc;
      openSecureDoc(filename);
    });
  });
}
  // 


  // Events ---------------------------
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

  studyModeToggle?.addEventListener("change", () => {
    currentPage = 1;
    renderQuestions();
  });

  unreviewedOnlyCheckbox?.addEventListener("change", () => {
    currentPage = 1;
    renderQuestions();
  });

  // ---------------------------
  // Init
  // ---------------------------
  if (requireAuthOrRedirect()) {
  applyRoleBasedUI();
  wireSecureDocLinks();
  loadQuestions();
}

