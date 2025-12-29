const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { JWT_SECRET, PORT } = require("./config");
const users = require("./users.json");

const app = express();
app.use(cors());
app.use(express.json());

const PROJECTS_PATH = path.join(__dirname, "projects.json");

/* --------------------------
   Helpers for projects file
--------------------------- */
function readProjects() {
  try {
    const data = fs.readFileSync(PROJECTS_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading projects.json:", e);
    return [];
  }
}

function writeProjects(projects) {
  try {
    fs.writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));
  } catch (e) {
    console.error("Error writing projects.json:", e);
  }
}

/* --------------------------
          Auth
--------------------------- */

// LOGIN ENDPOINT
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Incoming login:", email);

  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  console.log("User looked up:", user && { email: user.email, role: user.role });

  if (!user) {
    console.log("❌ No user found!");
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  console.log("Password valid:", validPassword);

  if (!validPassword) {
    console.log("❌ Password mismatch");
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  return res.json({
    message: "Logged in successfully",
    token,
    role: user.role,
    name: user.name,
  });
});

// AUTH MIDDLEWARE
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(403).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

/* --------------------------
        Projects API
--------------------------- */

// GET all projects (any authenticated user)
app.get("/api/projects", verifyToken, (req, res) => {
  const projects = readProjects();
  return res.json({ projects });
});

// CREATE project (admin only)
app.post("/api/projects", verifyToken, verifyAdmin, (req, res) => {
  const { projectName, compliance, riskLevel, status, lastAudit, assignedTo } =
    req.body;

  if (!projectName || !compliance || !riskLevel || !status) {
    return res
      .status(400)
      .json({ message: "projectName, compliance, riskLevel, status required" });
  }

  const projects = readProjects();
  const nextId =
    projects.length > 0 ? Math.max(...projects.map((p) => p.id || 0)) + 1 : 1;

  const project = {
    id: nextId,
    projectName,
    compliance,
    riskLevel,
    status,
    lastAudit: lastAudit || new Date().toISOString().slice(0, 10),
    assignedTo: assignedTo || "GRC Team",
  };

  projects.push(project);
  writeProjects(projects);

  return res.status(201).json({ project });
});

// UPDATE project (admin only)
app.put("/api/projects/:id", verifyToken, verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { projectName, compliance, riskLevel, status, lastAudit, assignedTo } =
    req.body;

  const projects = readProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Project not found" });
  }

  const existing = projects[index];

  const updated = {
    ...existing,
    projectName: projectName ?? existing.projectName,
    compliance: compliance ?? existing.compliance,
    riskLevel: riskLevel ?? existing.riskLevel,
    status: status ?? existing.status,
    lastAudit: lastAudit || existing.lastAudit,
    assignedTo: assignedTo ?? existing.assignedTo,
  };

  projects[index] = updated;
  writeProjects(projects);

  return res.json({ project: updated });
});

// DELETE project (admin only)
app.delete("/api/projects/:id", verifyToken, verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const projects = readProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Project not found" });
  }

  const removed = projects[index];
  const remaining = projects.filter((p) => p.id !== id);
  writeProjects(remaining);

  return res.json({ message: "Project deleted", project: removed });
});

// 📌 Load Questions Data
const questionsFile = path.join(__dirname, "questions.json");
let questions = JSON.parse(fs.readFileSync(questionsFile));

// Save Questions Helper
function saveQuestions() {
  fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
}

// ------------------------
// Q&A API Routes
// ------------------------

// GET ALL QUESTIONS (all authenticated users)
app.get("/api/questions", verifyToken, (req, res) => {
  res.json({ questions });
});

// CREATE a new question (admin only)
app.post("/api/questions", verifyToken, verifyAdmin, (req, res) => {
  const newQ = {
    id: Date.now(),
    question: req.body.question,
    answer: req.body.answer,
    category: req.body.category
  };

  questions.push(newQ);
  saveQuestions();
  res.status(201).json({ message: "Question added", question: newQ });
});

// UPDATE a question (admin only)
app.put("/api/questions/:id", verifyToken, verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = questions.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Question not found" });
  }

  questions[index] = { ...questions[index], ...req.body };
  saveQuestions();
  res.json({ message: "Question updated", question: questions[index] });
});

// DELETE a question (admin only)
app.delete("/api/questions/:id", verifyToken, verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = questions.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Question not found" });
  }

  questions.splice(index, 1);
  saveQuestions();
  res.json({ message: "Question deleted" });
});

/* --------------------------
        Admin-only info
--------------------------- */
app.get("/api/admin/users", verifyToken, verifyAdmin, (req, res) => {
  return res.json({
    message: "Admin access granted",
    users: users.map((u) => ({ email: u.email, role: u.role })),
  });
});

/* --------------------------
        Start Server
--------------------------- */
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
