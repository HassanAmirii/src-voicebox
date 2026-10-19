// Student reporting form, public board, and student interactions.

const API_BASE_URL = window.VOICEBOX_CONFIG.API_BASE_URL;

const complaintForm = document.getElementById("complaintForm");
const submissionStatus = document.getElementById("submissionStatus");
const ticketSearchForm = document.getElementById("ticketSearchForm");
const ticketIdInput = document.getElementById("ticketIdInput");
const ticketSearchStatus = document.getElementById("ticketSearchStatus");
const ticketSearchResult = document.getElementById("ticketSearchResult");
const themeToggle = document.getElementById("themeToggle");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const topControls = document.getElementById("topControls");
const studentTabButtons = [...document.querySelectorAll(".student-tab-btn")];
const studentTabContents = [
  ...document.querySelectorAll(".student-tab-content"),
];
const publicStatusList = document.getElementById("publicStatusList");
const complaintTitleInput = document.getElementById("complaintTitle");
const complaintCommentInput = document.getElementById("complaintComment");
const identityInput = document.getElementById("identityBox");
const titleCounter = document.getElementById("titleCounter");
const commentCounter = document.getElementById("commentCounter");
const identityCounter = document.getElementById("identityCounter");
const heroMetricValues = [
  ...document.querySelectorAll(".metric-value[data-count-target]"),
];

const limits = {
  titleMin: 20,
  titleMax: 30,
  identityMin: 15,
  commentMin: 150,
};

const studentState = {
  activeTab: "reportFormTab",
  reports: [],
};

