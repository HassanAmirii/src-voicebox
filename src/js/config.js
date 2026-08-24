// Shared API configuration for the browser clients.

window.VOICEBOX_CONFIG = Object.freeze({
  API_BASE_URL:
    import.meta.env.VITE_API_URL || "https://voicebox.formatio.cloud",
});
