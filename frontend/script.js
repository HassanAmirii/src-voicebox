const state = {
  reports: [],
  admins: ["admin", "case_manager", "wellbeing_lead"],
  codes: ["NACOS-2026-ALPHA"],
  loggedIn: false,
  unhandledPage: 1,
  handledPage: 1,
  perPage: 10,
  activeTab: "unhandledTab",
  queuePage: 1,
  unhandledSearch: "",
  handledSearch: "",
  unhandledTag: "all",
  handledTag: "all",
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

if (mobileMenuToggle && topControls) {
  mobileMenuToggle.addEventListener("click", () => {
    const isOpen = topControls.classList.toggle("open");
    mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (topControls.contains(target) || mobileMenuToggle.contains(target))
      return;
    topControls.classList.remove("open");
    mobileMenuToggle.setAttribute("aria-expanded", "false");
  });
}

function seededReports() {
  return [
    {
      id: 1,
      title: "Lab supervisor ignored chemical spill alarm",
      comment:
        "During Organic Chem practical in Block C, a solvent spill alarm rang but we were told to continue. Two students felt dizzy and left the room.",
      tag: "Lab Safety",
      identity: "Anonymous",
      status: "unhandled",
      adminNote: "",
      createdAt: new Date(2026, 3, 7, 10, 12).toISOString(),
    },
    {
      id: 2,
      title: "Repeated mockery in tutorial group",
      comment:
        "My pronunciation is mocked every Tuesday in tutorial T-14 by two classmates. I stopped speaking in sessions because of it.",
      tag: "Mockery",
      identity: "Anonymous",
      status: "unhandled",
      adminNote: "",
      createdAt: new Date(2026, 3, 6, 15, 8).toISOString(),
    },
    {
      id: 3,
      title: "Hostel corridor lights off for days",
      comment:
        "A wing in Hall 3 has had no corridor lights for four nights. There was a theft report yesterday and students are scared to pass there.",
      tag: "Hostel Safety",
      identity: "Student-2481",
      status: "queued",
      adminNote:
        "Maintenance and hall security notified. Following up tonight.",
      createdAt: new Date(2026, 3, 5, 20, 4).toISOString(),
    },
    {
      id: 4,
      title: "Unfair penalty for missing attendance",
      comment:
        "I was marked absent despite submitting a hospital letter. Course adviser rejected appeal without review and cut continuous assessment marks.",
      tag: "Unfair Academic Challenge",
      identity: "Anonymous",
      status: "unhandled",
      adminNote: "",
      createdAt: new Date(2026, 3, 4, 9, 33).toISOString(),
    },
    {
      id: 5,
      title: "Threatening note left on desk",
      comment:
        "I found a note saying I should stop attending night classes or I would regret it. This happened twice this week in LT-2.",
      tag: "Peer Threat",
      identity: "Anonymous",
      status: "queued",
      adminNote: "Campus patrol requested around LT-2 evening sessions.",
      createdAt: new Date(2026, 3, 3, 18, 45).toISOString(),
    },
    {
      id: 6,
      title: "Counselling referral took too long",
      comment:
        "I asked student affairs for urgent counselling support after panic attacks but got a response only after 12 days.",
      tag: "Mental Health Distress",
      identity: "Student-3014",
      status: "handled",
      adminNote:
        "Priority protocol updated with counselling unit and follow-up completed.",
      createdAt: new Date(2026, 3, 2, 11, 20).toISOString(),
    },
    {
      id: 7,
      title: "Harassment near faculty parking",
      comment:
        "A non-student waits by the parking gate and makes comments to female students in the evening. Security said no report was filed.",
      tag: "Harassment",
      identity: "Anonymous",
      status: "unhandled",
      adminNote: "",
      createdAt: new Date(2026, 3, 2, 19, 9).toISOString(),
    },
    {
      id: 8,
      title: "Lecturer used insulting remarks in class",
      comment:
        "In Econometrics class, a lecturer called students 'lazy and useless' when asking questions. This has happened in three sessions.",
      tag: "Lecturer Misconduct",
      identity: "Anonymous",
      status: "handled",
      adminNote: "Department head engaged and formal warning issued.",
      createdAt: new Date(2026, 3, 1, 13, 50).toISOString(),
    },
  ];
}

function switchAuthMode(mode) {
  const isLogin = mode === "login";
  showLogin.classList.toggle("active", isLogin);
  showSignup.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
  adminFormTitle.textContent = isLogin ? "Admin Login" : "Admin Sign Up";
  authStatus.textContent = "";
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function renderEntryCard(report, index) {
  const card = document.createElement("article");
  card.className = "entry-card";
  card.style.animation = `fadeUp 0.45s ease ${index * 0.04}s both`;
  const adminNote = report.adminNote
    ? `<div class="entry-meta">Admin Note: ${report.adminNote}</div>`
    : "";
  card.innerHTML = `
    <div class="entry-head">
      <h4>${report.title}</h4>
      <span class="entry-date">${formatDate(report.createdAt)}</span>
    </div>
    <div class="entry-meta">Tag: ${report.tag}</div>
    <p>${report.comment}</p>
    <div class="entry-meta">Identity: ${report.identity}</div>
    ${adminNote}
  `;
  return card;
}

function paginate(items, page) {
  const start = (page - 1) * state.perPage;
  return items.slice(start, start + state.perPage);
}

function applyFilters(items, query, tag) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((report) => {
    const textMatch =
      !normalizedQuery ||
      report.title.toLowerCase().includes(normalizedQuery) ||
      report.comment.toLowerCase().includes(normalizedQuery);
    const tagMatch = tag === "all" || report.tag === tag;
    return textMatch && tagMatch;
  });
}

function updatePageInfo(labelId, page, totalPages) {
  const el = document.getElementById(labelId);
  el.textContent = `Page ${page} of ${totalPages || 1}`;
}

function renderReports() {
  const unhandled = applyFilters(
    state.reports.filter((r) => r.status === "unhandled"),
    state.unhandledSearch,
    state.unhandledTag,
  );
  const queued = state.reports.filter((r) => r.status === "queued");
  const handled = applyFilters(
    state.reports.filter((r) => r.status === "handled"),
    state.handledSearch,
    state.handledTag,
  );

  const unhandledPages = Math.max(
    1,
    Math.ceil(unhandled.length / state.perPage),
  );
  const handledPages = Math.max(1, Math.ceil(handled.length / state.perPage));
  const queuePages = Math.max(1, Math.ceil(queued.length / state.perPage));

  if (state.unhandledPage > unhandledPages)
    state.unhandledPage = unhandledPages;
  if (state.handledPage > handledPages) state.handledPage = handledPages;
  if (state.queuePage > queuePages) state.queuePage = queuePages;

  const unhandledList = document.getElementById("unhandledList");
  const queueList = document.getElementById("queueList");
  const handledList = document.getElementById("handledList");

  unhandledList.innerHTML = "";
  queueList.innerHTML = "";
  handledList.innerHTML = "";

  paginate(unhandled, state.unhandledPage).forEach((report, idx) => {
    const card = renderEntryCard(report, idx);
    const actions = document.createElement("div");
    actions.className = "entry-actions";
    actions.innerHTML = `<button class="btn btn-accent queue-action" data-id="${report.id}">Click to Queue + Add Comment</button>`;
    card.appendChild(actions);
    unhandledList.appendChild(card);
  });

  paginate(queued, state.queuePage).forEach((report, idx) => {
    const card = renderEntryCard(report, idx);
    const actions = document.createElement("div");
    actions.className = "entry-actions";
    actions.innerHTML = `<button class="btn btn-accent mark-handled" data-id="${report.id}">Click to Mark as Handled</button>`;
    card.appendChild(actions);
    queueList.appendChild(card);
  });

  paginate(handled, state.handledPage).forEach((report, idx) => {
    const card = renderEntryCard(report, idx);
    const actions = document.createElement("div");
    actions.className = "entry-actions";
    actions.innerHTML = `<button class="btn btn-ghost return-queue" data-id="${report.id}">Click to Return to Queue</button>`;
    card.appendChild(actions);
    handledList.appendChild(card);
  });

  updatePageInfo("unhandledPageInfo", state.unhandledPage, unhandledPages);
  updatePageInfo("queuePageInfo", state.queuePage, queuePages);
  updatePageInfo("handledPageInfo", state.handledPage, handledPages);

  document.getElementById("unhandledPrev").disabled = state.unhandledPage === 1;
  document.getElementById("unhandledNext").disabled =
    state.unhandledPage === unhandledPages;
  document.getElementById("queuePrev").disabled = state.queuePage === 1;
  document.getElementById("queueNext").disabled =
    state.queuePage === queuePages;
  document.getElementById("handledPrev").disabled = state.handledPage === 1;
  document.getElementById("handledNext").disabled =
    state.handledPage === handledPages;
}

function drawPieChart() {
  const canvas = document.getElementById("statusChart");
  const ctx = canvas.getContext("2d");
  const handled = state.reports.filter((r) => r.status === "handled").length;
  const unhandled = state.reports.length - handled;
  const total = Math.max(state.reports.length, 1);
  const handledAngle = (handled / total) * Math.PI * 2;

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
  ctx.font = '500 13px "IBM Plex Mono"';
  ctx.fillText(`Handled: ${handled}`, 20, 332);
  ctx.fillText(`Unhandled: ${unhandled}`, 178, 332);
}

function updateStats() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const todayString = now.toDateString();

  const weekly = state.reports.filter(
    (r) => new Date(r.createdAt) >= weekAgo,
  ).length;
  const today = state.reports.filter(
    (r) => new Date(r.createdAt).toDateString() === todayString,
  ).length;
  const handled = state.reports.filter((r) => r.status === "handled").length;
  const ratio = Math.round((handled / Math.max(state.reports.length, 1)) * 100);

  document.getElementById("weeklyTotal").textContent = weekly;
  document.getElementById("todayTotal").textContent = today;
  document.getElementById("handledRatio").textContent = `${ratio}%`;

  drawPieChart();
}

