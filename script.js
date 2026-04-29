const API_BASE_URL =
  (window.VOICEBOX_CONFIG && window.VOICEBOX_CONFIG.API_BASE_URL) ||
  "https://voicebox-api-zmw2.onrender.com";
const TOKEN_KEY = "voicebox_admin_token";
const CURRENT_ADMIN_USERNAME_KEY = "voicebox_current_admin_username";

const state = {
  token: localStorage.getItem(TOKEN_KEY) || "",
  currentAdminUsername: localStorage.getItem(CURRENT_ADMIN_USERNAME_KEY) || "",
  pendingDeleteUsername: "",
  loggedIn: false,
  activeTab: "unhandledTab",
  perPage: 10,
  unhandled: {
    page: 1,
    totalPages: 1,
    totalReports: 0,
    search: "",
    tag: "all",
    reports: [],
  },
  queue: {
    page: 1,
    totalPages: 1,
    totalReports: 0,
    reports: [],
  },
  handled: {
    page: 1,
    totalPages: 1,
    totalReports: 0,
    search: "",
    tag: "all",
    reports: [],
  },
  stats: {
    totalReports: 0,
    totalThisWeek: 0,
    totalToday: 0,
    handledRatio: 0,
  },
  admins: [],
};

const adminGateway = document.getElementById("adminGateway");
const adminDashboard = document.getElementById("adminDashboard");
const showLogin = document.getElementById("showLogin");
const showSignup = document.getElementById("showSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authStatus = document.getElementById("authStatus");
const adminFormTitle = document.getElementById("adminFormTitle");
const tabButtons = [...document.querySelectorAll(".tab-btn")];
const tabContents = [...document.querySelectorAll(".tab-content")];
const themeToggle = document.getElementById("themeToggle");
const unhandledSearch = document.getElementById("unhandledSearch");
const handledSearch = document.getElementById("handledSearch");
const unhandledTagFilter = document.getElementById("unhandledTagFilter");
const handledTagFilter = document.getElementById("handledTagFilter");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const topControls = document.getElementById("topControls");
const generatedCodeEl = document.getElementById("generatedCode");
const copyMembershipCodeBtn = document.getElementById("copyMembershipCodeBtn");

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

function setCopyButtonState({ visible, copied = false } = {}) {
  if (!copyMembershipCodeBtn) return;
  copyMembershipCodeBtn.classList.toggle("hidden", !visible);
  copyMembershipCodeBtn.setAttribute(
    "aria-label",
    copied ? "Code copied" : "Copy generated membership code",
  );
  copyMembershipCodeBtn.setAttribute("title", copied ? "Copied" : "Copy code");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temp = document.createElement("textarea");
  temp.value = text;
  temp.setAttribute("readonly", "");
  temp.style.position = "absolute";
  temp.style.left = "-9999px";
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
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

function setListLoading(listId, message = "Loading reports...") {
  const container = document.getElementById(listId);
  if (!container) return;
  container.innerHTML = `<article class="entry-card">${message}</article>`;
}

function setStatsLoading() {
  const totalReportsEl = document.getElementById("totalReports");
  if (totalReportsEl) totalReportsEl.textContent = "...";
  document.getElementById("weeklyTotal").textContent = "...";
  document.getElementById("todayTotal").textContent = "...";
  document.getElementById("handledRatio").textContent = "...";
}

function setAdminsLoading() {
  const adminList = document.getElementById("adminList");
  if (!adminList) return;
  adminList.innerHTML = '<div class="admin-row">Loading admins...</div>';
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

async function apiRequest(path, options = {}) {
  const { method = "GET", token = "", body, query = {} } = options;
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload && (payload.message || payload.error)) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

function normalizeStatus(status) {
  if (status === "Unhandled" || status === "Queue" || status === "Handled") {
    return status;
  }
  return "Unhandled";
}

function normalizeReport(report) {
  const tags = Array.isArray(report.tags)
    ? report.tags
    : report.tag
      ? [report.tag]
      : [];

  return {
    id: report._id || report.id,
    title: report.title || "Untitled",
    comment: report.comment || "",
    tags,
    identity: report.identity || "Hidden",
    status: normalizeStatus(report.status),
    adminNote: report.adminNote || "",
    createdAt: report.createdAt || new Date().toISOString(),
  };
}

function getViewConfig(tab) {
  if (tab === "unhandledTab") return state.unhandled;
  if (tab === "queueTab") return state.queue;
  return state.handled;
}

function getStatusFromTab(tab) {
  if (tab === "unhandledTab") return "Unhandled";
  if (tab === "queueTab") return "Queue";
  return "Handled";
}

function renderEntryCard(report, index) {
  const card = document.createElement("article");
  card.className = "entry-card";
  card.style.animation = `fadeUp 0.45s ease ${index * 0.04}s both`;
  const tagText = report.tags.length ? report.tags.join(", ") : "General";
  const safeNote = report.adminNote || "No admin note yet.";

  card.innerHTML = `
    <div class="entry-head">
      <h4>${report.title}</h4>
      <span class="entry-date">${formatDate(report.createdAt)}</span>
    </div>
    <div class="entry-meta">Tags: ${tagText}</div>
    <div class="entry-meta">Status: <span class="status-pill">${report.status}</span></div>
    <p>${report.comment}</p>
    <div class="entry-meta">Identity: ${report.identity || "Hidden"}</div>
    <div class="entry-meta">Admin Note: ${safeNote}</div>
  `;

  return card;
}

function renderView(viewKey, listId, pageInfoId, prevId, nextId) {
  const view = state[viewKey];
  const container = document.getElementById(listId);
  container.innerHTML = "";

  if (!view.reports.length) {
    container.innerHTML =
      '<article class="entry-card">No reports found.</article>';
  }

  view.reports.forEach((report, idx) => {
    const card = renderEntryCard(report, idx);
    if (idx === 0) card.classList.add("is-featured");
    const actions = document.createElement("div");
    actions.className = "entry-actions";

    if (viewKey === "unhandled") {
      actions.innerHTML = `<button class="btn btn-accent queue-action" data-id="${report.id}">Click to Queue + Add Comment</button>`;
    }
    if (viewKey === "queue") {
      actions.innerHTML = `<button class="btn btn-accent mark-handled" data-id="${report.id}">Click to Mark as Handled</button>`;
    }
    if (viewKey === "handled") {
      actions.innerHTML = `<button class="btn btn-ghost return-queue" data-id="${report.id}">Click to Return to Queue</button>`;
    }

    card.appendChild(actions);
    container.appendChild(card);
  });

  const pageInfo = document.getElementById(pageInfoId);
  pageInfo.textContent = `Page ${view.page} of ${view.totalPages || 1}`;

  document.getElementById(prevId).disabled = view.page <= 1;
  document.getElementById(nextId).disabled = view.page >= view.totalPages;
}

function drawPieChart() {
  const canvas = document.getElementById("statusChart");
  const ctx = canvas.getContext("2d");
  const handledAngle =
    (Math.max(0, Math.min(100, state.stats.handledRatio)) / 100) * Math.PI * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 120;

  const styles = getComputedStyle(document.documentElement);
  const handledColor = styles.getPropertyValue("--accent").trim();
  const unhandledColor = "#c8c3b5";
  const textColor = styles.getPropertyValue("--text").trim();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, 0, handledAngle);
  ctx.closePath();
  ctx.fillStyle = handledColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, handledAngle, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = unhandledColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, 62, 0, Math.PI * 2);
  ctx.fillStyle = styles.getPropertyValue("--bg").trim();
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.font = '500 13px "DM Sans"';
  ctx.fillText(`Handled: ${state.stats.handledRatio}%`, 20, 332);
  ctx.fillText(`Reports: ${state.stats.totalReports}`, 178, 332);
}

function updateStatsUI() {
  const totalReportsEl = document.getElementById("totalReports");
  if (totalReportsEl) {
    totalReportsEl.textContent = state.stats.totalReports;
  }
  document.getElementById("weeklyTotal").textContent =
    state.stats.totalThisWeek;
  document.getElementById("todayTotal").textContent = state.stats.totalToday;
  document.getElementById("handledRatio").textContent =
    `${state.stats.handledRatio}%`;
  drawPieChart();
}

async function loadStats() {
  setStatsLoading();
  const payload = await apiRequest("/admin/stats", { token: state.token });
  const data = payload && payload.data ? payload.data : {};
  state.stats = {
    totalReports: Number(data.totalReports || 0),
    totalThisWeek: Number(data.totalThisWeek || 0),
    totalToday: Number(data.totalToday || 0),
    handledRatio: Number(data.handledRatio || 0),
  };
  updateStatsUI();
}

function collectKnownTags() {
  const mapTags = (reports) =>
    reports.flatMap((report) =>
      Array.isArray(report.tags) ? report.tags : [],
    );
  const allTags = [
    ...mapTags(state.unhandled.reports),
    ...mapTags(state.queue.reports),
    ...mapTags(state.handled.reports),
  ];
  return [...new Set(allTags)].sort((a, b) => a.localeCompare(b));
}

function renderTagOptions() {
  const tags = collectKnownTags();
  const options = tags
    .map((tag) => `<option value="${tag}">${tag}</option>`)
    .join("");
  unhandledTagFilter.innerHTML = `<option value="all">All tags</option>${options}`;
  handledTagFilter.innerHTML = `<option value="all">All tags</option>${options}`;
  unhandledTagFilter.value = state.unhandled.tag;
  handledTagFilter.value = state.handled.tag;
}

async function loadReportsForTab(tabId) {
  if (tabId === "unhandledTab") {
    setListLoading("unhandledList");
  }
  if (tabId === "queueTab") {
    setListLoading("queueList");
  }
  if (tabId === "handledTab") {
    setListLoading("handledList");
  }

  const view = getViewConfig(tabId);
  const status = getStatusFromTab(tabId);
  const query = {
    status,
    page: view.page,
    limit: state.perPage,
  };

  if (status !== "Queue") {
    if (view.search && view.search.trim()) query.search = view.search.trim();
    if (view.tag !== "all") query.tags = view.tag;
  }

  const payload = await apiRequest("/admin/reports", {
    token: state.token,
    query,
  });

  const reports = Array.isArray(payload && payload.reports)
    ? payload.reports
    : [];
  const pagination = payload && payload.pagination ? payload.pagination : {};

  view.reports = reports.map(normalizeReport);
  view.totalPages = Number(pagination.totalPages || 1) || 1;
  view.totalReports = Number(pagination.totalReports || 0);

  if (view.page > view.totalPages) {
    view.page = view.totalPages;
  }

  if (tabId === "unhandledTab") {
    renderView(
      "unhandled",
      "unhandledList",
      "unhandledPageInfo",
      "unhandledPrev",
      "unhandledNext",
    );
  }
  if (tabId === "queueTab") {
    renderView("queue", "queueList", "queuePageInfo", "queuePrev", "queueNext");
  }
  if (tabId === "handledTab") {
    renderView(
      "handled",
      "handledList",
      "handledPageInfo",
      "handledPrev",
      "handledNext",
    );
  }
}

function normalizeAdmins(payload) {
  const rawAdmins =
    (payload && payload.admins) ||
    (payload && payload.data && payload.data.admins) ||
    (payload && payload.data) ||
    [];
  if (!Array.isArray(rawAdmins)) return [];

  return rawAdmins
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item.username === "string") return item.username;
      return "";
    })
    .filter(Boolean);
}

