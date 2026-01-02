// dashboard.js (FULL WORKING)

const API_BASE = "https://kiranregmi-com-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  // Required DOM references (must exist in dashboard.html)
  const totalDisplay = document.getElementById("totalCount");
  const categorySelect = document.getElementById("categorySelect");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const questionsContainer = document.getElementById("questionsContainer");
  const pageBox = document.getElementById("pageBox");
  const welcomeLine = document.getElementById("welcomeLine");
  const userChip = document.getElementById("userChip");
  const loginRedirectNotice = document.getElementById("loginRedirectNotice");
  const logoutBtn = document.getElementById("logoutBtn");

  // Optional DOM references (may NOT exist in your current dashboard.html)
  const searchInput = document.getElementById("searchInput");          // optional
  const unreviewedOnlyCheckbox = document.getElementById("unreviewedOnly"); // optional

  // If any required element is missing, fail gracefully (prevents silent blank page)
  const required = [
    totalDisplay, categorySelect, shuffleBtn, questionsContainer,
    pageBox, welcomeLine, userChip, loginRedirectNotice, logoutBtn
  ];
  if (required.some(el => !el)) {
    console.error("Dashboard missing required elements. Check dashboard.html IDs.");
    return;
  }

  // State
  let allQuestions = [];
  let currentPage = 1;
  const PAGE_SIZE = 12;
  let shuffled = false;

  // Reviewed storage
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

  // Auth/session
  function getSession() {
    return {
      token: localStorage.getItem("token"),
      role: localStorage.getItem("role"),
      email: localStorage.getItem("email")
    };
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/login.html";
  }

  logoutBtn.addEventListener("click", handleLogout);

  function requireAuthOrRedirect() {
    const { token, role, email } = getSession();

    if (!token || !role) {
      loginRedirectNotice.style.display = "block";
      welcomeLine.textContent = "You are not signed in. Redirecting to login…";
      userChip.textContent = "";
      setTimeout(() => (window.location.href = "/login.html"), 1200);
      return false;
    }

    welcomeLine.textContent = `Welcome back, ${email || "Signed in user"}`;
    userChip.textContent = role === "admin" ? "Admin" : "User";
    return true;
  }

  // Fetch questions
  async function loadQuestions() {
    const { token } = getSession();

    try {
      const res = await fetch(`${API_BASE}/questions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Backend currently allows it without auth, but sending token is fine.
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        console.error("Failed to fetch questions:", res.status, res.statusText);
        welcomeLine.textContent = "Error loading questions from server.";
        return;
      }

      const data = await res.json();
      if (!data || !data.success || !Array.isArray(data.questions)) {
        console.error("Unexpected response from /api/questions:", data);
        welcomeLine.textContent = "Unexpected question format from server.";
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

  // Helpers
  function normalizeText(v) {
    return (v ?? "").toString();
  }

  function getQuestionId(q) {
    return normalizeText(q.id || q._id || q.questionId || "");
  }

  function getQuestionText(q) {
    // Support multiple field names
    return normalizeText(q.question || q.text || q.prompt || "Question text missing.");
  }

  function getAnswerText(q) {
    return normalizeText(q.answer || q.solution || q.explanation || "");
  }

  function getCategory(q) {
    return normalizeText(q.category || "General");
  }

  function getFilteredQuestions() {
    const category = categorySelect.value || "All";

    // Optional search
    const searchTerm = searchInput
      ? normalizeText(searchInput.value).trim().toLowerCase()
      : "";

    // Optional "unreviewed only"
    const unreviewedOnly = unreviewedOnlyCheckbox
      ? !!unreviewedOnlyCheckbox.checked
      : false;

    return allQuestions.filter(q => {
      const id = getQuestionId(q);
      if (!id) return false;

      const cat = getCategory(q);

      // category filter
      if (category !== "All" && cat !== category) return false;

      // search filter
      if (searchTerm) {
        const qt = getQuestionText(q).toLowerCase();
        const at = getAnswerText(q).toLowerCase();
        if (!qt.includes(searchTerm) && !at.includes(searchTerm)) return false;
      }

      // reviewed filter
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

  function escapeHtml(str) {
    // prevents broken layout if answers contain < or >
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  // Render
  function renderQuestions() {
    let filtered = getFilteredQuestions();

    totalDisplay.textContent = String(filtered.length);

    if (shuffled) {
      filtered = [...filtered];
      shuffleArray(filtered);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start
