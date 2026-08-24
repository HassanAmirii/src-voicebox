// Shared tab activation helpers.

function setActiveTab(tabId) {
  state.activeTab = tabId;
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  tabContents.forEach((content) => {
    content.classList.toggle("active", content.id === tabId);
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