function renderAdmins() {
  const adminList = document.getElementById("adminList");
  adminList.innerHTML = "";

  state.admins.forEach((admin, idx) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <span class="mono">${admin}</span>
      <button class="remove-admin" data-index="${idx}">Remove</button>
    `;
    adminList.appendChild(row);
  });
}

function renderTagOptions() {
  const uniqueTags = [...new Set(state.reports.map((report) => report.tag))];
  const options = uniqueTags
    .sort((a, b) => a.localeCompare(b))
    .map((tag) => `<option value="${tag}">${tag}</option>`)
    .join("");
  unhandledTagFilter.innerHTML = `<option value="all">All tags</option>${options}`;
  handledTagFilter.innerHTML = `<option value="all">All tags</option>${options}`;
  unhandledTagFilter.value = state.unhandledTag;
  handledTagFilter.value = state.handledTag;
}

function showDashboard() {
  state.loggedIn = true;
  adminGateway.classList.add("hidden");
  adminDashboard.classList.remove("hidden");
  adminDashboard.scrollIntoView({ behavior: "smooth", block: "start" });
  renderTagOptions();
  renderReports();
  updateStats();
  renderAdmins();
}

function showInfo(message) {
  authStatus.textContent = message;
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

showLogin.addEventListener("click", () => switchAuthMode("login"));
showSignup.addEventListener("click", () => switchAuthMode("signup"));

[...document.querySelectorAll(".info-btn")].forEach((btn) => {
  btn.addEventListener("click", () => {
    showInfo(btn.dataset.info || "Credential guidance unavailable.");
  });
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = document.getElementById("adminUsername").value.trim();
  const pass = document.getElementById("adminPassword").value.trim();
  if (state.admins.includes(user) && pass.length >= 6) {
    authStatus.textContent = "Access granted. Opening secure dashboard...";
    showDashboard();
    return;
  }
  authStatus.textContent = "Access denied. Verify your authorized credentials.";
});

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("signupUsername").value.trim();
  const code = document.getElementById("membershipCode").value.trim();

  if (!username) {
    authStatus.textContent = "Please provide a username.";
    return;
  }
  if (!state.codes.includes(code)) {
    authStatus.textContent = "Membership code is invalid or expired.";
    return;
  }
  if (state.admins.includes(username)) {
    authStatus.textContent = "That username already exists.";
    return;
  }
  state.admins.push(username);
  authStatus.textContent = "Admin account created. Proceed to sign in.";
  switchAuthMode("login");
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});

unhandledSearch.addEventListener("input", (event) => {
  state.unhandledSearch = event.target.value;
  state.unhandledPage = 1;
  renderReports();
});

handledSearch.addEventListener("input", (event) => {
  state.handledSearch = event.target.value;
  state.handledPage = 1;
  renderReports();
});

unhandledTagFilter.addEventListener("change", (event) => {
  state.unhandledTag = event.target.value;
  state.unhandledPage = 1;
  renderReports();
});

handledTagFilter.addEventListener("change", (event) => {
  state.handledTag = event.target.value;
  state.handledPage = 1;
  renderReports();
});

document.getElementById("unhandledPrev").addEventListener("click", () => {
  state.unhandledPage = Math.max(1, state.unhandledPage - 1);
  renderReports();
});

document.getElementById("unhandledNext").addEventListener("click", () => {
  state.unhandledPage += 1;
  renderReports();
});

document.getElementById("handledPrev").addEventListener("click", () => {
  state.handledPage = Math.max(1, state.handledPage - 1);
  renderReports();
});

document.getElementById("handledNext").addEventListener("click", () => {
  state.handledPage += 1;
  renderReports();
});

document.getElementById("queuePrev").addEventListener("click", () => {
  state.queuePage = Math.max(1, state.queuePage - 1);
  renderReports();
});

document.getElementById("queueNext").addEventListener("click", () => {
  state.queuePage += 1;
  renderReports();
});

document.getElementById("generateCodeBtn").addEventListener("click", () => {
  const code = `NACOS-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  state.codes.push(code);
  document.getElementById("generatedCode").textContent =
    `New membership code: ${code}`;
});

