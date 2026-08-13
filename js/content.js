const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB
const MAX_IMAGE_BYTES = 300 * 1024 * 1024; // 300MB

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
  hoverRevealToggle: document.getElementById("hover-reveal-toggle"),
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
    els.bgVideo.preload = "auto";
    els.bgVideo.src = currentObjectUrl;

    const showAndPlay = () => {
      els.bgVideo.style.display = "block";
      els.bgVideo.play().catch(() => {});
    };

    if (isFullyBuffered(els.bgVideo)) {
      showAndPlay();
    } else {
      els.bgVideo.addEventListener("canplaythrough", showAndPlay, { once: true });
      els.bgVideo.load();
    }
  } else {
    els.bgImage.style.backgroundImage = `url("${currentObjectUrl}")`;
    els.bgImage.style.display = "block";
  }
}

function isFullyBuffered(video) {
  const buffered = video.buffered;
  if (!buffered.length || !video.duration) return false;
  return buffered.end(buffered.length - 1) >= video.duration - 0.1;
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
  document.body.classList.toggle("settings-panel-open", !els.settingsPanel.classList.contains("hidden"));
});

document.addEventListener("click", (e) => {
  const clickedInsidePanel = els.settingsPanel.contains(e.target);
  const clickedToggle = els.settingsToggle.contains(e.target);
  if (!clickedInsidePanel && !clickedToggle) {
    els.settingsPanel.classList.add("hidden");
    document.body.classList.remove("settings-panel-open");
  }
});

// ---------- Hover-reveal toggle ----------

els.hoverRevealToggle.addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  document.body.classList.toggle("hover-reveal", enabled);
  await browser.storage.local.set({ hoverReveal: enabled });
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
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    showStatus(`Video is ${mb}MB — the limit is 300MB.`, "error");
    return;
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    showStatus(`Image is ${mb}MB — the limit is 300MB.`, "error");
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

  const { showClock = true, hoverReveal = false } = await browser.storage.local.get(["showClock", "hoverReveal"]);
els.clockToggle.checked = showClock;
setClockVisible(showClock);

els.hoverRevealToggle.checked = hoverReveal;
document.body.classList.toggle("hover-reveal", hoverReveal);

  try {
    const record = await getMedia();
    renderMedia(record);
  } catch (err) {
    console.error(err);
    renderMedia(null);
  }
}
els.bgVideo.loop = false;

els.bgVideo.addEventListener('ended', () => {
  els.bgVideo.currentTime = 0;
  els.bgVideo.play().catch(() => {
    els.bgVideo.load();
    els.bgVideo.play().catch(() => {});
  });
});

// safety net for mid-playback stalls, separate from the loop-point issue
let stallTimer = null;
els.bgVideo.addEventListener('waiting', () => {
  clearTimeout(stallTimer);
  stallTimer = setTimeout(() => {
    if (els.bgVideo.readyState < 3) {
      const t = els.bgVideo.currentTime;
      els.bgVideo.load();
      els.bgVideo.currentTime = t;
      els.bgVideo.play().catch(() => {});
    }
  }, 8000);
});
els.bgVideo.addEventListener('playing', () => clearTimeout(stallTimer));

window.addEventListener('keydown', (event) => {
  if(event.ctrlKey && event.shiftKey && event.code === 'Slash'){
    event.preventDefault();
    console.log('crtl + shift + / got clicked');

    els.settingsPanel.classList.toggle('hidden');
    document.body.classList.toggle(
      'settings-panel-open',
      !els.settingsPanel.classList.contains('hidden')
    );
        
  }
})

init();