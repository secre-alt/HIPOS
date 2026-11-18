// Install prompts, connection status, offline caching, and user-controlled updates.
import { translate } from "./i18n.js";
function initPwa({ message, modal }) {
  let installPrompt = null, offlineReady = false;
  function connection() {
    document.querySelector("#connection").textContent = offlineReady ? navigator.onLine ? "Ready offline" : "Offline \xB7 saved on device" : navigator.onLine ? "Preparing offline access\u2026" : "Offline cache not ready";
  }
  window.addEventListener("online", connection);
  window.addEventListener("offline", connection);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
  });
  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
    } else modal("<h2>Install HIPOS</h2><p>On Chrome or Edge, open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p><p>On iPhone or iPad, open in Safari and choose <strong>Share \u2192 Add to Home Screen</strong>.</p><p>Open once online and wait for \u201CReady offline\u201D before disconnecting.</p>");
  }
  document.querySelector("#install").addEventListener("click", installApp);
  document.querySelector("#footer-install").addEventListener("click", installApp);
  window.addEventListener("appinstalled", () => {
    appInstalled = true;
    installPrompt = null;
    updateInstallBanner();
    message("HIPOS is installed.");
  });
  let appInstalled = false, installDismissed = false;
  try {
    installDismissed = sessionStorage.getItem("hipos.install.dismissed") === "true";
  } catch {
  }
  const standalone = matchMedia("(display-mode: standalone)");
  function updateInstallBanner() {
    const installed = appInstalled || standalone.matches || Boolean(navigator.standalone);
    document.querySelector("#install-banner").hidden = installDismissed || installed;
    document.querySelector("#footer-install").hidden = !installDismissed || installed;
  }
  standalone.addEventListener("change", updateInstallBanner);
  document.querySelector("#dismiss-install").addEventListener("click", () => {
    installDismissed = true;
    try {
      sessionStorage.setItem("hipos.install.dismissed", "true");
    } catch {
    }
    updateInstallBanner();
  });
  updateInstallBanner();
  // Wait for an explicit update request so a reload cannot interrupt a report.
  // The first service worker installation never prompts for an update.
  const updateBanner = document.querySelector("#update-banner"), applyUpdate = document.querySelector("#apply-update");
  let swRegistration = null, updating = false;
  // Never pop the banner over a game round or an open dialog; try again shortly.
  function busy() {
    return Boolean(document.querySelector("dialog[open], #compost-hud:not([hidden])"));
  }
  function showUpdate() {
    if (updating) return;
    if (busy()) {
      setTimeout(showUpdate, 4000);
      return;
    }
    updateBanner.hidden = false;
  }
  function trackWorker(worker) {
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate();
    });
  }
  function watchUpdates(registration) {
    swRegistration = registration;
    if (registration.waiting && navigator.serviceWorker.controller) showUpdate();
    if (registration.installing) trackWorker(registration.installing);
    registration.addEventListener("updatefound", () => {
      if (registration.installing) trackWorker(registration.installing);
    });
  }
  function checkForUpdate() {
    if (swRegistration && navigator.onLine) swRegistration.update().catch(() => {
    });
  }
  applyUpdate.addEventListener("click", () => {
    const waiting = swRegistration?.waiting;
    if (!waiting) {
      location.reload();
      return;
    }
    updating = true;
    applyUpdate.disabled = true;
    applyUpdate.textContent = translate("Updating\u2026");
    waiting.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => location.reload(), 5e3);
  });
  async function manualUpdateCheck() {
    if (!navigator.onLine) {
      message("Connect to the internet to check for updates.");
      return;
    }
    if (!swRegistration) {
      message("Updates are unavailable in this browser.");
      return;
    }
    if (swRegistration.waiting) {
      showUpdate();
      message("An update is ready. Tap Update now.");
      return;
    }
    message("Checking for updates\u2026");
    try {
      await swRegistration.update();
    } catch {
      message("Could not check for updates. Try again.");
      return;
    }
    message(swRegistration.installing || swRegistration.waiting ? "Update found. It will be ready in a moment." : "You have the latest version.");
  }
  document.querySelector("#dismiss-update").addEventListener("click", () => {
    updateBanner.hidden = true;
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (updating) location.reload();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkForUpdate();
    });
    window.addEventListener("online", checkForUpdate);
    setInterval(() => {
      if (!document.hidden) checkForUpdate();
    }, 30 * 60 * 1e3);
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then((registration) => {
      watchUpdates(registration);
      checkForUpdate();
      return navigator.serviceWorker.ready;
    }).then(() => {
      offlineReady = true;
      connection();
    }).catch(() => {
      document.querySelector("#connection").textContent = "Offline setup unavailable";
      message("Offline setup failed. Use HTTPS or localhost and reload online.");
    });
  } else document.querySelector("#connection").textContent = "Offline caching unavailable";
  connection();
  return { manualUpdateCheck };
}
export {
  initPwa
};