function renderAdmins() {
  const adminList = document.getElementById("adminList");
  adminList.innerHTML = "";

  if (!state.admins.length) {
    adminList.innerHTML = '<div class="admin-row">No admins found.</div>';
    return;
  }

  state.admins.forEach((admin) => {
    const isCurrentAdmin =
      state.currentAdminUsername &&
      admin.toLowerCase() === state.currentAdminUsername.toLowerCase();
    const isPendingDelete = state.pendingDeleteUsername === admin;

    const row = document.createElement("div");
    row.className = "admin-row";

    if (isCurrentAdmin) {
      row.innerHTML = `
        <span class="mono">${admin}</span>
        <span class="status-pill" title="Signed in admin">You</span>
      `;
    } else if (isPendingDelete) {
      row.innerHTML = `
        <span class="mono">${admin}</span>
        <div class="entry-actions">
          <button class="remove-admin-confirm" data-username="${admin}">Confirm</button>
          <button class="btn btn-ghost remove-admin-cancel" data-username="${admin}">Cancel</button>
        </div>
      `;
    } else {
      row.innerHTML = `
        <span class="mono">${admin}</span>
        <button class="remove-admin" data-username="${admin}">Remove</button>
      `;
    }

    adminList.appendChild(row);
  });
}

async function loadAdmins() {
  setAdminsLoading();
  const payload = await apiRequest("/admin/admins", { token: state.token });
  state.admins = normalizeAdmins(payload);
  renderAdmins();
}

