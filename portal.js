// portal.js

/* --------------------------
    Backend API Base URL
--------------------------- */
const API_BASE_URL = "http://localhost:5000";

/* --------------------------
    Session Storage Helpers
--------------------------- */
const SESSION_KEY = "kr_portal_session";

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse session", e);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* --------------------------
    DOM Elements
--------------------------- */
const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const authError = document.getElementById("authError");

const sidebarRoleText = document.getElementById("sidebarRoleText");
const sidebarEmailText = document.getElementById("sidebarEmailText");
const adminNavItem = document.getElementById("adminNavItem");

const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeSubtitle = document.getElementById("welcomeSubtitle");
const userChip = document.getElementById("userChip");

const logoutBtn = document.getElementById("logoutBtn");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectTableBody = document.getElementById("projectTableBody");

const profileEmail = document.getElementById("profileEmail");
const profileRole = document.getElementById("profileRole");
const profileName = document.getElementById("profileName");

const sidebarButtons = document.querySelectorAll(".sidebar-nav button");
const views = document.querySelectorAll(".view-section");

/* --------------------------
    Login Handler (JWT Auth)
--------------------------- */
async function handleLogin(event) {
  event.preventDefault(); // Prevent page refresh

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      authError.classList.remove("hidden");
      return;
    }

    authError.classList.add("hidden");

    const data = await response.json();
    const token = data.token;

    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload

    const session = {
      isAuthenticated: true,
      token,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      loginTime: new Date().toISOString(),
    };

    saveSession(session);
    showDashboard(session);
  } catch (error) {
    console.error("Login error:", error);
    authError.classList.remove("hidden");
  }
}

/* --------------------------
    Dashboard / UI Loading
--------------------------- */
function showDashboard(session) {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");

  const { email, role, name } = session;

  userChip.textContent = `${name || "User"} • ${role}`;
  sidebarRoleText.textContent = role === "admin" ? "Administrator" : "User";
  sidebarEmailText.textContent = email;

  profileEmail.textContent = email;
  profileRole.textContent = role;
  profileName.textContent = name;

  if (role === "admin") {
    adminNavItem.classList.remove("hidden");
    addProjectBtn.classList.remove("hidden");
  } else {
    adminNavItem.classList.add("hidden");
    addProjectBtn.classList.add("hidden");
  }

  welcomeTitle.textContent =
    role === "admin" ? "Admin Project Dashboard" : "Project Dashboard";

  welcomeSubtitle.textContent =
    role === "admin"
      ? "You have administrative access to manage portal projects."
      : "You can view projects assigned to your team.";

  renderProjects(session);
}

function showAuth() {
  authSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
}

