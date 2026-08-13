

// ----------  Rendering Functions ----------

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

// ---------- Tab Functions ----------

async function getOpenTabs() {
    try {
        const tabs = await browser.tabs.query({});

        if (tabs.length === 0) {
            console.log("No tabs found.");
            return
        } 
      const activeTab = tabs.find(tab => tab.active);
      const tabsToDisplay = [
          activeTab,
          ...tabs.filter(tab => tab.id !== activeTab?.id)
      ].slice(0, 4);

      let tabsToShow = '';

      tabsToDisplay.forEach(tab => {
          const isActive = tab.active ? 'active' : 'inactive';
          tabsToShow += `
              <div class="open-tab ${isActive}">  
                  <div class="tab-favicon">
                      <img 
                          src="${tab.favIconUrl || ''}" 
                          alt="${tab.title || 'Tab'}"
                      >
                  </div>

                  <div class="tab-info">
                      <div class="tab-title">${tab.title || 'Untitled'}</div>
                      <div class="tab-url">${tab.url || ''}</div>
                  </div>

                  <div class="tab-action">
                      ↵
                  </div>
              </div>
          `;
      });

      els.DispalyTabs.innerHTML = tabsToShow ;

      tabsToShow = '';
    } catch (error) {
        console.error("Error getting tabs:", error);
    }
}

// ---------- Keyboard Control Functions  ----------

function isExactShortcut(event, {
    ctrl = false,
    alt = false,
    shift = false,
    meta = false,
    code
}) {
    return (
        event.ctrlKey === ctrl &&
        event.altKey === alt &&
        event.shiftKey === shift &&
        event.metaKey === meta &&
        event.code === code
    );
}

// ---------- Imp Function ----------
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