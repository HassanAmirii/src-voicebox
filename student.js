const complaintForm = document.getElementById("complaintForm");
const submissionStatus = document.getElementById("submissionStatus");
const themeToggle = document.getElementById("themeToggle");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const topControls = document.getElementById("topControls");

const studentState = {
  reports: [],
};

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
    createdAt: new Date().toISOString(),
  });

  complaintForm.reset();
  submissionStatus.textContent =
    "Submitted anonymously. Thank you for speaking up.";
});

document.documentElement.setAttribute("data-theme", "light");
