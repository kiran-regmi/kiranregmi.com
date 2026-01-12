
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "CSF";

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
const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");

fetch("/learning/questions.json")
  .then(res => res.json())
  .then(data => {
    const questions = data.filter(q => q.category === category);

    document.getElementById("progressText").textContent =
      `Progress: ${Object.keys(progress).length} / ${questions.length}`;

    renderQuestions(questions);
  })
  .catch(err => {
    console.error("Failed to load questions:", err);
  });

function renderQuestions(questions) {
  const container = document.getElementById("questionsContainer");

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

    btn.addEventListener("click", () => {
      answer.style.display = "block";
      btn.style.display = "none";

      progress[q.id] = true;
      localStorage.setItem(progressKey, JSON.stringify(progress));

      document.getElementById("progressText").textContent =
        `Progress: ${Object.keys(progress).length} / ${questions.length}`;
    });

    container.appendChild(card);
  });
}
