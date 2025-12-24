// ================================
// Supabase Initialization (UMD)
// ================================
const SUPABASE_URL = "https://lveuvtszgjorqtqaveny.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2ZXV2dHN6Z2pvcnF0cWF2ZW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTc4NjYsImV4cCI6MjA4MTU3Mzg2Nn0.uAln7ZzQ2KpKcGn9gLcoFnC61gBeRkLIT6jpEfRrj7I";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.supabaseClient = supabaseClient;

// ================================
// AUTH GUARD
// ================================
async function requireAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "./login.html";
    return null;
  }
  return data.session;
}

window.requireAuth = requireAuth;

// ================================
// LOGIN
// ================================
function initLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const errorBox = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove("hidden");
      return;
    }

    window.location.href = "./dashboard.html";
  });
}

// ================================
// LOGOUT
// ================================
function initLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "./login.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  initLogout();
});
