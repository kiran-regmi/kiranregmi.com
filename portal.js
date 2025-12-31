// portal.js

// const API_BASE_URL = "http://localhost:5000"; // change later when backend is deployed


// Decide backend URL: localhost in dev, Render in prod
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://kiranregmi-com-backend.onrender.com";

const SESSION_KEY = "kr_portal_session";
const PROGRESS_KEY = "kr_practice_progress";

/* ---------- Session helpers ---------- */
function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ---------- Practice progress helpers ---------- */
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/* -------------- Main Portal Logic -------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Sections
  const authSection = document.getElementById("authSection");
  const portalShell = document.getElementById("portalShell");

  // Auth
  const loginForm = document.getElementById("loginForm");
  const authError = document.getElementById("authError");
  const logoutBtn = document.getElementById("logoutBtn");

  // Top nav
  const portalTabs = document.querySelectorAll(".portal-tab[data-view]");
  const adminTab = document.getElementById("adminTab");
  const portalUserEmail = document.getElementById("portalUserEmail");

  // Views
  const projectsView = document.getElementById("projectsView");
  const practiceView = document.getElementById("practiceView");
  const profileView = document.getElementById("profileView");
  const adminView = document.getElementById("adminView");
  const views = { projectsView, practiceView, profileView, adminView };

  // Profile fields
  const profileEmail = document.getElementById("profileEmail");
  const profileRole = document.getElementById("profileRole");
  const profileName = document.getElementById("profileName");

  // Projects
  const projectTableBody = document.getElementById("projectTableBody");
  const addProjectBtn = document.getElementById("addProjectBtn");
  const projectDrawer = document.getElementById("projectDrawer");
  const drawerClose = document.getElementById("drawerClose");
  const projectForm = document.getElementById("projectForm");
  const drawerTitle = document.getElementById("drawerTitle");

  // Interview practice
  const categoryFilter = document.getElementById("categoryFilter");
  const studyModeBtn = document.getElementById("studyModeBtn");
  const quizModeBtn = document.getElementById("quizModeBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const questionsContainer = document.getElementById("questionsContainer");
  const practiceProgressLabel = document.getElementById("practiceProgressLabel");
  const practiceSummary = document.getElementById("practiceSummary");
  const practicePagination = document.getElementById("practicePagination");

  // Practice state
  let allQuestions = [];
  let practiceProgress = loadProgress();
  let currentCategory = "SOC";
  let currentMode = "study"; // "study" or "quiz"
  let currentPage = 1;
  const pageSize = 9;
  let questionsLoaded = false;

  /* ---------- UI helpers ---------- */
  function showAuth() {
    authSection.classList.remove("hidden");
    portalShell.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    portalUserEmail.textContent = "";
  }

  function showPortal(session) {
    authSection.classList.add("hidden");
    portalShell.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");

    const { email, role, name } = session;
    portalUserEmail.textContent = email || "";

    if (profileEmail) profileEmail.textContent = email || "";
    if (profileRole) profileRole.textContent = role || "";
    if (profileName) profileName.textContent = name || email || "";

    if (role === "admin") {
      adminTab.classList.remove("hidden");
      addProjectBtn.classList.remove("hidden");
    } else {
      adminTab.classList.add("hidden");
      addProjectBtn.classList.add("hidden");
    }

    setActiveView("projectsView");

    if (categoryFilter) {
      currentCategory = "SOC";
      categoryFilter.value = "SOC";
    }
  }

  function setActiveView(viewId) {
    Object.entries(views).forEach(([id, el]) => {
      if (!el) return;
      el.classList.toggle("active", id === viewId);
    });

    portalTabs.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });

    if (viewId === "practiceView") {
      if (!questionsLoaded) {
        loadQuestions();
      } else {
        renderQuestions();
      }
    }
  }

  /* ---------- Auth/Login handlers ---------- */
  async function handleLogin(e) {
    e.preventDefault();
    authError.classList.add("hidden");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        authError.classList.remove("hidden");
        return;
      }

      const data = await res.json();
      const session = {
        token: data.token,
        role: data.role,
        email: data.email,
        name: data.name || data.email,
        isAuthenticated: true,
      };

      saveSession(session);
      showPortal(session);
      loadProjects();
      loadQuestions();
    } catch (err) {
      console.error("Login failed:", err);
      authError.classList.remove("hidden");
    }
  }

  function handleLogout() {
    clearSession();
    allQuestions = [];
    questionsLoaded = false;
    practiceProgress = loadProgress();
    showAuth();
  }

  /* ---------- Projects ---------- */
  function openProjectDrawer() {
    if (!projectDrawer) return;
    drawerTitle.textContent = "Add Project";
    projectForm.reset();
    projectDrawer.classList.remove("hidden");
  }

  function closeProjectDrawer() {
    if (!projectDrawer) return;
    projectDrawer.classList.add("hidden");
  }

  async function loadProjects() {
    const session = loadSession();
    if (!session || !session.token || !projectTableBody) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      const data = await res.json();
      const projects = Array.isArray(data.projects) ? data.projects : [];

      projectTableBody.innerHTML = "";

      if (projects.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          '<td colspan="7" style="font-size:0.85rem;color:#6b7280;">No projects returned yet from backend.</td>';
        projectTableBody.appendChild(tr);
        return;
      }

      projects.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.project || p.name || "Project"}</td>
          <td>${p.compliance || "-"}</td>
          <td>${p.riskImpact || "-"}</td>
          <td>${p.status || "-"}</td>
          <td>${p.auditDate || "-"}</td>
          <td>${p.owner || p.assignedTo || "-"}</td>
          <td>${session.role === "admin" ? "Admin-only actions" : "View only"}</td>
        `;
        projectTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }

  async function handleProjectSubmit(e) {
    e.preventDefault();
    const session = loadSession();
    if (!session || !session.token) return;

    const payload = {
      project: document.getElementById("formProjectName").value.trim(),
      compliance: document.getElementById("formCompliance").value,
      riskImpact: document.getElementById("formRisk").value,
      status: document.getElementById("formStatus").value,
      owner: document.getElementById("formAssignedTo").value,
      auditDate: document.getElementById("formLastAudit").value,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to save project");
      }
      closeProjectDrawer();
      loadProjects();
    } catch (err) {
      console.error("Error saving project:", err);
    }
  }

  /* ---------- Interview Questions ---------- */
  function getCategoryFilteredQuestions() {
    if (currentCategory === "all") return [...allQuestions];
    return allQuestions.filter((q) => q.category === currentCategory);
  }

  function computeProgress(list) {
    let mastered = 0;
    let needsWork = 0;
    list.forEach((q) => {
      const status = practiceProgress[q.id];
      if (status === "mastered") mastered++;
      if (status === "needs-work") needsWork++;
    });
    return { mastered, needsWork, total: list.length };
  }

  function markStatus(questionId, status, card) {
    practiceProgress[questionId] = status;
    saveProgress(practiceProgress);

    if (card) {
      card.classList.remove("mastered", "needs-work");
      if (status === "mastered") card.classList.add("mastered");
      if (status === "needs-work") card.classList.add("needs-work");

      const pillRow = card.querySelectorAll(".status-pill");
      pillRow.forEach((pill) => {
        pill.classList.remove("active-mastered", "active-needs-work");
        if (pill.dataset.status === status) {
          pill.classList.add(
            status === "mastered" ? "active-mastered" : "active-needs-work"
          );
        }
      });
    }

    const list = getCategoryFilteredQuestions();
    const { mastered, needsWork, total } = computeProgress(list);
    if (practiceProgressLabel) {
      practiceProgressLabel.textContent = `Mastered: ${mastered} • Need work: ${needsWork} • Total: ${total}`;
    }
    if (practiceSummary) {
      practiceSummary.textContent = `You are viewing ${currentCategory === "all" ? "all categories" : currentCategory} • Mastered ${mastered} • Need work ${needsWork} • Total ${total}`;
    }
  }

  function renderQuestions() {
    if (!questionsContainer) return;

    questionsContainer.innerHTML = "";
    if (practiceSummary) practiceSummary.textContent = "";
    if (practicePagination) practicePagination.innerHTML = "";

    if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
      questionsContainer.innerHTML =
        '<p class="portal-helper-text">No questions loaded yet. Check backend /api/questions.</p>';
      if (practiceProgressLabel) {
        practiceProgressLabel.textContent =
          "No questions loaded. Check backend /api/questions.";
      }
      return;
    }

    let list = getCategoryFilteredQuestions();

    if (list.length === 0) {
      questionsContainer.innerHTML = `
        <div class="portal-card">
          <p class="portal-helper-text">
            No questions for this category yet. Try another filter.
          </p>
        </div>
      `;
      if (practiceProgressLabel) {
        practiceProgressLabel.textContent =
          "No questions for this category yet.";
      }
      return;
    }

    const { mastered, needsWork, total } = computeProgress(list);
    if (practiceProgressLabel) {
      practiceProgressLabel.textContent = `Mastered: ${mastered} • Need work: ${needsWork} • Total: ${total}`;
    }
    if (practiceSummary) {
      practiceSummary.textContent = `Viewing ${currentCategory === "all" ? "all categories" : currentCategory} • Mastered ${mastered} • Need work ${needsWork} • Total ${total}`;
    }

    const totalPages = Math.ceil(list.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * pageSize;
    const visible = list.slice(start, start + pageSize);

    visible.forEach((q, idx) => {
      const card = document.createElement("div");
      card.classList.add("question-card");

      const status = practiceProgress[q.id];
      if (status === "mastered") card.classList.add("mastered");
      if (status === "needs-work") card.classList.add("needs-work");

      const globalIndex = start + idx + 1;
      const labelNumber = String(globalIndex).padStart(2, "0");

      const answerHidden = currentMode === "quiz";

      card.innerHTML = `
        <div class="question-meta">
          <div>
            <strong>Q${labelNumber} — ${q.question}</strong>
            <span class="category-tag">${q.category}</span>
          </div>
        </div>
        <div class="answer ${answerHidden ? "hidden" : ""}">
          ${q.answer}
        </div>
        <div class="card-actions">
          <button class="status-pill" data-status="mastered">Mastered</button>
          <button class="status-pill" data-status="needs-work">Need work</button>
        </div>
      `;

      // Setup pill state
      const pills = card.querySelectorAll(".status-pill");
      pills.forEach((pill) => {
        const pillStatus = pill.dataset.status;
        pill.classList.remove("active-mastered", "active-needs-work");
        if (pillStatus === status) {
          pill.classList.add(
            status === "mastered" ? "active-mastered" : "active-needs-work"
          );
        }
        pill.addEventListener("click", (e) => {
          e.stopPropagation();
          markStatus(q.id, pillStatus, card);
        });
      });

      // Toggle answer visibility on card click (except on buttons)
      card.addEventListener("click", (e) => {
        if (e.target.closest(".status-pill")) return;
        const ans = card.querySelector(".answer");
        if (ans) ans.classList.toggle("hidden");
      });

      questionsContainer.appendChild(card);
    });

    // Pagination controls — once per page, not per card
    if (practicePagination) {
      practicePagination.innerHTML = "";

      const prevBtn = document.createElement("button");
      prevBtn.textContent = "← Previous";
      prevBtn.classList.add("btn-link");
      prevBtn.disabled = currentPage === 1;

      const label = document.createElement("span");
      label.textContent = `Page ${currentPage} of ${totalPages}`;

      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next →";
      nextBtn.classList.add("btn-link");
      nextBtn.disabled = currentPage === totalPages;

      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderQuestions();
          questionsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderQuestions();
          questionsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      practicePagination.appendChild(prevBtn);
      practicePagination.appendChild(label);
      practicePagination.appendChild(nextBtn);
    }
  }

  async function loadQuestions() {
    const session = loadSession();
    if (!session || !session.token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/questions`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      const data = await res.json();
      allQuestions = Array.isArray(data.questions) ? data.questions : [];
      questionsLoaded = true;
      currentPage = 1;
      renderQuestions();
    } catch (err) {
      console.error("Failed to load questions:", err);
      if (questionsContainer) {
        questionsContainer.innerHTML =
          '<p class="portal-helper-text error">Error loading questions from backend.</p>';
      }
    }
  }

  /* ---------- Practice controls ---------- */
  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      currentCategory = categoryFilter.value;
      currentPage = 1;
      renderQuestions();
    });
  }

  if (studyModeBtn && quizModeBtn) {
    studyModeBtn.addEventListener("click", () => {
      currentMode = "study";
      studyModeBtn.classList.add("active");
      quizModeBtn.classList.remove("active");
      renderQuestions();
    });

    quizModeBtn.addEventListener("click", () => {
      currentMode = "quiz";
      quizModeBtn.classList.add("active");
      studyModeBtn.classList.remove("active");
      renderQuestions();
    });
  }

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      if (allQuestions.length === 0) return;
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
      }
      currentPage = 1;
      renderQuestions();
    });
  }

  /* ---------- Nav tabs ---------- */
  portalTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const viewId = btn.dataset.view;
      if (viewId) setActiveView(viewId);
    });
  });

  /* ---------- Drawer events ---------- */
  if (addProjectBtn) addProjectBtn.addEventListener("click", openProjectDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeProjectDrawer);
  if (projectDrawer) {
    projectDrawer.addEventListener("click", (e) => {
      if (e.target === projectDrawer) closeProjectDrawer();
    });
  }
  if (projectForm) projectForm.addEventListener("submit", handleProjectSubmit);

  /* ---------- Initial load ---------- */
  const existingSession = loadSession();
  if (existingSession && existingSession.isAuthenticated && existingSession.token) {
    showPortal(existingSession);
    loadProjects();
    loadQuestions();
  } else {
    showAuth();
  }

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
});