/* --------------------------
  Fetch & Render Projects
--------------------------- */
async function renderProjects(session) {
  const token = session?.token;
  if (!token) {
    clearSession();
    return showAuth();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      clearSession();
      return showAuth();
    }

    const data = await response.json();
    const projects = data.projects || [];

    projectTableBody.innerHTML = "";

    projects.forEach((project) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${project.projectName}</td>
        <td>${project.compliance || "-"}</td>
        <td>${project.riskLevel || "-"}</td>
        <td>${project.status || "-"}</td>
        <td>${project.lastAudit || "-"}</td>
        <td>${project.assignedTo || "-"}</td>
        <td>
          ${
            session.role === "admin"
              ? `
              <button 
                class="btn-link" 
                data-action="edit" 
                data-id="${project.id}"
              >Edit</button>
              <button 
                class="btn-danger" 
                data-action="delete" 
                data-id="${project.id}"
              >Delete</button>
            `
              : `<span style="font-size:0.8rem; color:#6b7280;">View only</span>`
          }
        </td>
      `;

      projectTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Auth failed:", error);
    clearSession();
    showAuth();
  }
}

/* --------------------------
      Admin CRUD Helpers
--------------------------- */
async function handleAddProject(session) {
  if (session.role !== "admin") return;

  const projectName = prompt("Project name (e.g., SOC 2 Audit Prep):");
  if (!projectName) return;

  const compliance = prompt(
    "Compliance framework (e.g., ISO27001, SOC2, PCI-DSS, NIST CSF, HIPAA):",
    "SOC2"
  );

  const riskLevel = prompt(
    "Risk level (High / Medium / Low):",
    "High"
  );

  const status = prompt(
    "Status (Active / Pending / Closed):",
    "Active"
  );

  const lastAudit = prompt(
    "Last audit date (YYYY-MM-DD) or leave blank for today:",
    ""
  );

  const assignedTo = prompt(
    "Control owner (GRC Team / SOC Team / IAM Team / SecOps Team):",
    "GRC Team"
  );

  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        projectName,
        compliance,
        riskLevel,
        status,
        lastAudit: lastAudit || undefined,
        assignedTo,
      }),
    });

    if (!response.ok) {
      console.error("Failed to create project");
      return;
    }

    await renderProjects(session);
  } catch (error) {
    console.error("Error creating project:", error);
  }
}

async function handleEditProject(session, id) {
  if (session.role !== "admin") return;

  try {
    // First fetch latest list to get current values
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    const data = await response.json();
    const projects = data.projects || [];
    const project = projects.find((p) => p.id === id);
    if (!project) {
      alert("Project not found.");
      return;
    }

    const projectName = prompt(
      "Project name:",
      project.projectName
    );
    if (!projectName) return;

    const compliance = prompt(
      "Compliance framework:",
      project.compliance
    );

    const riskLevel = prompt(
      "Risk level (High / Medium / Low):",
      project.riskLevel
    );

    const status = prompt(
      "Status (Active / Pending / Closed):",
      project.status
    );

    const lastAudit = prompt(
      "Last audit date (YYYY-MM-DD):",
      project.lastAudit
    );

    const assignedTo = prompt(
      "Control owner:",
      project.assignedTo
    );

    const updateRes = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        projectName,
        compliance,
        riskLevel,
        status,
        lastAudit,
        assignedTo,
      }),
    });

    if (!updateRes.ok) {
      console.error("Failed to update project");
      return;
    }

    await renderProjects(session);
  } catch (error) {
    console.error("Error editing project:", error);
  }
}

async function handleDeleteProject(session, id) {
  if (session.role !== "admin") return;

  const confirmed = confirm(
    "Are you sure you want to delete this project? This cannot be undone."
  );
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to delete project");
      return;
    }

    await renderProjects(session);
  } catch (error) {
    console.error("Error deleting project:", error);
  }
}

/* --------------------------
    Table Action Delegation
--------------------------- */
function handleProjectActionClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.getAttribute("data-action");
  const id = parseInt(button.getAttribute("data-id"), 10);
  const session = loadSession();

  if (!session?.isAuthenticated) {
    return showAuth();
  }

  if (action === "edit") {
    handleEditProject(session, id);
  } else if (action === "delete") {
    handleDeleteProject(session, id);
  }
}

/* --------------------------
          Sidebar
--------------------------- */
function handleSidebarClick(event) {
  const button = event.target.closest("button[data-view]");
  if (!button) return;

  const targetViewId = button.getAttribute("data-view");

  sidebarButtons.forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");

  views.forEach((view) => {
    view.classList.toggle("active", view.id === targetViewId);
  });
}

/* --------------------------
          Logout
--------------------------- */
function handleLogout() {
  clearSession();
  showAuth();
}

/* --------------------------
          Init
--------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const session = loadSession();
  if (session?.isAuthenticated) {
    showDashboard(session);
  } else {
    showAuth();
  }

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  sidebarButtons.forEach((btn) =>
    btn.addEventListener("click", handleSidebarClick)
  );

  if (projectTableBody) {
    projectTableBody.addEventListener("click", handleProjectActionClick);
  }

  if (addProjectBtn) {
    addProjectBtn.addEventListener("click", () => {
      const session = loadSession();
      if (!session?.isAuthenticated) return showAuth();
      if (session.role !== "admin") return;
      handleAddProject(session);
    });
  }
});