async function loadDashboardData() {
  await Promise.all([
    loadReportsForTab("unhandledTab"),
    loadReportsForTab("queueTab"),
    loadReportsForTab("handledTab"),
    loadStats(),
    loadAdmins(),
  ]);
  renderTagOptions();
}

function setActiveTab(tabId) {
  state.activeTab = tabId;
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  tabContents.forEach((content) => {
    content.classList.toggle("active", content.id === tabId);
  });
}

function showDashboard() {
  state.loggedIn = true;
  adminGateway.classList.add("hidden");
  adminDashboard.classList.remove("hidden");
  adminDashboard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function logout() {
  state.loggedIn = false;
  state.token = "";
  state.currentAdminUsername = "";
  state.pendingDeleteUsername = "";
  generatedCodeEl.textContent = "";
  generatedCodeEl.dataset.code = "";
  setCopyButtonState({ visible: false });
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_ADMIN_USERNAME_KEY);
  adminDashboard.classList.add("hidden");
  adminGateway.classList.remove("hidden");
  setActiveTab("unhandledTab");
  showInfo("Logged out.", false);
}

async function updateReportStatus(reportId, status, promptText, fallbackNote) {
  let adminNote = "";
  if (status === "Queue" || status === "Handled") {
    const noteInput = window.prompt(promptText, fallbackNote || "");
    if (noteInput === null) return;
    adminNote = noteInput.trim();
    if (adminNote.length <= 10) {
      showInfo("Admin note must be more than 10 characters.", true);
      return;
    }
  }

  const body = { status };
  if (adminNote) body.adminNote = adminNote;

  await apiRequest(`/admin/reports/${reportId}`, {
    method: "PATCH",
    token: state.token,
    body,
  });

  await Promise.all([
    loadReportsForTab("unhandledTab"),
    loadReportsForTab("queueTab"),
    loadReportsForTab("handledTab"),
    loadStats(),
  ]);
  renderTagOptions();
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

function bindDashboardEvents() {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tabId = btn.dataset.tab;
      setActiveTab(tabId);

      try {
        if (tabId === "statsTab") {
          await loadStats();
        } else if (tabId === "adminsTab") {
          await loadAdmins();
        } else {
          await loadReportsForTab(tabId);
        }
      } catch (error) {
        showInfo(error.message || "Unable to load tab data.", true);
      }
    });
  });

  unhandledSearch.addEventListener("input", async (event) => {
    state.unhandled.search = event.target.value;
    state.unhandled.page = 1;
    try {
      await loadReportsForTab("unhandledTab");
    } catch (error) {
      showInfo(error.message || "Failed to filter unhandled reports.", true);
    }
  });

  handledSearch.addEventListener("input", async (event) => {
    state.handled.search = event.target.value;
    state.handled.page = 1;
    try {
      await loadReportsForTab("handledTab");
    } catch (error) {
      showInfo(error.message || "Failed to filter handled reports.", true);
    }
  });

  unhandledTagFilter.addEventListener("change", async (event) => {
    state.unhandled.tag = event.target.value;
    state.unhandled.page = 1;
    try {
      await loadReportsForTab("unhandledTab");
    } catch (error) {
      showInfo(error.message || "Failed to apply tag filter.", true);
    }
  });

  handledTagFilter.addEventListener("change", async (event) => {
    state.handled.tag = event.target.value;
    state.handled.page = 1;
    try {
      await loadReportsForTab("handledTab");
    } catch (error) {
      showInfo(error.message || "Failed to apply tag filter.", true);
    }
  });

  document
    .getElementById("unhandledPrev")
    .addEventListener("click", async () => {
      if (state.unhandled.page <= 1) return;
      state.unhandled.page -= 1;
      try {
        await loadReportsForTab("unhandledTab");
      } catch (error) {
        showInfo(error.message || "Failed to load previous page.", true);
      }
    });

  document
    .getElementById("unhandledNext")
    .addEventListener("click", async () => {
      if (state.unhandled.page >= state.unhandled.totalPages) return;
      state.unhandled.page += 1;
      try {
        await loadReportsForTab("unhandledTab");
      } catch (error) {
        showInfo(error.message || "Failed to load next page.", true);
      }
    });

  document.getElementById("queuePrev").addEventListener("click", async () => {
    if (state.queue.page <= 1) return;
    state.queue.page -= 1;
    try {
      await loadReportsForTab("queueTab");
    } catch (error) {
      showInfo(error.message || "Failed to load previous page.", true);
    }
  });

  document.getElementById("queueNext").addEventListener("click", async () => {
    if (state.queue.page >= state.queue.totalPages) return;
    state.queue.page += 1;
    try {
      await loadReportsForTab("queueTab");
    } catch (error) {
      showInfo(error.message || "Failed to load next page.", true);
    }
  });

  document.getElementById("handledPrev").addEventListener("click", async () => {
    if (state.handled.page <= 1) return;
    state.handled.page -= 1;
    try {
      await loadReportsForTab("handledTab");
    } catch (error) {
      showInfo(error.message || "Failed to load previous page.", true);
    }
  });

  document.getElementById("handledNext").addEventListener("click", async () => {
    if (state.handled.page >= state.handled.totalPages) return;
    state.handled.page += 1;
    try {
      await loadReportsForTab("handledTab");
    } catch (error) {
      showInfo(error.message || "Failed to load next page.", true);
    }
  });

  document
    .getElementById("generateCodeBtn")
    .addEventListener("click", async () => {
      try {
        const payload = await apiRequest("/admin/membership-code", {
          method: "POST",
          token: state.token,
        });

        const data = payload && payload.data ? payload.data : payload;
        const code = data && data.code ? data.code : "(code unavailable)";
        const expiresAt =
          data && data.expiresAt
            ? ` (expires: ${formatDate(data.expiresAt)})`
            : "";
        generatedCodeEl.textContent = `New membership code: ${code}${expiresAt}`;
        generatedCodeEl.dataset.code = code;
        setCopyButtonState({ visible: code !== "(code unavailable)" });
      } catch (error) {
        generatedCodeEl.dataset.code = "";
        setCopyButtonState({ visible: false });
        showInfo(error.message || "Could not generate membership code.", true);
      }
    });

  if (copyMembershipCodeBtn) {
    copyMembershipCodeBtn.addEventListener("click", async () => {
      const code = generatedCodeEl.dataset.code || "";
      if (!code) return;

      try {
        await copyTextToClipboard(code);
        setCopyButtonState({ visible: true, copied: true });
        showInfo("Membership code copied.");
        window.setTimeout(() => {
          setCopyButtonState({ visible: true, copied: false });
        }, 1300);
      } catch {
        showInfo("Could not copy code. Please copy it manually.", true);
      }
    });
  }

  document
    .getElementById("adminList")
    .addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;

      const username = target.dataset.username;
      if (!username) return;

      if (target.classList.contains("remove-admin")) {
        state.pendingDeleteUsername = username;
        renderAdmins();
        return;
      }

      if (target.classList.contains("remove-admin-cancel")) {
        state.pendingDeleteUsername = "";
        renderAdmins();
        return;
      }

      if (!target.classList.contains("remove-admin-confirm")) return;

      try {
        await apiRequest(`/admin/admins/${encodeURIComponent(username)}`, {
          method: "DELETE",
          token: state.token,
        });
        state.pendingDeleteUsername = "";
        await loadAdmins();
        showInfo(`Admin "${username}" removed.`);
      } catch (error) {
        showInfo(error.message || "Could not delete admin.", true);
      }
    });

  document
    .getElementById("unhandledList")
    .addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      if (!target.classList.contains("queue-action")) return;

      const reportId = target.dataset.id;
      if (!reportId) return;

      try {
        await updateReportStatus(
          reportId,
          "Queue",
          "Add a queue note for this case (must be >10 characters):",
          "Escalated for follow-up by case manager.",
        );
      } catch (error) {
        showInfo(error.message || "Could not queue report.", true);
      }
    });

  document
    .getElementById("queueList")
    .addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      if (!target.classList.contains("mark-handled")) return;

      const reportId = target.dataset.id;
      if (!reportId) return;

      const confirmed = window.confirm("Mark this queued case as handled?");
      if (!confirmed) return;

      try {
        await updateReportStatus(
          reportId,
          "Handled",
          "Add a resolution note (must be >10 characters):",
          "Case reviewed and action completed.",
        );
      } catch (error) {
        showInfo(error.message || "Could not mark report as handled.", true);
      }
    });

  document
    .getElementById("handledList")
    .addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      if (!target.classList.contains("return-queue")) return;

      const reportId = target.dataset.id;
      if (!reportId) return;

      try {
        await updateReportStatus(
          reportId,
          "Queue",
          "Add a follow-up note before returning this case to queue:",
          "Returned to queue for additional follow-up.",
        );
      } catch (error) {
        showInfo(error.message || "Could not return report to queue.", true);
      }
    });

  document.getElementById("logoutBtn").addEventListener("click", logout);
}

