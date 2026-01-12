const params = new URLSearchParams(window.location.search);
const category = params.get("category");
const unit = params.get("unit"); // REQUIRED

const questions = data.filter(q =>
  q.category === category &&
  inferUnit(q) === unit
);


const titleMap = {
  CSF: "Cybersecurity Foundations",
  SOC: "SOC Fundamentals",
  IAM: "Identity & Access Management",
  GRC: "Governance, Risk & Compliance"
};

document.getElementById("lessonTitle").textContent =
  titleMap[category] || "Lesson";

document.getElementById("lessonMeta").textContent =
  `Category: ${category}`;

const progressKey = `lesson_progress_${category}`;
let progress = JSON.parse(localStorage.getItem(progressKey) || "{}");

let allQuestions = [];

fetch("/learning/questions.json")
  .then(res => res.json())
  .then(data => {
    allQuestions = data.filter(q => q.category === category);
    updateProgress(allQuestions);
    renderQuestions(allQuestions);
  })
  .catch(err => {
    console.error("Failed to load questions:", err);
  });

/* ===============================
   UNIT DERIVATION (v1)
   =============================== */

function inferUnit(question) {
  const text = (question.title + " " + question.question).toLowerCase();

  if (text.includes("risk") || text.includes("threat")) return "risk";
  if (text.includes("identity") || text.includes("authentication") || text.includes("authorization")) return "identity";
  if (text.includes("network") || text.includes("tcp") || text.includes("ip")) return "network";
  if (text.includes("soc") || text.includes("alert") || text.includes("incident")) return "soc";
  if (text.includes("ai") || text.includes("machine learning")) return "ai";

  return "basics";
}

/* ===============================
   FILTER HANDLING
   =============================== */

document.getElementById("unitSelect").addEventListener("change", e => {
  const unit = e.target.value;

  const filtered =
    unit === "ALL"
      ? allQuestions
      : allQuestions.filter(q => inferUnit(q) === unit);

  updateProgress(filtered);
  renderQuestions(filtered);
});

/* ===============================
   RENDERING
   =============================== */

function renderQuestions(questions) {
  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";

  questions.forEach(q => {
    const card = document.createElement("div");
    card.className = "question-card";

    card.innerHTML = `
      <div class="question-title">${q.title}</div>
      <div>${q.question}</div>
      <button class="show-answer-btn">Show Answer</button>
      <div class="answer">${q.answer}</div>
    `;

    const btn = card.querySelector(".show-answer-btn");
    const answer = card.querySelector(".answer");

    if (progress[q.id]) {
      answer.style.display = "block";
      btn.style.display = "none";
    }

    btn.addEventListener("click", () => {
      answer.style.display = "block";
      btn.style.display = "none";

      progress[q.id] = true;
      localStorage.setItem(progressKey, JSON.stringify(progress));
      updateProgress(questions);
    });

    container.appendChild(card);
  });
}

/* ===============================
   PROGRESS
   =============================== */

function updateProgress(questions) {
  const completed = questions.filter(q => progress[q.id]).length;

  document.getElementById("progressText").textContent =
    `Progress: ${completed} / ${questions.length}`;
}
