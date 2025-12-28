console.log("Auth.js Loaded");
console.log(supabase);

// Supabase Init
const supabaseUrl = "https://lveuvtszgjjorqtqaveny.supabase.co";
const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2ZXV2dHN6Z2pvcnF0cWF2ZW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTc4NjYsImV4cCI6MjA4MTU3Mzg2Nn0.uAln7ZzQ2KpKcGn9gLcoFnC61gBeRkLIT6jpEfRrj7I";

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  console.log("Login form detected");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("Email").value.trim();
    const password = document.getElementById("Password").value.trim();
    const message = document.getElementById("loginMessage");

    message.textContent = "Signing in...";
    message.style.color = "#64ffda";

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("Auth Result:", data, error);

    if (error) {
      message.textContent = "❌ " + error.message;
      message.style.color = "#ff6b6b";
      return;
    }

    message.textContent = "✔ Login successful! Redirecting...";
    message.style.color = "#00f5d4";

    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 600);
  });
});
