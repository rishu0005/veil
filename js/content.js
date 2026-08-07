const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

const els = {
  bgVideo: document.getElementById("bg-video"),
  bgImage: document.getElementById("bg-image"),
  emptyState: document.getElementById("empty-state"),
  clockWrap: document.getElementById("clock-wrap"),
  clockTime: document.getElementById("clock-time"),
  clockDate: document.getElementById("clock-date"),
  settingsToggle: document.getElementById("settings-toggle"),
  settingsPanel: document.getElementById("settings-panel"),
  fileInput: document.getElementById("file-input"),
  uploadStatus: document.getElementById("upload-status"),
  clockToggle: document.getElementById("clock-toggle"),
  removeMediaBtn: document.getElementById("remove-media"),
};

let currentObjectUrl = null; // track so we can revoke it and avoid memory leaks

// ---------- Rendering ----------

function clearBackground() {
  els.bgVideo.pause();
  els.bgVideo.removeAttribute("src");
  els.bgVideo.load();
  els.bgVideo.style.display = "none";

  els.bgImage.style.backgroundImage = "";
  els.bgImage.style.display = "none";

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function renderMedia(record) {
  clearBackground();

  if (!record) {
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  currentObjectUrl = URL.createObjectURL(record.file);

  if (record.type.startsWith("video/")) {
    els.bgVideo.src = currentObjectUrl;
    els.bgVideo.style.display = "block";
  } else {
    els.bgImage.style.backgroundImage = `url("${currentObjectUrl}")`;
    els.bgImage.style.display = "block";
  }
}

function renderClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  els.clockTime.textContent = `${hh}:${mm}`;
  els.clockDate.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

let clockInterval = null;
function setClockVisible(visible) {
  els.clockWrap.classList.toggle("hidden", !visible);
  if (visible) {
    renderClock();
    if (!clockInterval) clockInterval = setInterval(renderClock, 1000 * 15);
  } else if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

// ---------- Status messages ----------

function showStatus(message, kind) {
  els.uploadStatus.textContent = message;
  els.uploadStatus.className = `status ${kind}`;
  els.uploadStatus.classList.remove("hidden");
}

function hideStatus() {
  els.uploadStatus.classList.add("hidden");
}

// ---------- Settings panel ----------

els.settingsToggle.addEventListener("click", () => {
  els.settingsPanel.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  const clickedInsidePanel = els.settingsPanel.contains(e.target);
  const clickedToggle = els.settingsToggle.contains(e.target);
  if (!clickedInsidePanel && !clickedToggle) {
    els.settingsPanel.classList.add("hidden");
  }
});

// ---------- Upload handling ----------

els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = ""; // allow re-selecting the same file later
  if (!file) return;

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    showStatus("Please choose an image or video file.", "error");
    return;
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    const mb = (file.size / (2048 * 2048)).toFixed(1);
    showStatus(`Video is ${mb}MB — the limit is 100MB.`, "error");
    return;
  }

  showStatus("Saving wallpaper…", "loading");

  try {
    await saveMedia(file); // this clears out the previous file too
    const record = await getMedia();
    renderMedia(record);
    showStatus("Wallpaper updated.", "success");
    setTimeout(hideStatus, 2500);
  } catch (err) {
    console.error(err);
    showStatus("Something went wrong saving that file.", "error");
  }
});

els.removeMediaBtn.addEventListener("click", async () => {
  try {
    await clearMedia();
    renderMedia(null);
    showStatus("Wallpaper removed.", "success");
    setTimeout(hideStatus, 2000);
  } catch (err) {
    console.error(err);
    showStatus("Couldn't remove the wallpaper.", "error");
  }
});

// ---------- Clock toggle ----------

els.clockToggle.addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  setClockVisible(enabled);
  await browser.storage.local.set({ showClock: enabled });
});

// ---------- Init ----------

async function init() {
  // Ask for persistent storage so the browser is less likely to evict
  // our IndexedDB data (relevant once videos get large).
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  const { showClock = true } = await browser.storage.local.get("showClock");
  els.clockToggle.checked = showClock;
  setClockVisible(showClock);

  try {
    const record = await getMedia();
    renderMedia(record);
  } catch (err) {
    console.error(err);
    renderMedia(null);
  }
}

init();