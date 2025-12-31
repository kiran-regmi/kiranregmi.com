// portal.js - FINAL WORKING VERSION FOR PRODUCTION 🚀

// ==== Configuration ====
const API_BASE_URL = "https://kiranregmi-com-backend.onrender.com";
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/login`;


// Store JWT token
function setToken(token) {
    localStorage.setItem("authToken", token);
}

function getToken() {
    return localStorage.getItem("authToken");
}

function logout() {
    localStorage.removeItem("authToken");
    window.location.href = "portal.html";
}

document.getElementById("logoutBtn")?.addEventListener("click", logout);

// ===== LOGIN =====
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const messageBox = document.getElementById("loginError");

    messageBox.innerText = "Logging in...";
    messageBox.style.color = "gray";

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            messageBox.innerText = data.message || "Login Failed.";
            messageBox.style.color = "red";
            return;
        }

        setToken(data.token);
        localStorage.setItem("role", data.role);

        messageBox.innerText = "Login successful! Redirecting...";
        messageBox.style.color = "green";

        setTimeout(() => {
            window.location.href = "portal.html";
        }, 800);

    } catch (err) {
        console.error("Login Error:", err);
        messageBox.innerText = "Server not responding.";
        messageBox.style.color = "red";
    }
}

document.getElementById("loginForm")?.addEventListener("submit", handleLogin);

// ===== AUTH CHECK =====
function validateLogin() {
    const token = getToken();
    if (!token) {
        console.warn("Missing token – redirecting to login.");
        if (!window.location.pathname.includes("portal-login")) {
            window.location.href = "portal-login.html";
        }
    }
}
validateLogin();

// ===== FETCH QUESTIONS =====
let allQuestions = [];
let filteredQuestions = [];
let currentPage = 1;
let limit = 8;
let currentCategory = "All";

async function loadQuestions() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/questions`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch questions");

        allQuestions = await response.json();
        filteredQuestions = allQuestions;
        renderQuestions();
        updateStats();

    } catch (err) {
        console.error("Fetch Questions Error:", err);
    }
}
if (!window.location.pathname.includes("portal-login.html")) {
    loadQuestions();
}

// ==== Render Questions ====
function renderQuestions() {
    const container = document.getElementById("questionsContainer");
    if (!container || filteredQuestions.length === 0) return;

    container.innerHTML = "";
    const start = (currentPage - 1) * limit;
    const slice = filteredQuestions.slice(start, start + limit);

    slice.forEach((q, i) => {
        const qNum = start + i + 1;
        container.innerHTML += `
            <div class="question-card">
                <div class="question-title">Q${qNum}: ${q.question}</div>
                <div class="question-answer">${q.answer}</div>
                <span class="pill">${q.category || "GEN"}</span>
            </div>
        `;
    });

    updatePagination();
}

// ==== Pagination ====
function updatePagination() {
    const pageBox = document.getElementById("pageBox");
    const totalPages = Math.ceil(filteredQuestions.length / limit);

    pageBox.innerHTML = `
        <button ${currentPage === 1 ? "disabled" : ""} onclick="prevPage()">Prev</button>
        Page ${currentPage} of ${totalPages}
        <button ${currentPage === totalPages ? "disabled" : ""} onclick="nextPage()">Next</button>
    `;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderQuestions();
    }
}

function nextPage() {
    if (currentPage < Math.ceil(filteredQuestions.length / limit)) {
        currentPage++;
        renderQuestions();
    }
}

// ==== Category Filter ====
document.getElementById("categorySelect")?.addEventListener("change", (e) => {
    currentCategory = e.target.value;

    filteredQuestions = currentCategory === "All"
        ? allQuestions
        : allQuestions.filter(q => q.category === currentCategory);

    currentPage = 1;
    renderQuestions();
    updateStats();
});

// ==== Shuffle ====
document.getElementById("shuffleBtn")?.addEventListener("click", () => {
    filteredQuestions.sort(() => Math.random() - 0.5);
    renderQuestions();
});

// ==== Stats ====
function updateStats() {
    document.getElementById("totalCount").innerText = allQuestions.length;
}

// ==== Init UI Based on Role ====
function updateRoleUI() {
    const role = localStorage.getItem("role");
    const adminPanel = document.getElementById("adminPanelLink");

    if (role !== "admin") {
        adminPanel?.remove();
    }
}
updateRoleUI();
