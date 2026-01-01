const API_BASE = "https://kiranregmi-com-backend.onrender.com";

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("Login Response:", data);

    if (!response.ok) {
      document.getElementById("errorMsg").innerText =
        data.error || "Invalid email or password.";
      return;
    }

    localStorage.setItem("authToken", data.token);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Network error:", error);
    document.getElementById("errorMsg").innerText =
      "Network error. Please try again.";
  }
}
