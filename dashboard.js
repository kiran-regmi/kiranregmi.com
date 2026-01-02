// dashboard.js — BASELINE + STUDY MODE (SAFE VERSION)

const API_BASE = "https://kiranregmi-com-backend.onrender.com/api";

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

  // Study mode controls (optional but present in your HTML)
  const studyModeToggle = document.getElementById("studyModeToggle");
  const unreviewedOnlyCheckbox = document.getElementById("unreviewedOnly");

  // ---------------------------
  // State
  // ---------------------------
  let allQuestions = [];
  let currentPage = 1;
  const PAGE_SIZE = 12;
  let shuffled = false;

  // ---------------------------
  // Reviewed (localStorage)
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
    if (value) map[id] = true;
    else delete map[id];
    localStorage.setItem(reviewedStoreKey, JSON.stringify(map));
  }

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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/login.html";
  }

  logoutBtn.addEventListener("click", handleLogout);

  // ---------------------------
  // Fetch questions
  // ---------------------------
  async function loadQuestions() {
    const { token } = getSession();
    try {
      const res = await fetch(`${API_BASE}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      allQuestions = data.questions || [];
      currentPage = 1;
      renderQuestions();
    } catch (err) {
      console.error("Failed to load questions", err);
    }
  }

  // ---------------------------
  // Filtering logic
  // ---------------------------
  function getFilteredQuestions() {
    const category = categorySelect.value;
    const searchTerm = searchInput.value.trim().toLowerCase();
    const studyModeOn = studyModeToggle?.checked;
    const unreviewedOnly = unreviewedOnlyCheckbox?.checked;

    return allQuestions.filter(q => {
      // Category
      if (category !== "All" && q.category !== category) return false;

      // Search
      if (searchTerm) {
        const qt = (q.question || "").toLowerCase();
        const at = (q.answer || "").toLowerCase();
        if (!qt.includes(searchTerm) && !at.includes(searchTerm)) return false;
      }

      // Study Mode filter
      if (studyModeOn && unreviewedOnly && isReviewed(q.id)) {
        return false;
      }

      return true;
    });
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // ---------------------------
  // Render
  // ---------------------------
  function renderQuestions() {
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

      card.innerHTML = `
        <h4>${q.question}</h4>
        <p><strong>Category:</strong> ${q.category}</p>

        <button class="answer-btn">Show Answer</button>

        <div class="answer hidden">
          <strong>Answer:</strong>
          <div class="answer-text">${q.answer || "No answer provided."}</div>
        </div>
      `;

      // Answer toggle
      const btn = card.querySelector(".answer-btn");
      const ans = card.querySelector(".answer");

      btn.addEventListener("click", () => {
        const hidden = ans.classList.contains("hidden");
        ans.classList.toggle("hidden");
        btn.textContent = hidden ? "Hide Answer" : "Show Answer";
      });

      // Study Mode: Reviewed button
      if (studyModeToggle?.checked) {
        const reviewed = isReviewed(q.id);

        const reviewBtn = document.createElement("button");
        reviewBtn.textContent = reviewed ? "Mark Unreviewed" : "Mark Reviewed";
        reviewBtn.style.marginTop = "0.5rem";
        reviewBtn.style.fontSize = "0.75rem";

        reviewBtn.addEventListener("click", () => {
          setReviewed(q.id, !reviewed);
          renderQuestions();
        });

        card.appendChild(reviewBtn);
      }

      questionsContainer.appendChild(card);
    });

    // Pagination
    pageBox.innerHTML = `<span>Page ${currentPage} of ${totalPages}</span>`;
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

  // ---------------------------
  // Events
  // ---------------------------
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderQuestions();
  });

  categorySelect.addEventListener("change", () => {
    currentPage = 1;
    renderQuestions();
  });

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
    loadQuestions();
  }
});
