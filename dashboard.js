// dashboard.js

const API_BASE = "https://kiranregmi-com-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  // DOM references
  const totalDisplay = document.getElementById("totalCount");
  const categorySelect = document.getElementById("categorySelect");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const questionsContainer = document.getElementById("questionsContainer");
  const pageBox = document.getElementById("pageBox");
  const welcomeLine = document.getElementById("welcomeLine");
  const userChip = document.getElementById("userChip");
  const loginRedirectNotice = document.getElementById("loginRedirectNotice");
  const logoutBtn = document.getElementById("logoutBtn");

  // State
  let allQuestions = [];
  let currentPage = 1;
  const PAGE_SIZE = 12;
  let shuffled = false;

  // --- Session / Auth helpers ---

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
      // Not signed in
      loginRedirectNotice.style.display = "block";
      welcomeLine.textContent = "No active session found.";
      userChip.textContent = "";
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1500);
      return false;
    }

    // Show session info in UI
    const safeEmail = email || "Signed in user";
    welcomeLine.textContent = `Welcome back, ${safeEmail}`;
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

  // --- Fetch questions ---

  async function loadQuestions() {
    const { token } = getSession();
    if (!token) return; // already handled by requireAuthOrRedirect

    try {
      const res = await fetch(`${API_BASE}/questions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        // Token invalid/expired – force re-login
        console.warn("Unauthorized, clearing session and redirecting.");
        handleLogout();
        return;
      }

      if (!res.ok) {
        console.error("Failed to fetch questions:", res.status, res.statusText);
        welcomeLine.textContent = "Error loading questions from server.";
        return;
      }

      const data = await res.json();

      if (!data.success || !Array.isArray(data.questions)) {
        console.error("Unexpected /api/questions response shape:", data);
        welcomeLine.textContent = "Question data returned in unexpected format.";
        return;
      }

      allQuestions = data.questions;
      currentPage = 1;
      renderQuestions();
    } catch (err) {
      console.error("Network error fetching questions:", err);
      welcomeLine.textContent = "Network error while loading questions.";
    }
  }

  // --- Rendering helpers ---

  function getFilteredQuestions() {
    const category = categorySelect.value;
    if (category === "All") {
      return [...allQuestions];
    }
    return allQuestions.filter(q => q.category === category);
  }

  function shuffleArray(arr) {
    // Fisher–Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function renderQuestions() {
    const filtered = getFilteredQuestions();

    // update total count
    totalDisplay.textContent = filtered.length.toString();

    if (shuffled) {
      shuffleArray(filtered);
    }

    // pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    // render cards
    questionsContainer.innerHTML = "";
    if (pageItems.length === 0) {
      questionsContainer.innerHTML = `<p style="font-size:0.9rem;color:#6b7280;">No questions found for this category.</p>`;
    } else {
      for (const q of pageItems) {
        const card = document.createElement("div");
        card.className = "question-card";

        const text = q.question || q.text || "Question text missing.";
        const categoryLabel = q.category || "General";
        const idLabel = q.id || q._id || "";

        card.innerHTML = `
          <h4 class="question-text">${text}</h4>
          <p><strong>Category:</strong> ${categoryLabel}</p>
          ${idLabel ? `<p style="font-size:0.75rem;color:#9ca3af;">ID: ${idLabel}</p>` : ""}
          <button class="answer-btn">Show Answer</button>
          <div class="answer hidden">
          <strong>Answer:</strong>
          <div class="answer-text">
            ${q.answer ? q.answer : "No answer provided in dataset."}
          </div>
          </div>
          `;

          const btn = card.querySelector(".answer-btn");
          const ans = card.querySelector(".answer");

          btn.addEventListener("click", () => {
            const isHidden = ans.classList.contains("hidden");
            ans.classList.toggle("hidden");
            btn.textContent = isHidden ? "Hide Answer" : "Show Answer";
        });

        questionsContainer.appendChild(card);
      }
    }

    // render pagination controls
    pageBox.innerHTML = "";
    const meta = document.createElement("span");
    meta.textContent = `Page ${currentPage} of ${totalPages}`;
    pageBox.appendChild(meta);

    if (totalPages > 1) {
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "Prev";
      prevBtn.disabled = currentPage === 1;
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderQuestions();
        }
      });

      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderQuestions();
        }
      });

      // Put buttons around the page indicator
      pageBox.prepend(prevBtn);
      pageBox.appendChild(nextBtn);
    }
  }

  // --- Event wiring ---

  categorySelect.addEventListener("change", () => {
    currentPage = 1;
    renderQuestions();
  });

  shuffleBtn.addEventListener("click", () => {
    shuffled = true; // mark as shuffled for this view
    currentPage = 1;
    renderQuestions();
  });

  // --- Init ---

  const hasSession = requireAuthOrRedirect();
  if (hasSession) {
    loadQuestions();
  }
});
