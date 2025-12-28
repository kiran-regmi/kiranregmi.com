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
  return raw ? JSON.parse(raw) : null;
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

const sidebarButtons = document.querySelectorAll(".sidebar-nav button");
const views = document.querySelectorAll(".view-section");

/* ------- Modal / Drawer Elements ------- */
const projectDrawer = document.getElementById("projectDrawer");
const drawerClose = document.getElementById("drawerClose");
const drawerTitle = document.getElementById("drawerTitle");

const projectForm = document.getElementById("projectForm");
const formProjectName = document.getElementById("formProjectName");
const formCompliance = document.getElementById("formCompliance");
const formRisk = document.getElementById("formRisk");
const formStatus = document.getElementById("formStatus");
const formAssignedTo = document.getElementById("formAssignedTo");
const formLastAudit = document.getElementById("formLastAudit");

let editProjectId = null; // Tracks editing state

/* --------------------------
    LOGIN HANDLER
--------------------------- */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

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

    const data = await response.json();
    const token = data.token;
    const payload = JSON.parse(atob(token.split(".")[1]));

    const session = {
      isAuthenticated: true,
      token,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };

    saveSession(session);
    showDashboard(session);

  } catch (error) {
    console.error(error);
    authError.classList.remove("hidden");
  }
}

/* --------------------------
    SHOW DASHBOARD
--------------------------- */
function showDashboard(session) {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");

  userChip.textContent = `${session.name} • ${session.role}`;
  sidebarEmailText.textContent = session.email;
  sidebarRoleText.textContent = session.role;

  if (session.role === "admin") {
    adminNavItem.classList.remove("hidden");
    addProjectBtn.classList.remove("hidden");
  } else {
    adminNavItem.classList.add("hidden");
    addProjectBtn.classList.add("hidden");
  }

  welcomeTitle.textContent =
    session.role === "admin" ? "Admin Project Dashboard" : "Project Dashboard";

  renderProjects(session);
}

/* --------------------------
    LOAD / FETCH PROJECTS
--------------------------- */
async function renderProjects(session) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    const { projects } = await response.json();

    projectTableBody.innerHTML = "";

    projects.forEach((project) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${project.projectName}</td>
        <td>${project.compliance}</td>
        <td>${project.riskLevel}</td>
        <td>${project.status}</td>
        <td>${project.lastAudit}</td>
        <td>${project.assignedTo}</td>
        <td>
        ${
          session.role === "admin"
            ? `<button class="btn-link" data-id="${project.id}" data-action="edit">Edit</button>
               <button class="btn-danger" data-id="${project.id}" data-action="delete">Delete</button>`
            : `<span style="font-size:0.8rem;color:#666;">View only</span>`
        }
        </td>
      `;

      projectTableBody.appendChild(tr);
    });
  } catch (e) {
    console.error("Error loading projects", e);
  }
}

/* --------------------------
    OPEN DRAWER (ADD/EDIT)
--------------------------- */
function openDrawer(mode, project = null) {
  const session = loadSession();
  if (!session?.isAuthenticated || session.role !== "admin") return;

  editProjectId = mode === "edit" ? project.id : null;
  drawerTitle.textContent = mode === "edit" ? "Edit Project" : "Add Project";

  formProjectName.value = project?.projectName || "";
  formCompliance.value = project?.compliance || "SOC2";
  formRisk.value = project?.riskLevel || "High";
  formStatus.value = project?.status || "Active";
  formAssignedTo.value = project?.assignedTo || "GRC Team";
  formLastAudit.value = project?.lastAudit || "";

  projectDrawer.classList.add("show");
}

/* --------------------------
    CLOSE DRAWER
--------------------------- */
function closeDrawer() {
  projectDrawer.classList.remove("show");
  editProjectId = null;
}

drawerClose.addEventListener("click", closeDrawer);

/* --------------------------
    HANDLE SAVE SUBMIT
--------------------------- */
projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const session = loadSession();
  if (!session?.isAuthenticated || session.role !== "admin") return;

  const projectData = {
    projectName: formProjectName.value,
    compliance: formCompliance.value,
    riskLevel: formRisk.value,
    status: formStatus.value,
    assignedTo: formAssignedTo.value,
    lastAudit: formLastAudit.value,
  };

  const method = editProjectId ? "PUT" : "POST";
  const url = editProjectId
    ? `${API_BASE_URL}/api/projects/${editProjectId}`
    : `${API_BASE_URL}/api/projects`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(projectData),
  });

  if (response.ok) {
    closeDrawer();
    renderProjects(session);
  } else {
    alert("Failed to save project.");
  }
});

/* --------------------------
 DELETE / EDIT ACTIONS
--------------------------- */
projectTableBody.addEventListener("click", async (event) => {
  const button = event.target;
  const id = button.getAttribute("data-id");
  const action = button.getAttribute("data-action");

  const session = loadSession();

  if (action === "edit") {
    const { projects } = await (await fetch(`${API_BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })).json();

    const project = projects.find((p) => p.id == id);
    openDrawer("edit", project);
  }

  if (action === "delete") {
    if (!confirm("Delete this project permanently?")) return;

    await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.token}` },
    });

    renderProjects(session);
  }
});

/* --------------------------
 SIDEBAR + LOGOUT
--------------------------- */
function handleLogout() {
  clearSession();
  showAuth();
}

sidebarButtons.forEach((btn) =>
  btn.addEventListener("click", (e) => {
    const view = btn.getAttribute("data-view");
    views.forEach((v) =>
      v.classList.toggle("active", v.id === view)
    );
  })
);

/* --------------------------
 INIT
--------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const session = loadSession();
  if (session?.isAuthenticated) {
    showDashboard(session);
  } else {
    authSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
  }

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (addProjectBtn)
    addProjectBtn.addEventListener("click", () => openDrawer("add"));
});
