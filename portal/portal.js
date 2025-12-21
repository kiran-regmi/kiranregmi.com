// /portal/portal.js
// Requires: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> in your HTML

const SUPABASE_URL = "https://lveuvtszgjorqtqaveny.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2ZXV2dHN6Z2pvcnF0cWF2ZW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTc4NjYsImV4cCI6MjA4MTU3Mzg2Nn0.uAln7ZzQ2KpKcGn9gLcoFnC61gBeRkLIT6jpEfRrj7I";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it accessible on other pages if needed
window.supabaseClient = supabaseClient;

/**
 * Redirect to login if user is not authenticated
 */
async function requireAuth() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) console.warn("Auth session error:", error.message);

  const session = data?.session;
  if (!session) {
    // If user isn't logged in, send them to login
    window.location.href = "./login.html";
    return null;
  }
  return session;
}

/**
 * Login handler (only runs if #login-form exists on the page)
 */
async function handleLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const errorBox = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (errorBox) {
      errorBox.classList.add("hidden");
      errorBox.textContent = "";
    }

    const email = document.getElementById("email")?.value?.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      if (errorBox) {
        errorBox.textContent = "Please enter email and password.";
        errorBox.classList.remove("hidden");
      } else {
        alert("Please enter email and password.");
      }
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      if (errorBox) {
        errorBox.textContent = error.message;
        errorBox.classList.remove("hidden");
      } else {
        alert("Login failed: " + error.message);
      }
      return;
    }

    // Success → go to dashboard inside /portal
    window.location.href = "./dashboard.html";
  });
}

/**
 * Logout handler (only runs if #logoutBtn exists)
 */
function handleLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "./login.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  handleLoginForm();
  handleLogout();
});

// Export helpers if you want to call them from other scripts/pages
window.requireAuth = requireAuth;