function setSubmissionMessage(message, isError = false) {
  submissionStatus.textContent = message;
  submissionStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function normalizeReport(report) {
  const tags = Array.isArray(report.tags)
    ? report.tags
    : report.tag
      ? [report.tag]
      : [];

  return {
    id: report._id || report.id,
    ticketId: report.ticketId || "",
    title: report.title || "Untitled",
    tags,
    status: normalizeStatus(report.status),
    adminNote: report.adminNote || "Pending moderator review.",
    createdAt: report.createdAt || new Date().toISOString(),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function extractTicketId(payload) {
  if (!payload || typeof payload !== "object") return "";

  const visited = new Set();
  const search = (value) => {
    if (!value || typeof value !== "object" || visited.has(value)) return "";
    visited.add(value);

    if (value.ticketId) return String(value.ticketId).trim();
    for (const nestedValue of Object.values(value)) {
      const ticketId = search(nestedValue);
      if (ticketId) return ticketId;
    }
    return "";
  };

  return search(payload);
}

async function apiRequest(path, options = {}) {
  const { method = "GET", body, query = {} } = options;
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
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

function renderPublicBoard() {
  if (!publicStatusList) return;
  publicStatusList.innerHTML = "";

  if (!studentState.reports.length) {
    publicStatusList.innerHTML =
      '<article class="entry-card">No reports available yet.</article>';
    return;
  }

  studentState.reports.forEach((report, idx) => {
    publicStatusList.appendChild(createReportCard(report, idx));
  });
}

function createReportCard(report, idx = 0) {
  const card = document.createElement("article");
  card.className = "entry-card";
  card.style.animation = `fadeUp 0.45s ease ${idx * 0.04}s both`;
  if (idx === 0) card.classList.add("is-featured");
  const tags = report.tags.length ? report.tags.join(", ") : "General";

  card.innerHTML = `
    <div class="entry-head">
      <h4>${escapeHtml(report.title)}</h4>
      <span class="entry-date">${escapeHtml(formatDate(report.createdAt))}</span>
    </div>
    <div class="entry-meta">Tags: ${escapeHtml(tags)}</div>
    <div class="entry-meta">Status: <span class="status-pill">${escapeHtml(report.status)}</span></div>
    <div class="entry-meta">Admin Note: ${escapeHtml(report.adminNote)}</div>
  `;
  return card;
}

function setTicketSearchMessage(message, isError = false) {
  ticketSearchStatus.textContent = message;
  ticketSearchStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function renderTicketSearchResult(report) {
  ticketSearchResult.innerHTML = "";
  ticketSearchResult.appendChild(createReportCard(report));
}

function renderSubmissionSuccess(ticketId) {
  const card = document.createElement("article");
  card.className = "submission-success-card";
  card.innerHTML = `
    <h3>Report submitted successfully</h3>
    <p>Your report has been received. Keep this ticket ID safe to check its status later.</p>
    <div class="ticket-id-display">
      <label for="submittedTicketId">Your ticket ID</label>
      <div class="ticket-id-actions">
        <input id="submittedTicketId" class="ticket-id-value" value="${escapeHtml(ticketId)}" readonly />
        <button type="button" class="btn btn-ghost copy-ticket-btn">Copy</button>
      </div>
    </div>
    <p class="ticket-warning">Copy and keep this ID somewhere safe. It is required to find your report.</p>
  `;
  submissionStatus.replaceChildren(card);
  submissionStatus.style.color = "";
  const copyButton = card.querySelector(".copy-ticket-btn");
  copyButton.addEventListener("click", async () => {
    try {
      await copyTextToClipboard(ticketId);
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy failed";
    }
  });
}

async function loadPublicReports() {
  const payload = await apiRequest("/reports", {
    query: {
      page: 1,
      limit: 12,
    },
  });

  const reports = Array.isArray(payload && payload.reports)
    ? payload.reports
    : [];
  studentState.reports = reports.map(normalizeReport);
  renderPublicBoard();
}

function validateForm({ title, comment, tags, identity }) {
  if (title.length < limits.titleMin || title.length > limits.titleMax) {
    return "Title must be between 20 and 30 characters.";
  }
  if (!tags.length) {
    return "Select at least one tag.";
  }
  if (comment.length < limits.commentMin) {
    return "Comment must be at least 150 characters.";
  }
  if (identity && identity.length < limits.identityMin) {
    return "Identity must be at least 15 characters when provided.";
  }
  return "";
}

function setCounterState(counterEl, message, isInvalid) {
  if (!counterEl) return;
  counterEl.textContent = message;
  counterEl.classList.toggle("invalid", isInvalid);
}

function clearCounterState(counterEl) {
  if (!counterEl) return;
  counterEl.textContent = "";
  counterEl.classList.remove("invalid");
  counterEl.classList.remove("limit-message");
}

function updateTitleCounter() {
  if (!complaintTitleInput) return;
  const length = complaintTitleInput.value.trim().length;
  const isAtMax = length === limits.titleMax;
  const isTooShort = length < limits.titleMin;
  const isTooLong = length > limits.titleMax;

  if (isAtMax) {
    titleCounter.classList.add("limit-message");
    setCounterState(
      titleCounter,
      "Title is limited to 30 characters. You can express more in the comment section.",
      false,
    );
    return;
  }

  titleCounter.classList.remove("limit-message");

  if (isTooLong) {
    setCounterState(
      titleCounter,
      `${length}/${limits.titleMax} (${length - limits.titleMax} over max)`,
      true,
    );
    return;
  }

  if (isTooShort) {
    setCounterState(
      titleCounter,
      `${length}/${limits.titleMax} (${limits.titleMin - length} more to minimum)`,
      true,
    );
    return;
  }

  setCounterState(titleCounter, `${length}/${limits.titleMax} (ready)`, false);
}

function updateCommentCounter() {
  if (!complaintCommentInput) return;
  const length = complaintCommentInput.value.trim().length;
  const isTooShort = length < limits.commentMin;

  if (isTooShort) {
    setCounterState(
      commentCounter,
      `${length} chars (${limits.commentMin - length} more to minimum)`,
      true,
    );
    return;
  }

  setCounterState(commentCounter, `${length} chars (ready)`, false);
}

function updateIdentityCounter() {
  if (!identityInput) return;
  const length = identityInput.value.trim().length;

  if (length === 0) {
    setCounterState(
      identityCounter,
      `Optional: 0 chars (enter ${limits.identityMin}+ if provided)`,
      false,
    );
    return;
  }

  if (length < limits.identityMin) {
    setCounterState(
      identityCounter,
      `${length} chars (${limits.identityMin - length} more to minimum)`,
      true,
    );
    return;
  }

  setCounterState(identityCounter, `${length} chars (ready)`, false);
}

function clearAllCounters() {
  clearCounterState(titleCounter);
  clearCounterState(commentCounter);
  clearCounterState(identityCounter);
}

function animateCountUp(element, { target, suffix = "", duration = 1800 }) {
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * easedProgress);
    element.textContent = `${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function observeHeroMetrics() {
  if (!heroMetricValues.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion || !("IntersectionObserver" in window)) {
    heroMetricValues.forEach((element) => {
      const target = Number(element.dataset.countTarget || 0);
      const suffix = element.dataset.countSuffix || "";
      element.textContent = `${target}${suffix}`;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        heroMetricValues.forEach((element) => {
          const target = Number(element.dataset.countTarget || 0);
          const suffix = element.dataset.countSuffix || "";
          animateCountUp(element, { target, suffix, duration: 1800 });
        });

        currentObserver.disconnect();
      });
    },
    { threshold: 0.55 },
  );

  const metricsSection = document.querySelector(".hero-metrics");
  if (metricsSection) observer.observe(metricsSection);
}

function bindShellEvents() {
  themeToggle.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
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
      if (topControls.contains(target) || mobileMenuToggle.contains(target)) {
        return;
      }
      topControls.classList.remove("open");
      mobileMenuToggle.setAttribute("aria-expanded", "false");
    });
  }
}

function bindStudentEvents() {
  complaintTitleInput.addEventListener("input", updateTitleCounter);
  complaintCommentInput.addEventListener("input", updateCommentCounter);
  identityInput.addEventListener("input", updateIdentityCounter);

  complaintTitleInput.addEventListener("blur", () => {
    if (complaintTitleInput.value.trim().length !== limits.titleMax) {
      clearCounterState(titleCounter);
    }
  });
  complaintCommentInput.addEventListener("blur", () => {
    clearCounterState(commentCounter);
  });
  identityInput.addEventListener("blur", () => {
    clearCounterState(identityCounter);
  });

  complaintForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = complaintTitleInput.value.trim();
    const comment = complaintCommentInput.value.trim();
    const identity = identityInput.value.trim();
    const tags = [...document.querySelectorAll("#tagGroup input:checked")].map(
      (tag) => tag.value,
    );

    const validationMessage = validateForm({ title, comment, tags, identity });
    if (validationMessage) {
      setSubmissionMessage(validationMessage, true);
      return;
    }

    const payload = {
      title,
      tags,
      comment,
    };
    if (identity) payload.identity = identity;

    try {
      setSubmissionMessage("Submitting your report...");
      const response = await apiRequest("/reports", {
        method: "POST",
        body: payload,
      });

      const ticketId = extractTicketId(response);
      if (!ticketId) {
        throw new Error(
          "The report was submitted, but the backend response did not include ticketId.",
        );
      }
      complaintForm.reset();
      clearAllCounters();
      renderSubmissionSuccess(ticketId);
    } catch (error) {
      setSubmissionMessage(error.message || "Could not submit report.", true);
    }
  });

  ticketSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ticketId = ticketIdInput.value.trim();
    if (!ticketId) return;

    ticketSearchResult.innerHTML = "";
    setTicketSearchMessage("Searching...");
    try {
      const payload = await apiRequest(`/reports/${encodeURIComponent(ticketId)}`);
      if (!payload || !payload.report) {
        throw new Error("Report not found.");
      }
      renderTicketSearchResult(normalizeReport(payload.report));
      setTicketSearchMessage("");
    } catch (error) {
      setTicketSearchMessage(error.message || "Could not find that report.", true);
    }
  });

  studentTabButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tabId = btn.dataset.studentTab;
      setActiveStudentTab(tabId);
      if (tabId === "publicBoardTab") {
        try {
          await loadPublicReports();
        } catch (error) {
          setSubmissionMessage(
            error.message || "Could not refresh recent reports.",
            true,
          );
        }
      }
    });
  });
}

async function init() {
  document.documentElement.setAttribute("data-theme", "light");
  bindShellEvents();
  bindStudentEvents();
  observeHeroMetrics();
  clearAllCounters();

  try {
    await loadPublicReports();
  } catch {
    renderPublicBoard();
    setSubmissionMessage(
      "Unable to load public feed right now. You can still submit a report.",
      true,
    );
  }
}

init();