document.getElementById("adminList").addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.classList.contains("remove-admin")) return;

  const index = Number(target.dataset.index);
  if (Number.isNaN(index)) return;
  if (state.admins.length <= 1) {
    document.getElementById("generatedCode").textContent =
      "At least one admin must remain.";
    return;
  }

  state.admins.splice(index, 1);
  renderAdmins();
});

document.getElementById("unhandledList").addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.classList.contains("queue-action")) return;

  const id = Number(target.dataset.id);
  const report = state.reports.find((item) => item.id === id);
  if (!report) return;

  const adminComment = window.prompt(
    "Add a queue comment for this case:",
    report.adminNote || "",
  );
  if (adminComment === null) return;
  report.adminNote =
    adminComment.trim() || "Queued for review by assigned officer.";
  report.status = "queued";
  state.unhandledPage = 1;
  renderReports();
});

document.getElementById("queueList").addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.classList.contains("mark-handled")) return;

  const id = Number(target.dataset.id);
  const report = state.reports.find((item) => item.id === id);
  if (!report) return;

  const confirmed = window.confirm(
    "Mark this queued case as handled? This will move it to Handled reports.",
  );
  if (!confirmed) return;

  report.status = "handled";
  if (!report.adminNote) {
    report.adminNote = "Case resolved and action completed.";
  }
  renderReports();
  updateStats();
});

document.getElementById("handledList").addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.classList.contains("return-queue")) return;

  const id = Number(target.dataset.id);
  const report = state.reports.find((item) => item.id === id);
  if (!report) return;

  report.status = "queued";
  report.adminNote =
    report.adminNote || "Returned to queue for additional follow-up.";
  renderReports();
  updateStats();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  state.loggedIn = false;
  adminDashboard.classList.add("hidden");
  adminGateway.classList.remove("hidden");
  setActiveTab("unhandledTab");
  authStatus.textContent = "Logged out.";
});

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "light" : "dark",
  );
  if (state.loggedIn) drawPieChart();
});

function init() {
  state.reports = seededReports();
  document.documentElement.setAttribute("data-theme", "light");
  renderTagOptions();
  renderReports();
  updateStats();
}

init();