function bindShellEvents() {
  if (mobileMenuToggle && topControls) {
    mobileMenuToggle.addEventListener("click", () => {
      const isOpen = topControls.classList.toggle("open");
      mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (topControls.contains(target) || mobileMenuToggle.contains(target)) {
        return;
      }
      topControls.classList.remove("open");
      mobileMenuToggle.setAttribute("aria-expanded", "false");
    });
  }

  themeToggle.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "light" : "dark",
    );
    if (state.loggedIn) drawPieChart();
  });
}

async function tryResumeSession() {
  if (!state.token) return;

  try {
    if (!state.currentAdminUsername) {
      state.currentAdminUsername = resolveUsernameFromToken(state.token);
      if (state.currentAdminUsername) {
        localStorage.setItem(
          CURRENT_ADMIN_USERNAME_KEY,
          state.currentAdminUsername,
        );
      }
    }

    showDashboard();
    await loadDashboardData();
    showInfo("Session restored.");
  } catch {
    logout();
  }
}

async function init() {
  document.documentElement.setAttribute("data-theme", "light");
  generatedCodeEl.dataset.code = "";
  setCopyButtonState({ visible: false });
  bindShellEvents();
  bindAuthEvents();
  bindDashboardEvents();
  await tryResumeSession();
}

init();
