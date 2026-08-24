// Admin authentication mode and session helpers.

function switchAuthMode(mode) {
  const isLogin = mode === "login";
  showLogin.classList.toggle("active", isLogin);
  showSignup.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
  adminFormTitle.textContent = isLogin ? "Admin Login" : "Admin Sign Up";
  authStatus.textContent = "";
}

function showInfo(message, isError = false) {
  authStatus.textContent = message;
  authStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function resolveUsernameFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== "object") return "";

  const candidates = [
    payload.username,
    payload.userName,
    payload.user,
    payload.sub,
    payload.name,
  ];

  const found = candidates.find(
    (item) => typeof item === "string" && item.trim().length,
  );
  return found ? found.trim() : "";
}

function bindAuthEvents() {
  showLogin.addEventListener("click", () => switchAuthMode("login"));
  showSignup.addEventListener("click", () => switchAuthMode("signup"));

  [...document.querySelectorAll(".info-btn")].forEach((btn) => {
    btn.addEventListener("click", () => {
      showInfo(btn.dataset.info || "Credential guidance unavailable.");
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    try {
      showInfo("Signing in to secure dashboard...");
      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: { username, password },
      });

      const token = payload && payload.token ? payload.token : "";
      if (!token) throw new Error("No token received from server.");

      state.token = token;
      state.currentAdminUsername = username;
      state.pendingDeleteUsername = "";
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(CURRENT_ADMIN_USERNAME_KEY, username);

      showDashboard();
      await loadDashboardData();
      showInfo("Access granted.");
    } catch (error) {
      showInfo(error.message || "Login failed.", true);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const membershipCode = document
      .getElementById("membershipCode")
      .value.trim();

    try {
      showInfo("Creating admin account...");
      await apiRequest("/auth/register", {
        method: "POST",
        body: { username, password, membershipCode },
      });
      showInfo("Admin account created. Proceed to sign in.");
      switchAuthMode("login");
      signupForm.reset();
    } catch (error) {
      showInfo(error.message || "Registration failed.", true);
    }
  });
}