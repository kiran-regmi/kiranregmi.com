const API_BASE = "https://kiranregmi-com-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  // DOM references
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
  const unreviewedOnlyCheckbox = document.getElementById("unreviewedOnly");

  // State
  let allQuestions = [];
  let currentPage = 1;
  const PAGE_SIZE = 12;
  let shuffled = false;

  // --- Reviewed helpers ---
  const reviewedStoreKey = "reviewedQuestions";

  function getReviewedMap() {
    return JSON.parse(localStorage.getItem(reviewedStoreKey) || "{}");
  }

  function isReviewed(id) {
    return !!getReviewedMap()[id];
  }

  function setReviewed(id, value) {
    const map = getReviewedMap();
    value ? (map[id] = true) : delete map[id];
    localStorage.setItem(reviewedStoreKey, JSON.stringify(map));
  }

  // --- Auth helpers ---
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
      welcomeLine.textContent = "No active session found.";
      setTimeout(() => (window.location.href = "/login.html"), 1500);
      return false;
    }
    welcomeLine.textContent = `Welcome back, ${email || "User"}`;
    userChip.textContent = role === "admin" ? "Admin" : "User";
    return true;
  }

  function handleLogout() {
    ["token", "role", "email"].forEach(k => localStorage.removeItem(k));
    window.location.href = "/login.html";
  }

  logoutBtn.addEventListener("click", handleLogout);

  // --- Fetch ---
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
    } catch (e) {
      console.error("Fetch failed", e);
    }
  }

  // --- Filters ---
  function getFilteredQuestions() {
    const search = searchInput.value.toLowerCase();
    const category = categorySelect.value;
    const unreviewedOnly = unreviewedOnlyCheckbox.checked;

    return allQuestions.filter(q => {
      const id = q.id || q._id;
      if (!id) return false;
      if (category !== "All" && q.category !== category) return false;
      if (
        search &&
        !q.question.toLowerCase().includes(search) &&
        !(q.answer || "").toLowerCase().includes(search)
      ) return false;
      if (unreviewedOnly && isReviewed(id)) return false;
      return true;
    });
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // --- Render ---
  function renderQuestions() {
    let filtered = getFilteredQuestions();
    totalDisplay.textContent = filtered.length;

    if (shuffled) shuffleArray(filtered);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);

    const pageItems = filtered.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );

    questionsContainer.innerHTML = "";

    pageItems.forEach(q => {
      const id = q.id || q._id;
      const reviewed = isReviewed(id);

      const card = document.createElement("div");
      card.className = "question-card";

      card.innerHTML = `
        <h4>${q.question}
          ${reviewed ? `<span class="reviewed-badge">Reviewed</span>` : ""}
        </h4>
        <p><strong>Category:</strong> ${q.category}</p>

        <button class="review-btn">
          ${reviewed ? "Mark Unreviewed" : "Mark Reviewed"}
        </button>

        <button class="answer-btn">Show Answer</button>

        <div class="answer hidden">
          <strong>Answer:</strong>
          <div class="answer-text">${q.answer || "No answer provided."}</div>
        </div>
      `;

      card.querySelector(".review-btn").onclick = () => {
        setReviewed(id, !reviewed);
        renderQuestions();
      };

      const ans = card.querySelector(".answer");
      const btn = card.querySelector(".answer-btn");
      btn.onclick = () => {
        ans.classList.toggle("hidden");
        btn.textContent = ans.classList.contains("hidden")
          ? "Show Answer"
          : "Hide Answer";
      };

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

  // --- Events ---
  [searchInput, categorySelect, unreviewedOnlyCheckbox].forEach(el =>
    el.addEventListener("input", () => {
      currentPage = 1;
      renderQuestions();
    })
  );

  shuffleBtn.addEventListener("click", () => {
    shuffled = true;
    renderQuestions();
  });

  // --- Init ---
  if (requireAuthOrRedirect()) loadQuestions();
});
