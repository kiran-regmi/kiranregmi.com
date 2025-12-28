// portal.js

// --- Mock users for demo authentication (Phase 1) ---
const MOCK_USERS = [
  {
    email: "admin@kiranregmi.com",
    password: "Admin@123",
    role: "admin",
    name: "Admin User",
  },
  {
    email: "user@kiranregmi.com",
    password: "User@123",
    role: "user",
    name: "Standard User",
  },
];

// --- Demo projects ---
let projects = [
  {
    id: 1,
    name: "Onboarding – New Client A",
    status: "active",
    owner: "Security Team",
    updated: "2025-12-20",
  },
  {
    id: 2,
    name: "IAM Policy Review – Internal",
    status: "pending",
    owner: "GRC",
    updated: "2025-12-15",
  },
  {
    id: 3,
    name: "Vulnerability Remediation Wave 3",
    status: "closed",
    owner: "Ops",
    updated: "2025-11-30",
  },
];

const SESSION_KEY = "kr_portal_session";

// --- DOM Elements ---
const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const authError = document.getElementById("authError");

const sidebarRoleText = document.getElementById("sidebarRoleText");
const sidebarEmailText = document.getElementById("sidebarEmailText");
const sidebarRoleBadge = document.getElementById("sidebarRoleBadge");
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

// --- Session Helpers ---
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

// --- Auth Logic ---
function authenticate(email, password) {
  return MOCK_USERS.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  );
}

function handleLogin(event) {
  event.preventDefault();
  if (!loginForm) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const user = authenticate(email, password);

  if (!user) {
    authError.classList.remove("hidden");
    return;
  }

  authError.classList.add("hidden");

  const session = {
    isAuthenticated: true,
    email: user.email,
    role: user.role,
    name: user.name,
    loginTime: new Date().toISOString(),
  };

  saveSession(session);
  showDashboard(session);
}

// --- UI Rendering ---
function showAuth() {
  authSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
}

function showDashboard(session) {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");

  const { email, role, name } = session;

  // Header text
  welcomeTitle.textContent =
    role === "admin" ? "Admin Project Dashboard" : "Project Dashboard";
  welcomeSubtitle.textContent =
    role === "admin"
      ? "You have administrative access to manage portal projects."
      : "You can view projects assigned to your team.";

  // Sidebar info
  sidebarRoleText.textContent = role === "admin" ? "Administrator" : "User";
  sidebarEmailText.textContent = email;
  sidebarRoleBadge.style.background =
    role === "admin" ? "rgba(220, 38, 38, 0.2)" : "rgba(37, 99, 235, 0.2)";

  // User chip
  userChip.textContent = `${name || "User"} • ${role}`;

  // Profile view data
  profileEmail.textContent = email;
  profileRole.textContent = role;
  profileName.textContent = name;

  // Admin-only elements
  if (role === "admin") {
    adminNavItem.classList.remove("hidden");
    addProjectBtn.classList.remove("hidden");
  } else {
    adminNavItem.classList.add("hidden");
    addProjectBtn.classList.add("hidden");
  }

  renderProjects(role);
}

function renderProjects(role) {
  projectTableBody.innerHTML = "";

  projects.forEach((project) => {
    const tr = document.createElement("tr");

    const statusClass =
      project.status === "active"
        ? "status-active"
        : project.status === "pending"
        ? "status-pending"
        : "status-closed";

    tr.innerHTML = `
      <td>${project.name}</td>
      <td>
        <span class="project-status ${statusClass}">
          ${project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </td>
      <td>${project.owner}</td>
      <td>${project.updated}</td>
      <td>
        <div class="project-actions">
          ${
            role === "admin"
              ? `
              <button class="btn-link" data-action="edit" data-id="${project.id}">Edit</button>
              <button class="btn-danger" data-action="delete" data-id="${project.id}">Delete</button>
            `
              : `<span style="font-size:0.8rem; color:#6b7280;">View only</span>`
          }
        </div>
      </td>
    `;

    projectTableBody.appendChild(tr);
  });

  if (role === "admin") {
    attachProjectActionHandlers();
  }
}

function attachProjectActionHandlers() {
  projectTableBody.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.getAttribute("data-action");
    const idAttr = target.getAttribute("data-id");
    if (!action || !idAttr) return;

    const id = parseInt(idAttr, 10);
    if (action === "delete") {
      handleDeleteProject(id);
    } else if (action === "edit") {
      handleEditProject(id);
    }
  });
}

// --- Project CRUD (Admin Only) ---
function handleAddProject(session) {
  if (session.role !== "admin") return;

  const name = prompt("Project name:");
  if (!name) return;

  const status = prompt(
    "Status (active / pending / closed):",
    "active"
  )?.toLowerCase();
  if (!["active", "pending", "closed"].includes(status)) {
    alert("Invalid status. Using 'pending'.");
  }

  const project = {
    id: Date.now(),
    name: name.trim(),
    status: ["active", "pending", "closed"].includes(status)
      ? status
      : "pending",
    owner: session.role === "admin" ? "Admin" : "Team",
    updated: new Date().toISOString().slice(0, 10),
  };

  projects.unshift(project);
  renderProjects(session.role);
}

function handleDeleteProject(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this project? This cannot be undone."
  );
  if (!confirmed) return;

  projects = projects.filter((p) => p.id !== id);
  const session = loadSession();
  if (session) {
    renderProjects(session.role);
  }
}

function handleEditProject(id) {
  const project = projects.find((p) => p.id === id);
  if (!project) return;

  const newName = prompt("Update project name:", project.name);
  if (!newName) return;

  const newStatus = prompt(
    "Update status (active / pending / closed):",
    project.status
  )?.toLowerCase();

  if (!["active", "pending", "closed"].includes(newStatus)) {
    alert("Invalid status. Keeping current status.");
  }

  project.name = newName.trim();
  if (["active", "pending", "closed"].includes(newStatus)) {
    project.status = newStatus;
  }
  project.updated = new Date().toISOString().slice(0, 10);

  const session = loadSession();
  if (session) {
    renderProjects(session.role);
  }
}

// --- Tabs / Views ---
function handleSidebarClick(event) {
  const button = event.target.closest("button[data-view]");
  if (!button) return;

  const targetViewId = button.getAttribute("data-view");
  if (!targetViewId) return;

  sidebarButtons.forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");

  views.forEach((view) => {
    if (view.id === targetViewId) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });
}

// --- Logout ---
function handleLogout() {
  clearSession();
  showAuth();
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  const existingSession = loadSession();
  if (existingSession && existingSession.isAuthenticated) {
    showDashboard(existingSession);
  } else {
    showAuth();
  }

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (addProjectBtn) {
    addProjectBtn.addEventListener("click", () => {
      const session = loadSession();
      if (!session || !session.isAuthenticated) return;
      handleAddProject(session);
    });
  }

  // Sidebar
  sidebarButtons.forEach((btn) =>
    btn.addEventListener("click", handleSidebarClick)
  );
});
