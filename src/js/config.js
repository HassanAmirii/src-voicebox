// Shared API configuration for the browser clients.

window.VOICEBOX_CONFIG = Object.freeze({
  API_BASE_URL:
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("voicebox-dev")
      ? "https://voicebox-dev.formatio.cloud"
      : "https://voicebox.formatio.cloud",
});
