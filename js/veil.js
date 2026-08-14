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
  searchWrap : document.getElementById("search-wrap"),
  searchInput : document.getElementById("search-input"),
  DisplayTabs : document.getElementById("display-tabs"),
};

let currentObjectUrl = null; // track so we can revoke it and avoid memory leaks



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



els.bgVideo.loop = false;

els.bgVideo.addEventListener('ended', () => {
  els.bgVideo.currentTime = 0;
  els.bgVideo.play().catch(() => {
    els.bgVideo.load();
    els.bgVideo.play().catch(() => {});
  });
});


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

els.searchInput.addEventListener('keydown', async (event) =>{


  if(isExactShortcut(event, {
    code: "ArrowDown"
  })){
      event.preventDefault();
      moveTabSelection('down');
      return;
  }

  if(isExactShortcut(event, {
    code: "ArrowUp"
  })){
      event.preventDefault();
      moveTabSelection('up');
      return;
  }


  if(isExactShortcut(event, {
    code: 'Enter'
  })){
      event.preventDefault();
      const tabs = els.DisplayTabs.querySelectorAll('.open-tab');
      const query = els.searchInput.value.trim();
      /*
      * If a tab is selected,
      * switch to that existing tab.
      */

      if (
          selectedTabIndex >= 0 &&
          selectedTabIndex < tabs.length && !query
      ) {
          const selectedTab = tabs[selectedTabIndex];
          const tabId = Number(
              selectedTab.dataset.tabId
          );
          await jumpToTab(tabId);
          return;
      }

    
    if(!query){
      return;
    }
    
    if (isUrl(query)) {
      const url = /^https?:\/\//i.test(query)
      ? query
      : "https://" + query;
      
      window.location.href = url;
    } else {
      const url = "https://www.google.com/search?q=" +
      encodeURIComponent(query);
      
      window.location.href = url;
    }
  }
  
  if(isExactShortcut(event, {
    code: 'Escape'
  })){
    els.searchInput.value = "";
      selectedTabIndex = -1;
        updateSelectedTab();

    els.searchInput.blur();
  } 
});

els.DisplayTabs.addEventListener('click', async (event) => {

    const tabElement = event.target.closest('.open-tab');
    if (!tabElement) {
        return;
    }
    const tabId = Number(
        tabElement.dataset.tabId
    );
    await jumpToTab(tabId);

});
// ----------  Toggle Control Panel ----------
window.addEventListener('keydown', (event) => {
  if(isExactShortcut(event, {
    ctrl: true,
    shift: true,
    code: 'Slash'
  })){
    event.preventDefault();
    
    els.settingsPanel.classList.toggle('hidden');
    document.body.classList.toggle(
      'settings-panel-open',
      !els.settingsPanel.classList.contains('hidden')
    );
    
  }
  
  // ---------- Toggle Search Bar ----------
  if (isExactShortcut(event, {
    ctrl: true,
    code: 'KeyK'
  })){
    event.preventDefault();
    
    console.log('Ctrl + K');
    els.searchWrap.classList.toggle('hidden');
    
    els.searchInput.focus();
    els.searchInput.select();
    
    getOpenTabs();
  }
})


// ---------- Init ----------
init();