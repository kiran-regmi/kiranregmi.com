const API_BASE_URL = "http://localhost:5000";

// SAVE & LOAD SESSION
function saveSession(session) {
  localStorage.setItem("session", JSON.stringify(session));
}
function loadSession() {
  return JSON.parse(localStorage.getItem("session"));
}
function clearSession() {
  localStorage.removeItem("session");
  showLogin();
}

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");

// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) return alert("Invalid login");

  const data = await res.json();
  saveSession({ token: data.token, role: data.role, email: data.email, name: data.name });

  const session = loadSession();
  showDashboard(session);
  loadProjects();
  loadQuestions(); // NEW
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
});

// SHOW UI SECTIONS
function showLogin() {
  authSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
}

function showDashboard(session) {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");

  document.getElementById("sidebarRoleText").textContent = session.role;
  document.getElementById("sidebarEmailText").textContent = session.email;
  document.getElementById("userChip").textContent = session.email;
  document.getElementById("profileEmail").textContent = session.email;
  document.getElementById("profileRole").textContent = session.role;
  document.getElementById("profileName").textContent = session.name;

  if (session.role === "admin") {
    document.getElementById("adminNavItem").classList.remove("hidden");
    document.getElementById("addProjectBtn").classList.remove("hidden");
  } else {
    document.getElementById("adminNavItem").classList.add("hidden");
    document.getElementById("addProjectBtn").classList.add("hidden");
  }

  switchView("dashboardView");
}

// NAVIGATION
const buttons = document.querySelectorAll(".dashboard-sidebar button");
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    switchView(btn.dataset.view);
    if (btn.dataset.view === "practiceView") {
      loadQuestions(); // NEW — auto load when tab switches
    }
  });
});

function switchView(targetId) {
  document.querySelectorAll(".view-section").forEach(v => v.classList.remove("active"));
  const section = document.getElementById(targetId);
  if (section) section.classList.add("active");

  buttons.forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-view="${targetId}"]`).classList.add("active");
}

// LOAD PROJECTS
async function loadProjects() {
  const session = loadSession();
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    headers: { "Authorization": `Bearer ${session.token}` }
  });
  const data = await res.json();

  const tbody = document.getElementById("projectTableBody");
  tbody.innerHTML = "";

  data.projects.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.project}</td>
        <td>${p.compliance}</td>
        <td>${p.riskImpact}</td>
        <td>${p.status}</td>
        <td>${p.auditDate}</td>
        <td>${p.owner}</td>
        <td>—</td>
      </tr>`;
  });
}

// ======================================================
// 📚 LOAD INTERVIEW QUESTIONS (NEW)
// ======================================================
async function loadQuestions() {
  const session = loadSession();
  const res = await fetch(`${API_BASE_URL}/api/questions`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  const data = await res.json();
  renderQuestions(data.questions);
}

function renderQuestions(questions) {
  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";

  questions.forEach(q => {
    const div = document.createElement("div");
    div.classList.add("question-card");
    div.innerHTML = `
      <strong>${q.question}</strong>
      <span class="category-tag">${q.category}</span>
      <div class="answer hidden">${q.answer}</div>
    `;
    div.addEventListener("click", () => {
      div.querySelector(".answer").classList.toggle("hidden");
    });
    container.appendChild(div);
  });
}

// INITIAL LOAD
(function init() {
  const session = loadSession();
  if (session?.token) {
    showDashboard(session);
    loadProjects();
    loadQuestions(); // NEW
  } else {
    showLogin();
  }
})();
