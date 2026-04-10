const complaintForm = document.getElementById("complaintForm");
const submissionStatus = document.getElementById("submissionStatus");
const themeToggle = document.getElementById("themeToggle");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const topControls = document.getElementById("topControls");
const studentTabButtons = [...document.querySelectorAll(".student-tab-btn")];
const studentTabContents = [
  ...document.querySelectorAll(".student-tab-content"),
];
const publicStatusList = document.getElementById("publicStatusList");

const studentState = {
  reports: [],
  activeTab: "reportFormTab",
};

function seededPublicReports() {
  return [
    {
      title: "Lab supervisor ignored chemical spill alarm",
      tags: ["Lab Safety"],
      status: "Handled",
      adminNote: "Safety audit scheduled for Block C.",
      createdAt: new Date(2026, 3, 7, 10, 12).toISOString(),
    },
    {
      title: "Repeated mockery in tutorial group",
      tags: ["Mockery"],
      status: "In Review",
      adminNote: "Assigned to wellbeing case manager for follow-up.",
      createdAt: new Date(2026, 3, 6, 15, 8).toISOString(),
    },
    {
      title: "Threatening note left on desk",
      tags: ["Peer Threat"],
      status: "Queued",
      adminNote: "Campus patrol requested around LT-2 evening sessions.",
      createdAt: new Date(2026, 3, 3, 18, 45).toISOString(),
    },
  ];
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function renderPublicBoard() {
  if (!publicStatusList) return;
  publicStatusList.innerHTML = "";

  const combined = [...seededPublicReports(), ...studentState.reports].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  combined.slice(0, 12).forEach((report, idx) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    card.style.animation = `fadeUp 0.45s ease ${idx * 0.04}s both`;
    const tags = (
      report.tags && report.tags.length ? report.tags : ["General"]
    ).join(", ");
    card.innerHTML = `
      <div class="entry-head">
        <h4>${report.title}</h4>
        <span class="entry-date">${formatDate(report.createdAt)}</span>
      </div>
      <div class="entry-meta">Tags: ${tags}</div>
      <div class="entry-meta">Status: <span class="status-pill">${report.status}</span></div>
      <div class="entry-meta">Admin Note: ${report.adminNote}</div>
    `;
    publicStatusList.appendChild(card);
  });
}

function setActiveStudentTab(tabId) {
  studentState.activeTab = tabId;
  studentTabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.studentTab === tabId);
  });
  studentTabContents.forEach((content) => {
    content.classList.toggle("active", content.id === tabId);
  });
}

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "light" : "dark",
  );
});

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

complaintForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("complaintTitle").value.trim();
  const comment = document.getElementById("complaintComment").value.trim();
  const identity =
    document.getElementById("identityBox").value.trim() || "Anonymous";
  const selectedTags = [
    ...document.querySelectorAll("#tagGroup input:checked"),
  ].map((t) => t.value);

  if (!title || !comment) {
    submissionStatus.textContent = "Please complete title and comment.";
    return;
  }

  studentState.reports.unshift({
    title,
    comment,
    identity,
    tags: selectedTags,
    status: "Received",
    adminNote: "Report received and waiting for moderator review.",
    createdAt: new Date().toISOString(),
  });

  renderPublicBoard();

  complaintForm.reset();
  submissionStatus.textContent =
    "Submitted anonymously. Thank you for speaking up.";
});

studentTabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveStudentTab(btn.dataset.studentTab);
  });
});

document.documentElement.setAttribute("data-theme", "light");
renderPublicBoard();
