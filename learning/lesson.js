// learning/lesson.js

const params = new URLSearchParams(window.location.search);
const category = params.get("category"); // e.g., CSF
const unit = params.get("unit");         // e.g., risk

const crumbUnit = document.getElementById("crumbUnit");
if (crumbUnit) {
  crumbUnit.textContent = TITLE_MAP[unit] || "Lesson";
}


if (!category || !unit) {
  // Fail fast to avoid confusing states
  window.location.href = "/learning/foundations.html";
}

const TITLE_MAP = {
  basics: "Cybersecurity Basics",
  risk: "Risk & Threat Modeling",
  identity: "Identity Fundamentals",
  network: "Network Fundamentals",
  soc: "SOC Workflow Basics",
  ai: "AI Foundations for Security"
};

const CATEGORY_MAP = {
  CSF: "Foundations",
  SOC: "SOC",
  IAM: "IAM",
  GRC: "GRC"
};

const lessonTitleEl = document.getElementById("lessonTitle");
const lessonMetaEl = document.getElementById("lessonMeta");
const progressTextEl = document.getElementById("progressText");
const container = document.getElementById("questionsContainer");

// Header text
lessonTitleEl.textContent = TITLE_MAP[unit] || "Lesson";
lessonMetaEl.textContent = `${CATEGORY_MAP[category]} • ${TITLE_MAP[unit]}`;

// Progress key is scoped to category + unit
const progressKey = `lesson_progress_${category}_${unit}`;
let progress = JSON.parse(localStorage.getItem(progressKey) || "{}");

// --- Unit inference (v1, schema-safe) ---
function inferUnit(q) {
  const t = (q.title + " " + q.question).toLowerCase();
  if (t.includes("risk") || t.includes("threat")) return "risk";
  if (t.includes("identity") || t.includes("authentication") || t.includes("authorization")) return "identity";
  if (t.includes("network") || t.includes("tcp") || t.includes("ip")) return "network";
  if (t.includes("soc") || t.includes("alert") || t.includes("incident")) return "soc";
  if (t.includes("ai") || t.includes("machine learning")) return "ai";
  return "basics";
}

fetch("/learning/questions.json")
  .then(r => r.json())
  .then(all => {
    const questions = all.filter(q =>
      q.category === category && inferUnit(q) === unit
    );

    updateProgress(questions);
    renderQuestions(questions);
  })
  .catch(err => {
    console.error("Failed to load questions", err);
    container.innerHTML = "<p>Unable to load lesson content.</p>";
  });

function renderQuestions(questions) {
  container.innerHTML = "";
  questions.forEach(q => {
    const card = document.createElement("div");
    card.className = "question-card";
    card.innerHTML = `
      <div class="question-title">${q.title}</div>
      <div class="question-body">${q.question}</div>
      <button class="show-answer-btn">Show Answer</button>
      <div class="answer">${q.answer}</div>
    `;

    const btn = card.querySelector(".show-answer-btn");
    const ans = card.querySelector(".answer");

    if (progress[q.id]) {
      ans.style.display = "block";
      btn.style.display = "none";
    }

    btn.addEventListener("click", () => {
      ans.style.display = "block";
      btn.style.display = "none";
      progress[q.id] = true;
      localStorage.setItem(progressKey, JSON.stringify(progress));
      updateProgress(questions);
    });

    container.appendChild(card);
  });
}

function updateProgress(questions) {
  const done = questions.filter(q => progress[q.id]).length;
  progressTextEl.textContent = `Progress: ${done} / ${questions.length}`;
}
